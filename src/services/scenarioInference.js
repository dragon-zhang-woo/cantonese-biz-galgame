import inferenceConfig from "../../shared/scenario-inference.json";
import casePatterns from "../../backend/data/case_patterns.json";

const patternById = new Map(casePatterns.map((pattern) => [pattern.id, pattern]));
const focusRuleById = new Map(
  inferenceConfig.focusRules.map((rule) => [rule.id, rule]),
);

function normalize(value) {
  return value.toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

function explicitResult(value, label) {
  return {
    value,
    confidence: "high",
    reasons: [`采用你确认的${label}`],
  };
}

function matchRule(value, rules) {
  const text = normalize(value);
  return rules.find((rule) =>
    rule.phrases.some((phrase) => text.includes(normalize(phrase))),
  );
}

function patternScore(pattern, description) {
  const text = normalize(description);
  const rule = focusRuleById.get(pattern.id);
  const keywordScore = pattern.keywords.reduce(
    (score, keyword) => score + (text.includes(normalize(keyword)) ? 2 : 0),
    0,
  );
  const strongScore = (rule?.strongPhrases ?? []).reduce(
    (score, phrase) => score + (text.includes(normalize(phrase)) ? 6 : 0),
    0,
  );
  return {
    pattern,
    score: keywordScore + strongScore,
    priority: rule?.priority ?? 0,
    reason: rule?.reason ?? "根据任务描述匹配训练模式",
  };
}

function rankedPatterns(description, focus) {
  if (focus !== "自动") {
    const explicit = casePatterns.find((pattern) => pattern.task === focus);
    return explicit
      ? [{ pattern: explicit, score: 100, priority: 100, reason: "采用你确认的训练重点" }]
      : [];
  }
  const ranked = casePatterns
    .map((pattern) => patternScore(pattern, description))
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.priority - left.priority ||
        casePatterns.indexOf(left.pattern) - casePatterns.indexOf(right.pattern),
    );
  const followUpSignals = [
    "跟进",
    "没回复",
    "未回复",
    "没有回复",
    "还没有回复",
    "一直没回复",
    "得闲",
    "有空",
    "催进度",
    "催办",
    "确认负责人和时间",
  ];
  const matched = [];
  for (const entry of ranked) {
    if (entry.score <= 0) continue;
    if (
      entry.pattern.id === "soft-follow-up" &&
      matched[0]?.pattern.id === "delivery-risk" &&
      !followUpSignals.some((signal) => normalize(description).includes(normalize(signal)))
    ) {
      continue;
    }
    matched.push(entry);
    if (matched.length === 2) break;
  }
  if (matched.length) return matched;
  const fallback = patternById.get(inferenceConfig.defaults.fallbackPatternId);
  return [{ pattern: fallback, score: 0, priority: 0, reason: "未检测到明确任务，采用通用异议训练" }];
}

function resolveRelationship(description, preference, primaryPattern) {
  if (preference !== "自动") return explicitResult(preference, "关系");
  const rule = matchRule(description, inferenceConfig.relationshipRules);
  if (rule) {
    return { value: rule.value, confidence: rule.confidence, reasons: [rule.reason] };
  }
  return {
    value: primaryPattern.relation ?? inferenceConfig.defaults.relation,
    confidence: "low",
    reasons: ["没有明确关系称谓，按主要任务模板补足"],
  };
}

function resolveChannel(description, preference, primaryPattern) {
  if (preference !== "自动") return explicitResult(preference, "渠道");
  const rule = matchRule(description, inferenceConfig.channelRules);
  if (rule) {
    return { value: rule.value, confidence: rule.confidence, reasons: [rule.reason] };
  }
  return {
    value: primaryPattern.channel ?? inferenceConfig.defaults.channel,
    confidence: "low",
    reasons: ["没有明确渠道线索，按主要任务模板补足"],
  };
}

export function getVisualSceneId(relation, channel) {
  const override = inferenceConfig.sceneOverrides.find(
    (item) => item.relation === relation && item.channel === channel,
  );
  return (
    override?.visualSceneId ??
    inferenceConfig.personaScenes[relation]?.visualSceneId ??
    inferenceConfig.defaults.visualSceneId
  );
}

export function getPersona(relation) {
  return (
    inferenceConfig.personaScenes[relation] ??
    inferenceConfig.personaScenes[inferenceConfig.defaults.relation]
  );
}

export function inferScenario(description, preferences = {}) {
  const relationPreference = preferences.relation ?? "自动";
  const channelPreference = preferences.channel ?? "自动";
  const focusPreference = preferences.focus ?? "自动";
  const ranked = rankedPatterns(description, focusPreference);
  const primary = ranked[0].pattern;
  const relation = resolveRelationship(description, relationPreference, primary);
  const channel = resolveChannel(description, channelPreference, primary);
  const focus = {
    value: primary.task,
    confidence: focusPreference !== "自动" ? "high" : ranked[0].score >= 6 ? "high" : ranked[0].score > 0 ? "medium" : "low",
    reasons: [ranked[0].reason],
  };
  return {
    patterns: ranked.map((entry) => entry.pattern),
    inference: { relation, channel, focus },
    visualSceneId: getVisualSceneId(relation.value, channel.value),
  };
}
