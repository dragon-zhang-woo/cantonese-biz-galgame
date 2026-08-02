const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const DEFAULT_SPEECH_CAPABILITIES = {
  configured: false,
  liveSupported: false,
  uploadSupported: false,
  acceptedMimeTypes: [
    "audio/webm",
    "audio/mp4",
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/aac",
    "audio/ogg",
  ],
  maxUploadBytes: 25 * 1024 * 1024,
  recordingLimitsMs: {
    "campaign-turn": 90_000,
    "practice-turn": 90_000,
    "custom-turn": 120_000,
    "scenario-intake": 300_000,
  },
};

export async function getSpeechCapabilities() {
  try {
    const response = await fetch(`${API_BASE}/api/speech/capabilities`);
    if (!response.ok) return DEFAULT_SPEECH_CAPABILITIES;
    const payload = await response.json();
    return {
      configured: Boolean(payload.configured),
      liveSupported: Boolean(payload.live_supported),
      uploadSupported: Boolean(payload.upload_supported),
      acceptedMimeTypes:
        payload.accepted_mime_types ?? DEFAULT_SPEECH_CAPABILITIES.acceptedMimeTypes,
      maxUploadBytes:
        payload.max_upload_bytes ?? DEFAULT_SPEECH_CAPABILITIES.maxUploadBytes,
      recordingLimitsMs: {
        "campaign-turn": payload.recording_limits_ms?.campaign_turn ?? 90_000,
        "practice-turn": payload.recording_limits_ms?.practice_turn ?? 90_000,
        "custom-turn": payload.recording_limits_ms?.custom_turn ?? 120_000,
        "scenario-intake": payload.recording_limits_ms?.scenario_intake ?? 300_000,
      },
    };
  } catch {
    return DEFAULT_SPEECH_CAPABILITIES;
  }
}

export async function transcribeAudio(audio, scope, languageHint = "yue-HK") {
  const form = new FormData();
  form.append("audio", audio, "anonymous-training-audio");
  form.append("scope", scope);
  form.append("language_hint", languageHint);
  const response = await fetch(`${API_BASE}/api/speech/transcriptions`, {
    method: "POST",
    body: form,
  });
  if (!response.ok) {
    let detail = null;
    try {
      detail = (await response.json()).detail;
    } catch {
      detail = null;
    }
    const error = new Error(detail?.message || "港话通暂时无法转写这段录音。");
    error.code = detail?.code || "upstream_unavailable";
    error.recoverable = detail?.recoverable ?? true;
    throw error;
  }
  const payload = await response.json();
  return {
    transcript: payload.transcript,
    detectedLanguage: payload.detected_language,
    durationMs: payload.duration_ms,
    transcriptionSource: payload.transcription_source,
    warnings: payload.warnings ?? [],
  };
}

export function createLiveSpeechSocket() {
  const target = new URL(API_BASE, window.location.href);
  target.protocol = target.protocol === "https:" ? "wss:" : "ws:";
  target.pathname = `${target.pathname.replace(/\/$/, "")}/api/speech/transcriptions/live`;
  target.search = "";
  target.hash = "";
  return new WebSocket(target);
}
