import { describe, expect, it } from "vitest";
import { initialStatus, scenes } from "../data/scenes.js";
import {
  hasMeaningfulProgress,
  readSession,
  SESSION_STORAGE_KEY,
  writeSession,
} from "./sessionStore.js";

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

describe("run persistence", () => {
  it("restores bounded progress without persisting player wording", () => {
    const storage = createStorage();
    writeSession(
      {
        sceneId: scenes[1].id,
        status: { ...initialStatus, trust: 104 },
        history: [
          {
            sceneId: scenes[0].id,
            choice: "这段自由作答不应该进入本机存档",
            learningPoint: "先讲清楚角色与价值。",
          },
        ],
        mode: "ai",
        isEnded: false,
      },
      storage,
    );

    const raw = storage.getItem(SESSION_STORAGE_KEY);
    const restored = readSession(storage);

    expect(raw).not.toContain("这段自由作答");
    expect(restored.status.trust).toBe(100);
    expect(restored.history).toEqual([
      { sceneId: scenes[0].id, learningPoint: "先讲清楚角色与价值。" },
    ]);
    expect(hasMeaningfulProgress(restored)).toBe(true);
  });

  it("rejects incompatible or malformed sessions", () => {
    const storage = createStorage();
    storage.setItem(SESSION_STORAGE_KEY, "not-json");
    expect(readSession(storage)).toBeNull();

    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ version: 99, sceneId: scenes[0].id }),
    );
    expect(readSession(storage)).toBeNull();
  });
});
