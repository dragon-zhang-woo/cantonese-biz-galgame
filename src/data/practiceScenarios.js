const asset = (name) => `/assets/${name}`;

const neutralFallback = (speaker) => ({
  responseYue: `${speaker}点点头，示意你再讲具体少少。`,
  responseZh: `${speaker}点点头，示意你再说具体一些。`,
  feedback:
    "AI 暂时未回应；本轮以中性结果继续，不会把保底文案当成对你自由作答的真实评分。",
  learningPoint:
    "自由作答在模型不可用时保持中性，避免系统以静态答案武断评价用户。",
});

export const practiceScenarios = [
  {
    id: "practice-vincent-clarify-brief",
    stage: 1,
    chapter: "情境 01 · 先确认，再开工",
    location: "金钟 · 项目战情室",
    speaker: "Vincent 梁志诚",
    role: "项目带教经理",
    background: asset("practice-vincent-clarify-brief-v01.png"),
    imageAlt:
      "清晨的金钟项目战情室，Vincent 站在右侧等待新人确认任务",
    skill: "任务澄清",
    difficulty: "入门",
    duration: "3 分钟",
    objective: "在开工前确认目标、交付物、截止时间和首个检查点。",
    hiddenRisk:
      "害怕显得不懂而直接答应，最后做出一份方向正确但无法使用的交付物。",
    transferTemplate:
      "我理解今次目标係＿＿；交付物係＿＿；我会喺＿＿前畀你第一版，咁样啱唔啱？",
    npcLineYue: "呢份新任务你今日帮我跟一跟，尽快畀我就得。",
    npcLineZh: "这项新任务你今天帮我跟进一下，尽快给我就行。",
    coachHint:
      "“尽快”和“跟一跟”都不是可执行标准。先确认成功定义，再承诺时间。",
    glossary: {
      term: "跟一跟",
      explanation:
        "香港职场常见的宽泛委托语，可能包括搜集资料、协调、撰写或持续追踪；需要主动确认交付边界。",
    },
    freeformFallback: neutralFallback("Vincent"),
    options: [
      {
        id: "confirm-four-points",
        text: "我确认下：目标係做决策摘要、交一页纸，今日四点前畀初稿，啱吗？",
        responseYue: "啱，先畀我一页结论，数据附件可以听朝补。",
        responseZh: "对，先给我一页结论，数据附件可以明早补。",
        feedback:
          "你把模糊委托转成了目标、格式、时间和优先级，既不拖延，也避免无效返工。",
        learningPoint:
          "接受任务前，用目标、交付物、截止时间和检查点把模糊要求变成可执行承诺。",
        delta: { trust: 4, professionalism: 6, language: 3, culture: 4 },
      },
      {
        id: "say-yes-immediately",
        text: "冇问题，我即刻做，尽快畀你。",
        responseYue: "你打算交咩俾我？我唔想下晏先发现大家理解唔同。",
        responseZh: "你准备交什么给我？我不想下午才发现大家理解不同。",
        feedback:
          "态度积极，但你复述了对方的模糊词，没有确认任何可验收标准。",
        learningPoint:
          "快速答应不等于执行力；缺少成功定义的承诺只会把风险推迟。",
        delta: { trust: 0, professionalism: -4, language: 2, culture: -1 },
      },
    ],
    nextSceneId: null,
  },
  {
    id: "practice-mrs-ho-priority-conflict",
    stage: 2,
    chapter: "情境 02 · 两件急事，只能先做一件",
    location: "金钟 · 开放办公室",
    speaker: "何太",
    role: "部门直属经理",
    background: asset("practice-mrs-ho-priority-conflict-v01.png"),
    imageAlt:
      "午前的金钟办公室，何太站在两份互相冲突的项目文件旁",
    skill: "优先级协商",
    difficulty: "入门",
    duration: "4 分钟",
    objective: "公开资源冲突，提出优先级建议，并说明另一项工作的影响。",
    hiddenRisk:
      "同时答应两件急事，表面配合，实际让两个利益相关方都在最后一刻失望。",
    transferTemplate:
      "两项都要喺＿＿前完成，而我而家只够先做一项。我建议先做＿＿，因为＿＿；另一项会延至＿＿，可以吗？",
    npcLineYue: "客户简报同内部预算都话今日要，你点排？",
    npcLineZh: "客户简报和内部预算都说今天要，你怎样安排？",
    coachHint:
      "不要只抛问题给经理。把冲突、判断依据、建议顺序和影响一次说清楚。",
    glossary: {
      term: "点排",
      explanation:
        "不仅是问日程，更是在测试你能否用业务影响说明优先级，并主动管理预期。",
    },
    freeformFallback: neutralFallback("何太"),
    options: [
      {
        id: "recommend-priority",
        text: "我建议先交三点客户简报，预算表五点畀初版；客户会议唔可以顺延。",
        responseYue: "可以，你而家同财务讲清楚五点係初版，唔好等佢哋估。",
        responseZh: "可以，你现在和财务说明五点是初版，不要让他们猜。",
        feedback:
          "你没有假装资源无限，而是用外部承诺解释取舍，并主动给出第二项的新时间。",
        learningPoint:
          "优先级协商要包含判断依据、明确建议，以及被延后任务的新预期。",
        delta: { trust: 5, professionalism: 6, language: 3, culture: 4 },
      },
      {
        id: "promise-both",
        text: "两份我都会今日搞掂，放心。",
        responseYue: "你得三个钟。讲清楚先后，同埋边份会有取舍。",
        responseZh: "你只有三个小时。说清楚先后，以及哪一份会有所取舍。",
        feedback:
          "你试图用保证消除焦虑，却没有说明资源约束或质量代价。",
        learningPoint:
          "过度承诺会隐藏风险；专业做法是尽早暴露冲突并给出可执行选择。",
        delta: { trust: -2, professionalism: -5, language: 2, culture: -2 },
      },
    ],
    nextSceneId: null,
  },
  {
    id: "practice-vincent-bad-news",
    stage: 3,
    chapter: "情境 03 · 坏消息要几点讲",
    location: "金钟 · 项目区",
    speaker: "Vincent 梁志诚",
    role: "项目带教经理",
    background: asset("practice-vincent-bad-news-v01.png"),
    imageAlt:
      "黄昏的金钟项目区，Vincent 站在右侧询问如何传达已确认的延误",
    skill: "坏消息沟通",
    difficulty: "进阶",
    duration: "4 分钟",
    objective: "在事实确认后尽早沟通延误，说明影响、承担和下一更新时间。",
    hiddenRisk:
      "为了等到“完整答案”才开口，使客户错过调整窗口，并把延误升级为信任问题。",
    transferTemplate:
      "我哋啱啱确认＿＿会延至＿＿，影响係＿＿。我负责＿＿，并会喺＿＿前再更新你。",
    npcLineYue: "而家确认星期五交唔到，你打算几时同客户讲？",
    npcLineZh: "现在确认星期五无法交付，你准备什么时候告诉客户？",
    coachHint:
      "坏消息的价值在于给对方调整时间。先讲已知事实，不要等所有细节齐全才出现。",
    glossary: {
      term: "几时讲",
      explanation:
        "这里同时在问沟通时机与责任态度。越早明确事实、影响和下一次更新时间，越能保住信任。",
    },
    freeformFallback: neutralFallback("Vincent"),
    options: [
      {
        id: "early-owned-update",
        text: "我而家先讲已确认嘅延误同影响，八点前再畀修订时间表，我负责跟进。",
        responseYue: "好，唔使等齐所有答案。先俾客户有时间调配资源。",
        responseZh: "好，不需要等到所有答案齐全。先让客户有时间调整资源。",
        feedback:
          "你把事实、影响、承担和下一更新时间组合成了可信的早期预警。",
        learningPoint:
          "坏消息要早讲；用已知事实、影响、负责人和下次更新时间提供确定感。",
        delta: { trust: 6, professionalism: 6, language: 3, culture: 4 },
      },
      {
        id: "wait-for-perfect-plan",
        text: "等我哋听朝有完整补救方案先一次过讲。",
        responseYue: "客户听朝先知，就少咗成晚调整。点解要佢承担我哋等答案嘅成本？",
        responseZh: "客户明早才知道，就少了一整晚调整。为什么要让对方承担我们等待答案的成本？",
        feedback:
          "你希望带着方案出现，但延迟预警会让对方失去调整选择。",
        learningPoint:
          "完整方案可以稍后补，已确认的重大影响不应被等待完美答案掩盖。",
        delta: { trust: -5, professionalism: -3, language: 2, culture: -3 },
      },
    ],
    nextSceneId: null,
  },
  {
    id: "practice-ah-long-networking-lunch",
    stage: 4,
    chapter: "情境 04 · 午饭不是面试",
    location: "中环 · 茶餐厅",
    speaker: "阿朗",
    role: "本地项目经理",
    background: asset("practice-ah-long-networking-lunch-v01.png"),
    imageAlt:
      "午市中的中环茶餐厅，阿朗坐在右侧与新人进行第一次非正式交流",
    skill: "非正式建立关系",
    difficulty: "入门",
    duration: "4 分钟",
    objective: "自然打开话题，说明建立联系的理由，并让对方保留退出空间。",
    hiddenRisk:
      "把午饭变成单向索取信息或隐形面试，让对方感觉被利用。",
    transferTemplate:
      "听讲你之前做过＿＿，我而家都遇到类似问题。想听下你当时点判断；如果今日唔方便，下次先都得。",
    npcLineYue: "第一次一齐食饭，唔使咁正式。你最近忙紧咩？",
    npcLineZh: "第一次一起吃饭，不必这么正式。你最近在忙什么？",
    coachHint:
      "关系建立不是索取履历。先分享一点真实背景，再提出有边界的小问题。",
    glossary: {
      term: "唔使咁正式",
      explanation:
        "是在邀请你降低仪式感，但不是取消边界。自然、互惠和给对方选择空间比热络更重要。",
    },
    freeformFallback: neutralFallback("阿朗"),
    options: [
      {
        id: "share-and-invite",
        text: "我最近跟跨团队试点，听讲你做过类似项目。想听下你踩过咩坑，唔方便都冇问题。",
        responseYue: "得呀，我最初就係衰在太迟搵运营同事。你个项目去到边？",
        responseZh: "可以，我最初就是太晚找运营同事。你的项目进行到哪里？",
        feedback:
          "你先提供自己的背景，再提出具体而有退出空间的问题，形成了互惠对话。",
        learningPoint:
          "非正式社交用“自我披露、具体好奇、退出空间”建立安全感。",
        delta: { trust: 5, professionalism: 3, language: 4, culture: 6 },
      },
      {
        id: "extract-network",
        text: "你识唔识客户高层？可唔可以介绍几个畀我？",
        responseYue: "我哋不如先讲下你做紧个项目，睇下有冇相关先。",
        responseZh: "我们不如先说说你正在做的项目，看看是否相关。",
        feedback:
          "你跳过关系基础直接索取关键资源，对方会自然收紧边界。",
        learningPoint:
          "第一次非正式见面先建立共同语境，不要把关系当成即时可提取的人脉。",
        delta: { trust: -4, professionalism: -2, language: 2, culture: -5 },
      },
    ],
    nextSceneId: null,
  },
  {
    id: "practice-ah-long-soft-followup",
    stage: 5,
    chapter: "情境 05 · “得闲搞”到底几时搞",
    location: "金钟 · 电梯大堂",
    speaker: "阿朗",
    role: "本地项目经理",
    background: asset("practice-ah-long-soft-followup-v01.png"),
    imageAlt:
      "蓝调时刻的金钟电梯大堂，阿朗拿着笔记本回应跨团队任务跟进",
    skill: "柔性跟进",
    difficulty: "进阶",
    duration: "4 分钟",
    objective: "不指责地重述共同目标，把模糊承诺变成负责人和具体时间。",
    hiddenRisk:
      "只重复“有空帮忙”，任务长期没有主人；或催得太硬，破坏跨团队关系。",
    transferTemplate:
      "想同你对一对＿＿。为咗赶到＿＿，可唔可以由＿＿负责，并喺＿＿前畀到＿＿？如果时间唔得，我哋一齐改范围。",
    npcLineYue: "嗰份跨团队资料我未执好，得闲我再搞啦。",
    npcLineZh: "那份跨团队资料我还没整理好，有空我再做吧。",
    coachHint:
      "先承认对方负荷，再把共同目标、最低交付和具体时间说清楚。",
    glossary: {
      term: "得闲再搞",
      explanation:
        "常见的软性延后表达，并不自动等于拒绝。有效跟进要降低工作量的不确定性，并确认负责人和时间。",
    },
    freeformFallback: neutralFallback("阿朗"),
    options: [
      {
        id: "soft-specific-followup",
        text: "明白你忙。为咗星期三评审，听朝十一点前畀三项关键数据得唔得？其余可以后补。",
        responseYue: "三项就得，我听朝十点半畀你；其余星期四补。",
        responseZh: "三项可以，我明早十点半给你；其余周四补。",
        feedback:
          "你先接住对方负荷，再缩小最低交付并提出具体时间，让承诺变得可执行。",
        learningPoint:
          "柔性跟进不是含糊；用共同目标、最低范围和具体时间降低对方承诺成本。",
        delta: { trust: 5, professionalism: 6, language: 4, culture: 6 },
      },
      {
        id: "accuse-delay",
        text: "你上星期已经话得闲搞，而家仲未做，究竟几时先肯交？",
        responseYue: "我知迟咗，但你咁问我都唔清楚你最急要边部分。",
        responseZh: "我知道晚了，但你这样问，我仍不清楚你最急需哪一部分。",
        feedback:
          "你指出了拖延，却把问题变成责备，没有减少任务范围或明确交付标准。",
        learningPoint:
          "跨团队跟进要让下一步更容易发生；追究态度不能替代明确范围和时间。",
        delta: { trust: -5, professionalism: -2, language: 2, culture: -5 },
      },
    ],
    nextSceneId: null,
  },
  {
    id: "practice-mrs-ho-scope-creep",
    stage: 6,
    chapter: "情境 06 · 客户临时加需求",
    location: "金钟 · 项目会议舱",
    speaker: "何太",
    role: "部门直属经理",
    background: asset("practice-mrs-ho-scope-creep-v01.png"),
    imageAlt:
      "下午的金钟玻璃会议舱，何太在新增需求文件旁等待范围判断",
    skill: "范围控制",
    difficulty: "进阶",
    duration: "5 分钟",
    objective: "确认客户意图，说明原范围与影响，并提出公平的交换条件。",
    hiddenRisk:
      "为维持关系而免费承诺新增工作，最终用质量、进度或团队透支买单。",
    transferTemplate:
      "呢个需求可以做。原范围係＿＿；加入后会影响＿＿。我建议用＿＿换＿＿，或者作为下一阶段，边个更适合？",
    npcLineYue: "客户想免费加多一个自动报告功能，你会点覆？",
    npcLineZh: "客户希望免费增加一个自动报告功能，你会怎样回复？",
    coachHint:
      "不要直接说“不”，也不要直接答应。先把范围和影响摆到桌面，再谈交换。",
    glossary: {
      term: "加多一个",
      explanation:
        "看似很小的请求可能带来测试、维护和交付风险。范围控制的重点是共同看见代价，而不是机械拒绝。",
    },
    freeformFallback: neutralFallback("何太"),
    options: [
      {
        id: "trade-scope",
        text: "可以做，但会影响本周上线。我建议先换走低使用率报表，或者放入第二阶段。",
        responseYue: "好，俾客户两个选择，同埋讲清楚各自时间同影响。",
        responseZh: "好，给客户两个选择，并说明各自的时间和影响。",
        feedback:
          "你没有把边界包装成拒绝，而是用透明影响和可选交换保护共同结果。",
        learningPoint:
          "范围变化用“原范围、影响、交换选项”协商，避免免费承诺或生硬拒绝。",
        delta: { trust: 5, professionalism: 6, language: 3, culture: 5 },
      },
      {
        id: "agree-for-relationship",
        text: "客户开口就尽量做啦，关系紧要过呢少少工作量。",
        responseYue: "关系唔係靠团队无限加班维持。边个风险会被你收埋咗？",
        responseZh: "关系不是靠团队无限加班维持。你隐藏了哪一项风险？",
        feedback:
          "你把关系与无条件答应等同起来，却没有说明被牺牲的质量、时间和团队成本。",
        learningPoint:
          "健康关系建立在透明交换上；隐藏代价的好意会在交付时反噬信任。",
        delta: { trust: -2, professionalism: -6, language: 2, culture: -2 },
      },
    ],
    nextSceneId: null,
  },
  {
    id: "practice-chen-executive-brief",
    stage: 7,
    chapter: "情境 07 · 高层只给你一分钟",
    location: "中环 · 决策会议室",
    speaker: "陈嘉敏",
    role: "区域业务总监",
    background: asset("practice-chen-executive-brief-v01.png"),
    imageAlt:
      "明亮的中环高层决策室，陈嘉敏站在右侧等待一分钟结论汇报",
    skill: "高层汇报",
    difficulty: "挑战",
    duration: "5 分钟",
    objective: "先给结论，再给最强证据，最后提出一个明确决策请求。",
    hiddenRisk:
      "从项目背景开始讲，耗尽注意力，却没有让决策者知道今天需要决定什么。",
    transferTemplate:
      "结论係＿＿。最关键证据係＿＿。今日想请你决定＿＿；如果通过，我哋会喺＿＿前完成＿＿。",
    npcLineYue: "我得一分钟。结果係点，同埋今日要我决定咩？",
    npcLineZh: "我只有一分钟。结果如何，以及今天需要我决定什么？",
    coachHint:
      "不要复述全过程。用“结论—证据—请求”让决策者能立即行动。",
    glossary: {
      term: "要我决定咩",
      explanation:
        "高层汇报的终点不是信息完整，而是决策清晰。必须把需要对方批准、选择或承担的事项说出来。",
    },
    freeformFallback: neutralFallback("陈嘉敏"),
    options: [
      {
        id: "conclusion-evidence-ask",
        text: "结论係试点值得扩到两区；转化升一成八。今日请你批四周扩展同一名运营负责人。",
        responseYue: "清楚。成本上限同退出条件再讲一句，我就可以决定。",
        responseZh: "清楚。再用一句说明成本上限和退出条件，我就可以决定。",
        feedback:
          "你先给结论，用最强数据支撑，再提出单一、具体的决策请求。",
        learningPoint:
          "一分钟汇报坚持“结论、关键证据、明确请求”，背景只在被追问时补充。",
        delta: { trust: 5, professionalism: 6, language: 3, culture: 5 },
      },
      {
        id: "tell-full-history",
        text: "个项目由三个月前讲起，当时我哋先做访谈，然后开咗六次会……",
        responseYue: "停一停。你先讲结论，同埋而家要我批咩。",
        responseZh: "先停一下。你先说结论，以及现在需要我批准什么。",
        feedback:
          "过程可能重要，但你没有按决策者的时间和任务组织信息。",
        learningPoint:
          "高层时间有限时，先交付可决策信息；时间线不是默认叙事顺序。",
        delta: { trust: -2, professionalism: -5, language: 2, culture: -3 },
      },
    ],
    nextSceneId: null,
  },
];

export function getPracticeScenario(id) {
  return (
    practiceScenarios.find((scenario) => scenario.id === id) ??
    practiceScenarios[0]
  );
}

export const practiceCharacterCoverage = Object.entries(
  practiceScenarios.reduce((coverage, scenario) => {
    coverage[scenario.speaker] = (coverage[scenario.speaker] ?? 0) + 1;
    return coverage;
  }, {}),
).map(([speaker, count]) => ({ speaker, count }));
