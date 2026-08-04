import asyncio
import logging

from app.core.config import Settings
from app.models.schemas import LocalizationFeedback, ModelTurn, TurnRequest, TurnResponse
from app.services.providers.base import AIProvider
from app.services.providers.deepseek_provider import DeepSeekProvider
from app.services.providers.hkchat_provider import HKChatProvider
from app.services.providers.mock_provider import MockProvider
from app.services.turn_cache import TurnCache


logger = logging.getLogger(__name__)


class GameEngine:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.mock = MockProvider()
        self.cache = TurnCache(
            ttl_seconds=settings.ai_cache_ttl_seconds,
            max_entries=settings.ai_cache_max_entries,
        )
        self.scene_provider: AIProvider | None = None
        self.localization_provider: HKChatProvider | None = None

        if settings.ai_scene_provider == "deepseek" and settings.deepseek_api_key:
            self.scene_provider = DeepSeekProvider(settings)
        if settings.ai_localize_provider == "hkchat" and settings.hkchat_api_key:
            self.localization_provider = HKChatProvider(settings)

    @property
    def provider_name(self) -> str:
        scene = "deepseek" if self.scene_provider else "fallback"
        localization = "hkchat" if self.localization_provider else "fallback"
        return self._provider_label(scene, localization)

    @property
    def dual_model_ready(self) -> bool:
        return self.scene_provider is not None and self.localization_provider is not None

    @staticmethod
    def _provider_label(scene: str, localization: str) -> str:
        if scene == "fallback" and localization == "fallback":
            return "fallback"
        return f"{scene}+{localization}"

    @staticmethod
    def _fallback_localization(request: TurnRequest) -> LocalizationFeedback:
        delta = request.fallback.delta

        def score(value: int) -> int:
            return max(0, min(10, 5 + round(value / 2)))

        return LocalizationFeedback(
            naturalness=score(delta.language),
            politeness=score(delta.culture),
            business_fit=score(delta.professionalism),
            hk_rewrite=request.player_action.text,
            comment=request.fallback.coach_feedback,
            source="fallback",
        )

    async def _scene_result(self, request: TurnRequest) -> tuple[ModelTurn, str]:
        if self.scene_provider is None:
            return await self.mock.generate_turn(request), "fallback"
        try:
            result = await self.scene_provider.generate_turn(request)
            if self._repeats_scene_prompt(request, result):
                raise ValueError("AI scene provider repeated the incoming NPC line")
            return result, "deepseek"
        except Exception as exc:
            logger.warning(
                "AI scene provider failed (%s): %s",
                type(exc).__name__,
                exc,
            )
            return await self.mock.generate_turn(request), "fallback"

    @staticmethod
    def _repeats_scene_prompt(request: TurnRequest, result: ModelTurn) -> bool:
        def normalize(value: str) -> str:
            return "".join(value.split()).strip("「」『』\"'，。！？!?、")

        incoming_yue = normalize(request.scene.npc_line_yue)
        incoming_zh = normalize(request.scene.npc_line_zh)
        return normalize(result.npc_line_yue) in {incoming_yue, incoming_zh}

    async def _localization_result(
        self, request: TurnRequest
    ) -> tuple[LocalizationFeedback, str]:
        if self.localization_provider is None:
            return self._fallback_localization(request), "fallback"
        try:
            result = await self.localization_provider.review(request)
            return result, "hkchat"
        except Exception as exc:
            logger.warning(
                "AI localization provider failed (%s): %s",
                type(exc).__name__,
                exc,
            )
            return self._fallback_localization(request), "fallback"

    async def play_turn(self, request: TurnRequest) -> TurnResponse:
        cached = await self.cache.get(request)
        if cached is not None:
            return cached

        scene_task = self._scene_result(request)
        localization_task = self._localization_result(request)
        (result, scene_source), (localization, localization_source) = (
            await asyncio.gather(scene_task, localization_task)
        )
        response = TurnResponse(
            provider=self._provider_label(scene_source, localization_source),
            localization=localization,
            **result.model_dump(),
        )
        await self.cache.set(request, response)
        return response
