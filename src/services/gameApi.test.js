import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./runtimeConfig.js", () => ({
  runtimeConfig: {
    apiBase: "https://api.example.com",
    remoteApiEnabled: true,
  },
}));

const { announcePublicApiStatusChanged } = vi.hoisted(() => ({
  announcePublicApiStatusChanged: vi.fn(),
}));
vi.mock("./publicApi.js", () => ({ announcePublicApiStatusChanged }));

import { requestAiTurn } from "./gameApi.js";

const fallback = {
  npcLineYue: "好，听朝等你更新。",
  npcLineZh: "好，明早等你更新。",
  coachFeedback: "本地保底反馈。",
  delta: { trust: 0, professionalism: 0, language: 0, culture: 0 },
};

const request = {
  scene: {
    id: "test",
    speaker: "陈嘉敏",
    role: "区域业务总监",
    npcLineYue: "你会点跟进？",
    npcLineZh: "你会怎样跟进？",
    coachHint: "给出时间。",
  },
  option: { id: "reply", text: "听朝十一点前更新。" },
  status: { trust: 50, professionalism: 50, language: 50, culture: 50 },
  fallback,
};

describe("requestAiTurn fallback diagnostics", () => {
  beforeEach(() => {
    announcePublicApiStatusChanged.mockClear();
    vi.stubGlobal("window", {
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout,
    });
  });

  it("preserves the public budget exhaustion reason", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({
          detail: { code: "public_budget_exhausted" },
        }),
      }),
    );

    const result = await requestAiTurn(request);

    expect(result).toEqual({
      provider: "fallback",
      turn: fallback,
      fallbackReason: "public_budget_exhausted",
    });
    expect(announcePublicApiStatusChanged).toHaveBeenCalledOnce();
  });

  it("distinguishes an unreachable backend", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    const result = await requestAiTurn(request);

    expect(result.fallbackReason).toBe("network_error");
    expect(result.turn).toBe(fallback);
  });
});
