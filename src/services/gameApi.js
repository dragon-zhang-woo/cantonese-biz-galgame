const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function requestAiTurn({ scene, option, status, fallback }) {
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
