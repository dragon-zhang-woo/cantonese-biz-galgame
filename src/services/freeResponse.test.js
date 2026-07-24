import { describe, expect, it } from "vitest";
import {
  buildCustomOption,
  canSubmitFreeResponse,
  normalizeFreeResponse,
} from "./freeResponse.js";

const scene = {
  freeformFallback: {
    responseYue: "收到，我哋先继续。",
    responseZh: "收到，我们先继续。",
    feedback: "AI 暂时未回应，本轮以中性结果继续。",
    learningPoint: "自由作答在模型不可用时不会被武断评分。",
  },
};

describe("free response", () => {
  it("normalizes whitespace and builds a neutral fallback action", () => {
    const option = buildCustomOption(scene, "  我会先确认   客户最担心边一部分。  ");

    expect(option.id).toBe("custom-response");
    expect(option.text).toBe("我会先确认 客户最担心边一部分。");
    expect(option.delta).toEqual({
      trust: 0,
      professionalism: 0,
      language: 0,
      culture: 0,
    });
  });

  it("requires a meaningful minimum length", () => {
    expect(canSubmitFreeResponse("好")).toBe(false);
    expect(canSubmitFreeResponse("我会处理")).toBe(true);
    expect(() => buildCustomOption(scene, "得")).toThrow();
  });

  it("caps input to the client-side maximum", () => {
    expect(normalizeFreeResponse("测".repeat(200))).toHaveLength(160);
  });
});
