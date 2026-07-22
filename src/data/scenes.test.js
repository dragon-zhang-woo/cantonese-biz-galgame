import { describe, expect, it } from "vitest";
import { getScene, scenes } from "./scenes.js";

describe("story graph", () => {
  it("contains a complete five-act path", () => {
    expect(scenes).toHaveLength(5);
    for (let index = 0; index < scenes.length - 1; index += 1) {
      expect(scenes[index].nextSceneId).toBe(scenes[index + 1].id);
    }
    expect(scenes.at(-1).nextSceneId).toBeNull();
  });

  it("keeps every scene playable with two choices", () => {
    for (const scene of scenes) {
      expect(scene.options).toHaveLength(2);
      expect(scene.background).toMatch(/^\/assets\//);
      expect(getScene(scene.id)).toBe(scene);
    }
  });
});
