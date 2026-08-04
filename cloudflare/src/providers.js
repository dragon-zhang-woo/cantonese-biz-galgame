import { DEEPSEEK_SYSTEM_PROMPT, HKCHAT_SYSTEM_PROMPT } from "./prompts.js";
import { validateLocalization, validateModelTurn } from "./validation.js";

function chatEndpoint(baseUrl) {
  const normalized = baseUrl.replace(/\/+$/, "");
  return `${normalized}/chat/completions`;
}

function parseJsonObject(content) {
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("empty_provider_content");
  }
  const trimmed = content.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  return JSON.parse(withoutFence);
}

async function postChat(fetchImpl, url, apiKey, body, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`provider_http_${response.status}`);
    const payload = await response.json();
    return parseJsonObject(payload?.choices?.[0]?.message?.content);
  } finally {
    clearTimeout(timeout);
  }
}

async function validatedProviderCall(call, validate) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return validate(await call());
    } catch (error) {
      lastError = error;
      if (String(error?.message || "").startsWith("provider_http_")) break;
    }
  }
  throw lastError;
}

export function requestDeepSeekTurn(request, env, config, fetchImpl = fetch) {
  const input = JSON.stringify(request);
  return validatedProviderCall(
    () =>
      postChat(
        fetchImpl,
        chatEndpoint(config.deepseekBaseUrl),
        env.DEEPSEEK_API_KEY,
        {
          model: config.deepseekModel,
          messages: [
            { role: "system", content: DEEPSEEK_SYSTEM_PROMPT },
            { role: "user", content: `json input:\n${input}` },
          ],
          response_format: { type: "json_object" },
          temperature: 0.55,
          max_tokens: 700,
          thinking: { type: "disabled" },
        },
        config.providerTimeoutMs,
      ),
    validateModelTurn,
  );
}

export function requestHkchatReview(request, env, config, fetchImpl = fetch) {
  const input = JSON.stringify(request);
  return validatedProviderCall(
    () =>
      postChat(
        fetchImpl,
        chatEndpoint(`${config.hkchatBaseUrl}/v1`.replace(/\/v1\/v1$/, "/v1")),
        env.HKCHAT_API_KEY,
        {
          model: config.hkchatModel,
          messages: [
            { role: "system", content: HKCHAT_SYSTEM_PROMPT },
            { role: "user", content: `請評估以下 json input：\n${input}` },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 520,
          include_reasoning: false,
          chat_template_kwargs: { enable_thinking: false },
        },
        config.providerTimeoutMs,
      ),
    validateLocalization,
  );
}

function roundHalfEven(value) {
  const floor = Math.floor(value);
  const fraction = value - floor;
  if (fraction === 0.5) return floor % 2 === 0 ? floor : floor + 1;
  return Math.round(value);
}

function fallbackScore(value) {
  return Math.max(0, Math.min(10, 5 + roundHalfEven(value / 2)));
}

export function fallbackTurn(request) {
  return {
    ...request.fallback,
    task_progress: 0,
    relationship_signal: "稳定",
    should_close: false,
    next_move: "回应对方刚才的追问，并把下一步说具体。",
  };
}

export function fallbackLocalization(request) {
  return {
    naturalness: fallbackScore(request.fallback.delta.language),
    politeness: fallbackScore(request.fallback.delta.culture),
    business_fit: fallbackScore(request.fallback.delta.professionalism),
    hk_rewrite: request.player_action.text,
    comment: request.fallback.coach_feedback,
    source: "fallback",
  };
}

function normalizeLine(value) {
  return value.replace(/\s+/g, "").replace(/^[「」『』"'，。！？!?、]+|[「」『』"'，。！？!?、]+$/g, "");
}

function repeatsIncomingLine(request, turn) {
  const candidate = normalizeLine(turn.npc_line_yue);
  return new Set([
    normalizeLine(request.scene.npc_line_yue),
    normalizeLine(request.scene.npc_line_zh),
  ]).has(candidate);
}

export async function playDualModelTurn(
  request,
  env,
  config,
  fetchImpl = fetch,
) {
  const [sceneResult, localizationResult] = await Promise.allSettled([
    requestDeepSeekTurn(request, env, config, fetchImpl),
    requestHkchatReview(request, env, config, fetchImpl),
  ]);

  let sceneSource = "fallback";
  let scene = fallbackTurn(request);
  if (
    sceneResult.status === "fulfilled" &&
    !repeatsIncomingLine(request, sceneResult.value)
  ) {
    sceneSource = "deepseek";
    scene = sceneResult.value;
  }

  const localizationSource =
    localizationResult.status === "fulfilled" ? "hkchat" : "fallback";
  const localization =
    localizationResult.status === "fulfilled"
      ? localizationResult.value
      : fallbackLocalization(request);

  return {
    ...scene,
    provider:
      sceneSource === "fallback" && localizationSource === "fallback"
        ? "fallback"
        : `${sceneSource}+${localizationSource}`,
    localization,
  };
}
