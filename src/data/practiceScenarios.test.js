import { describe, expect, it } from "vitest";
import {
  getPracticeScenario,
  practiceCharacterCoverage,
  practiceScenarios,
} from "./practiceScenarios.js";

describe("practice scenario library", () => {
  it("contains seven standalone practical cases", () => {
    expect(practiceScenarios).toHaveLength(7);
    for (const scenario of practiceScenarios) {
      expect(scenario.options).toHaveLength(2);
      expect(scenario.background).toMatch(/^\/assets\/practice-/);
      expect(scenario.nextSceneId).toBeNull();
      expect(scenario.objective.length).toBeGreaterThan(10);
      expect(scenario.hiddenRisk.length).toBeGreaterThan(10);
      expect(scenario.transferTemplate).toContain("＿＿");
      expect(getPracticeScenario(scenario.id)).toBe(scenario);
    }
  });

  it("gives every main character at least one additional case", () => {
    expect(practiceCharacterCoverage).toEqual(
      expect.arrayContaining([
        { speaker: "Vincent 梁志诚", count: 2 },
        { speaker: "何太", count: 2 },
        { speaker: "阿朗", count: 2 },
        { speaker: "陈嘉敏", count: 1 },
      ]),
    );
  });
});
