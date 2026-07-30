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

  it("redacts an organisation named through ordinary workplace context", () => {
    const result = sanitizeCustomDescription(
      "我在星火科技负责客户项目，需要练习如何解释交付延期并确认下一步。",
    );

    expect(result.text).toContain("在[机构名称]负责");
    expect(result.text).not.toContain("星火科技");
    expect(result.categories).toContain("机构名称");
    expect(result.count).toBe(1);
  });
});
