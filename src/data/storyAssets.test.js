import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import path from "node:path";
import { customSceneImages } from "./customSceneAssets.js";
import { practiceScenarios } from "./practiceScenarios.js";
import { scenes } from "./scenes.js";
import { judgeShowcaseSteps } from "./judgeShowcase.js";
import {
  characterDossiers,
  cinematicImages,
  getCinematic,
} from "./storyAssets.js";

describe("cinematic story assets", () => {
  it("maps every act to an establishing shot, reaction sheet and inserts", () => {
    const expectedInsertCounts = [2, 2, 2, 3, 3];

    scenes.forEach((scene, index) => {
      const cinematic = getCinematic(scene.id);
      expect(cinematic.establishing.image).toMatch(/\/assets\/[^/]+\.png$/);
      expect(cinematic.reaction.image).toMatch(/\/assets\/[^/]+\.png$/);
      expect(cinematic.reaction.frames).toBeGreaterThanOrEqual(3);
      expect(cinematic.inserts).toHaveLength(expectedInsertCounts[index]);
      cinematic.inserts.forEach((insert) => {
        expect(insert.image).toMatch(/\/assets\/[^/]+\.png$/);
      });
    });
  });

  it("provides four character dossiers and references all 26 new images", () => {
    expect(characterDossiers).toHaveLength(4);
    expect(new Set(characterDossiers.map((character) => character.id)).size).toBe(4);
    expect(cinematicImages).toHaveLength(26);
    expect(new Set(cinematicImages).size).toBe(26);
  });

  it("keeps every PNG in public/assets connected to the game", () => {
    const assetDirectory = path.join(process.cwd(), "public", "assets");
    const filesOnDisk = readdirSync(assetDirectory)
      .filter((fileName) => fileName.endsWith(".png"))
      .sort();
    const referencedFiles = [
      ...new Set([
        ...scenes.map((scene) => scene.background.split("/").at(-1)),
        ...practiceScenarios.map((scene) => scene.background.split("/").at(-1)),
        ...customSceneImages.map((image) => image.split("/").at(-1)),
        ...judgeShowcaseSteps
          .map((step) => step.positiveAsset?.split("/").at(-1))
          .filter(Boolean),
        ...cinematicImages.map((image) => image.split("/").at(-1)),
      ]),
    ].sort();

    expect(referencedFiles).toEqual(filesOnDisk);
  });
});
