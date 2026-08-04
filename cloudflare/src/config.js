const DEFAULTS = Object.freeze({
  allowedOrigins: "https://dragon-zhang-woo.github.io",
  budgetCny: "5",
  estimatedTurnCostCny: "0.05",
  turnsPerClient: "5",
  deepseekBaseUrl: "https://api.deepseek.com",
  deepseekModel: "deepseek-v4-pro",
  hkchatBaseUrl: "https://test-new-api.hkchat.app",
  hkchatModel: "t2_hkgai-v3_fp8_1m_e7",
});

function boundedInteger(value, fallback, minimum, maximum) {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}

function decimalToMilli(value, fallback) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed) || parsed < 0) return decimalToMilli(fallback, "0");
  return Math.round(parsed * 1000);
}

function normalizedBaseUrl(value, fallback) {
  const candidate = String(value || fallback).trim().replace(/\/+$/, "");
  const url = new URL(candidate);
  if (url.protocol !== "https:") throw new Error("Provider base URLs must use HTTPS.");
  return url.href.replace(/\/$/, "");
}

export function readConfig(env = {}) {
  const budgetMilliCny = decimalToMilli(
    env.PUBLIC_AI_BUDGET_CNY,
    DEFAULTS.budgetCny,
  );
  const estimatedTurnMilliCny = Math.max(
    1,
    decimalToMilli(
      env.PUBLIC_AI_ESTIMATED_TURN_COST_CNY,
      DEFAULTS.estimatedTurnCostCny,
    ),
  );
  const maxTurns =
    budgetMilliCny > 0
      ? Math.max(1, Math.floor(budgetMilliCny / estimatedTurnMilliCny))
      : 0;

  return {
    allowedOrigins: String(env.ALLOWED_ORIGINS || DEFAULTS.allowedOrigins)
      .split(",")
      .map((value) => value.trim().replace(/\/$/, ""))
      .filter(Boolean),
    budgetCny: budgetMilliCny / 1000,
    estimatedTurnCostCny: estimatedTurnMilliCny / 1000,
    maxTurns,
    turnsPerClient: boundedInteger(
      env.PUBLIC_AI_TURNS_PER_CLIENT,
      Number(DEFAULTS.turnsPerClient),
      1,
      100,
    ),
    deepseekBaseUrl: normalizedBaseUrl(
      env.DEEPSEEK_BASE_URL,
      DEFAULTS.deepseekBaseUrl,
    ),
    deepseekModel: String(env.DEEPSEEK_MODEL || DEFAULTS.deepseekModel),
    hkchatBaseUrl: normalizedBaseUrl(
      env.HKCHAT_BASE_URL,
      DEFAULTS.hkchatBaseUrl,
    ),
    hkchatModel: String(env.HKCHAT_MODEL || DEFAULTS.hkchatModel),
    providerTimeoutMs: boundedInteger(env.PROVIDER_TIMEOUT_MS, 30_000, 5_000, 35_000),
  };
}

export function dualModelReady(env = {}) {
  return Boolean(
    typeof env.DEEPSEEK_API_KEY === "string" &&
      env.DEEPSEEK_API_KEY.trim() &&
      typeof env.HKCHAT_API_KEY === "string" &&
      env.HKCHAT_API_KEY.trim(),
  );
}

export function providerName(env = {}) {
  const deepseek = env.DEEPSEEK_API_KEY ? "deepseek" : "fallback";
  const hkchat = env.HKCHAT_API_KEY ? "hkchat" : "fallback";
  return deepseek === "fallback" && hkchat === "fallback"
    ? "fallback"
    : `${deepseek}+${hkchat}`;
}
