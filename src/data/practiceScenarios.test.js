import { describe, expect, it } from "vitest";
import {
  getPracticeScenario,
  practiceCharacterCoverage,
  practiceScenarios,
} from "./practiceScenarios.js";

describe("practice scenario library", () => {
  it("contains twelve filterable standalone practical cases", () => {
    expect(practiceScenarios).toHaveLength(12);
    for (const scenario of practiceScenarios) {
      expect(scenario.options).toHaveLength(2);
      expect(scenario.background).toMatch(/^\/assets\/practice-/);
      expect(scenario.nextSceneId).toBeNull();
      expect(scenario.objective.length).toBeGreaterThan(10);
      expect(scenario.hiddenRisk.length).toBeGreaterThan(10);
      expect(scenario.transferTemplate).toContain("＿＿");
      expect(scenario.relation.length).toBeGreaterThan(1);
      expect(scenario.pressure.length).toBeGreaterThan(1);
      expect(scenario.channel.length).toBeGreaterThan(1);
      expect(scenario.sourceIds.length).toBeGreaterThan(0);
      expect(getPracticeScenario(scenario.id)).toBe(scenario);
    }
  });

  it("gives every main character at least one additional case", () => {
    expect(practiceCharacterCoverage).toEqual(
      expect.arrayContaining([
        { speaker: "Vincent 梁志诚", count: 3 },
        { speaker: "何太", count: 4 },
        { speaker: "阿朗", count: 4 },
        { speaker: "陈嘉敏", count: 1 },
      ]),
    );
  });
});
