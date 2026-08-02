from fastapi.testclient import TestClient
import base64
import io
import json
import uuid
import wave

import pytest
import httpx

from app.core.config import Settings
from app.main import create_app
from app.services.speech import (
    MAX_UPLOAD_BYTES,
    HKChatSpeechAdapter,
    SpeechAdapterResult,
    SpeechModuleError,
    SpeechTranscriptionModule,
    _matches_file_signature,
    _normalise_audio,
)


def test_speech_capabilities_are_honest_without_verified_contract() -> None:
    client = TestClient(
        create_app(
            Settings(
                hkchat_speech_api_key="configured-but-not-enough",
                hkchat_speech_http_url="",
                hkchat_speech_ws_url="",
            )
        )
    )

    response = client.get("/api/speech/capabilities")

    assert response.status_code == 200
    assert response.json() == {
        "configured": False,
        "live_supported": False,
        "upload_supported": False,
        "accepted_mime_types": [
            "audio/webm",
            "audio/mp4",
            "audio/mpeg",
            "audio/wav",
            "audio/x-wav",
            "audio/aac",
            "audio/ogg",
        ],
        "max_upload_bytes": 26_214_400,
        "recording_limits_ms": {
            "campaign_turn": 90_000,
            "practice_turn": 90_000,
            "custom_turn": 120_000,
            "scenario_intake": 300_000,
        },
    }


def test_speech_capabilities_enable_the_documented_file_contract_with_a_key() -> None:
    payload = TestClient(
        create_app(Settings(hkchat_speech_api_key="hkgai-test-key"))
    ).get("/api/speech/capabilities").json()

    assert payload["configured"] is True
    assert payload["upload_supported"] is True
    assert payload["live_supported"] is False


def test_speech_capabilities_reject_the_documented_tts_websocket_for_live_asr() -> None:
    client = TestClient(
        create_app(
            Settings(
                hkchat_speech_api_key="test-key",
                hkchat_speech_http_url="",
                hkchat_speech_ws_url=(
                    "wss://openspeech.hkgai.net/server_proxy/api/ws/tts"
                ),
            )
        )
    )

    payload = client.get("/api/speech/capabilities").json()

    assert payload["configured"] is False
    assert payload["live_supported"] is False
    assert payload["upload_supported"] is False


def test_speech_capabilities_allow_an_explicitly_injected_live_adapter() -> None:
    class VerifiedLiveAdapter:
        async def transcribe_file(self, audio: bytes, *, language_hint: str):
            raise AssertionError("file transcription is not configured")

        async def stream(self, events):
            yield {"type": "ready"}

    payload = TestClient(
        create_app(
            Settings(
                hkchat_speech_api_key="test-key",
                hkchat_speech_http_url="",
                hkchat_speech_ws_url="wss://speech.example.test/live",
            ),
            speech_adapter=VerifiedLiveAdapter(),
        )
    ).get("/api/speech/capabilities").json()

    assert payload["configured"] is True
    assert payload["live_supported"] is True
    assert payload["upload_supported"] is False


def test_live_websocket_refuses_the_tts_socket_without_a_verified_adapter() -> None:
    client = TestClient(
        create_app(
            Settings(
                hkchat_speech_api_key="test-key",
                hkchat_speech_http_url="",
                hkchat_speech_ws_url=(
                    "wss://openspeech.hkgai.net/server_proxy/api/ws/tts"
                ),
            )
        )
    )

    try:
        with client.websocket_connect(
            "/api/speech/transcriptions/live",
            headers={"origin": "http://localhost:5173"},
        ):
            raise AssertionError("unverified TTS socket enabled live ASR")
    except Exception as error:
        assert getattr(error, "code", None) == 1013


def _wav_bytes(duration_ms: int = 250) -> bytes:
    output = io.BytesIO()
    with wave.open(output, "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(16_000)
        audio.writeframes(b"\x00\x00" * (16_000 * duration_ms // 1000))
    return output.getvalue()


def _encoded_audio_bytes(container_format: str, codec: str, sample_rate: int) -> bytes:
    import av

    output = io.BytesIO()
    with av.open(output, mode="w", format=container_format) as container:
        stream = container.add_stream(codec, rate=sample_rate)
        stream.layout = "mono"
        samples_per_frame = 960 if codec == "libopus" else 1024
        remaining = sample_rate // 4
        while remaining > 0:
            sample_count = min(samples_per_frame, remaining)
            frame = av.AudioFrame(format="s16", layout="mono", samples=sample_count)
            frame.sample_rate = sample_rate
            frame.planes[0].update(b"\x00\x00" * sample_count)
            for packet in stream.encode(frame):
                container.mux(packet)
            remaining -= sample_count
        for packet in stream.encode(None):
            container.mux(packet)
    return output.getvalue()


@pytest.mark.parametrize(
    ("container_format", "codec", "sample_rate"),
    [
        ("wav", "pcm_s16le", 16_000),
        ("mp3", "libmp3lame", 16_000),
        ("mp4", "aac", 16_000),
        ("adts", "aac", 16_000),
        ("ogg", "libopus", 48_000),
        ("webm", "libopus", 48_000),
    ],
)
def test_real_supported_containers_decode_to_16khz_mono_wav(
    container_format: str, codec: str, sample_rate: int
) -> None:
    normalized, duration_ms = _normalise_audio(
        _encoded_audio_bytes(container_format, codec, sample_rate)
    )

    with wave.open(io.BytesIO(normalized), "rb") as audio:
        assert audio.getframerate() == 16_000
        assert audio.getnchannels() == 1
        assert audio.getsampwidth() == 2
    assert 240 <= duration_ms <= 330


def test_uploaded_audio_is_normalized_and_transcribed_without_server_persistence() -> None:
    class RecordingAdapter:
        async def transcribe_file(
            self, audio: bytes, *, language_hint: str
        ) -> SpeechAdapterResult:
            assert audio.startswith(b"RIFF")
            assert language_hint == "yue-HK"
            return SpeechAdapterResult(
                transcript="我想先确认负责人同更新时间。",
                detected_language="yue-HK",
            )

    client = TestClient(
        create_app(
            Settings(
                hkchat_speech_api_key="test-key",
                hkchat_speech_http_url="https://speech.example.test/transcribe",
            ),
            speech_adapter=RecordingAdapter(),
        )
    )

    response = client.post(
        "/api/speech/transcriptions",
        data={"scope": "custom-turn", "language_hint": "yue-HK"},
        files={"audio": ("private-name.wav", _wav_bytes(), "audio/wav")},
    )

    assert response.status_code == 200
    assert response.json() == {
        "transcript": "我想先确认负责人同更新时间。",
        "detected_language": "yue-HK",
        "duration_ms": 250,
        "transcription_source": "hkchat-speech",
        "warnings": [],
    }


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("status_code", "expected_code"),
    [
        (401, "upstream_auth"),
        (403, "upstream_auth"),
        (429, "upstream_rate_limited"),
        (400, "upstream_unavailable"),
        (500, "upstream_unavailable"),
    ],
)
async def test_hkchat_file_adapter_maps_upstream_http_failures(
    status_code: int, expected_code: str
) -> None:
    transport = httpx.MockTransport(
        lambda _request: httpx.Response(status_code, json={"detail": "hidden"})
    )
    adapter = HKChatSpeechAdapter(
        Settings(
            hkchat_speech_api_key="test-key",
            hkchat_speech_http_url="https://speech.example.test/transcribe",
        ),
        http_transport=transport,
    )

    with pytest.raises(SpeechModuleError) as failure:
        await adapter.transcribe_file(_wav_bytes(), language_hint="yue-HK")
    assert failure.value.code == expected_code


@pytest.mark.asyncio
async def test_hkchat_file_adapter_maps_timeout_and_uses_official_json_contract() -> None:
    timeout_request = None

    def timeout_handler(request: httpx.Request) -> httpx.Response:
        nonlocal timeout_request
        timeout_request = request
        raise httpx.ReadTimeout("provider timeout", request=request)

    timeout_adapter = HKChatSpeechAdapter(
        Settings(
            hkchat_speech_api_key="test-key",
            hkchat_speech_http_url="https://speech.example.test/transcribe",
        ),
        http_transport=httpx.MockTransport(timeout_handler),
    )
    with pytest.raises(SpeechModuleError) as timeout:
        await timeout_adapter.transcribe_file(_wav_bytes(), language_hint="auto")
    assert timeout.value.code == "upstream_timeout"
    assert timeout_request is not None

    captured_request: dict[str, object] = {}

    def success_handler(request: httpx.Request) -> httpx.Response:
        captured_request.update(
            {
                "url": str(request.url),
                "authorization": request.headers.get("Authorization", ""),
                "content_type": request.headers.get("Content-Type", ""),
                "body": json.loads(request.content),
            }
        )
        return httpx.Response(
            200,
            json={"code": 200, "msg": "SUCCESS", "data": {"result": "收到。"}},
        )

    official_adapter = HKChatSpeechAdapter(
        Settings(
            hkchat_speech_api_key="hkgai-test-key",
            hkchat_speech_http_url="https://speech.example.test/transcribe",
        ),
        http_transport=httpx.MockTransport(success_handler),
    )
    source_audio = _wav_bytes()
    result = await official_adapter.transcribe_file(
        source_audio,
        language_hint="yue-HK",
    )

    body = captured_request["body"]
    assert captured_request["url"] == "https://speech.example.test/transcribe"
    assert captured_request["authorization"] == "Bearer hkgai-test-key"
    assert str(captured_request["content_type"]).startswith("application/json")
    uuid.UUID(body["request_id"])
    assert body["resource"]["type"] == 2
    assert base64.b64decode(body["resource"]["data"]) == source_audio
    assert body["config"] == {"ddc": False, "hot_keys": []}
    assert result.transcript == "收到。"
    assert result.detected_language is None
    assert result.warnings == ()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("provider_code", "expected_code"),
    [
        (401, "upstream_auth"),
        (403, "upstream_auth"),
        (429, "upstream_rate_limited"),
        (400, "upstream_unavailable"),
        (500, "upstream_unavailable"),
    ],
)
async def test_hkchat_file_adapter_maps_provider_json_failures(
    provider_code: int, expected_code: str
) -> None:
    adapter = HKChatSpeechAdapter(
        Settings(hkchat_speech_api_key="test-key"),
        http_transport=httpx.MockTransport(
            lambda _request: httpx.Response(
                200,
                json={"code": provider_code, "msg": "hidden", "data": None},
            )
        ),
    )

    with pytest.raises(SpeechModuleError) as failure:
        await adapter.transcribe_file(_wav_bytes(), language_hint="auto")
    assert failure.value.code == expected_code


def test_live_websocket_relays_ordered_hkchat_transcript_events() -> None:
    class LiveAdapter:
        async def transcribe_file(self, audio: bytes, *, language_hint: str):
            raise AssertionError("file transcription should not run")

        async def stream(self, events):
            yield {"type": "ready"}
            async for event in events:
                if isinstance(event, bytes):
                    assert event == b"\x00\x00" * 160
                    yield {"type": "interim", "sequence": 1, "text": "我想确认"}
                elif event["type"] == "finish":
                    yield {"type": "final", "sequence": 2, "text": "我想确认负责人。"}
                    yield {
                        "type": "complete",
                        "transcript": "我想确认负责人。",
                        "source": "hkchat-speech",
                    }

    client = TestClient(
        create_app(
            Settings(
                hkchat_speech_api_key="test-key",
                hkchat_speech_http_url="https://speech.example.test/transcribe",
                hkchat_speech_ws_url="wss://speech.example.test/live",
            ),
            speech_adapter=LiveAdapter(),
        )
    )

    with client.websocket_connect(
        "/api/speech/transcriptions/live",
        headers={"origin": "http://localhost:5173"},
    ) as socket:
        socket.send_json(
            {
                "type": "start",
                "scope": "custom-turn",
                "sample_rate": 16_000,
                "encoding": "pcm_s16le",
            }
        )
        assert socket.receive_json() == {"type": "ready"}
        socket.send_bytes(b"\x00\x00" * 160)
        assert socket.receive_json() == {
            "type": "interim",
            "sequence": 1,
            "text": "我想确认",
        }
        socket.send_json({"type": "finish"})
        assert socket.receive_json() == {
            "type": "final",
            "sequence": 2,
            "text": "我想确认负责人。",
        }
        assert socket.receive_json() == {
            "type": "complete",
            "transcript": "我想确认负责人。",
            "source": "hkchat-speech",
        }


def test_live_websocket_cancel_reaches_adapter_and_closes_cleanly() -> None:
    cancelled = False

    class CancelAdapter:
        async def transcribe_file(self, audio: bytes, *, language_hint: str):
            raise AssertionError

        async def stream(self, events):
            nonlocal cancelled
            yield {"type": "ready"}
            async for event in events:
                if isinstance(event, dict) and event.get("type") == "cancel":
                    cancelled = True
                    return

    client = TestClient(
        create_app(
            Settings(
                hkchat_speech_api_key="test-key",
                hkchat_speech_ws_url="wss://speech.example.test/live",
            ),
            speech_adapter=CancelAdapter(),
        )
    )

    with client.websocket_connect(
        "/api/speech/transcriptions/live",
        headers={"origin": "http://localhost:5173"},
    ) as socket:
        socket.send_json(
            {
                "type": "start",
                "scope": "custom-turn",
                "sample_rate": 16_000,
                "encoding": "pcm_s16le",
            }
        )
        assert socket.receive_json() == {"type": "ready"}
        socket.send_json({"type": "cancel"})

    assert cancelled is True


def test_corrupt_audio_returns_stable_recoverable_error() -> None:
    class NeverCalledAdapter:
        async def transcribe_file(self, audio: bytes, *, language_hint: str):
            raise AssertionError("corrupt audio must not reach the provider")

    client = TestClient(
        create_app(
            Settings(
                hkchat_speech_api_key="test-key",
                hkchat_speech_http_url="https://speech.example.test/transcribe",
            ),
            speech_adapter=NeverCalledAdapter(),
        )
    )
    response = client.post(
        "/api/speech/transcriptions",
        data={"scope": "campaign-turn", "language_hint": "auto"},
        files={"audio": ("anonymous.wav", b"RIFF\x00\x00\x00\x00WAVEbad", "audio/wav")},
    )

    assert response.status_code == 415
    assert response.json()["detail"] == {
        "code": "unsupported_media",
        "message": "无法读取这段录音，请改用 WAV、MP3、M4A、AAC、Ogg 或 WebM。",
        "recoverable": True,
    }


def test_live_websocket_rejects_untrusted_origin() -> None:
    class LiveAdapter:
        async def transcribe_file(self, audio: bytes, *, language_hint: str):
            raise AssertionError

        async def stream(self, events):
            yield {"type": "ready"}

    client = TestClient(
        create_app(
            Settings(
                hkchat_speech_api_key="test-key",
                hkchat_speech_ws_url="wss://speech.example.test/live",
            ),
            speech_adapter=LiveAdapter(),
        )
    )

    try:
        with client.websocket_connect(
            "/api/speech/transcriptions/live",
            headers={"origin": "https://attacker.example"},
        ):
            raise AssertionError("untrusted origin connected")
    except Exception as error:
        assert getattr(error, "code", None) == 1008


@pytest.mark.parametrize(
    ("content_type", "header"),
    [
        ("audio/webm", b"\x1aE\xdf\xa3\x00\x00"),
        ("audio/mp4", b"\x00\x00\x00\x18ftypM4A "),
        ("audio/mpeg", b"ID3\x04\x00"),
        ("audio/wav", b"RIFF\x00\x00\x00\x00WAVE"),
        ("audio/x-wav", b"RIFF\x00\x00\x00\x00WAVE"),
        ("audio/aac", b"\xff\xf1\x50\x80"),
        ("audio/ogg", b"OggS\x00\x02"),
    ],
)
def test_supported_audio_types_require_matching_file_headers(
    content_type: str, header: bytes
) -> None:
    assert _matches_file_signature(content_type, header)
    assert not _matches_file_signature(content_type, b"not really audio")


def test_empty_and_oversized_uploads_use_stable_errors() -> None:
    class NeverCalledAdapter:
        async def transcribe_file(self, audio: bytes, *, language_hint: str):
            raise AssertionError

    module = SpeechTranscriptionModule(
        Settings(
            hkchat_speech_api_key="test-key",
            hkchat_speech_http_url="https://speech.example.test/transcribe",
        ),
        NeverCalledAdapter(),
    )

    async def check() -> None:
        with pytest.raises(SpeechModuleError, match="录音文件为空") as empty:
            await module.transcribe_file(
                b"", content_type="audio/wav", scope="campaign-turn", language_hint="auto"
            )
        assert empty.value.code == "unsupported_media"
        with pytest.raises(SpeechModuleError, match="25MB") as oversized:
            await module.transcribe_file(
                b"x" * (MAX_UPLOAD_BYTES + 1),
                content_type="audio/wav",
                scope="campaign-turn",
                language_hint="auto",
            )
        assert oversized.value.code == "file_too_large"

    import asyncio

    asyncio.run(check())


@pytest.mark.asyncio
async def test_uploaded_audio_enforces_the_scope_duration_limit() -> None:
    class NeverCalledAdapter:
        async def transcribe_file(self, audio: bytes, *, language_hint: str):
            raise AssertionError("overlong audio must not reach the provider")

    module = SpeechTranscriptionModule(
        Settings(
            hkchat_speech_api_key="test-key",
            hkchat_speech_http_url="https://speech.example.test/transcribe",
        ),
        NeverCalledAdapter(),
    )

    with pytest.raises(SpeechModuleError) as too_long:
        await module.transcribe_file(
            _wav_bytes(90_001),
            content_type="audio/wav",
            scope="campaign-turn",
            language_hint="yue-HK",
        )
    assert too_long.value.code == "audio_too_long"


def test_upload_resource_is_closed_after_a_failed_request(monkeypatch) -> None:
    from starlette.datastructures import UploadFile

    closed_filenames: list[str | None] = []
    original_close = UploadFile.close

    async def tracked_close(upload: UploadFile) -> None:
        closed_filenames.append(upload.filename)
        await original_close(upload)

    monkeypatch.setattr(UploadFile, "close", tracked_close)
    client = TestClient(
        create_app(
            Settings(
                hkchat_speech_api_key="test-key",
                hkchat_speech_http_url="https://speech.example.test/transcribe",
            )
        )
    )

    response = client.post(
        "/api/speech/transcriptions",
        data={"scope": "campaign-turn", "language_hint": "auto"},
        files={"audio": ("private-name.wav", b"not audio", "audio/wav")},
    )

    assert response.status_code == 415
    assert closed_filenames
    assert set(closed_filenames) == {"private-name.wav"}


@pytest.mark.asyncio
async def test_client_speech_limits_isolate_concurrency_and_start_rate() -> None:
    module = SpeechTranscriptionModule(Settings())
    await module.acquire("client-a")
    await module.acquire("client-a")
    with pytest.raises(SpeechModuleError) as concurrent:
        await module.acquire("client-a")
    assert concurrent.value.code == "too_many_concurrent"
    await module.release("client-a")
    await module.release("client-a")

    for _ in range(8):
        await module.acquire("client-a")
        await module.release("client-a")
    with pytest.raises(SpeechModuleError) as rate_limited:
        await module.acquire("client-a")
    assert rate_limited.value.code == "rate_limited"

    await module.acquire("client-b")
    await module.release("client-b")


@pytest.mark.asyncio
async def test_live_only_configuration_rejects_file_transcription() -> None:
    class LiveOnlyAdapter:
        async def transcribe_file(self, audio: bytes, *, language_hint: str):
            raise AssertionError("file transcription must stay disabled")

        async def stream(self, events):
            yield {"type": "ready"}

    module = SpeechTranscriptionModule(
        Settings(
            hkchat_speech_api_key="test-key",
            hkchat_speech_http_url="",
            hkchat_speech_ws_url="wss://speech.example.test/live",
        ),
        LiveOnlyAdapter(),
    )

    with pytest.raises(SpeechModuleError) as not_configured:
        await module.transcribe_file(
            _wav_bytes(),
            content_type="audio/wav",
            scope="campaign-turn",
            language_hint="auto",
        )
    assert not_configured.value.code == "not_configured"


@pytest.mark.asyncio
async def test_live_stream_deduplicates_sequences_and_merges_final_segments() -> None:
    class DuplicateAdapter:
        async def transcribe_file(self, audio: bytes, *, language_hint: str):
            raise AssertionError

        async def stream(self, events):
            yield {"type": "ready"}
            async for event in events:
                if isinstance(event, bytes):
                    yield {"type": "interim", "sequence": 1, "text": "我想"}
                    yield {"type": "interim", "sequence": 1, "text": "重复"}
                    yield {"type": "final", "sequence": 2, "text": "我想确认"}
                    yield {"type": "final", "sequence": 2, "text": "重复"}
                elif event.get("type") == "finish":
                    yield {"type": "final", "sequence": 3, "text": "负责人。"}
                    yield {"type": "complete", "transcript": "", "source": "wrong"}

    module = SpeechTranscriptionModule(
        Settings(
            hkchat_speech_api_key="test-key",
            hkchat_speech_ws_url="wss://speech.example.test/live",
        ),
        DuplicateAdapter(),
    )

    async def inputs():
        yield {
            "type": "start",
            "scope": "custom-turn",
            "sample_rate": 16_000,
            "encoding": "pcm_s16le",
        }
        yield b"\x00\x00" * 160
        yield {"type": "finish"}

    received = [event async for event in module.live_stream(inputs())]

    assert received == [
        {"type": "ready"},
        {"type": "interim", "sequence": 1, "text": "我想"},
        {"type": "final", "sequence": 2, "text": "我想确认"},
        {"type": "final", "sequence": 3, "text": "负责人。"},
        {
            "type": "complete",
            "transcript": "我想确认 负责人。",
            "source": "hkchat-speech",
        },
    ]


@pytest.mark.asyncio
async def test_live_stream_enforces_scope_duration_from_pcm_bytes() -> None:
    class ConsumingAdapter:
        async def transcribe_file(self, audio: bytes, *, language_hint: str):
            raise AssertionError

        async def stream(self, events):
            async for _event in events:
                pass
            if False:
                yield {"type": "ready"}

    module = SpeechTranscriptionModule(
        Settings(
            hkchat_speech_api_key="test-key",
            hkchat_speech_ws_url="wss://speech.example.test/live",
        ),
        ConsumingAdapter(),
    )

    async def inputs():
        yield {
            "type": "start",
            "scope": "campaign-turn",
            "sample_rate": 16_000,
            "encoding": "pcm_s16le",
        }
        yield b"\x00" * (16_000 * 2 * 90 + 2)

    with pytest.raises(SpeechModuleError) as too_long:
        _ = [event async for event in module.live_stream(inputs())]
    assert too_long.value.code == "audio_too_long"
