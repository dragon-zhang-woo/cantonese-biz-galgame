from app.models.schemas import ModelTurn, TurnRequest
from app.services.providers.base import AIProvider


class MockProvider(AIProvider):
    async def generate_turn(self, request: TurnRequest) -> ModelTurn:
        fallback = request.fallback
        return ModelTurn(
            npc_line_yue=fallback.npc_line_yue,
            npc_line_zh=fallback.npc_line_zh,
            coach_feedback=fallback.coach_feedback,
            delta=fallback.delta,
        )
