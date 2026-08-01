from fastapi.testclient import TestClient
import io
import wave

import pytest

from app.core.config import Settings
from app.main import create_app
from app.services.speech import (
    MAX_UPLOAD_BYTES,
    SpeechAdapterResult,
    SpeechModuleError,
    SpeechTranscriptionModule,
    _matches_file_signature,
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


def test_speech_capabilities_allow_verified_live_only_basic_contract() -> None:
    client = TestClient(
        create_app(
            Settings(
                hkchat_speech_ws_url="wss://speech.example.test/live",
                hkchat_speech_auth_mode="basic",
                hkchat_speech_username="organiser-user",
                hkchat_speech_password="organiser-password",
            )
        )
    )

    payload = client.get("/api/speech/capabilities").json()

    assert payload["configured"] is True
    assert payload["live_supported"] is True
    assert payload["upload_supported"] is False


def _wav_bytes(duration_ms: int = 250) -> bytes:
    output = io.BytesIO()
    with wave.open(output, "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(16_000)
        audio.writeframes(b"\x00\x00" * (16_000 * duration_ms // 1000))
    return output.getvalue()


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
