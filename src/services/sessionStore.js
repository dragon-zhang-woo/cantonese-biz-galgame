import { initialStatus, scenes } from "../data/scenes.js";

export const SESSION_STORAGE_KEY = "cantonese-biz:run:v1";
const SESSION_VERSION = 1;
const sceneIds = new Set(scenes.map((scene) => scene.id));

function sanitizeStatus(value) {
  if (!value || typeof value !== "object") return { ...initialStatus };
  return Object.fromEntries(
    Object.entries(initialStatus).map(([key, fallback]) => {
      const candidate = Number(value[key]);
      return [
        key,
        Number.isFinite(candidate)
          ? Math.max(0, Math.min(100, Math.round(candidate)))
          : fallback,
      ];
    }),
  );
}

function sanitizeHistory(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item) =>
        item &&
        sceneIds.has(item.sceneId) &&
        typeof item.learningPoint === "string",
    )
    .slice(0, scenes.length)
    .map((item) => ({
      sceneId: item.sceneId,
      learningPoint: item.learningPoint.trim().slice(0, 420),
    }));
}

export function readSession(storage = globalThis.localStorage) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (value?.version !== SESSION_VERSION || !sceneIds.has(value.sceneId)) {
      return null;
    }
    return {
      sceneId: value.sceneId,
      status: sanitizeStatus(value.status),
      history: sanitizeHistory(value.history),
      mode: value.mode === "ai" ? "ai" : "story",
      isEnded: Boolean(value.isEnded),
    };
  } catch {
    return null;
  }
}

export function writeSession(session, storage = globalThis.localStorage) {
  if (!storage) return;
  const payload = {
    version: SESSION_VERSION,
    sceneId: sceneIds.has(session.sceneId) ? session.sceneId : scenes[0].id,
    status: sanitizeStatus(session.status),
    history: sanitizeHistory(session.history),
    mode: session.mode === "ai" ? "ai" : "story",
    isEnded: Boolean(session.isEnded),
  };
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
}

export function clearSession(storage = globalThis.localStorage) {
  storage?.removeItem(SESSION_STORAGE_KEY);
}

export function hasMeaningfulProgress(session) {
  return Boolean(
    session &&
      (session.sceneId !== scenes[0].id ||
        session.history.length > 0 ||
        session.isEnded),
  );
}
