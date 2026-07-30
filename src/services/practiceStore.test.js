import { describe, expect, it } from "vitest";
import {
  PRACTICE_STORAGE_KEY,
  readPracticeProgress,
  recordPracticeResult,
} from "./practiceStore.js";
import { practiceScenarios } from "../data/practiceScenarios.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe("practice progress", () => {
  it("records attempts and keeps the best score without saving response text", () => {
    const storage = memoryStorage();
    const scenarioId = practiceScenarios[0].id;

    recordPracticeResult(
      { scenarioId, score: 62, provider: "deepseek+hkchat" },
      storage,
    );
    const progress = recordPracticeResult(
      { scenarioId, score: 51, provider: "fallback" },
      storage,
    );

    expect(progress.completed[scenarioId]).toEqual({
      attempts: 2,
      bestScore: 62,
      provider: "fallback",
    });
    expect(storage.getItem(PRACTICE_STORAGE_KEY)).not.toContain("response");
  });

  it("ignores unknown scenario ids", () => {
    const storage = memoryStorage();
    recordPracticeResult(
      { scenarioId: "unknown", score: 100, provider: "story" },
      storage,
    );

    expect(readPracticeProgress(storage).totalAttempts).toBe(0);
  });
});
