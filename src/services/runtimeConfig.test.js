import { describe, expect, it } from "vitest";
import { resolveRuntimeConfig } from "./runtimeConfig.js";

describe("resolveRuntimeConfig", () => {
  it("uses the local API only during local development", () => {
    const local = resolveRuntimeConfig({}, { hostname: "localhost" });
    const remote = resolveRuntimeConfig({}, { hostname: "example.com" });

    expect(local.apiBase).toBe("http://localhost:8000");
    expect(local.remoteApiEnabled).toBe(true);
    expect(remote.apiBase).toBe("");
    expect(remote.remoteApiEnabled).toBe(false);
  });

  it("makes the public demo zero-cost unless an explicit backend is configured", () => {
    const offline = resolveRuntimeConfig(
      { VITE_PUBLIC_DEMO_MODE: "true" },
      { hostname: "dragon-zhang-woo.github.io" },
    );
    const limited = resolveRuntimeConfig(
      {
        VITE_PUBLIC_DEMO_MODE: "true",
        VITE_API_BASE_URL: "https://api.example.com",
      },
      { hostname: "dragon-zhang-woo.github.io" },
    );

    expect(offline.remoteApiEnabled).toBe(false);
    expect(offline.apiBase).toBe("");
    expect(limited.remoteApiEnabled).toBe(true);
    expect(limited.apiBase).toBe("https://api.example.com");
  });

  it("normalizes the API base and rejects insecure public endpoints", () => {
    const normalized = resolveRuntimeConfig(
      {
        VITE_PUBLIC_DEMO_MODE: "true",
        VITE_API_BASE_URL: "https://api.example.com/",
      },
      { hostname: "dragon-zhang-woo.github.io" },
    );
    const insecure = resolveRuntimeConfig(
      {
        VITE_PUBLIC_DEMO_MODE: "true",
        VITE_API_BASE_URL: "http://api.example.com",
      },
      { hostname: "dragon-zhang-woo.github.io" },
    );

    expect(normalized.apiBase).toBe("https://api.example.com");
    expect(insecure.remoteApiEnabled).toBe(false);
    expect(insecure.configurationIssue).toBe("invalid_api_url");
  });
});
