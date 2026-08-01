import json
import re
from pathlib import Path
from uuid import uuid4

from app.models.schemas import (
    ComposedScenario,
    InferenceResult,
    KnowledgeSourceRef,
    RedactionSummary,
    ScenarioComposeRequest,
    ScenarioInference,
    ScenarioRound,
    SkillCardRef,
)


DATA_DIR = Path(__file__).resolve().parents[2] / "data"
SHARED_DIR = Path(__file__).resolve().parents[3] / "shared"


def _load_json(name: str):
    with (DATA_DIR / name).open(encoding="utf-8") as handle:
        return json.load(handle)


def _load_shared_json(name: str):
    with (SHARED_DIR / name).open(encoding="utf-8") as handle:
        return json.load(handle)


SOURCES = _load_json("sources.json")
SKILL_CARDS = _load_json("skill_cards.json")
CASE_PATTERNS = _load_json("case_patterns.json")
SCENARIO_TEMPLATES = _load_json("scenario_templates.json")
INFERENCE_CONFIG = _load_shared_json("scenario-inference.json")

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
            r"(?:地址(?:是|为|在|[:：])?\s*"
            r"[\u4e00-\u9fffA-Za-z0-9\-]{2,40}(?=[，。；,;]|$))|"
            r"(?:[\u4e00-\u9fffA-Za-z]{2,24}(?:路|街|道|巷)"
            r"[\u4e00-\u9fffA-Za-z\-]{0,12}\d{1,6}"
            r"(?:号|號|室|楼|樓|座)?)"
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


FOCUS_RULE_BY_ID = {
    rule["id"]: rule for rule in INFERENCE_CONFIG["focusRules"]
}


def _normalize(value: str) -> str:
    return " ".join(value.lower().split())


def _pattern_score(pattern: dict, description: str) -> int:
    text = _normalize(description)
    keyword_score = sum(
        2 for keyword in pattern["keywords"] if _normalize(keyword) in text
    )
    strong_score = sum(
        6
        for phrase in FOCUS_RULE_BY_ID.get(pattern["id"], {}).get(
            "strongPhrases", []
        )
        if _normalize(phrase) in text
    )
    return keyword_score + strong_score


def _classification_text(description: str) -> str:
    text = re.sub(r"\[(?:姓名|机构名称|电邮|电话|网址|地址|凭证)\]", "", description)
    return re.sub(
        r"(?:邮箱|电邮|电话|网址|地址)\s*[:：]?\s*(?=$|[，。；,;])",
        "",
        text,
    )


FOCUS_PATTERN_IDS = {
    "任务澄清": "ambiguous-brief",
    "优先级协商": "priority-conflict",
    "风险汇报": "delivery-risk",
    "范围控制": "scope-request",
    "催进度": "soft-follow-up",
    "高层汇报": "executive-brief",
    "资料边界": "personal-data-request",
    "表达异议": "workplace-conflict",
}

VISUAL_BACKGROUNDS = {
    "vincent-war-room": "/assets/custom-vincent-war-room-v01.png",
    "mrs-ho-manager-office": "/assets/custom-mrs-ho-manager-office-v01.png",
    "chen-client-boardroom": "/assets/custom-chen-client-boardroom-v01.png",
    "ah-long-open-office": "/assets/custom-ah-long-open-office-v01.png",
    "chen-video-call": "/assets/custom-chen-video-call-v01.png",
    "mrs-ho-restaurant": "/assets/custom-mrs-ho-restaurant-v01.png",
}


def _select_patterns(
    description: str, focus: str
) -> tuple[list[dict], InferenceResult]:
    if focus != "自动":
        pattern_id = FOCUS_PATTERN_IDS[focus]
        pattern = next(item for item in CASE_PATTERNS if item["id"] == pattern_id)
        return [pattern], InferenceResult(
            value=pattern["task"],
            confidence="high",
            reasons=["采用你确认的训练重点"],
        )

    scored = [
        (
            item,
            _pattern_score(item, description),
            FOCUS_RULE_BY_ID.get(item["id"], {}).get("priority", 0),
        )
        for item in CASE_PATTERNS
    ]
    ranked = sorted(
        scored,
        key=lambda entry: (
            entry[1],
            entry[2],
            -CASE_PATTERNS.index(entry[0]),
        ),
        reverse=True,
    )

    selected: list[dict] = []
    for item, score, _priority in ranked:
        if score <= 0:
            continue
        if (
            item["id"] == "soft-follow-up"
            and selected
            and selected[0]["id"] == "delivery-risk"
            and not any(
                signal in description
                for signal in (
                    "跟进",
                    "没回复",
                    "未回复",
                    "没有回复",
                    "还没有回复",
                    "一直没回复",
                    "得闲",
                    "有空",
                    "催进度",
                    "催办",
                    "确认负责人和时间",
                )
            )
        ):
            continue
        selected.append(item)
        if len(selected) == 2:
            break

    if not selected:
        selected.append(
            next(item for item in CASE_PATTERNS if item["id"] == "workplace-conflict")
        )
    primary = selected[0]
    score = next(value for item, value, _priority in ranked if item is primary)
    rule = FOCUS_RULE_BY_ID.get(primary["id"], {})
    confidence = "high" if score >= 6 else "medium" if score > 0 else "low"
    reason = rule.get("reason", "根据任务描述匹配训练模式")
    if score == 0:
        reason = "未检测到明确任务，采用通用异议训练"
    return selected[:2], InferenceResult(
        value=primary["task"],
        confidence=confidence,
        reasons=[reason],
    )


def _match_rule(description: str, rules: list[dict]) -> dict | None:
    text = _normalize(description)
    return next(
        (
            rule
            for rule in rules
            if any(_normalize(phrase) in text for phrase in rule["phrases"])
        ),
        None,
    )


def _infer_dimension(
    description: str,
    preference: str,
    fallback: str,
    rules: list[dict],
    label: str,
) -> InferenceResult:
    if preference != "自动":
        return InferenceResult(
            value=preference,
            confidence="high",
            reasons=[f"采用你确认的{label}"],
        )
    rule = _match_rule(description, rules)
    if rule:
        return InferenceResult(
            value=rule["value"],
            confidence=rule["confidence"],
            reasons=[rule["reason"]],
        )
    return InferenceResult(
        value=fallback,
        confidence="low",
        reasons=[f"没有明确{label}线索，按主要任务模板补足"],
    )


def _visual_scene_id(relation: str, channel: str) -> str:
    override = next(
        (
            item
            for item in INFERENCE_CONFIG["sceneOverrides"]
            if item["relation"] == relation and item["channel"] == channel
        ),
        None,
    )
    if override:
        return override["visualSceneId"]
    return INFERENCE_CONFIG["personaScenes"].get(
        relation,
        {
            "visualSceneId": INFERENCE_CONFIG["defaults"]["visualSceneId"]
        },
    )["visualSceneId"]


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


def _rounds(
    patterns: list[dict],
    description: str,
    pressure: str,
    count: int,
) -> list[ScenarioRound]:
    pressure_suffix = SCENARIO_TEMPLATES["pressureLevels"][pressure]["promptSuffix"]
    summary = re.split(r"[，。；;]", description, maxsplit=1)[0][:48].rstrip()
    prompts = [
        (
            f"你话而家要处理「{summary}」。先讲清楚，你想我最后答应或者确认咩？",
            f"你说现在要处理“{summary}”。先讲清楚，你希望我最后答应或确认什么？",
        ),
        (
            "你个判断凭咩？如果我唔接受，你仲有咩具体依据或者选择？",
            "你的判断依据是什么？如果我不接受，你还有什么具体依据或选择？",
        ),
        (
            "时间同资源唔会一齐加，你建议点取舍？讲埋边一项会受影响。",
            "时间和资源不会同时增加，你建议怎样取舍？也说明哪一项会受影响。",
        ),
        (
            "你个方案对件事有帮助，但对我有咩保障？点避免我承担晒风险？",
            "你的方案对事情有帮助，但对我有什么保障？怎样避免由我承担全部风险？",
        ),
        (
            "而家讲到执行：边个喺几时做咩？中间边个点要再确认？",
            "现在谈执行：谁在什么时间做什么？中间哪个节点需要再次确认？",
        ),
        (
            "最后一次：你用两句说清楚共识，同埋下一次更新系几时。",
            "最后一次：请用两句话说清共识，以及下一次更新时间。",
        ),
    ]
    phases = [
        ("define", "定义希望达成的真实结果", "先说希望对方确认什么，再补一项最关键事实。"),
        ("probe", "回应质疑并补足依据", "回应对方刚才的具体疑问，不要重讲开场白。"),
        ("tradeoff", "在限制中提出取舍", "给出一个判断、一个影响和一个可选方案。"),
        ("relationship", "处理对方的关系顾虑", "承接对方担心承担的风险，再说明你愿意负责什么。"),
        ("commit", "形成负责人和检查点", "明确负责人、时间点、依赖和下一次更新。"),
        ("close", "把共识写成可执行收口", "用最少的话确认共识、未决项和确认方式。"),
    ]
    rounds: list[ScenarioRound] = []
    pattern_key = "-".join(pattern["id"] for pattern in patterns)
    for index, (round_id, purpose, hint) in enumerate(phases[:count]):
        yue, zh = prompts[index]
        rounds.append(
            ScenarioRound(
                id=f"{pattern_key}-{round_id}",
                purpose=purpose,
                npc_line_yue=f"{yue} {pressure_suffix}",
                npc_line_zh=f"{zh} {pressure_suffix}",
                coach_hint=hint,
            )
        )
    return rounds


def compose_scenario(request: ScenarioComposeRequest) -> ComposedScenario:
    redacted_description, redaction = redact_description(request.description)
    classification_text = _classification_text(redacted_description)
    patterns, focus_inference = _select_patterns(
        classification_text, request.focus
    )
    primary_pattern = patterns[0]
    skill_ids = list(
        dict.fromkeys(
            skill_id
            for pattern in patterns
            for skill_id in pattern["skillIds"]
        )
    )[:3]
    skills = [SKILL_BY_ID[skill_id] for skill_id in skill_ids]
    source_ids = list(
        dict.fromkeys(
            source_id
            for skill in skills
            for source_id in skill["sourceIds"]
        )
    )
    sources = [SOURCE_BY_ID[source_id] for source_id in source_ids]
    relation_inference = _infer_dimension(
        classification_text,
        request.relation,
        primary_pattern["relation"],
        INFERENCE_CONFIG["relationshipRules"],
        "关系",
    )
    channel_inference = _infer_dimension(
        classification_text,
        request.channel,
        primary_pattern["channel"],
        INFERENCE_CONFIG["channelRules"],
        "渠道",
    )
    relationship = relation_inference.value
    channel = channel_inference.value
    difficulty = SCENARIO_TEMPLATES["pressureLevels"][request.pressure]["difficulty"]
    persona = INFERENCE_CONFIG["personaScenes"].get(
        relationship,
        {
            "speaker": primary_pattern["npc"]["speaker"],
            "role": primary_pattern["npc"]["role"],
            "visualSceneId": INFERENCE_CONFIG["defaults"]["visualSceneId"],
        },
    )
    visual_scene_id = _visual_scene_id(relationship, channel)
    tasks = [pattern["task"] for pattern in patterns]
    task = "与".join(tasks)
    objective = "；同时".join(skill["objective"] for skill in skills[:2])
    transfer_template = "；再用：".join(
        _transfer_template(pattern) for pattern in patterns
    )

    return ComposedScenario(
        id=f"custom-{uuid4().hex[:12]}",
        title=f"现实情境 · {task}",
        relation=relationship,
        task=task,
        channel=channel,
        difficulty=difficulty,
        pressure=request.pressure,
        speaker=persona["speaker"],
        role=persona["role"],
        objective=objective,
        hidden_risk=_relationship_risk(skills),
        transfer_template=transfer_template,
        fallback_scenario_id=primary_pattern["fallbackScenarioId"],
        visual_scene_id=visual_scene_id,
        background=VISUAL_BACKGROUNDS[visual_scene_id],
        redacted_description=redacted_description,
        redaction=redaction,
        skill_cards=[_skill_ref(skill) for skill in skills],
        sources=[_source_ref(source) for source in sources],
        rounds=_rounds(
            patterns,
            classification_text,
            request.pressure,
            request.rounds,
        ),
        disclaimer=(
            "这是匿名沟通训练，不替代法律、人事、医疗或心理专业意见。"
            "高风险情况请使用所属机构的正式流程或官方求助渠道。"
        ),
        provider="rules+knowledge",
        composition_source="rules+knowledge",
        inference=ScenarioInference(
            relation=relation_inference,
            channel=channel_inference,
            focus=focus_inference,
        ),
    )
