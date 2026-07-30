from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class Status(BaseModel):
    trust: int = Field(ge=0, le=100)
    professionalism: int = Field(ge=0, le=100)
    language: int = Field(ge=0, le=100)
    culture: int = Field(ge=0, le=100)


class Delta(BaseModel):
    trust: int = Field(default=0, ge=-6, le=6)
    professionalism: int = Field(default=0, ge=-6, le=6)
    language: int = Field(default=0, ge=-6, le=6)
    culture: int = Field(default=0, ge=-6, le=6)


class SceneContext(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    speaker: str = Field(min_length=1, max_length=40)
    role: str = Field(min_length=1, max_length=60)
    npc_line_yue: str = Field(min_length=1, max_length=280)
    npc_line_zh: str = Field(min_length=1, max_length=280)
    coach_hint: str = Field(min_length=1, max_length=360)
    objective: str = Field(default="", max_length=360)
    hidden_risk: str = Field(default="", max_length=420)
    transfer_template: str = Field(default="", max_length=420)


class PlayerAction(BaseModel):
    choice_id: str = Field(min_length=1, max_length=80)
    text: str = Field(min_length=1, max_length=320)


class TurnFallback(BaseModel):
    npc_line_yue: str = Field(min_length=1, max_length=280)
    npc_line_zh: str = Field(min_length=1, max_length=280)
    coach_feedback: str = Field(min_length=1, max_length=420)
    delta: Delta


class TurnRequest(BaseModel):
    scene: SceneContext
    player_action: PlayerAction
    state: Status
    fallback: TurnFallback


class ModelTurn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    npc_line_yue: str = Field(min_length=1, max_length=280)
    npc_line_zh: str = Field(min_length=1, max_length=280)
    coach_feedback: str = Field(min_length=1, max_length=420)
    delta: Delta

    @field_validator("npc_line_yue", "npc_line_zh", "coach_feedback")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        return " ".join(value.split())


class LocalizationFeedback(BaseModel):
    model_config = ConfigDict(extra="forbid")

    naturalness: int = Field(ge=0, le=10)
    politeness: int = Field(ge=0, le=10)
    business_fit: int = Field(ge=0, le=10)
    hk_rewrite: str = Field(min_length=1, max_length=320)
    comment: str = Field(min_length=1, max_length=420)
    source: Literal["hkchat", "fallback"]

    @field_validator("hk_rewrite", "comment")
    @classmethod
    def normalize_feedback_text(cls, value: str) -> str:
        return " ".join(value.split())


class TurnResponse(ModelTurn):
    provider: Literal[
        "deepseek+hkchat",
        "deepseek+fallback",
        "fallback+hkchat",
        "fallback",
    ]
    localization: LocalizationFeedback


class ScenarioComposeRequest(BaseModel):
    description: str = Field(min_length=20, max_length=500)
    pressure: Literal["温和", "直接", "高压"] = "直接"
    rounds: int = Field(default=3, ge=2, le=3)

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: str) -> str:
        return " ".join(value.split())


class RedactionSummary(BaseModel):
    count: int = Field(ge=0)
    categories: list[str] = Field(default_factory=list)


class KnowledgeSourceRef(BaseModel):
    id: str
    title: str
    publisher: str
    url: str
    usage_note: str
    risk_level: Literal["low", "medium", "high"]


class SkillCardRef(BaseModel):
    id: str
    title: str
    objective: str
    steps: list[str]
    source_ids: list[str]
    legal_risk: Literal["low", "medium", "high"]


class ScenarioRound(BaseModel):
    id: str
    purpose: str
    npc_line_yue: str
    npc_line_zh: str
    coach_hint: str


class ComposedScenario(BaseModel):
    id: str
    title: str
    relation: str
    task: str
    channel: str
    difficulty: str
    pressure: Literal["温和", "直接", "高压"]
    speaker: str
    role: str
    objective: str
    hidden_risk: str
    transfer_template: str
    fallback_scenario_id: str
    background: str
    redacted_description: str
    redaction: RedactionSummary
    skill_cards: list[SkillCardRef] = Field(min_length=1, max_length=3)
    sources: list[KnowledgeSourceRef] = Field(min_length=1, max_length=6)
    rounds: list[ScenarioRound] = Field(min_length=2, max_length=3)
    disclaimer: str
    provider: Literal["rules+knowledge"]
