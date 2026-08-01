import { describe, expect, it } from "vitest";
import fixtures from "../../shared/scenario-inference-fixtures.json";
import { inferScenario } from "./scenarioInference.js";

describe("shared custom-scenario inference", () => {
  it.each(fixtures)("matches $id", ({ description, preferences, expected }) => {
    const result = inferScenario(description, preferences);
    expect(result.inference.relation.value).toBe(expected.relation);
    expect(result.inference.channel.value).toBe(expected.channel);
    expect(result.inference.channel.confidence).toBe(expected.channelConfidence);
    expect(result.inference.focus.value).toBe(expected.focus);
  });
});
