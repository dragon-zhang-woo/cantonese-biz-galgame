import json

from openai import AsyncOpenAI
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.core.config import Settings
from app.models.schemas import ModelTurn, TurnRequest
from app.services.providers.base import AIProvider

SYSTEM_PROMPT = """
You are the bounded narrative-performance and coaching engine for an original
Hong Kong business Cantonese visual novel.

Return one JSON object only. Do not add markdown.

The application, not you, owns the story graph. You may only:
1. write the NPC's immediate Cantonese reaction;
2. provide a concise Standard Chinese translation;
3. explain the workplace-pragmatics consequence;
4. suggest small score deltas.

Requirements:
- Cantonese must be natural Hong Kong written Cantonese with restrained
  code-switching only when business context calls for it.
- npc_line_yue must be the NPC's new reaction after the supplied player action;
  do not repeat the NPC line from the scene input.
- npc_line_zh must be a faithful Standard Chinese translation of
  npc_line_yue; the two lines must express the same reaction.
- Never claim one wording is universally correct.
- Coach feedback must distinguish linguistic correctness from social effect.
- Do not introduce legal, financial or medical advice.
- Each delta must be an integer from -6 to 6.
- Preserve the supplied outcome direction; do not reverse a clearly positive
  fallback into a negative result or vice versa.

JSON schema:
{
  "npc_line_yue": "string",
  "npc_line_zh": "string",
  "coach_feedback": "string",
  "delta": {
    "trust": 0,
    "professionalism": 0,
    "language": 0,
    "culture": 0
  }
}
""".strip()


class DeepSeekProvider(AIProvider):
    def __init__(self, settings: Settings):
        self.client = AsyncOpenAI(
            api_key=settings.deepseek_api_key,
            base_url=settings.deepseek_base_url,
            timeout=7.5,
        )
        self.model = settings.deepseek_model

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=0.25, min=0.25, max=1),
        retry=retry_if_exception_type((ValueError, json.JSONDecodeError)),
        reraise=True,
    )
    async def generate_turn(self, request: TurnRequest) -> ModelTurn:
        payload = request.model_dump(mode="json")
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": "json input:\n"
                    + json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
                },
            ],
            response_format={"type": "json_object"},
            temperature=0.55,
            max_tokens=700,
            extra_body={"thinking": {"type": "disabled"}},
        )
        content = response.choices[0].message.content
        if not content:
            raise ValueError("DeepSeek returned empty content")
        return ModelTurn.model_validate_json(content)
