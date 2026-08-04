import { runtimeConfig } from "./runtimeConfig.js";

export const PUBLIC_API_STATUS_CHANGED = "cantonese-biz:public-api-status-changed";

export function initialPublicApiStatus(config = runtimeConfig) {
  if (config.configurationIssue) {
    return { state: "misconfigured", provider: "fallback" };
  }
  if (!config.remoteApiEnabled) {
    return { state: "offline", provider: "fallback" };
  }
  return { state: "checking", provider: null };
}

export async function fetchPublicApiStatus({
  config = runtimeConfig,
  fetchImpl = globalThis.fetch,
  timeoutMs = 5000,
} = {}) {
  const initial = initialPublicApiStatus(config);
  if (initial.state !== "checking") return initial;

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`${config.apiBase}/api/public/quota`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      return {
        state: "unreachable",
        provider: null,
        error: `http_${response.status}`,
      };
    }

    const payload = await response.json();
    const remainingTurns = Number.isInteger(payload.remaining_turns)
      ? payload.remaining_turns
      : null;
    const base = {
      provider: typeof payload.provider === "string" ? payload.provider : null,
      dualModelReady: payload.dual_model_ready === true,
      budgetEnabled: payload.enabled === true,
      remainingTurns,
      perClientTurnLimit: Number.isInteger(payload.per_client_turn_limit)
        ? payload.per_client_turn_limit
        : null,
    };

    if (!base.dualModelReady) return { ...base, state: "degraded" };
    if (base.budgetEnabled && remainingTurns === 0) {
      return { ...base, state: "exhausted" };
    }
    return { ...base, state: "available" };
  } catch (error) {
    return {
      state: "unreachable",
      provider: null,
      error: error?.name === "AbortError" ? "timeout" : "network_error",
    };
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export function announcePublicApiStatusChanged(target = globalThis) {
  if (typeof target.dispatchEvent !== "function" || typeof Event !== "function") {
    return;
  }
  target.dispatchEvent(new Event(PUBLIC_API_STATUS_CHANGED));
}
