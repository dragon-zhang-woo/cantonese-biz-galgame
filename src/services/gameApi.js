const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function requestAiTurn({
  scene,
  option,
  status,
  fallback,
  history = [],
}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 38000);

  try {
    const response = await fetch(`${API_BASE}/api/game/turn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        scene: {
          id: scene.id,
          speaker: scene.speaker,
          role: scene.role,
          npc_line_yue: scene.npcLineYue,
          npc_line_zh: scene.npcLineZh,
          coach_hint: scene.coachHint,
          objective: scene.objective ?? "",
          hidden_risk: scene.hiddenRisk ?? "",
          transfer_template: scene.transferTemplate ?? "",
          scenario_summary: scene.scenarioSummary ?? "",
          round_index: scene.roundIndex ?? 1,
          round_limit: scene.roundLimit ?? 3,
          history: history.slice(-8).map((entry, index) => ({
            round_index: entry.roundIndex ?? index + 1,
            npc_line_yue: entry.npcLineYue,
            npc_line_zh: entry.npcLineZh,
            player_text: entry.text,
            npc_reaction_yue: entry.turn.npcLineYue,
            npc_reaction_zh: entry.turn.npcLineZh,
            coach_feedback: entry.turn.coachFeedback,
          })),
        },
        player_action: {
          choice_id: option.id,
          text: option.text,
        },
        state: status,
        fallback: {
          npc_line_yue: fallback.npcLineYue,
          npc_line_zh: fallback.npcLineZh,
          coach_feedback: fallback.coachFeedback,
          delta: fallback.delta,
        },
      }),
    });

    if (!response.ok) throw new Error(`AI request failed: ${response.status}`);
    const payload = await response.json();
    return {
      provider: payload.provider ?? "deepseek",
      turn: {
        npcLineYue: payload.npc_line_yue,
        npcLineZh: payload.npc_line_zh,
        coachFeedback: payload.coach_feedback,
        delta: payload.delta,
        taskProgress: payload.task_progress ?? fallback.taskProgress ?? 0,
        relationshipSignal:
          payload.relationship_signal ?? fallback.relationshipSignal ?? "稳定",
        shouldClose: payload.should_close ?? fallback.shouldClose ?? false,
        nextMove:
          payload.next_move ??
          fallback.nextMove ??
          "回应对方刚才的追问，并把下一步说具体。",
        localization: payload.localization
          ? {
              naturalness: payload.localization.naturalness,
              politeness: payload.localization.politeness,
              businessFit: payload.localization.business_fit,
              hkRewrite: payload.localization.hk_rewrite,
              comment: payload.localization.comment,
              source: payload.localization.source,
            }
          : fallback.localization,
      },
    };
  } catch {
    return { provider: "fallback", turn: fallback };
  } finally {
    window.clearTimeout(timeout);
  }
}
