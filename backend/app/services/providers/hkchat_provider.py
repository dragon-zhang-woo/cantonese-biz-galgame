import json

from openai import AsyncOpenAI
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.core.config import Settings
from app.models.schemas import LocalizationFeedback, TurnRequest
from app.services.providers.base import LocalizationProvider


LOCALIZATION_SYSTEM_PROMPT = """
你係香港商務語境教練。你只負責評估玩家講法，唔負責推進劇情。

只回傳一個 JSON object，不要 markdown 或額外解釋：
{
  "naturalness": 0,
  "politeness": 0,
  "business_fit": 0,
  "hk_rewrite": "更自然但意思相同的香港商務講法",
  "comment": "一句清楚解釋語言正確性與社交效果的評語",
  "source": "hkchat"
}

要求：
- 三個分數必須是 0 到 10 的整數。
- 評估要結合角色關係、商務目的和當前場景，不能只看文法。
- scene.history 係之前完整匿名對話；評語要承接玩家已經講過嘅內容，
  唔好將每一輪當成第一次回答。
- 如輸入包含 objective、hidden_risk 同 transfer_template，要同時判斷玩家
  有冇完成實際任務、避開隱藏風險，並提供可直接帶到真實職場使用的改善。
- 唔好用「hidden_risk」等系統字眼直接劇透，要用自然教練語言講清後果。
- hk_rewrite 保留玩家原意，不得添加承諾、價格或事實。
- 不宣稱只有一種正確講法。
""".strip()


class HKChatProvider(LocalizationProvider):
    def __init__(self, settings: Settings):
        base_url = settings.hkchat_base_url.rstrip("/")
        if not base_url.endswith("/v1"):
            base_url += "/v1"

        self.client = AsyncOpenAI(
            api_key=settings.hkchat_api_key,
            base_url=base_url,
            timeout=30.0,
        )
        self.model = settings.hkchat_model
        self.enable_thinking = settings.hkchat_enable_thinking
        self.reasoning_effort = settings.hkchat_reasoning_effort

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=0.25, min=0.25, max=1),
        retry=retry_if_exception_type((ValueError, json.JSONDecodeError)),
        reraise=True,
    )
    async def review(self, request: TurnRequest) -> LocalizationFeedback:
        payload = request.model_dump(mode="json")
        extra_body: dict[str, object] = {
            "include_reasoning": False,
            "chat_template_kwargs": {
                "enable_thinking": self.enable_thinking,
            },
        }
        if self.enable_thinking and self.reasoning_effort != "none":
            extra_body["reasoning_effort"] = self.reasoning_effort

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": LOCALIZATION_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": "請評估以下 json input：\n"
                    + json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
                },
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=520,
            extra_body=extra_body,
        )
        content = response.choices[0].message.content
        if not content:
            raise ValueError("HKChat returned empty content")
        return LocalizationFeedback.model_validate_json(content)
