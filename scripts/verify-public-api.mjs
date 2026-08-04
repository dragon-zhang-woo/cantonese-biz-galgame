const [apiBaseArgument, ...flags] = process.argv.slice(2);

if (!apiBaseArgument) {
  throw new Error(
    "Usage: npm run verify:public-api -- https://your-api.example.com [--spend-turn]",
  );
}

const apiBase = new URL(apiBaseArgument);
if (
  apiBase.protocol !== "https:" &&
  !["localhost", "127.0.0.1"].includes(apiBase.hostname)
) {
  throw new Error("Public API verification requires HTTPS.");
}

const base = apiBase.href.replace(/\/$/, "");
const spendTurn = flags.includes("--spend-turn");

async function readJson(path, options) {
  const response = await fetch(`${base}${path}`, options);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      `${path} returned ${response.status}: ${JSON.stringify(payload)}`,
    );
  }
  return payload;
}

const health = await readJson("/health");
const quotaBefore = await readJson("/api/public/quota");

if (health.provider !== "deepseek+hkchat" || health.dual_model_ready !== true) {
  throw new Error(`Dual model is not ready: ${JSON.stringify(health)}`);
}
if (quotaBefore.enabled !== true) {
  throw new Error(`Public budget is not enabled: ${JSON.stringify(quotaBefore)}`);
}
if (quotaBefore.remaining_turns < 1) {
  throw new Error("Public dual-model quota is exhausted.");
}

process.stdout.write(
  `${JSON.stringify({ health, quota: quotaBefore }, null, 2)}\n`,
);

if (spendTurn) {
  const payload = {
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
  const turn = await readJson("/api/game/turn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (turn.provider !== "deepseek+hkchat") {
    throw new Error(`Live turn used a fallback provider: ${turn.provider}`);
  }
  const quotaAfter = await readJson("/api/public/quota");
  if (quotaAfter.used_turns !== quotaBefore.used_turns + 1) {
    throw new Error("Public quota did not reserve exactly one turn.");
  }
  process.stdout.write(`${JSON.stringify({ turn, quota: quotaAfter }, null, 2)}\n`);
}
