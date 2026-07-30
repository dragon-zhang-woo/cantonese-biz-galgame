import { describe, expect, it } from "vitest";
import {
  CUSTOM_SCENARIO_MAX_LENGTH,
  sanitizeCustomDescription,
} from "./customScenario.js";

describe("custom scenario privacy", () => {
  it("redacts common personal and confidential information before API use", () => {
    const result = sanitizeCustomDescription(
      "我叫张伟，经理叫Alex Wong，公司是火鸟咨询，请打91234567或发alex@example.com，API_KEY=secret123456。",
    );

    expect(result.text).not.toContain("张伟");
    expect(result.text).not.toContain("Alex Wong");
    expect(result.text).not.toContain("火鸟咨询");
    expect(result.text).not.toContain("91234567");
    expect(result.text).not.toContain("alex@example.com");
    expect(result.text).not.toContain("secret123456");
    expect(result.count).toBeGreaterThanOrEqual(6);
  });

  it("bounds the intake length", () => {
    const result = sanitizeCustomDescription("困".repeat(700));
    expect(result.text).toHaveLength(CUSTOM_SCENARIO_MAX_LENGTH);
  });
});
