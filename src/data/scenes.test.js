import { describe, expect, it } from "vitest";
import { getScene, scenes } from "./scenes.js";

describe("story graph", () => {
  it("contains a complete three-act path", () => {
    expect(scenes).toHaveLength(3);
    expect(scenes[0].nextSceneId).toBe(scenes[1].id);
    expect(scenes[1].nextSceneId).toBe(scenes[2].id);
    expect(scenes[2].nextSceneId).toBeNull();
  });

  it("keeps every scene playable with two choices", () => {
    for (const scene of scenes) {
      expect(scene.options).toHaveLength(2);
      expect(scene.background).toMatch(/^\/assets\//);
      expect(getScene(scene.id)).toBe(scene);
    }
  });
});
