import pytest

from app.core.config import Settings
from app.models.schemas import TurnRequest
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
    engine = GameEngine(Settings(ai_provider="mock"))
    response = await engine.play_turn(sample_request())

    assert response.provider == "mock"
    assert response.delta.trust == 6
    assert response.npc_line_yue.startswith("好")


def test_rejects_out_of_bounds_model_delta() -> None:
    payload = sample_request().model_dump()
    payload["fallback"]["delta"]["trust"] = 99

    with pytest.raises(ValueError):
        TurnRequest.model_validate(payload)
