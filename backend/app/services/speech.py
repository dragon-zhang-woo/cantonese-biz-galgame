from __future__ import annotations

import io
import asyncio
import base64
import json
import time
import wave
from collections import defaultdict, deque
from dataclasses import dataclass
from collections.abc import AsyncIterator
from typing import Any, Protocol

import av
import httpx
from websockets.asyncio.client import connect

from app.core.config import Settings
from app.models.schemas import (
    SpeechCapabilities,
    SpeechRecordingLimits,
    SpeechTranscriptionResponse,
)


ACCEPTED_AUDIO_TYPES = [
    "audio/webm",
    "audio/mp4",
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/aac",
    "audio/ogg",
]
MAX_UPLOAD_BYTES = 25 * 1024 * 1024
SCOPE_LIMITS_MS = {
    "campaign-turn": 90_000,
    "practice-turn": 90_000,
    "custom-turn": 120_000,
    "scenario-intake": 300_000,
}


@dataclass(frozen=True)
class SpeechAdapterResult:
    transcript: str
    detected_language: str | None = None
    warnings: tuple[str, ...] = ()


class SpeechAdapter(Protocol):
    async def transcribe_file(
        self, audio: bytes, *, language_hint: str
    ) -> SpeechAdapterResult: ...


SpeechStreamInput = bytes | dict[str, Any]
SpeechStreamEvent = dict[str, Any]


class SpeechLiveAdapter(Protocol):
    def stream(
        self, events: AsyncIterator[SpeechStreamInput]
    ) -> AsyncIterator[SpeechStreamEvent]: ...


class SpeechModuleError(Exception):
    def __init__(self, code: str, message: str, status_code: int, recoverable: bool):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.recoverable = recoverable


class HKChatSpeechAdapter:
    """HTTP adapter enabled only after a verified upstream URL is configured."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.url = settings.hkchat_speech_http_url
        self.api_key = settings.hkchat_speech_api_key
        self.auth_mode = settings.hkchat_speech_auth_mode
        self.username = settings.hkchat_speech_username
        self.password = settings.hkchat_speech_password

    def _auth(self) -> tuple[dict[str, str], httpx.BasicAuth | None]:
        if self.auth_mode == "basic":
            username = self.username or self.api_key
            return {}, httpx.BasicAuth(username, self.password)
        return {"Authorization": f"Bearer {self.api_key}"}, None

    def _websocket_headers(self) -> dict[str, str]:
        if self.auth_mode == "basic":
            username = self.username or self.api_key
            token = base64.b64encode(
                f"{username}:{self.password}".encode("utf-8")
            ).decode("ascii")
            return {"Authorization": f"Basic {token}"}
        return {"Authorization": f"Bearer {self.api_key}"}

    async def transcribe_file(
        self, audio: bytes, *, language_hint: str
    ) -> SpeechAdapterResult:
        headers, auth = self._auth()
        try:
            async with httpx.AsyncClient(timeout=35.0) as client:
                response = await client.post(
                    self.url,
                    headers=headers,
                    auth=auth,
                    files={"audio": ("speech.wav", audio, "audio/wav")},
                    data={"language_hint": language_hint},
                )
            if response.status_code in {401, 403}:
                raise SpeechModuleError(
                    "upstream_auth",
                    "港话通语音鉴权失败。",
                    502,
                    False,
                )
            if response.status_code == 429:
                raise SpeechModuleError(
                    "upstream_rate_limited",
                    "港话通语音服务繁忙，请稍后重试。",
                    503,
                    True,
                )
            response.raise_for_status()
            payload = response.json()
            transcript = str(payload.get("transcript") or payload.get("text") or "").strip()
            if not transcript:
                raise ValueError("empty transcript")
            return SpeechAdapterResult(
                transcript=transcript,
                detected_language=payload.get("detected_language") or payload.get("language"),
                warnings=tuple(payload.get("warnings") or ()),
            )
        except SpeechModuleError:
            raise
        except httpx.TimeoutException as exc:
            raise SpeechModuleError(
                "upstream_timeout",
                "港话通语音转写超时，录音仍保留在本机。",
                504,
                True,
            ) from exc
        except (httpx.HTTPError, ValueError, json.JSONDecodeError) as exc:
            raise SpeechModuleError(
                "upstream_unavailable",
                "港话通语音暂时不可用，录音仍保留在本机。",
                502,
                True,
            ) from exc

    async def stream(
        self, events: AsyncIterator[SpeechStreamInput]
    ) -> AsyncIterator[SpeechStreamEvent]:
        headers = self._websocket_headers()
        try:
            async with connect(
                self.settings.hkchat_speech_ws_url,
                additional_headers=headers,
                open_timeout=10,
                close_timeout=5,
                max_size=1_048_576,
            ) as upstream:
                async def send_events() -> None:
                    async for event in events:
                        if isinstance(event, bytes):
                            await upstream.send(event)
                        else:
                            await upstream.send(json.dumps(event, ensure_ascii=False))

                sender = asyncio.create_task(send_events())
                try:
                    async with asyncio.timeout(35):
                        async for message in upstream:
                            if not isinstance(message, str):
                                continue
                            event = json.loads(message)
                            yield event
                            if event.get("type") in {"complete", "error"}:
                                return
                finally:
                    sender.cancel()
                    await asyncio.gather(sender, return_exceptions=True)
        except TimeoutError as exc:
            raise SpeechModuleError(
                "upstream_timeout",
                "港话通实时语音超时，录音仍保留在本机。",
                504,
                True,
            ) from exc
        except SpeechModuleError:
            raise
        except Exception as exc:
            raise SpeechModuleError(
                "upstream_unavailable",
                "港话通实时语音暂时不可用，录音仍保留在本机。",
                502,
                True,
            ) from exc


def _matches_file_signature(content_type: str, data: bytes) -> bool:
    if content_type in {"audio/wav", "audio/x-wav"}:
        return data.startswith(b"RIFF") and data[8:12] == b"WAVE"
    if content_type == "audio/webm":
        return data.startswith(b"\x1aE\xdf\xa3")
    if content_type == "audio/mp4":
        return len(data) >= 12 and data[4:8] == b"ftyp"
    if content_type == "audio/ogg":
        return data.startswith(b"OggS")
    if content_type == "audio/mpeg":
        return data.startswith(b"ID3") or (len(data) >= 2 and data[0] == 0xFF and data[1] & 0xE0 == 0xE0)
    if content_type == "audio/aac":
        return len(data) >= 2 and data[0] == 0xFF and data[1] & 0xF6 == 0xF0
    return False


def _normalise_audio(data: bytes) -> tuple[bytes, int]:
    try:
        source = av.open(io.BytesIO(data))
        stream = next(iter(source.streams.audio))
        resampler = av.AudioResampler(format="s16", layout="mono", rate=16_000)
        pcm = bytearray()
        sample_count = 0
        for frame in source.decode(stream):
            for converted in resampler.resample(frame):
                sample_count += converted.samples
                pcm.extend(bytes(converted.planes[0])[: converted.samples * 2])
        for converted in resampler.resample(None):
            sample_count += converted.samples
            pcm.extend(bytes(converted.planes[0])[: converted.samples * 2])
        source.close()
    except (av.error.FFmpegError, StopIteration, ValueError) as exc:
        raise SpeechModuleError(
            "unsupported_media",
            "无法读取这段录音，请改用 WAV、MP3、M4A、AAC、Ogg 或 WebM。",
            415,
            True,
        ) from exc
    if not sample_count:
        raise SpeechModuleError("unsupported_media", "录音中没有可识别的音频。", 415, True)
    output = io.BytesIO()
    with wave.open(output, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(16_000)
        wav.writeframes(pcm)
    return output.getvalue(), round(sample_count * 1000 / 16_000)


class SpeechTranscriptionModule:
    """Validate, normalize and transcribe speech behind one interface."""

    def __init__(self, settings: Settings, adapter: SpeechAdapter | None = None):
        self.settings = settings
        self.adapter = adapter
        if self.adapter is None and (
            settings.speech_upload_configured or settings.speech_live_configured
        ):
            self.adapter = HKChatSpeechAdapter(settings)
        self._access_lock = asyncio.Lock()
        self._starts: dict[str, deque[float]] = defaultdict(deque)
        self._active: dict[str, int] = defaultdict(int)

    async def acquire(self, client_key: str) -> None:
        now = time.monotonic()
        async with self._access_lock:
            starts = self._starts[client_key]
            while starts and starts[0] <= now - 60:
                starts.popleft()
            if self._active[client_key] >= 2:
                raise SpeechModuleError(
                    "too_many_concurrent",
                    "同一客户端最多同时处理两段录音。",
                    429,
                    True,
                )
            if len(starts) >= 10:
                raise SpeechModuleError(
                    "rate_limited",
                    "语音请求过于频繁，请稍后重试。",
                    429,
                    True,
                )
            starts.append(now)
            self._active[client_key] += 1

    async def release(self, client_key: str) -> None:
        async with self._access_lock:
            self._active[client_key] = max(0, self._active[client_key] - 1)

    def capabilities(self) -> SpeechCapabilities:
        upload = self.adapter is not None and self.settings.speech_upload_configured
        live = (
            self.adapter is not None
            and self.settings.speech_live_configured
            and callable(getattr(self.adapter, "stream", None))
        )
        return SpeechCapabilities(
            configured=upload or live,
            live_supported=live,
            upload_supported=upload,
            accepted_mime_types=ACCEPTED_AUDIO_TYPES,
            max_upload_bytes=MAX_UPLOAD_BYTES,
            recording_limits_ms=SpeechRecordingLimits(),
        )

    async def transcribe_file(
        self,
        data: bytes,
        *,
        content_type: str,
        scope: str,
        language_hint: str,
    ) -> SpeechTranscriptionResponse:
        if self.adapter is None:
            raise SpeechModuleError("not_configured", "港话通语音尚未配置。", 503, True)
        if scope not in SCOPE_LIMITS_MS:
            raise SpeechModuleError("invalid_scope", "未知的训练语音范围。", 422, False)
        if language_hint not in {"auto", "yue-HK"}:
            raise SpeechModuleError("invalid_language", "不支持的语音提示语言。", 422, False)
        if not data:
            raise SpeechModuleError("unsupported_media", "录音文件为空。", 415, True)
        if len(data) > MAX_UPLOAD_BYTES:
            raise SpeechModuleError("file_too_large", "录音文件不能超过 25MB。", 413, True)
        if content_type not in ACCEPTED_AUDIO_TYPES or not _matches_file_signature(content_type, data):
            raise SpeechModuleError("unsupported_media", "录音格式或文件内容不受支持。", 415, True)
        normalized, duration_ms = _normalise_audio(data)
        if duration_ms > SCOPE_LIMITS_MS[scope]:
            raise SpeechModuleError("audio_too_long", "录音时长超过当前输入限制。", 413, True)
        result = await self.adapter.transcribe_file(
            normalized,
            language_hint=language_hint,
        )
        return SpeechTranscriptionResponse(
            transcript=result.transcript,
            detected_language=result.detected_language,
            duration_ms=duration_ms,
            warnings=list(result.warnings),
        )

    async def live_stream(
        self, events: AsyncIterator[SpeechStreamInput]
    ) -> AsyncIterator[SpeechStreamEvent]:
        stream = getattr(self.adapter, "stream", None)
        if not self.settings.speech_live_configured or not callable(stream):
            raise SpeechModuleError(
                "not_configured",
                "港话通实时语音尚未配置。",
                503,
                True,
            )
        async for event in stream(events):
            event_type = event.get("type")
            if event_type not in {"ready", "interim", "final", "complete", "error"}:
                continue
            yield event
