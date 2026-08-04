function isLocalHostname(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname === "terminal.local"
  );
}

function isEnabled(value) {
  return String(value ?? "").toLowerCase() === "true";
}

function normalizeApiBase(value, requireHttps) {
  const candidate = String(value ?? "").trim();
  if (!candidate) return "";
  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    if (requireHttps && url.protocol !== "https:") return "";
    return url.href.replace(/\/$/, "");
  } catch {
    return "";
  }
}

export function resolveRuntimeConfig(
  env = import.meta.env,
  location = globalThis.location,
) {
  const publicDemoMode = isEnabled(env.VITE_PUBLIC_DEMO_MODE);
  const configuredApiValue = String(env.VITE_API_BASE_URL ?? "").trim();
  const configuredApiBase = normalizeApiBase(
    configuredApiValue,
    publicDemoMode,
  );
  const localApiBase = isLocalHostname(location?.hostname)
    ? "http://localhost:8000"
    : "";

  const apiBase = configuredApiBase || (publicDemoMode ? "" : localApiBase);
  return Object.freeze({
    publicDemoMode,
    apiBase,
    remoteApiEnabled: Boolean(apiBase),
    configurationIssue:
      configuredApiValue && !configuredApiBase ? "invalid_api_url" : null,
  });
}

export const runtimeConfig = resolveRuntimeConfig();
