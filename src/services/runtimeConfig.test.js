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
});
