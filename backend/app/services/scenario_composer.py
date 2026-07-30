import json
import re
from pathlib import Path
from uuid import uuid4

from app.models.schemas import (
    ComposedScenario,
    KnowledgeSourceRef,
    RedactionSummary,
    ScenarioComposeRequest,
    ScenarioRound,
    SkillCardRef,
)


DATA_DIR = Path(__file__).resolve().parents[2] / "data"


def _load_json(name: str):
    with (DATA_DIR / name).open(encoding="utf-8") as handle:
        return json.load(handle)


SOURCES = _load_json("sources.json")
SKILL_CARDS = _load_json("skill_cards.json")
CASE_PATTERNS = _load_json("case_patterns.json")
SCENARIO_TEMPLATES = _load_json("scenario_templates.json")

SOURCE_BY_ID = {item["id"]: item for item in SOURCES}
SKILL_BY_ID = {item["id"]: item for item in SKILL_CARDS}


REDACTION_PATTERNS = [
    (
        "凭证",
        re.compile(
            r"(?i)(?:api[_ -]?key|access[_ -]?token|secret|password|sk-)"
            r"\s*[:=]?\s*[A-Za-z0-9_\-]{8,}"
        ),
    ),
    (
        "电邮",
        re.compile(
            r"(?<![A-Z0-9._%+-])[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}",
            re.I,
        ),
    ),
    (
        "电话",
        re.compile(r"(?<!\d)(?:\+?86[- ]?)?1[3-9]\d{9}(?!\d)|(?<!\d)(?:\+?852[- ]?)?[2-9]\d{3}[- ]?\d{4}(?!\d)"),
    ),
    (
        "网址",
        re.compile(r"https?://\S+|www\.\S+", re.I),
    ),
    (
        "地址",
        re.compile(
            r"[\u4e00-\u9fffA-Za-z0-9]{2,24}"
            r"(?:路|街|道|巷|大厦|中心|广场|楼|座)"
            r"[\u4e00-\u9fffA-Za-z0-9\-]{0,18}"
            r"(?:号|室|楼)?"
        ),
    ),
]

NAME_PATTERN = re.compile(
    r"(我叫|同事叫|经理叫|客户叫|导师叫|上司叫)"
    r"([\u4e00-\u9fff]{2,4}|[A-Za-z]+(?:\s+[A-Za-z]+){1,2})"
)
ORG_PATTERN = re.compile(
    r"(公司|客户|机构|项目)(叫|是|名称为)"
    r"([\u4e00-\u9fffA-Za-z0-9]{2,24})"
)
ORG_CONTEXT_PATTERN = re.compile(
    r"(在|来自)"
    r"([\u4e00-\u9fffA-Za-z0-9]{2,20}(?:公司|集团|科技|银行|学校|机构|中心))"
    r"(?=工作|任职|负责|的|，|,|。)"
)


def redact_description(value: str) -> tuple[str, RedactionSummary]:
    redacted = value
    categories: list[str] = []
    count = 0

    def replace_name(match: re.Match[str]) -> str:
        nonlocal count
        count += 1
        if "姓名" not in categories:
            categories.append("姓名")
        return f"{match.group(1)}[姓名]"

    def replace_org(match: re.Match[str]) -> str:
        nonlocal count
        count += 1
        if "机构名称" not in categories:
            categories.append("机构名称")
        return f"{match.group(1)}{match.group(2)}[机构名称]"

    def replace_context_org(match: re.Match[str]) -> str:
        nonlocal count
        count += 1
        if "机构名称" not in categories:
            categories.append("机构名称")
        return f"{match.group(1)}[机构名称]"

    redacted = NAME_PATTERN.sub(replace_name, redacted)
    redacted = ORG_PATTERN.sub(replace_org, redacted)
    redacted = ORG_CONTEXT_PATTERN.sub(replace_context_org, redacted)

    for label, pattern in REDACTION_PATTERNS:
        matches = pattern.findall(redacted)
        if not matches:
            continue
        count += len(matches)
        if label not in categories:
            categories.append(label)
        redacted = pattern.sub(f"[{label}]", redacted)

    return redacted, RedactionSummary(count=count, categories=categories)


def _pattern_score(pattern: dict, description: str) -> int:
    return sum(2 for keyword in pattern["keywords"] if keyword.lower() in description.lower())


def _classification_text(description: str) -> str:
    text = re.sub(r"\[(?:姓名|机构名称|电邮|电话|网址|地址|凭证)\]", "", description)
    return re.sub(
        r"(?:邮箱|电邮|电话|网址|地址)\s*[:：]?\s*(?=$|[，。；,;])",
        "",
        text,
    )


def _select_pattern(description: str) -> dict:
    ranked = sorted(
        CASE_PATTERNS,
        key=lambda item: (_pattern_score(item, description), -CASE_PATTERNS.index(item)),
        reverse=True,
    )
    return ranked[0]


def _relationship_from_text(description: str, fallback: str) -> str:
    relationship_keywords = {
        "客户": ["客户", "甲方", "客人"],
        "上司": ["上司", "经理", "老板", "主管"],
        "跨部门伙伴": ["跨部门", "其他部门", "别的团队"],
        "同事": ["同事", "组员", "团队成员"],
    }
    for relationship, keywords in relationship_keywords.items():
        if any(keyword.lower() in description.lower() for keyword in keywords):
            return relationship
    return fallback


def _channel_from_text(description: str, fallback: str) -> str:
    channel_keywords = {
        "邮件": ["邮件", "email", "电邮"],
        "电话": ["电话", "通话", "call"],
        "即时消息": ["微信", "WhatsApp", "消息", "群里", "即时"],
        "会议": ["会议", "会上", "汇报", "例会"],
        "当面": ["当面", "办公室", "午饭", "见面"],
    }
    for channel, keywords in channel_keywords.items():
        if any(keyword.lower() in description.lower() for keyword in keywords):
            return channel
    return fallback


def _source_ref(source: dict) -> KnowledgeSourceRef:
    return KnowledgeSourceRef(
        id=source["id"],
        title=source["title"],
        publisher=source["publisher"],
        url=source["url"],
        usage_note=source["usageNote"],
        risk_level=source["riskLevel"],
    )


def _skill_ref(skill: dict) -> SkillCardRef:
    return SkillCardRef(
        id=skill["id"],
        title=skill["title"],
        objective=skill["objective"],
        steps=skill["steps"],
        source_ids=skill["sourceIds"],
        legal_risk=skill["legalRisk"],
    )


def _relationship_risk(skills: list[dict]) -> str:
    risks = []
    for skill in skills:
        risks.extend(skill["relationshipRisks"])
    unique = list(dict.fromkeys(risks))
    return "；".join(unique[:3]) + "。"


def _transfer_template(pattern: dict) -> str:
    templates = {
        "priority-conflict": "目前＿＿和＿＿同时到期。我建议先做＿＿，因为＿＿；另一项会在＿＿更新，可以吗？",
        "ambiguous-brief": "我确认一下：目标是＿＿，交付物是＿＿，我会在＿＿前给你第一版，对吗？",
        "delivery-risk": "目前确认＿＿会受影响，影响是＿＿。我会负责＿＿，并在＿＿前再次更新。",
        "scope-request": "这个目标可以支持；如果加入＿＿，会影响＿＿。我们可以选择＿＿或＿＿，你希望先保哪一项？",
        "soft-follow-up": "为了赶上＿＿，可否由＿＿在＿＿前提供＿＿？如果时间不合适，我们一起调整范围。",
        "executive-brief": "我的建议是＿＿；关键依据是＿＿；主要风险是＿＿；请确认下一步由＿＿负责。",
        "personal-data-request": "我先确认资料用途、必要范围和获授权渠道；确认后我会在＿＿前提供最小所需资料。",
        "workplace-conflict": "我理解共同目标是＿＿。我担心＿＿会导致＿＿，建议先试＿＿，再在＿＿复核。",
    }
    return templates.get(pattern["id"], "我理解目标是＿＿；我会负责＿＿，并在＿＿前用＿＿方式确认下一步。")


def _rounds(pattern: dict, pressure: str, count: int) -> list[ScenarioRound]:
    pressure_suffix = SCENARIO_TEMPLATES["pressureLevels"][pressure]["promptSuffix"]
    prompts = [
        (
            "你先讲清楚，你认为而家最重要要解决咩？",
            "你先说清楚，你认为现在最重要要解决什么？",
        ),
        (
            "如果时间同资源都唔变，你建议点取舍？唔好只话有困难。",
            "如果时间和资源都不变，你建议怎样取舍？不要只说有困难。",
        ),
        (
            "好，咁边个喺几时做咩？你点确保大家理解一致？",
            "好，那么谁在什么时间做什么？你怎样确保大家理解一致？",
        ),
    ]
    rounds = []
    for index, template in enumerate(SCENARIO_TEMPLATES["rounds"][:count]):
        yue, zh = prompts[index]
        rounds.append(
            ScenarioRound(
                id=f"{pattern['id']}-{template['id']}",
                purpose=template["purpose"],
                npc_line_yue=f"{yue} {pressure_suffix}",
                npc_line_zh=f"{zh} {pressure_suffix}",
                coach_hint=template["coachHint"],
            )
        )
    return rounds


def compose_scenario(request: ScenarioComposeRequest) -> ComposedScenario:
    redacted_description, redaction = redact_description(request.description)
    classification_text = _classification_text(redacted_description)
    pattern = _select_pattern(classification_text)
    skills = [SKILL_BY_ID[skill_id] for skill_id in pattern["skillIds"]]
    source_ids = list(
        dict.fromkeys(
            source_id
            for skill in skills
            for source_id in skill["sourceIds"]
        )
    )
    sources = [SOURCE_BY_ID[source_id] for source_id in source_ids]
    channel = _channel_from_text(classification_text, pattern["channel"])
    relationship = _relationship_from_text(classification_text, pattern["relation"])
    difficulty = SCENARIO_TEMPLATES["pressureLevels"][request.pressure]["difficulty"]

    return ComposedScenario(
        id=f"custom-{uuid4().hex[:12]}",
        title=f"现实情境 · {pattern['task']}",
        relation=relationship,
        task=pattern["task"],
        channel=channel,
        difficulty=difficulty,
        pressure=request.pressure,
        speaker=pattern["npc"]["speaker"],
        role=pattern["npc"]["role"],
        objective=skills[0]["objective"],
        hidden_risk=_relationship_risk(skills),
        transfer_template=_transfer_template(pattern),
        fallback_scenario_id=pattern["fallbackScenarioId"],
        background=pattern["background"],
        redacted_description=redacted_description,
        redaction=redaction,
        skill_cards=[_skill_ref(skill) for skill in skills],
        sources=[_source_ref(source) for source in sources],
        rounds=_rounds(pattern, request.pressure, request.rounds),
        disclaimer=(
            "这是匿名沟通训练，不替代法律、人事、医疗或心理专业意见。"
            "高风险情况请使用所属机构的正式流程或官方求助渠道。"
        ),
        provider="rules+knowledge",
    )
