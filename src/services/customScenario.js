import { getKnowledgeSources } from "../data/knowledgeSources.js";
import { getPracticeScenario } from "../data/practiceScenarios.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const CUSTOM_SCENARIO_MIN_LENGTH = 20;
export const CUSTOM_SCENARIO_MAX_LENGTH = 500;

const localPatterns = [
  {
    id: "priority-conflict",
    keywords: ["两件", "同时", "优先", "来不及", "都要今天"],
    relation: "上司",
    task: "优先级协商",
    fallbackScenarioId: "practice-mrs-ho-priority-conflict",
    skillCards: [
      {
        id: "negotiate-priority",
        title: "用业务影响协商优先级",
        objective: "公开资源冲突、提出建议并说明另一项工作的影响",
        steps: ["说明冲突", "给出判断依据", "提出顺序", "更新另一项预期"],
        sourceIds: ["hk-labour-communication-consultation"],
        legalRisk: "low",
      },
    ],
  },
  {
    id: "scope-request",
    keywords: ["加需求", "免费", "额外", "顺便", "范围"],
    relation: "客户",
    task: "范围控制",
    fallbackScenarioId: "practice-mrs-ho-scope-creep",
    skillCards: [
      {
        id: "control-scope",
        title: "用条件式承诺守住范围",
        objective: "回应意图，同时说明范围、成本和交换条件",
        steps: ["承接意图", "指出变化", "给出选项", "确认取舍"],
        sourceIds: ["hk-labour-communication-consultation"],
        legalRisk: "low",
      },
    ],
  },
  {
    id: "delivery-risk",
    keywords: ["延期", "赶不上", "出错", "风险", "坏消息"],
    relation: "上司",
    task: "风险汇报",
    fallbackScenarioId: "practice-vincent-bad-news",
    skillCards: [
      {
        id: "communicate-bad-news",
        title: "尽早传达坏消息并保留调整空间",
        objective: "说明事实、影响、承担和下一更新时间",
        steps: ["先讲事实", "说明影响", "承担下一步", "约定更新时间"],
        sourceIds: ["hk-labour-effective-workplace-communication"],
        legalRisk: "low",
      },
    ],
  },
  {
    id: "ambiguous-brief",
    keywords: ["尽快", "跟一下", "格式", "导师", "方案", "不清楚"],
    relation: "上司",
    task: "任务澄清",
    fallbackScenarioId: "practice-vincent-clarify-brief",
    skillCards: [
      {
        id: "clarify-ambiguous-task",
        title: "把模糊指令变成可执行任务",
        objective: "确认目标、交付物、截止时间和检查点",
        steps: ["复述目标", "确认交付形式", "确认时间", "约定检查点"],
        sourceIds: ["hk-labour-effective-workplace-communication"],
        legalRisk: "low",
      },
    ],
  },
];

function replaceAndCount(value, expression, label, state) {
  return value.replace(expression, () => {
    state.count += 1;
    if (!state.categories.includes(label)) state.categories.push(label);
    return `[${label}]`;
  });
}

export function sanitizeCustomDescription(value) {
  const state = { count: 0, categories: [] };
  let text = value.replace(/\s+/g, " ").trim().slice(0, CUSTOM_SCENARIO_MAX_LENGTH);
  text = replaceAndCount(
    text,
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
    "电邮",
    state,
  );
  text = replaceAndCount(
    text,
    /(?:\+?86[- ]?)?1[3-9]\d{9}|(?:\+?852[- ]?)?[2-9]\d{3}[- ]?\d{4}/g,
    "电话",
    state,
  );
  text = replaceAndCount(
    text,
    /(我叫|同事叫|经理叫|客户叫|导师叫|上司叫)([\u4e00-\u9fff]{2,4}|[A-Za-z]+(?:\s+[A-Za-z]+){1,2})/g,
    "姓名",
    state,
  );
  text = replaceAndCount(
    text,
    /(公司|客户|机构|项目)(叫|是|名称为)([\u4e00-\u9fffA-Za-z0-9]{2,24})/g,
    "机构名称",
    state,
  );
  text = replaceAndCount(
    text,
    /(?:(?:api[_ -]?key|access[_ -]?token|secret|password|sk-)\s*[:=]?\s*)[A-Za-z0-9_-]{8,}/gi,
    "凭证",
    state,
  );
  return { text, ...state };
}

function channelFromText(value) {
  if (/邮件|电邮|email/i.test(value)) return "邮件";
  if (/电话|通话|call/i.test(value)) return "电话";
  if (/微信|WhatsApp|消息|群里/i.test(value)) return "即时消息";
  if (/会议|会上|汇报|例会/i.test(value)) return "会议";
  return "当面";
}

function localCompose(description, pressure, rounds, redaction) {
  const pattern =
    localPatterns
      .map((item) => ({
        ...item,
        score: item.keywords.filter((keyword) => description.includes(keyword)).length,
      }))
      .sort((left, right) => right.score - left.score)[0] ?? localPatterns[0];
  const fallback = getPracticeScenario(pattern.fallbackScenarioId);
  const roundTemplates = [
    {
      id: "understand",
      purpose: "先确认真正任务和限制",
      npcLineYue: "你先讲清楚，你认为而家最重要要解决咩？",
      npcLineZh: "你先说清楚，你认为现在最重要要解决什么？",
      coachHint: "先复述目标，并问清最影响行动的一项信息。",
    },
    {
      id: "respond",
      purpose: "提出兼顾任务与关系的回应",
      npcLineYue: "如果时间同资源都唔变，你建议点取舍？",
      npcLineZh: "如果时间和资源都不变，你建议怎样取舍？",
      coachHint: "给出判断、承担和一个可执行选择，不要只描述困难。",
    },
    {
      id: "close",
      purpose: "把对话收束为下一步",
      npcLineYue: "好，咁边个喺几时做咩？你点确保大家理解一致？",
      npcLineZh: "好，那么谁在什么时间做什么？你怎样确保大家理解一致？",
      coachHint: "明确负责人、时间点和确认方式。",
    },
  ];
  const sourceIds = pattern.skillCards.flatMap((skill) => skill.sourceIds);
  return {
    id: `custom-offline-${pattern.id}`,
    title: `现实情境 · ${pattern.task}`,
    relation: pattern.relation,
    task: pattern.task,
    channel: channelFromText(description),
    difficulty: pressure === "高压" ? "高压" : pressure === "直接" ? "进阶" : "入门",
    pressure,
    speaker: fallback.speaker,
    role: fallback.role,
    objective: pattern.skillCards[0].objective,
    hiddenRisk: fallback.hiddenRisk,
    transferTemplate: fallback.transferTemplate,
    fallbackScenarioId: fallback.id,
    background: fallback.background,
    redactedDescription: description,
    redaction,
    skillCards: pattern.skillCards,
    sources: getKnowledgeSources(sourceIds),
    rounds: roundTemplates.slice(0, rounds),
    disclaimer:
      "这是匿名沟通训练，不替代法律、人事、医疗或心理专业意见。高风险情况请使用正式流程或官方求助渠道。",
    provider: "offline-match",
  };
}

function mapScenario(payload, clientRedaction) {
  return {
    id: payload.id,
    title: payload.title,
    relation: payload.relation,
    task: payload.task,
    channel: payload.channel,
    difficulty: payload.difficulty,
    pressure: payload.pressure,
    speaker: payload.speaker,
    role: payload.role,
    objective: payload.objective,
    hiddenRisk: payload.hidden_risk,
    transferTemplate: payload.transfer_template,
    fallbackScenarioId: payload.fallback_scenario_id,
    background: payload.background,
    redactedDescription: payload.redacted_description,
    redaction: clientRedaction,
    skillCards: payload.skill_cards.map((skill) => ({
      id: skill.id,
      title: skill.title,
      objective: skill.objective,
      steps: skill.steps,
      sourceIds: skill.source_ids,
      legalRisk: skill.legal_risk,
    })),
    sources: payload.sources.map((source) => ({
      id: source.id,
      title: source.title,
      publisher: source.publisher,
      url: source.url,
      usageNote: source.usage_note,
      riskLevel: source.risk_level,
    })),
    rounds: payload.rounds.map((round) => ({
      id: round.id,
      purpose: round.purpose,
      npcLineYue: round.npc_line_yue,
      npcLineZh: round.npc_line_zh,
      coachHint: round.coach_hint,
    })),
    disclaimer: payload.disclaimer,
    provider: payload.provider,
  };
}

export async function composeCustomScenario({ description, pressure, rounds }) {
  const sanitized = sanitizeCustomDescription(description);
  if (sanitized.text.length < CUSTOM_SCENARIO_MIN_LENGTH) {
    throw new Error(`请至少输入 ${CUSTOM_SCENARIO_MIN_LENGTH} 个字。`);
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 18000);
  try {
    const response = await fetch(`${API_BASE}/api/scenario/compose`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        description: sanitized.text,
        pressure,
        rounds,
      }),
    });
    if (!response.ok) throw new Error(`compose failed: ${response.status}`);
    return mapScenario(await response.json(), {
      count: sanitized.count,
      categories: sanitized.categories,
    });
  } catch {
    return localCompose(sanitized.text, pressure, rounds, {
      count: sanitized.count,
      categories: sanitized.categories,
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

export function buildCustomRoundScene(scenario, index) {
  const round = scenario.rounds[index];
  return {
    id: `${scenario.id}-round-${index + 1}`,
    chapter: `${scenario.title} · 第 ${index + 1} 轮`,
    location: `${scenario.channel} · ${scenario.pressure}压力`,
    speaker: scenario.speaker,
    role: scenario.role,
    background: scenario.background,
    imageAlt: `${scenario.speaker}正在进行匿名现实情境训练`,
    skill: scenario.task,
    difficulty: scenario.difficulty,
    duration: `${scenario.rounds.length} 轮`,
    objective: scenario.objective,
    hiddenRisk: scenario.hiddenRisk,
    transferTemplate: scenario.transferTemplate,
    npcLineYue: round.npcLineYue,
    npcLineZh: round.npcLineZh,
    coachHint: round.coachHint,
    glossary: {
      term: "受约束模拟",
      explanation:
        "角色只围绕已识别的任务、关系和压力回应，不会替你发明现实事实或作专业决定。",
    },
    freeformFallback: {
      responseYue: `${scenario.speaker}点点头，叫你再讲具体一步。`,
      responseZh: `${scenario.speaker}点点头，请你再说明一个具体步骤。`,
      feedback:
        "模型暂时不可用；本轮保持中性，并继续用技能卡和行动模板完成训练。",
      learningPoint: "离线回退不会武断评价你的自由回答。",
    },
    options: [],
    nextSceneId: null,
  };
}
