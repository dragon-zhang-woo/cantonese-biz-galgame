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

export function resolveRuntimeConfig(
  env = import.meta.env,
  location = globalThis.location,
) {
  const publicDemoMode = isEnabled(env.VITE_PUBLIC_DEMO_MODE);
  const configuredApiBase = String(env.VITE_API_BASE_URL ?? "").trim();
  const localApiBase = isLocalHostname(location?.hostname)
    ? "http://localhost:8000"
    : "";

  const apiBase = configuredApiBase || (publicDemoMode ? "" : localApiBase);
  return Object.freeze({
    publicDemoMode,
    apiBase,
    remoteApiEnabled: Boolean(apiBase),
  });
}

export const runtimeConfig = resolveRuntimeConfig();
