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
