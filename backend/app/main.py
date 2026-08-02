import json

from fastapi import (
    Depends,
    FastAPI,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import Settings, get_settings
from app.models.schemas import (
    ComposedScenario,
    ScenarioComposeRequest,
    SpeechCapabilities,
    SpeechTranscriptionResponse,
    TurnRequest,
    TurnResponse,
)
from app.services.game_engine import GameEngine
from app.services.scenario_composer import compose_scenario
from app.services.speech import SpeechAdapter, SpeechModuleError, SpeechTranscriptionModule


def create_app(
    settings: Settings | None = None,
    speech_adapter: SpeechAdapter | None = None,
) -> FastAPI:
    config = settings or get_settings()
    app = FastAPI(
        title=config.app_name,
        version="1.0.0",
        description="Bounded AI reaction and Cantonese workplace coaching API.",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )
    engine = GameEngine(config)
    speech = SpeechTranscriptionModule(config, speech_adapter)

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {
            "status": "ok",
            "provider": engine.provider_name,
        }

    def get_engine() -> GameEngine:
        return engine

    @app.post("/api/game/turn", response_model=TurnResponse)
    async def turn(
        request: TurnRequest,
        game_engine: GameEngine = Depends(get_engine),
    ) -> TurnResponse:
        return await game_engine.play_turn(request)

    @app.post("/api/scenario/compose", response_model=ComposedScenario)
    async def scenario_compose(request: ScenarioComposeRequest) -> ComposedScenario:
        return compose_scenario(request)

    @app.get("/api/speech/capabilities", response_model=SpeechCapabilities)
    async def speech_capabilities() -> SpeechCapabilities:
        return speech.capabilities()

    @app.post("/api/speech/transcriptions", response_model=SpeechTranscriptionResponse)
    async def speech_transcription(
        request: Request,
        audio: UploadFile = File(...),
        scope: str = Form(...),
        language_hint: str = Form("auto"),
    ) -> SpeechTranscriptionResponse:
        client_key = request.client.host if request.client else "unknown"
        acquired = False
        try:
            await speech.acquire(client_key)
            acquired = True
            data = await audio.read(25 * 1024 * 1024 + 1)
            return await speech.transcribe_file(
                data,
                content_type=(audio.content_type or "").split(";", 1)[0].lower(),
                scope=scope,
                language_hint=language_hint,
            )
        except SpeechModuleError as exc:
            raise HTTPException(
                status_code=exc.status_code,
                detail={
                    "code": exc.code,
                    "message": exc.message,
                    "recoverable": exc.recoverable,
                },
            ) from exc
        finally:
            if acquired:
                await speech.release(client_key)
            await audio.close()

    @app.websocket("/api/speech/transcriptions/live")
    async def live_speech_transcription(websocket: WebSocket) -> None:
        origin = websocket.headers.get("origin", "")
        if origin not in config.cors_origins:
            await websocket.close(code=1008, reason="origin_not_allowed")
            return
        if not speech.capabilities().live_supported:
            await websocket.close(code=1013, reason="speech_not_configured")
            return
        client_key = websocket.client.host if websocket.client else "unknown"
        try:
            await speech.acquire(client_key)
        except SpeechModuleError:
            await websocket.close(code=1013, reason="speech_rate_limited")
            return
        await websocket.accept()
        try:
            start = await websocket.receive_json()
            if (
                start.get("type") != "start"
                or start.get("scope") not in {
                    "campaign-turn",
                    "practice-turn",
                    "custom-turn",
                    "scenario-intake",
                }
                or start.get("sample_rate") != 16_000
                or start.get("encoding") != "pcm_s16le"
            ):
                raise SpeechModuleError(
                    "invalid_stream_start",
                    "实时语音参数无效。",
                    422,
                    False,
                )

            async def client_events():
                yield start
                while True:
                    message = await websocket.receive()
                    if message["type"] == "websocket.disconnect":
                        return
                    if message.get("bytes") is not None:
                        yield message["bytes"]
                        continue
                    raw = message.get("text")
                    if raw is None:
                        continue
                    event = json.loads(raw)
                    if event.get("type") not in {"finish", "cancel"}:
                        raise SpeechModuleError(
                            "invalid_stream_event",
                            "实时语音事件无效。",
                            422,
                            False,
                        )
                    yield event
                    return

            async for event in speech.live_stream(client_events()):
                await websocket.send_json(event)
        except WebSocketDisconnect:
            return
        except (json.JSONDecodeError, SpeechModuleError) as exc:
            if isinstance(exc, SpeechModuleError):
                payload = {
                    "type": "error",
                    "code": exc.code,
                    "message": exc.message,
                    "recoverable": exc.recoverable,
                }
            else:
                payload = {
                    "type": "error",
                    "code": "invalid_stream_event",
                    "message": "实时语音事件无效。",
                    "recoverable": False,
                }
            await websocket.send_json(payload)
        finally:
            await speech.release(client_key)
            try:
                await websocket.close()
            except RuntimeError:
                pass

    return app


app = create_app()
