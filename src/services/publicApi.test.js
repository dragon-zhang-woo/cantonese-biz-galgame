import { describe, expect, it, vi } from "vitest";
import {
  fetchPublicApiStatus,
  initialPublicApiStatus,
} from "./publicApi.js";

const remoteConfig = {
  apiBase: "https://api.example.com",
  remoteApiEnabled: true,
  publicDemoMode: true,
  configurationIssue: null,
};

describe("public API status", () => {
  it("does not request the network when the public backend is disabled", async () => {
    const fetchImpl = vi.fn();
    const status = await fetchPublicApiStatus({
      config: {
        apiBase: "",
        remoteApiEnabled: false,
        publicDemoMode: true,
        configurationIssue: null,
      },
      fetchImpl,
    });

    expect(status.state).toBe("offline");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("reports a ready dual-model backend and its public quota", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        provider: "deepseek+hkchat",
        dual_model_ready: true,
        enabled: true,
        remaining_turns: 87,
        per_client_turn_limit: 5,
      }),
    });

    const status = await fetchPublicApiStatus({ config: remoteConfig, fetchImpl });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.example.com/api/public/quota",
      expect.objectContaining({ method: "GET" }),
    );
    expect(status).toEqual({
      state: "available",
      provider: "deepseek+hkchat",
      dualModelReady: true,
      budgetEnabled: true,
      remainingTurns: 87,
      perClientTurnLimit: 5,
    });
  });

  it("distinguishes exhausted quota from incomplete provider configuration", async () => {
    const exhausted = await fetchPublicApiStatus({
      config: remoteConfig,
      fetchImpl: vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          provider: "deepseek+hkchat",
          dual_model_ready: true,
          enabled: true,
          remaining_turns: 0,
          per_client_turn_limit: 5,
        }),
      }),
    });
    const degraded = await fetchPublicApiStatus({
      config: remoteConfig,
      fetchImpl: vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          provider: "fallback",
          dual_model_ready: false,
          enabled: true,
          remaining_turns: 100,
          per_client_turn_limit: 5,
        }),
      }),
    });

    expect(exhausted.state).toBe("exhausted");
    expect(degraded.state).toBe("degraded");
  });

  it("marks an invalid configured URL before attempting a request", () => {
    expect(
      initialPublicApiStatus({
        remoteApiEnabled: false,
        configurationIssue: "invalid_api_url",
      }).state,
    ).toBe("misconfigured");
  });
});
