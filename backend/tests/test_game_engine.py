import pytest

from app.core.config import Settings
from app.models.schemas import LocalizationFeedback, ModelTurn, TurnRequest, TurnResponse
from app.services.game_engine import GameEngine


def sample_request() -> TurnRequest:
    return TurnRequest.model_validate(
        {
            "scene": {
                "id": "central-client-brief",
                "speaker": "陈嘉敏",
                "role": "区域业务总监",
                "npc_line_yue": "点解要而家转？",
                "npc_line_zh": "为什么现在转型？",
                "coach_hint": "先回应风险。",
            },
            "player_action": {
                "choice_id": "risk-first",
                "text": "我先讲风险，再做试点。",
            },
            "state": {
                "trust": 42,
                "professionalism": 61,
                "language": 56,
                "culture": 53,
            },
            "fallback": {
                "npc_line_yue": "好，讲下点控制成本。",
                "npc_line_zh": "好，说说怎样控制成本。",
                "coach_feedback": "你把抽象观点变成了可验证行动。",
                "delta": {
                    "trust": 6,
                    "professionalism": 5,
                    "language": 2,
                    "culture": 4,
                },
            },
        }
    )


@pytest.mark.asyncio
async def test_mock_provider_returns_valid_bounded_turn() -> None:
    engine = GameEngine(
        Settings(
            ai_provider="mock",
            ai_scene_provider="mock",
            ai_localize_provider="mock",
        )
    )
    response = await engine.play_turn(sample_request())

    assert response.provider == "fallback"
    assert response.delta.trust == 6
    assert response.npc_line_yue.startswith("好")
    assert response.localization.source == "fallback"
    assert response.localization.business_fit == 7


def test_rejects_out_of_bounds_model_delta() -> None:
    payload = sample_request().model_dump()
    payload["fallback"]["delta"]["trust"] = 99

    with pytest.raises(ValueError):
        TurnRequest.model_validate(payload)


def test_accepts_bounded_custom_response_with_neutral_fallback() -> None:
    payload = sample_request().model_dump()
    payload["player_action"] = {
        "choice_id": "custom-response",
        "text": "我想先确认风险，再同你定一个两星期试点。",
    }
    payload["fallback"]["delta"] = {
        "trust": 0,
        "professionalism": 0,
        "language": 0,
        "culture": 0,
    }

    request = TurnRequest.model_validate(payload)

    assert request.player_action.choice_id == "custom-response"
    assert request.fallback.delta.trust == 0


def test_configures_dual_model_pipeline() -> None:
    engine = GameEngine(
        Settings(
            ai_scene_provider="deepseek",
            ai_localize_provider="hkchat",
            hkchat_api_key="test-hkchat-key",
            deepseek_api_key="test-deepseek-key",
        )
    )

    assert engine.provider_name == "deepseek+hkchat"
    assert engine.scene_provider is not None
    assert engine.localization_provider is not None


def test_turn_response_accepts_hkchat_provider() -> None:
    result = sample_request().fallback.model_dump()
    localization = {
        "naturalness": 8,
        "politeness": 9,
        "business_fit": 8,
        "hk_rewrite": "我哋可以先做兩星期試點。",
        "comment": "講法自然，而且有回應對方風險。",
        "source": "hkchat",
    }

    response = TurnResponse(
        provider="deepseek+hkchat",
        localization=localization,
        **result,
    )

    assert response.provider == "deepseek+hkchat"
    assert response.localization.naturalness == 8


@pytest.mark.asyncio
async def test_repeated_turn_uses_cache() -> None:
    class CountingSceneProvider:
        def __init__(self) -> None:
            self.calls = 0

        async def generate_turn(self, request: TurnRequest) -> ModelTurn:
            self.calls += 1
            return ModelTurn(**request.fallback.model_dump())

    class CountingLocalizationProvider:
        def __init__(self) -> None:
            self.calls = 0

        async def review(self, request: TurnRequest) -> LocalizationFeedback:
            self.calls += 1
            return LocalizationFeedback(
                naturalness=8,
                politeness=8,
                business_fit=9,
                hk_rewrite=request.player_action.text,
                comment="表达自然，而且回应了对方的风险顾虑。",
                source="hkchat",
            )

    engine = GameEngine(
        Settings(
            ai_scene_provider="mock",
            ai_localize_provider="mock",
            ai_cache_ttl_seconds=600,
        )
    )
    scene_provider = CountingSceneProvider()
    localization_provider = CountingLocalizationProvider()
    engine.scene_provider = scene_provider
    engine.localization_provider = localization_provider  # type: ignore[assignment]

    first = await engine.play_turn(sample_request())
    second = await engine.play_turn(sample_request())

    assert first == second
    assert scene_provider.calls == 1
    assert localization_provider.calls == 1


@pytest.mark.asyncio
async def test_repeated_incoming_npc_line_falls_back_safely() -> None:
    class RepeatingSceneProvider:
        async def generate_turn(self, request: TurnRequest) -> ModelTurn:
            return ModelTurn(
                npc_line_yue=request.scene.npc_line_yue,
                npc_line_zh="我听到你的回答。",
                coach_feedback="模型错误地重复了原问题。",
                delta={
                    "trust": 3,
                    "professionalism": 2,
                    "language": 1,
                    "culture": 1,
                },
            )

    engine = GameEngine(
        Settings(ai_scene_provider="mock", ai_localize_provider="mock")
    )
    engine.scene_provider = RepeatingSceneProvider()

    response = await engine.play_turn(sample_request())

    assert response.provider == "fallback"
    assert response.npc_line_yue == sample_request().fallback.npc_line_yue
    assert response.delta == sample_request().fallback.delta
