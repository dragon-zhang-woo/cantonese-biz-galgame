from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import Settings, get_settings
from app.models.schemas import TurnRequest, TurnResponse
from app.services.game_engine import GameEngine


def create_app(settings: Settings | None = None) -> FastAPI:
    config = settings or get_settings()
    app = FastAPI(
        title=config.app_name,
        version="0.1.0",
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

    return app


app = create_app()
