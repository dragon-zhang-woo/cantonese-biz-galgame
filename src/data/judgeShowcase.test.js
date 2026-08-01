import { describe, expect, it } from "vitest";
import { getScene, scenes } from "./scenes.js";
import { judgeShowcaseSteps } from "./judgeShowcase.js";

describe("judge showcase", () => {
  it("uses the fixed act 1, 4 and 5 scenes without changing the campaign graph", () => {
    expect(judgeShowcaseSteps.map((step) => getScene(step.sceneId).stage)).toEqual([1, 4, 5]);
    expect(scenes.map((scene) => scene.nextSceneId)).toEqual([
      "central-client-brief",
      "pantry-colleague-signal",
      "client-crisis-repair",
      "manager-lunch-close",
      null,
    ]);
  });

  it("contains no model or persistence configuration", () => {
    expect(JSON.stringify(judgeShowcaseSteps)).not.toMatch(/api|provider|storage/i);
  });
});
