import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app
from app.services.public_budget import PublicApiBudget, PublicBudgetExhausted


@pytest.mark.asyncio
async def test_public_budget_enforces_global_and_client_limits(tmp_path) -> None:
    budget = PublicApiBudget(
        Settings(
            public_ai_budget_cny=0.15,
            public_ai_estimated_turn_cost_cny=0.05,
            public_ai_turns_per_client=2,
            public_ai_budget_db_path=str(tmp_path / "quota.sqlite3"),
            public_ai_client_hash_salt="test-salt",
        )
    )

    await budget.reserve("client-a")
    second = await budget.reserve("client-a")
    assert second.remaining_turns == 1
    with pytest.raises(PublicBudgetExhausted):
        await budget.reserve("client-a")

    final = await budget.reserve("client-b")
    assert final.remaining_turns == 0
    with pytest.raises(PublicBudgetExhausted):
        await budget.reserve("client-c")


@pytest.mark.asyncio
async def test_disabled_public_budget_does_not_create_database(tmp_path) -> None:
    database = tmp_path / "quota.sqlite3"
    budget = PublicApiBudget(
        Settings(public_ai_budget_cny=0, public_ai_budget_db_path=str(database))
    )

    snapshot = await budget.reserve("client-a")

    assert snapshot.enabled is False
    assert snapshot.remaining_turns is None
    assert database.exists() is False


def test_turn_endpoint_falls_back_after_public_quota_is_exhausted(tmp_path) -> None:
    client = TestClient(
        create_app(
            Settings(
                ai_scene_provider="mock",
                ai_localize_provider="mock",
                public_ai_budget_cny=0.05,
                public_ai_estimated_turn_cost_cny=0.05,
                public_ai_turns_per_client=1,
                public_ai_budget_db_path=str(tmp_path / "quota.sqlite3"),
            )
        )
    )
    payload = {
        "scene": {
            "id": "quota-check",
            "speaker": "陈嘉敏",
            "role": "区域业务总监",
            "npc_line_yue": "你会点跟进？",
            "npc_line_zh": "你会怎样跟进？",
            "coach_hint": "给出负责人和时间。",
        },
        "player_action": {
            "choice_id": "custom-response",
            "text": "我会今日确认负责人，听朝十一点前更新。",
            "input_kind": "free",
        },
        "state": {
            "trust": 50,
            "professionalism": 50,
            "language": 50,
            "culture": 50,
        },
        "fallback": {
            "npc_line_yue": "好，你跟住呢个时间更新。",
            "npc_line_zh": "好，你按这个时间更新。",
            "coach_feedback": "负责人和更新时间都清楚。",
            "delta": {
                "trust": 1,
                "professionalism": 1,
                "language": 1,
                "culture": 1,
            },
        },
    }

    assert client.post("/api/game/turn", json=payload).status_code == 200
    exhausted = client.post("/api/game/turn", json=payload)
    assert exhausted.status_code == 429
    assert exhausted.json()["detail"]["code"] == "public_budget_exhausted"
    quota = client.get("/api/public/quota").json()
    assert quota["remaining_turns"] == 0
