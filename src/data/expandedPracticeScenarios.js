const asset = (name) => `/assets/${name}`;

const neutralFallback = (speaker) => ({
  responseYue: `${speaker}点点头，示意你再讲具体少少。`,
  responseZh: `${speaker}点点头，示意你再说具体一些。`,
  feedback:
    "AI 暂时未回应；本轮以中性结果继续，不会把保底文案当成对你自由作答的真实评分。",
  learningPoint:
    "自由作答在模型不可用时保持中性，避免系统以静态答案武断评价用户。",
});

export const expandedPracticeScenarios = [
  {
    id: "practice-mrs-ho-disagree-in-meeting",
    stage: 8,
    chapter: "情境 08 · 不同意，但别当众拆台",
    location: "金钟 · 项目会议舱",
    speaker: "何太",
    role: "部门直属经理",
    background: asset("practice-mrs-ho-priority-conflict-v01.png"),
    imageAlt: "金钟会议舱内，何太等待新人就高风险方案表达异议",
    skill: "表达异议",
    difficulty: "进阶",
    duration: "4 分钟",
    relation: "上司",
    pressure: "公开场合",
    channel: "会议",
    sourceIds: ["hk-labour-communication-consultation"],
    objective: "先确认共同目标，再用具体风险和替代方案表达不同意见。",
    hiddenRisk:
      "为了证明自己有判断而当众否定上司，或为了避免冲突而让明显风险继续。",
    transferTemplate:
      "我认同目标係＿＿。我担心＿＿会令＿＿；可唔可以先试＿＿，并喺＿＿复核？",
    npcLineYue: "大家都倾向今晚直接上线，你有冇其他意见？",
    npcLineZh: "大家都倾向今晚直接上线，你有没有其他意见？",
    coachHint:
      "异议的价值在于保护共同目标。给出事实、影响和可测试的替代，不评价谁对谁错。",
    glossary: {
      term: "有冇其他意见",
      explanation:
        "既可能是真正邀请，也可能是时间有限的收口。先确认目标再提出最关键风险，能减少对抗感。",
    },
    freeformFallback: neutralFallback("何太"),
    options: [
      {
        id: "goal-risk-alternative",
        text: "我认同要快，但今晚冇回滚演练风险太高。建议先上两成流量，听朝复核。",
        responseYue: "有替代就好。你而家讲埋边个负责监控，我哋可以决定。",
        responseZh: "有替代方案就好。你再说明谁负责监控，我们就可以决定。",
        feedback:
          "你承接速度目标，用具体风险解释异议，并给出可验证的折中方案。",
        learningPoint:
          "专业异议不是“反对”，而是共同目标、事实风险和可执行替代的组合。",
        delta: { trust: 5, professionalism: 6, language: 3, culture: 5 },
      },
      {
        id: "public-rejection",
        text: "我一早就话唔得，呢个方案根本唔专业。",
        responseYue: "讲方案风险，唔好评价同事。你有咩替代？",
        responseZh: "说明方案风险，不要评价同事。你有什么替代？",
        feedback:
          "你表达了立场，却把讨论变成人的对错，也没有提供下一步。",
        learningPoint:
          "公开异议要紧扣可观察事实和替代方案，避免让对方只能自我防卫。",
        delta: { trust: -5, professionalism: -4, language: 2, culture: -5 },
      },
    ],
    nextSceneId: null,
  },
  {
    id: "practice-ah-long-meeting-recap",
    stage: 9,
    chapter: "情境 09 · 会开完了，谁负责？",
    location: "金钟 · 电梯大堂",
    speaker: "阿朗",
    role: "本地项目经理",
    background: asset("practice-ah-long-soft-followup-v01.png"),
    imageAlt: "会议结束后的金钟电梯大堂，阿朗等待新人确认行动项",
    skill: "会议收口",
    difficulty: "进阶",
    duration: "4 分钟",
    relation: "跨部门伙伴",
    pressure: "首次合作",
    channel: "邮件",
    sourceIds: ["hk-labour-effective-workplace-communication"],
    objective: "把决定、负责人、时间点和未决问题写成可确认的会后纪要。",
    hiddenRisk:
      "为了显得有效率而把未决问题写成已经同意，或没有邀请对方更正。",
    transferTemplate:
      "今日确认咗＿＿；由＿＿喺＿＿前完成＿＿。＿＿仍待确认，如有理解偏差请喺＿＿前更正。",
    npcLineYue: "头先大家讲咗好多，你封跟进邮件会点写？",
    npcLineZh: "刚才大家说了很多，你的跟进邮件会怎样写？",
    coachHint:
      "纪要不是逐字记录。分开已决定、行动项和未决问题，并邀请更正。",
    glossary: {
      term: "跟进邮件",
      explanation:
        "在跨团队协作里，它既是记忆工具，也是关系工具。准确区分共识与待确认事项很重要。",
    },
    freeformFallback: neutralFallback("阿朗"),
    options: [
      {
        id: "decision-owner-open-item",
        text: "我会写：今日确认试点；阿朗周三交名单；预算仍待财务确认，有偏差请明早更正。",
        responseYue: "清楚，已决定同未决定分得开。我会直接回覆确认。",
        responseZh: "清楚，已决定和未决定分开了。我会直接回复确认。",
        feedback:
          "你把决定、负责人、日期、未决项和更正窗口都写清楚。",
        learningPoint:
          "高质量会议收口要让没有参会的人也能知道谁在何时做什么。",
        delta: { trust: 5, professionalism: 6, language: 3, culture: 5 },
      },
      {
        id: "vague-recap",
        text: "多谢大家今日开会，之后我哋再保持沟通。",
        responseYue: "咁听日边个做咩？我睇完仲係唔知。",
        responseZh: "那么明天谁做什么？我看完还是不知道。",
        feedback:
          "语气礼貌，但邮件没有承载任何行动信息。",
        learningPoint:
          "礼貌收尾不能替代决定、负责人、时间和未决问题。",
        delta: { trust: 0, professionalism: -5, language: 3, culture: 0 },
      },
    ],
    nextSceneId: null,
  },
  {
    id: "practice-vincent-personal-data-request",
    stage: 10,
    chapter: "情境 10 · 这份员工名单能不能发",
    location: "金钟 · 项目战情室",
    speaker: "Vincent 梁志诚",
    role: "项目带教经理",
    background: asset("practice-vincent-clarify-brief-v01.png"),
    imageAlt: "金钟项目战情室内，Vincent 就一份包含个人资料的名单提出要求",
    skill: "资料边界",
    difficulty: "挑战",
    duration: "5 分钟",
    relation: "上司",
    pressure: "权力差距",
    channel: "邮件",
    sourceIds: ["hk-pcpd-hr-code"],
    objective: "确认资料用途、必要范围、授权和安全传递方式，再采取行动。",
    hiddenRisk:
      "为了配合上司直接转发完整个人资料，或自己下法律结论而阻断工作。",
    transferTemplate:
      "我先确认用途係＿＿、最少需要＿＿，并经＿＿授权；确认后会用＿＿渠道喺＿＿前提供。",
    npcLineYue: "你将成份员工名单连电话电邮发畀外部顾问，佢话赶时间。",
    npcLineZh: "你把完整员工名单连同电话和电邮发给外部顾问，他说赶时间。",
    coachHint:
      "不要直接发送，也不要自行判断违法。先问用途、最小范围、授权和指定渠道。",
    glossary: {
      term: "完整员工名单",
      explanation:
        "包含可识别个人的资料时，应先确认用途和必要范围；高风险判断需要正式流程或指定负责人。",
    },
    freeformFallback: neutralFallback("Vincent"),
    options: [
      {
        id: "purpose-minimum-authority",
        text: "我先确认顾问用途、最少需要边几栏同授权负责人，再用指定安全渠道发送。",
        responseYue: "啱，先暂停发送。我同资料负责人确认范围，你准备最小版本。",
        responseZh: "对，先暂停发送。我和资料负责人确认范围，你准备最小版本。",
        feedback:
          "你没有阻断工作，而是用目的、最小范围、授权和渠道建立安全下一步。",
        learningPoint:
          "面对个人资料请求，先最小化并升级确认；不要用速度代替授权。",
        delta: { trust: 5, professionalism: 6, language: 3, culture: 5 },
      },
      {
        id: "send-everything",
        text: "好，赶时间我而家直接发完整 Excel 畀佢。",
        responseYue: "停一停。你确认过用途、范围同授权未？",
        responseZh: "先停一下。你确认过用途、范围和授权了吗？",
        feedback:
          "你把对方的时间压力当成了处理个人资料的充分依据。",
        learningPoint:
          "高压并不会自动扩大资料使用范围；先确认再行动。",
        delta: { trust: -5, professionalism: -6, language: 2, culture: -4 },
      },
    ],
    nextSceneId: null,
  },
  {
    id: "practice-mrs-ho-conflict-of-interest",
    stage: 11,
    chapter: "情境 11 · 供应商送来的礼物",
    location: "金钟 · 项目会议舱",
    speaker: "何太",
    role: "部门直属经理",
    background: asset("practice-mrs-ho-scope-creep-v01.png"),
    imageAlt: "金钟会议舱内，何太要求新人处理供应商送来的礼物",
    skill: "利益冲突披露",
    difficulty: "挑战",
    duration: "5 分钟",
    relation: "上司",
    pressure: "信任受损",
    channel: "当面",
    sourceIds: ["hk-icac-business-integrity"],
    objective: "说明相关事实和可能影响，暂停自行处理并请求正式披露或审批安排。",
    hiddenRisk:
      "认为礼物不贵就自行收下，或在未核实前直接指控供应商有不当目的。",
    transferTemplate:
      "供应商喺＿＿送咗＿＿，而我正参与＿＿决定。为避免观感同利益冲突，我会先＿＿并按流程申报。",
    npcLineYue: "供应商送咗份礼畀你，话只係小心意。你会点处理？",
    npcLineZh: "供应商送了一份礼物给你，说只是一点心意。你会怎样处理？",
    coachHint:
      "重点不是猜对方动机，而是透明披露事实、暂停个人决定并使用正式流程。",
    glossary: {
      term: "小心意",
      explanation:
        "礼物价值不是唯一判断。角色、决策权和外界观感都可能形成利益冲突风险。",
    },
    freeformFallback: neutralFallback("何太"),
    options: [
      {
        id: "pause-disclose",
        text: "我会先唔收，记录时间同物品，并向指定负责人申报我正参与供应商评选。",
        responseYue: "好，讲事实同角色就够，唔使猜佢动机。跟流程处理。",
        responseZh: "好，说明事实和角色即可，不必猜测对方动机。按流程处理。",
        feedback:
          "你透明说明事实和决策角色，并把判断交回正式流程。",
        learningPoint:
          "利益冲突沟通应及时披露、避免自行裁决，并保留可追溯记录。",
        delta: { trust: 6, professionalism: 6, language: 3, culture: 5 },
      },
      {
        id: "accept-small-gift",
        text: "唔贵嘅，收咗先啦，应该冇问题。",
        responseYue: "你而家参与评选，点解由你自己判断冇问题？",
        responseZh: "你正在参与评选，为什么由你自己判断没有问题？",
        feedback:
          "你用个人直觉替代了透明披露和正式流程。",
        learningPoint:
          "面对潜在利益冲突，不要用金额或善意猜测代替申报。",
        delta: { trust: -5, professionalism: -6, language: 2, culture: -4 },
      },
    ],
    nextSceneId: null,
  },
  {
    id: "practice-ah-long-corrective-feedback",
    stage: 12,
    chapter: "情境 12 · 反馈不是贴标签",
    location: "中环 · 茶餐厅",
    speaker: "阿朗",
    role: "本地项目经理",
    background: asset("practice-ah-long-networking-lunch-v01.png"),
    imageAlt: "安静的中环茶餐厅内，阿朗与新人讨论一次需要纠偏的合作",
    skill: "纠偏反馈",
    difficulty: "进阶",
    duration: "4 分钟",
    relation: "同事",
    pressure: "信任受损",
    channel: "当面",
    sourceIds: ["hk-labour-good-hr-guide"],
    objective: "描述具体事实和影响，听取背景，并确认下一次可观察行为。",
    hiddenRisk:
      "把一次行为升级成对人格或能力的评价，让对方只能防卫。",
    transferTemplate:
      "喺＿＿发生咗＿＿，影响係＿＿。我想先听你当时点判断；下次我哋可唔可以改成＿＿？",
    npcLineYue: "你话我上次配合得差，具体係边一部分？",
    npcLineZh: "你说我上次配合得不好，具体是哪一部分？",
    coachHint:
      "反馈要落在可观察事实、影响和下一次行为，不要用“总是”“不靠谱”等标签。",
    glossary: {
      term: "具体係边一部分",
      explanation:
        "对方在要求可核实的反馈。越具体，越容易把防卫转成共同改进。",
    },
    freeformFallback: neutralFallback("阿朗"),
    options: [
      {
        id: "fact-impact-invite",
        text: "上次周三改范围后我到交付前一晚先收到，团队冇时间评估。我想听下当时点解会咁。",
        responseYue: "明白，你讲紧通知时间，唔係话我个人唔合作。我解释下当时情况。",
        responseZh: "明白，你说的是通知时间，不是在说我个人不合作。我解释一下当时情况。",
        feedback:
          "你用时间、行为和影响描述问题，并邀请对方补充背景。",
        learningPoint:
          "纠偏反馈要把事实、影响、倾听和下一次标准放在同一段对话里。",
        delta: { trust: 5, professionalism: 5, language: 4, culture: 6 },
      },
      {
        id: "personality-label",
        text: "你成日都係咁，做嘢唔可靠。",
        responseYue: "如果你只係评价我个人，我唔知下次具体要改咩。",
        responseZh: "如果你只是评价我个人，我不知道下次具体要改什么。",
        feedback:
          "人格标签既难以验证，也没有提供可行动的改进标准。",
        learningPoint:
          "描述行为而非人格，才能让反馈产生下一次变化。",
        delta: { trust: -6, professionalism: -4, language: 2, culture: -6 },
      },
    ],
    nextSceneId: null,
  },
];
