export const initialStatus = {
  trust: 42,
  professionalism: 61,
  language: 56,
  culture: 53,
};

const asset = (fileName) =>
  `${import.meta.env.BASE_URL}assets/${fileName}`;

export const scenes = [
  {
    id: "central-client-brief",
    stage: 1,
    chapter: "第一章 · 中环初会",
    location: "中环 · 客户会议室",
    speaker: "陈嘉敏",
    role: "区域业务总监",
    background: asset("scene-central-client.png"),
    imageAlt: "夕阳下的香港中环办公室，一位女客户手持文件站在落地窗前",
    npcLineYue: "你份方案几完整，不过点解我哋要而家就转？",
    npcLineZh: "你的方案很完整，不过为什么我们现在就要转型？",
    coachHint: "她在测试你的商业判断，不是在否定方案。先回应风险，再谈机会。",
    glossary: {
      term: "点解要而家就转",
      explanation:
        "表面问时机，实际在问“延后有什么损失”。香港商务沟通常先接住顾虑，再给可验证的下一步。",
    },
    options: [
      {
        id: "risk-first",
        text: "我先讲唔转嘅风险，再用两星期试点验证。",
        responseYue: "好，咁你讲下试点点样控制成本。",
        responseZh: "好，那你说说试点怎样控制成本。",
        feedback:
          "你把抽象的“转型必要性”改写成可验证行动，既没有硬推，也没有回避决策。",
        learningPoint: "先接住风险顾虑，再提出可验证、可撤回的小步行动。",
        delta: { trust: 6, professionalism: 5, language: 2, culture: 4 },
      },
      {
        id: "market-window",
        text: "市场窗口得三个月，迟咗就会俾对手抢先。",
        responseYue: "我明，但你凭咩证明个窗口真係得三个月？",
        responseZh: "我明白，但你凭什么证明窗口真的只有三个月？",
        feedback:
          "观点够明确，却在没有证据时制造了紧迫感。香港客户通常会马上追问依据。",
        learningPoint: "避免用未经证明的紧迫感推动承诺，先给证据和验证方式。",
        delta: { trust: -2, professionalism: 1, language: 2, culture: -1 },
      },
    ],
    nextSceneId: "pantry-colleague-signal",
  },
  {
    id: "pantry-colleague-signal",
    stage: 2,
    chapter: "第二章 · 茶水间试探",
    location: "金钟 · 公司茶水间",
    speaker: "阿朗",
    role: "本地项目经理",
    background: asset("scene-pantry-colleague.png"),
    imageAlt: "蓝调时刻的香港办公室茶水间，一位男同事手持两杯咖啡",
    npcLineYue: "陈总成日话再睇下，你觉得佢其实想点？",
    npcLineZh: "陈总总说再看看，你觉得她真正想要什么？",
    coachHint: "“再睇下”未必是拒绝，可能是要你主动补齐信息。回答要留人情，也要有判断。",
    glossary: {
      term: "再睇下",
      explanation:
        "常见的缓冲表达，可能表示暂不承诺、资料不足或希望对方主动跟进。需结合关系和上下文判断。",
    },
    options: [
      {
        id: "read-the-gap",
        text: "佢未放心交付风险，我会补一页责任边界同退出机制。",
        responseYue: "啱，佢最怕唔知边个孭镬。你讲清楚就有得倾。",
        responseZh: "对，她最怕责任不清。你讲清楚就还有得谈。",
        feedback:
          "你没有把委婉表达当成简单拒绝，而是识别了对方尚未说出口的责任焦虑。",
        learningPoint: "把模糊回应翻译成待补信息，并主动明确责任边界。",
        delta: { trust: 4, professionalism: 4, language: 4, culture: 6 },
      },
      {
        id: "call-it-rejection",
        text: "我估佢只係客气，其实已经唔想做。",
        responseYue: "又未必，使唔使咁快落结论呀？",
        responseZh: "也未必，需要这么快下结论吗？",
        feedback:
          "你识别到委婉语气，却把不确定性直接判成拒绝，容易错过后续推进空间。",
        learningPoint: "面对港式缓冲表达，先验证含义，不要替对方过早终结谈判。",
        delta: { trust: -1, professionalism: -2, language: 3, culture: -3 },
      },
    ],
    nextSceneId: "manager-lunch-close",
  },
  {
    id: "manager-lunch-close",
    stage: 3,
    chapter: "第三章 · 午市收口",
    location: "湾仔 · 老字号茶餐厅",
    speaker: "何太",
    role: "你的直属经理",
    background: asset("scene-manager-lunch.png"),
    imageAlt: "夜色中的香港茶餐厅，一位女经理坐在卡座旁喝茶",
    npcLineYue: "客户话可以试，但预算唔会加。你会点收口？",
    npcLineZh: "客户说可以试，但预算不会增加。你会怎样推进到承诺？",
    coachHint: "最后不是“赢辩论”，而是把共识写成双方承担得起的下一步。",
    glossary: {
      term: "收口",
      explanation:
        "把讨论收束到明确决定、责任人和下一步。在谈判中要避免只得到一句模糊的“可以试”。",
    },
    options: [
      {
        id: "bounded-pilot",
        text: "范围减半、指标不减，达标先进入第二阶段。",
        responseYue: "呢个可以。听朝出一页纸，范围、指标、责任人写清楚。",
        responseZh: "这个可以。明早出一页纸，把范围、指标和责任人写清楚。",
        feedback:
          "你同时尊重预算边界和验证目标，把口头意向变成了可执行承诺。",
        learningPoint: "用范围换预算，但保留成功指标，并明确时间与责任人。",
        delta: { trust: 6, professionalism: 6, language: 2, culture: 4 },
      },
      {
        id: "discount-close",
        text: "我哋可以再平一成，今日就签。",
        responseYue: "唔好咁快自己劈价。客户未讲价格係唯一问题。",
        responseZh: "不要这么快主动降价。客户还没说价格是唯一问题。",
        feedback:
          "你试图快速成交，却把预算限制直接等同于价格异议，也削弱了方案价值。",
        learningPoint: "预算不变不等于只要降价；先重组范围和价值，再讨论价格。",
        delta: { trust: -2, professionalism: -4, language: 2, culture: -2 },
      },
    ],
    nextSceneId: null,
  },
];

export function getScene(id) {
  return scenes.find((scene) => scene.id === id) ?? scenes[0];
}
