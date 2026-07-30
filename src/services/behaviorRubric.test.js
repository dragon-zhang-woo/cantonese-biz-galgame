import { describe, expect, it } from "vitest";
import { evaluateBehavior } from "./behaviorRubric.js";

describe("behavior rubric", () => {
  it("scores a concrete accountable response above a vague promise", () => {
    const strong = evaluateBehavior({
      text: "我确认目标是一页摘要。我负责初稿，今日四点前发给你；风险是数据未齐，我会明早再更新附件，可以吗？",
    });
    const vague = evaluateBehavior({
      text: "冇问题，我会尽快搞掂。",
    });

    expect(strong.total).toBeGreaterThan(vague.total);
    expect(strong.completed).toBe(true);
    expect(vague.completed).toBe(false);
  });

  it("returns stable results for the same response", () => {
    const input = {
      text: "我建议先交客户简报，预算表五点更新；我会负责通知财务确认。",
    };

    expect(evaluateBehavior(input)).toEqual(evaluateBehavior(input));
  });
});
