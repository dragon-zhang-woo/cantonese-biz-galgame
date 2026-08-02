const asset = (fileName) => `${import.meta.env.BASE_URL}assets/${fileName}`;

export const judgeShowcaseSteps = [
  {
    id: "relationship-context",
    kind: "scene",
    sceneId: "admiralty-onboarding",
    label: "五幕主线",
    title: "同一句粤语，先看关系与任务",
    copy: "第一幕用金钟入职建立人物、责任和文化语境；模型可以增强表演，故事节点始终由程序控制。",
    nextLabel: "看专题训练",
  },
  {
    id: "practice-lab",
    kind: "practice",
    practiceScenarioId: "practice-ah-long-soft-followup",
    label: "12 项训练",
    title: "把一个高频难题练到可以迁移",
    copy: "训练库按关系、渠道、技能与难度组织；这里用跨部门柔性跟进展示预置自由回应与离线参考反馈。",
    nextLabel: "看现实情境",
  },
  {
    id: "custom-scenario",
    kind: "custom",
    label: "我的现实情境",
    title: "把真实难题变成匿名连续训练",
    copy: "演示已准备一段无敏感信息的跨部门催办文本；可现场编辑，并只用浏览器规则展示关系、渠道与训练重点。",
    image: asset("custom-ah-long-open-office-v01.png"),
    imageAlt: "香港开放办公室里，跨部门伙伴阿朗等待确认资料交付安排",
    nextLabel: "进入危机抉择",
  },
  {
    id: "crisis-choice",
    kind: "scene",
    sceneId: "client-crisis-repair",
    label: "主线关键抉择",
    title: "危机时，确定感比解释更重要",
    copy: "选择会立即改变信任与专业度，并用人物反应解释为什么。",
    positiveAsset: asset("showcase-chen-crisis-handoff-act4-v01.png"),
    positiveAssetAlt: "雨夜中环战情室里，陈嘉敏接过玩家递来的匿名补救计划",
    nextLabel: "看学习复盘",
  },
  {
    id: "bounded-close",
    kind: "scene",
    sceneId: "manager-lunch-close",
    label: "学习复盘",
    title: "把一句“可以试”写成可执行承诺",
    copy: "最后用范围、指标、负责人和下一步形成学习画像，而不是只给一句语言评分。",
  },
];

export const preparedShowcasePracticeResponse =
  "明白你忙。为咗星期三评审，听朝十一点前畀三项关键数据得唔得？其余可以后补。";

export const preparedShowcaseCustomInput =
  "跨部门同事已经两天未回复我需要的周报数据，负责人和交付时间都未确认，但星期三下午要向客户汇报。我想礼貌催进度，同时确认最低交付范围、负责人和更新时间。";

export const showcaseLearningReport = [
  "危机沟通先给事实范围、负责人和更新时间。",
  "预算不变时先重组范围与指标，不急着主动降价。",
  "标准剧情完全离线；AI 只增强角色反应与港式表达复盘。",
];
