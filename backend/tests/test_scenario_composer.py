import json
from pathlib import Path

from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app
from app.models.schemas import ScenarioComposeRequest
from app.services.scenario_composer import compose_scenario, redact_description


DATA_DIR = Path(__file__).resolve().parents[1] / "data"


def test_redacts_personal_and_confidential_information() -> None:
    text = (
        "我叫张伟，经理叫Alex Wong，公司是火鸟咨询，"
        "请打13800138000或发到alex@example.com，"
        "项目地址是皇后大道东248号，API_KEY=secret123456。"
    )

    redacted, summary = redact_description(text)

    assert "张伟" not in redacted
    assert "Alex Wong" not in redacted
    assert "火鸟咨询" not in redacted
    assert "13800138000" not in redacted
    assert "alex@example.com" not in redacted
    assert "secret123456" not in redacted
    assert summary.count >= 6
    assert {"姓名", "机构名称", "电话", "电邮", "凭证"}.issubset(
        set(summary.categories)
    )


def test_composes_bounded_priority_training() -> None:
    request = ScenarioComposeRequest(
        description="经理要求我同时完成两件今天到期的任务，我不知道怎样提出优先级。",
        pressure="高压",
        rounds=3,
    )

    scenario = compose_scenario(request)

    assert scenario.task == "优先级协商"
    assert scenario.relation == "上司"
    assert scenario.pressure == "高压"
    assert scenario.difficulty == "高压"
    assert len(scenario.rounds) == 3
    assert scenario.fallback_scenario_id == "practice-mrs-ho-priority-conflict"
    assert scenario.skill_cards[0].id == "negotiate-priority"
    assert scenario.sources
    assert all(source.url.startswith("https://") for source in scenario.sources)


def test_custom_description_is_not_echoed_when_it_contains_private_data() -> None:
    request = ScenarioComposeRequest(
        description="客户叫陈大文，电话是91234567，他要求我今天发完整员工名单。",
        pressure="直接",
        rounds=2,
    )

    scenario = compose_scenario(request)

    assert "陈大文" not in scenario.redacted_description
    assert "91234567" not in scenario.redacted_description
    assert len(scenario.rounds) == 2
    assert scenario.redaction.count == 2


def test_contact_details_do_not_override_the_workplace_task() -> None:
    scenario = compose_scenario(
        ScenarioComposeRequest(
            description=(
                "我叫陈先生，在星火科技负责项目。客户催促交付，但内部团队要延迟两天，"
                "请帮我练习如何解释并承诺下一步。邮箱 test@example.com，电话 13800138000。"
            ),
            pressure="高压",
            rounds=3,
        )
    )

    assert scenario.task == "风险汇报"
    assert scenario.relation == "客户"
    assert scenario.channel != "电话"
    assert "星火科技" not in scenario.redacted_description
    assert "test@example.com" not in scenario.redacted_description


def test_combines_multiple_real_world_tasks_and_matches_the_relationship() -> None:
    scenario = compose_scenario(
        ScenarioComposeRequest(
            description=(
                "我要向跨部门同事解释项目延期，对方又临时要求扩大范围，"
                "我希望练习怎样讲清事实、守住范围并约定下一步。"
            ),
            pressure="直接",
            rounds=5,
        )
    )

    assert "风险汇报" in scenario.task
    assert "范围控制" in scenario.task
    assert scenario.relation == "跨部门伙伴"
    assert scenario.speaker == "阿朗"
    assert scenario.background.endswith("custom-ah-long-open-office-v01.png")
    assert len(scenario.rounds) == 5
    assert len(scenario.skill_cards) >= 2


def test_user_can_override_role_channel_focus_and_session_length() -> None:
    scenario = compose_scenario(
        ScenarioComposeRequest(
            description="我需要练习在远程会议中回应客户不断加入的新要求，并确认交换条件。",
            pressure="高压",
            rounds=6,
            relation="客户",
            channel="视频会议",
            focus="范围控制",
        )
    )

    assert scenario.relation == "客户"
    assert scenario.channel == "视频会议"
    assert scenario.speaker == "陈嘉敏"
    assert scenario.task.startswith("范围控制")
    assert scenario.background.endswith("custom-chen-video-call-v01.png")
    assert len(scenario.rounds) == 6


def test_knowledge_base_meets_competition_minimums() -> None:
    sources = json.loads((DATA_DIR / "sources.json").read_text(encoding="utf-8"))
    skills = json.loads((DATA_DIR / "skill_cards.json").read_text(encoding="utf-8"))
    source_ids = {source["id"] for source in sources}

    assert len(sources) >= 30
    assert len(skills) >= 20
    assert all(skill["sourceIds"] for skill in skills)
    assert all(set(skill["sourceIds"]).issubset(source_ids) for skill in skills)


def test_compose_endpoint_returns_structured_scenario() -> None:
    client = TestClient(
        create_app(
            Settings(
                ai_scene_provider="mock",
                ai_localize_provider="mock",
            )
        )
    )

    response = client.post(
        "/api/scenario/compose",
        json={
            "description": "导师让我尽快交一个方案，但没有告诉我格式，我不敢继续追问。",
            "pressure": "直接",
            "rounds": 3,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["task"] == "任务澄清"
    assert payload["provider"] == "rules+knowledge"
    assert len(payload["rounds"]) == 3
