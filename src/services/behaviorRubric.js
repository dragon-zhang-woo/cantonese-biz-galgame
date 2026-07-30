export const behaviorRubric = [
  {
    id: "goalClarity",
    label: "目标清晰度",
    question: "有没有回应真正要解决的问题？",
  },
  {
    id: "specificity",
    label: "具体程度",
    question: "有没有时间、对象、交付物或明确行动？",
  },
  {
    id: "ownership",
    label: "责任意识",
    question: "有没有说明自己会承担什么？",
  },
  {
    id: "relationship",
    label: "关系维护",
    question: "有没有尊重对方处境并保留合作空间？",
  },
  {
    id: "riskTransparency",
    label: "风险透明度",
    question: "有没有及时说明冲突、限制或不确定性？",
  },
  {
    id: "nextStep",
    label: "下一步行动",
    question: "有没有负责人、时间点和确认方式？",
  },
];

const patterns = {
  goalClarity: [
    /目标|重点|要解决|我理解|我确认|建议|结论|为了|为咗/i,
    /交付|范围|优先|成功标准|决定/i,
  ],
  specificity: [
    /\d|点|時|时|今日|明日|明天|星期|周[一二三四五六日天]|月底/i,
    /初稿|版本|一页|附件|清单|负责人|会议|邮件|电邮/i,
  ],
  ownership: [
    /我会|我會|我负责|我負責|由我|我先|我跟进|我跟進/i,
    /承担|承擔|处理|處理|补充|補充|更新/i,
  ],
  relationship: [
    /可以吗|可以嗎|可唔可以|你觉得|你覺得|一齐|一起|方便|理解|谢谢|唔该|多謝/i,
    /如果|或者|选择|選擇|建议|建議|保留|配合/i,
  ],
  riskTransparency: [
    /风险|風險|影响|影響|冲突|衝突|延期|延误|延誤|限制|不确定|唔确定/i,
    /来不及|赶不上|范围|範圍|取舍|依赖|依賴/i,
  ],
  nextStep: [
    /前|之后|之後|再更新|确认|確認|回复|回覆|跟进|跟進|下一步/i,
    /由.+负责|由.+負責|我会.+[前時时点]|我會.+[前時时點]|安排/i,
  ],
};

function countMatches(text, expressions) {
  return expressions.reduce(
    (count, expression) => count + (expression.test(text) ? 1 : 0),
    0,
  );
}

function evidenceFor(item, score) {
  if (score >= 4) return `已完整覆盖${item.label}，并形成可执行闭环。`;
  if (score === 3) return `${item.label}基本清楚，还可以补一项确认细节。`;
  if (score === 2) return `已经出现${item.label}信号，但不足以让对方停止猜测。`;
  if (score === 1) return `只表达了态度，${item.label}仍然含糊。`;
  return `没有观察到${item.label}相关行为。`;
}

export function evaluateBehavior({ text, option, responses = [] }) {
  const combined = [...responses, text].filter(Boolean).join(" ");
  const deltaTotal = option
    ? Object.values(option.delta ?? {}).reduce((sum, value) => sum + value, 0)
    : 0;

  const items = behaviorRubric.map((item) => {
    const matches = countMatches(combined, patterns[item.id]);
    let score = Math.min(4, 1 + matches);
    if (combined.length >= 36) score += 1;
    if (deltaTotal >= 10) score += 1;
    if (deltaTotal < 0) score -= 1;
    score = Math.max(0, Math.min(4, score));
    return {
      ...item,
      score,
      evidence: evidenceFor(item, score),
    };
  });

  const total = items.reduce((sum, item) => sum + item.score, 0);
  const missing = items
    .filter((item) => item.score <= 2)
    .sort((left, right) => left.score - right.score)
    .slice(0, 2)
    .map((item) => item.label);

  return {
    items,
    total,
    max: 24,
    percent: Math.round((total / 24) * 100),
    completed:
      total >= 15 &&
      items.find((item) => item.id === "goalClarity").score >= 2 &&
      items.find((item) => item.id === "nextStep").score >= 2,
    missing,
  };
}
