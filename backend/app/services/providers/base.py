from abc import ABC, abstractmethod

from app.models.schemas import LocalizationFeedback, ModelTurn, TurnRequest


class AIProvider(ABC):
    @abstractmethod
    async def generate_turn(self, request: TurnRequest) -> ModelTurn:
        """Generate one bounded reaction and coaching result."""


class LocalizationProvider(ABC):
    @abstractmethod
    async def review(self, request: TurnRequest) -> LocalizationFeedback:
        """Review one player utterance in Hong Kong workplace context."""
