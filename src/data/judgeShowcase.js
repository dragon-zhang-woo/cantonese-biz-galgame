const asset = (fileName) => `${import.meta.env.BASE_URL}assets/${fileName}`;

export const judgeShowcaseSteps = [
  {
    id: "relationship-context",
    sceneId: "admiralty-onboarding",
    label: "关系后果",
    title: "同一句粤语，先看关系与任务",
    copy: "第一幕用金钟入职建立人物、责任和文化语境；模型可以增强表演，故事节点始终由程序控制。",
  },
  {
    id: "crisis-choice",
    sceneId: "client-crisis-repair",
    label: "关键抉择",
    title: "危机时，确定感比解释更重要",
    copy: "选择会立即改变信任与专业度，并用人物反应解释为什么。",
    positiveAsset: asset("showcase-chen-crisis-handoff-act4-v01.png"),
    positiveAssetAlt: "雨夜中环战情室里，陈嘉敏接过玩家递来的匿名补救计划",
  },
  {
    id: "bounded-close",
    sceneId: "manager-lunch-close",
    label: "行动收口",
    title: "把一句“可以试”写成可执行承诺",
    copy: "最后用范围、指标、负责人和下一步形成学习画像，而不是只给一句语言评分。",
  },
];

export const showcaseLearningReport = [
  "危机沟通先给事实范围、负责人和更新时间。",
  "预算不变时先重组范围与指标，不急着主动降价。",
  "标准剧情完全离线；AI 只增强角色反应与港式表达复盘。",
];
