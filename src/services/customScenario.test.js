import { describe, expect, it } from "vitest";
import {
  buildCustomRoundScene,
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
    const result = sanitizeCustomDescription("困".repeat(1200));
    expect(result.text).toHaveLength(CUSTOM_SCENARIO_MAX_LENGTH);
  });

  it("keeps ordinary wording that contains 道 while redacting actual addresses", () => {
    const ordinary = sanitizeCustomDescription(
      "负责人还没有回复，我不知道怎么说明时间和下一步。",
    );
    const privateAddress = sanitizeCustomDescription(
      "项目地址是皇后大道东248号，请帮我准备沟通。",
    );

    expect(ordinary.text).toContain("不知道怎么说明时间和下一步");
    expect(ordinary.categories).not.toContain("地址");
    expect(privateAddress.text).not.toContain("皇后大道东248号");
    expect(privateAddress.categories).toContain("地址");
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

  it("uses the previous real model reaction as the next round prompt", () => {
    const scenario = {
      id: "custom-test",
      title: "现实情境 · 风险汇报与范围控制",
      channel: "会议",
      pressure: "直接",
      speaker: "阿朗",
      role: "本地项目经理",
      background: "/assets/custom-ah-long-open-office-v01.png",
      task: "风险汇报与范围控制",
      difficulty: "进阶",
      objective: "说明事实并守住范围",
      hiddenRisk: "重复开场会让对方觉得没有回应。",
      transferTemplate: "先确认影响，再提出选项。",
      redactedDescription: "匿名跨部门情境",
      rounds: [
        {
          npcLineYue: "第一轮固定开场",
          npcLineZh: "第一轮固定开场",
          coachHint: "确认目标",
        },
        {
          npcLineYue: "第二轮固定模板",
          npcLineZh: "第二轮固定模板",
          coachHint: "提出选项",
        },
      ],
    };
    const priorTurn = {
      npcLineYue: "你话冻结范围，具体边个要确认？",
      npcLineZh: "你说冻结范围，具体由谁确认？",
      nextMove: "补上负责人和确认时间。",
    };

    const scene = buildCustomRoundScene(scenario, 1, priorTurn);

    expect(scene.npcLineYue).toBe(priorTurn.npcLineYue);
    expect(scene.npcLineZh).toBe(priorTurn.npcLineZh);
    expect(scene.coachHint).toBe(priorTurn.nextMove);
    expect(scene.roundIndex).toBe(2);
  });
});
