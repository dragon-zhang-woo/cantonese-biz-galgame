from app.core.config import Settings
from app.models.schemas import TurnRequest, TurnResponse
from app.services.providers.deepseek_provider import DeepSeekProvider
from app.services.providers.mock_provider import MockProvider


class GameEngine:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.mock = MockProvider()
        self.deepseek = (
            DeepSeekProvider(settings)
            if settings.ai_provider == "deepseek" and settings.deepseek_api_key
            else None
        )

    async def play_turn(self, request: TurnRequest) -> TurnResponse:
        if self.deepseek is None:
            result = await self.mock.generate_turn(request)
            return TurnResponse(provider="mock", **result.model_dump())

        try:
            result = await self.deepseek.generate_turn(request)
            return TurnResponse(provider="deepseek", **result.model_dump())
        except Exception:
            result = await self.mock.generate_turn(request)
            return TurnResponse(provider="fallback", **result.model_dump())
