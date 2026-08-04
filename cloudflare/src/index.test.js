import { describe, expect, it, vi } from "vitest";

import {
  hashClientKey,
  PublicBudgetExhausted,
  reservePublicTurn,
  snapshotPublicBudget,
} from "./budget.js";
import { readConfig } from "./config.js";
import { createWorker } from "./index.js";

class FakeD1 {
  constructor() {
    this.reservations = [];
  }

  prepare(sql) {
    const database = this;
    const statement = {
      values: [],
      bind(...values) {
        this.values = values;
        return this;
      },
      async first() {
        if (sql.includes("INSERT INTO public_ai_reservations")) {
          const [clientHash, maxTurns, turnsPerClient] = this.values;
          const clientTurns = database.reservations.filter(
            (value) => value === clientHash,
          ).length;
          if (
            database.reservations.length >= maxTurns ||
            clientTurns >= turnsPerClient
          ) {
            return null;
          }
          database.reservations.push(clientHash);
          return { id: database.reservations.length };
        }
        if (sql.includes("COUNT(*) AS used_turns")) {
          return { used_turns: database.reservations.length };
        }
        throw new Error(`Unexpected SQL in fake D1: ${sql}`);
      },
    };
    return statement;
  }
}

function testEnv(overrides = {}) {
  return {
    DB: new FakeD1(),
    DEEPSEEK_API_KEY: "deepseek-test-key",
    HKCHAT_API_KEY: "hkchat-test-key",
    PUBLIC_AI_CLIENT_HASH_SALT: "unit-test-salt",
    ALLOWED_ORIGINS: "https://dragon-zhang-woo.github.io",
    PUBLIC_AI_BUDGET_CNY: "5",
    PUBLIC_AI_ESTIMATED_TURN_COST_CNY: "0.05",
    PUBLIC_AI_TURNS_PER_CLIENT: "5",
    DEEPSEEK_BASE_URL: "https://api.deepseek.example",
    HKCHAT_BASE_URL: "https://api.hkchat.example",
    ...overrides,
  };
}

function turnPayload() {
  return {
    scene: {
      id: "deployment-smoke-test",
      speaker: "陈嘉敏",
      role: "区域业务总监",
      npc_line_yue: "你会点样确认下一步？",
      npc_line_zh: "你会怎样确认下一步？",
      coach_hint: "明确负责人、行动和时间。",
    },
    player_action: {
      choice_id: "deployment-smoke-test",
      text: "我会今日确认负责人，听朝十一点前交一页更新。",
      input_kind: "authored",
    },
    state: {
      trust: 50,
      professionalism: 50,
      language: 50,
      culture: 50,
    },
    fallback: {
      npc_line_yue: "好，听朝等你更新。",
      npc_line_zh: "好，明早等你更新。",
      coach_feedback: "你给出了明确负责人和更新时间。",
      delta: {
        trust: 1,
        professionalism: 1,
        language: 1,
        culture: 1,
      },
    },
  };
}

function providerFetch() {
  return vi.fn(async (url) => {
    const isDeepSeek = String(url).includes("deepseek");
    const content = isDeepSeek
      ? {
          npc_line_yue: "好，咁听朝十一点我等你份更新。",
          npc_line_zh: "好，那我明早十一点等你的更新。",
          coach_feedback: "负责人和时间都明确，下一步可以补充确认方式。",
          delta: {
            trust: 2,
            professionalism: 2,
            language: 1,
            culture: 1,
          },
          task_progress: 85,
          relationship_signal: "改善",
          should_close: true,
          next_move: "用一句话确认对方已接受时间点。",
        }
      : {
          naturalness: 8,
          politeness: 9,
          business_fit: 9,
          hk_rewrite: "我今日确认负责人，听朝十一点前畀你一页更新。",
          comment: "讲法清楚，有负责人同具体时间。",
          source: "hkchat",
        };
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: JSON.stringify(content) } }],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  });
}

function apiRequest(path, options = {}) {
  return new Request(`https://worker.example${path}`, {
    ...options,
    headers: {
      Origin: "https://dragon-zhang-woo.github.io",
      "CF-Connecting-IP": "203.0.113.10",
      ...(options.headers ?? {}),
    },
  });
}

describe("Cloudflare public API", () => {
  it("reports a degraded deployment without both provider secrets", async () => {
    const env = testEnv({ HKCHAT_API_KEY: "" });
    const response = await createWorker().fetch(apiRequest("/health"), env);

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      status: "degraded",
      provider: "deepseek+fallback",
      dual_model_ready: false,
    });
    expect(env.DB.reservations).toHaveLength(0);
  });

  it("stays degraded and does not spend when the budget salt is missing", async () => {
    const env = testEnv({ PUBLIC_AI_CLIENT_HASH_SALT: "" });
    const worker = createWorker({ fetchImpl: providerFetch() });

    const health = await worker.fetch(apiRequest("/health"), env);
    expect(health.status).toBe(503);
    await expect(health.json()).resolves.toMatchObject({
      status: "degraded",
      provider: "deepseek+hkchat",
      dual_model_ready: true,
    });

    const response = await worker.fetch(
      apiRequest("/api/game/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(turnPayload()),
      }),
      env,
    );
    expect(response.status).toBe(503);
    expect((await response.json()).detail.code).toBe(
      "budget_store_unavailable",
    );
    expect(env.DB.reservations).toHaveLength(0);
  });

  it("calls both providers, returns their provenance, and reserves one turn", async () => {
    const env = testEnv();
    const fetchImpl = providerFetch();
    const worker = createWorker({ fetchImpl });
    const response = await worker.fetch(
      apiRequest("/api/game/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(turnPayload()),
      }),
      env,
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.provider).toBe("deepseek+hkchat");
    expect(result.localization.source).toBe("hkchat");
    expect(result.task_progress).toBe(85);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(env.DB.reservations).toHaveLength(1);
    expect(env.DB.reservations[0]).toMatch(/^[a-f0-9]{64}$/);

    const quota = await worker.fetch(apiRequest("/api/public/quota"), env);
    await expect(quota.json()).resolves.toMatchObject({
      provider: "deepseek+hkchat",
      dual_model_ready: true,
      enabled: true,
      used_turns: 1,
      remaining_turns: 99,
      per_client_turn_limit: 5,
    });
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://dragon-zhang-woo.github.io",
    );
  });

  it("does not reserve quota for invalid input", async () => {
    const env = testEnv();
    const response = await createWorker({ fetchImpl: providerFetch() }).fetch(
      apiRequest("/api/game/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invalid: true }),
      }),
      env,
    );

    expect(response.status).toBe(422);
    expect((await response.json()).detail.code).toBe("invalid_request");
    expect(env.DB.reservations).toHaveLength(0);
  });

  it("rejects an untrusted browser origin before spending", async () => {
    const env = testEnv();
    const response = await createWorker({ fetchImpl: providerFetch() }).fetch(
      new Request("https://worker.example/api/game/turn", {
        method: "POST",
        headers: {
          Origin: "https://attacker.example",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(turnPayload()),
      }),
      env,
    );

    expect(response.status).toBe(403);
    expect(env.DB.reservations).toHaveLength(0);
  });

  it("returns explicit offline capabilities for public speech", async () => {
    const response = await createWorker().fetch(
      apiRequest("/api/speech/capabilities"),
      testEnv(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      configured: false,
      live_supported: false,
      upload_supported: false,
    });
  });
});

describe("D1 quota reservation", () => {
  it("enforces both global and per-client limits atomically", async () => {
    const db = new FakeD1();
    const config = readConfig({
      PUBLIC_AI_BUDGET_CNY: "0.10",
      PUBLIC_AI_ESTIMATED_TURN_COST_CNY: "0.05",
      PUBLIC_AI_TURNS_PER_CLIENT: "1",
    });
    const first = await hashClientKey("client-a", "salt");
    const second = await hashClientKey("client-b", "salt");

    await reservePublicTurn(db, first, config);
    await expect(reservePublicTurn(db, first, config)).rejects.toBeInstanceOf(
      PublicBudgetExhausted,
    );
    await reservePublicTurn(db, second, config);
    await expect(
      reservePublicTurn(db, await hashClientKey("client-c", "salt"), config),
    ).rejects.toBeInstanceOf(PublicBudgetExhausted);

    await expect(snapshotPublicBudget(db, config)).resolves.toMatchObject({
      used_turns: 2,
      remaining_turns: 0,
    });
  });
});
