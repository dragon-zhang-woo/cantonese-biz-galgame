import { practiceScenarios } from "../data/practiceScenarios.js";

export const PRACTICE_STORAGE_KEY = "cantonese-biz:practice:v1";
const scenarioIds = new Set(practiceScenarios.map((scenario) => scenario.id));

function emptyProgress() {
  return { completed: {}, totalAttempts: 0 };
}

function sanitizeEntry(id, value) {
  if (!scenarioIds.has(id) || !value || typeof value !== "object") return null;
  const attempts = Math.max(0, Math.min(999, Math.round(Number(value.attempts) || 0)));
  const bestScore = Math.max(
    0,
    Math.min(100, Math.round(Number(value.bestScore) || 0)),
  );
  if (!attempts) return null;
  return {
    attempts,
    bestScore,
    provider:
      typeof value.provider === "string"
        ? value.provider.trim().slice(0, 40)
        : "story",
  };
}

export function readPracticeProgress(storage = globalThis.localStorage) {
  if (!storage) return emptyProgress();
  try {
    const raw = storage.getItem(PRACTICE_STORAGE_KEY);
    if (!raw) return emptyProgress();
    const value = JSON.parse(raw);
    const completed = Object.fromEntries(
      Object.entries(value?.completed ?? {})
        .map(([id, entry]) => [id, sanitizeEntry(id, entry)])
        .filter(([, entry]) => Boolean(entry)),
    );
    return {
      completed,
      totalAttempts: Object.values(completed).reduce(
        (total, entry) => total + entry.attempts,
        0,
      ),
    };
  } catch {
    return emptyProgress();
  }
}

export function recordPracticeResult(
  { scenarioId, score, provider },
  storage = globalThis.localStorage,
) {
  if (!storage || !scenarioIds.has(scenarioId)) {
    return readPracticeProgress(storage);
  }
  const current = readPracticeProgress(storage);
  const previous = current.completed[scenarioId] ?? {
    attempts: 0,
    bestScore: 0,
    provider: "story",
  };
  const completed = {
    ...current.completed,
    [scenarioId]: {
      attempts: previous.attempts + 1,
      bestScore: Math.max(
        previous.bestScore,
        Math.max(0, Math.min(100, Math.round(Number(score) || 0))),
      ),
      provider:
        typeof provider === "string"
          ? provider.trim().slice(0, 40)
          : previous.provider,
    },
  };
  storage.setItem(
    PRACTICE_STORAGE_KEY,
    JSON.stringify({ version: 1, completed }),
  );
  return readPracticeProgress(storage);
}
