const RELATIONSHIP_SIGNALS = new Set(["改善", "稳定", "紧张"]);

export class RequestValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "RequestValidationError";
  }
}

function record(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RequestValidationError(`${label} must be an object.`);
  }
  return value;
}

function text(value, label, maximum, { minimum = 1, fallback } = {}) {
  const resolved = value == null && fallback !== undefined ? fallback : value;
  if (typeof resolved !== "string") {
    throw new RequestValidationError(`${label} must be a string.`);
  }
  const normalized = resolved.replace(/\s+/g, " ").trim();
  if (normalized.length < minimum || normalized.length > maximum) {
    throw new RequestValidationError(`${label} has an invalid length.`);
  }
  return normalized;
}

function integer(value, label, minimum, maximum, fallback) {
  const resolved = value == null && fallback !== undefined ? fallback : value;
  if (!Number.isInteger(resolved) || resolved < minimum || resolved > maximum) {
    throw new RequestValidationError(`${label} is out of range.`);
  }
  return resolved;
}

function boolean(value, label, fallback) {
  const resolved = value == null ? fallback : value;
  if (typeof resolved !== "boolean") {
    throw new RequestValidationError(`${label} must be a boolean.`);
  }
  return resolved;
}

function delta(value, label = "delta") {
  const source = record(value, label);
  return {
    trust: integer(source.trust, `${label}.trust`, -6, 6, 0),
    professionalism: integer(
      source.professionalism,
      `${label}.professionalism`,
      -6,
      6,
      0,
    ),
    language: integer(source.language, `${label}.language`, -6, 6, 0),
    culture: integer(source.culture, `${label}.culture`, -6, 6, 0),
  };
}

function historyEntry(value, index) {
  const source = record(value, `scene.history[${index}]`);
  const label = `scene.history[${index}]`;
  return {
    round_index: integer(source.round_index, `${label}.round_index`, 1, 8),
    npc_line_yue: text(source.npc_line_yue, `${label}.npc_line_yue`, 320),
    npc_line_zh: text(source.npc_line_zh, `${label}.npc_line_zh`, 320),
    player_text: text(source.player_text, `${label}.player_text`, 320),
    npc_reaction_yue: text(
      source.npc_reaction_yue,
      `${label}.npc_reaction_yue`,
      320,
    ),
    npc_reaction_zh: text(
      source.npc_reaction_zh,
      `${label}.npc_reaction_zh`,
      320,
    ),
    coach_feedback: text(
      source.coach_feedback,
      `${label}.coach_feedback`,
      520,
    ),
  };
}

export function validateTurnRequest(value) {
  const payload = record(value, "request");
  const scene = record(payload.scene, "scene");
  const action = record(payload.player_action, "player_action");
  const state = record(payload.state, "state");
  const fallback = record(payload.fallback, "fallback");
  const history = scene.history ?? [];
  if (!Array.isArray(history) || history.length > 8) {
    throw new RequestValidationError("scene.history must contain at most 8 rounds.");
  }
  const inputKind = action.input_kind ?? "authored";
  if (!new Set(["authored", "free"]).has(inputKind)) {
    throw new RequestValidationError("player_action.input_kind is invalid.");
  }

  return {
    scene: {
      id: text(scene.id, "scene.id", 80),
      speaker: text(scene.speaker, "scene.speaker", 40),
      role: text(scene.role, "scene.role", 60),
      npc_line_yue: text(scene.npc_line_yue, "scene.npc_line_yue", 320),
      npc_line_zh: text(scene.npc_line_zh, "scene.npc_line_zh", 320),
      coach_hint: text(scene.coach_hint, "scene.coach_hint", 360),
      objective: text(scene.objective, "scene.objective", 360, {
        minimum: 0,
        fallback: "",
      }),
      hidden_risk: text(scene.hidden_risk, "scene.hidden_risk", 420, {
        minimum: 0,
        fallback: "",
      }),
      transfer_template: text(
        scene.transfer_template,
        "scene.transfer_template",
        420,
        { minimum: 0, fallback: "" },
      ),
      scenario_summary: text(
        scene.scenario_summary,
        "scene.scenario_summary",
        1000,
        { minimum: 0, fallback: "" },
      ),
      round_index: integer(scene.round_index, "scene.round_index", 1, 8, 1),
      round_limit: integer(scene.round_limit, "scene.round_limit", 2, 8, 3),
      history: history.map(historyEntry),
    },
    player_action: {
      choice_id: text(action.choice_id, "player_action.choice_id", 80),
      text: text(action.text, "player_action.text", 320),
      input_kind: inputKind,
    },
    state: {
      trust: integer(state.trust, "state.trust", 0, 100),
      professionalism: integer(
        state.professionalism,
        "state.professionalism",
        0,
        100,
      ),
      language: integer(state.language, "state.language", 0, 100),
      culture: integer(state.culture, "state.culture", 0, 100),
    },
    fallback: {
      npc_line_yue: text(
        fallback.npc_line_yue,
        "fallback.npc_line_yue",
        280,
      ),
      npc_line_zh: text(
        fallback.npc_line_zh,
        "fallback.npc_line_zh",
        280,
      ),
      coach_feedback: text(
        fallback.coach_feedback,
        "fallback.coach_feedback",
        420,
      ),
      delta: delta(fallback.delta, "fallback.delta"),
    },
  };
}

export function validateModelTurn(value) {
  const source = record(value, "model turn");
  const relationshipSignal = source.relationship_signal ?? "稳定";
  if (!RELATIONSHIP_SIGNALS.has(relationshipSignal)) {
    throw new RequestValidationError("relationship_signal is invalid.");
  }
  return {
    npc_line_yue: text(source.npc_line_yue, "npc_line_yue", 320),
    npc_line_zh: text(source.npc_line_zh, "npc_line_zh", 320),
    coach_feedback: text(source.coach_feedback, "coach_feedback", 520),
    delta: delta(source.delta),
    task_progress: integer(source.task_progress, "task_progress", 0, 100, 0),
    relationship_signal: relationshipSignal,
    should_close: boolean(source.should_close, "should_close", false),
    next_move: text(source.next_move, "next_move", 240, {
      fallback: "回应对方刚才的追问，并把下一步说具体。",
    }),
  };
}

export function validateLocalization(value) {
  const source = record(value, "localization");
  return {
    naturalness: integer(source.naturalness, "naturalness", 0, 10),
    politeness: integer(source.politeness, "politeness", 0, 10),
    business_fit: integer(source.business_fit, "business_fit", 0, 10),
    hk_rewrite: text(source.hk_rewrite, "hk_rewrite", 320),
    comment: text(source.comment, "comment", 420),
    source: "hkchat",
  };
}
