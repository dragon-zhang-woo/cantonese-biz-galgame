export class PublicBudgetExhausted extends Error {
  constructor() {
    super("Public AI budget exhausted");
    this.name = "PublicBudgetExhausted";
  }
}

const RESERVE_SQL = `
  INSERT INTO public_ai_reservations (client_hash)
  SELECT ?1
  WHERE (SELECT COUNT(*) FROM public_ai_reservations) < ?2
    AND (
      SELECT COUNT(*)
      FROM public_ai_reservations
      WHERE client_hash = ?1
    ) < ?3
  RETURNING id
`;

const SNAPSHOT_SQL = `
  SELECT COUNT(*) AS used_turns
  FROM public_ai_reservations
`;

export async function hashClientKey(clientKey, salt) {
  const bytes = new TextEncoder().encode(`${salt}:${clientKey}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export function readClientKey(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",", 1)[0]?.trim() ||
    "unknown"
  );
}

export async function reservePublicTurn(db, clientHash, config) {
  if (config.maxTurns === 0) return snapshotPublicBudget(db, config);
  const row = await db
    .prepare(RESERVE_SQL)
    .bind(clientHash, config.maxTurns, config.turnsPerClient)
    .first();
  if (!row) throw new PublicBudgetExhausted();
  return snapshotPublicBudget(db, config);
}

export async function snapshotPublicBudget(db, config) {
  if (config.maxTurns === 0) {
    return {
      enabled: false,
      budget_cny: 0,
      estimated_turn_cost_cny: config.estimatedTurnCostCny,
      used_turns: 0,
      remaining_turns: null,
      per_client_turn_limit: config.turnsPerClient,
    };
  }
  const row = await db.prepare(SNAPSHOT_SQL).first();
  const usedTurns = Math.max(0, Number(row?.used_turns ?? 0));
  return {
    enabled: true,
    budget_cny: config.budgetCny,
    estimated_turn_cost_cny: config.estimatedTurnCostCny,
    used_turns: usedTurns,
    remaining_turns: Math.max(0, config.maxTurns - usedTurns),
    per_client_turn_limit: config.turnsPerClient,
  };
}

export const budgetSql = Object.freeze({ RESERVE_SQL, SNAPSHOT_SQL });
