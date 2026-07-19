from abc import ABC, abstractmethod

from app.models.schemas import ModelTurn, TurnRequest


class AIProvider(ABC):
    @abstractmethod
    async def generate_turn(self, request: TurnRequest) -> ModelTurn:
        """Generate one bounded reaction and coaching result."""
