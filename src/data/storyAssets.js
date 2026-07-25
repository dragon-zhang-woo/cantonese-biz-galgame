const asset = (fileName) =>
  `${import.meta.env.BASE_URL}assets/${fileName}`;

export const characterDossiers = [
  {
    id: "vincent",
    name: "Vincent 梁志诚",
    role: "项目带教经理",
    anchor: asset("char-vincent-anchor-candidate-[a-d]-v01.png"),
    imageAlt: "Vincent 的角色设定表，展示全身、正面、侧面和随身物件",
    profile: "克制、讲求结构，习惯先让新人说清楚自己能为项目解决什么。",
    signal: "他纠正的不是口音，而是你有没有把合作价值放在前面。",
    acts: "第一幕 · 金钟入职",
  },
  {
    id: "chen-jiamin",
    name: "陈嘉敏",
    role: "区域业务总监",
    anchor: asset("char-chen-jiamin-anchor-candidate-[a-d]-v01.png"),
    imageAlt: "陈嘉敏的角色设定表，展示全身、正面、侧面和随身物件",
    profile: "谨慎、重证据，对空泛承诺保持距离，但愿意给可验证的方案机会。",
    signal: "她的追问往往不是拒绝，而是在确认风险由谁承担、结果怎样验证。",
    acts: "第二幕 · 中环初会 / 第四幕 · 危机补救",
  },
  {
    id: "ah-long",
    name: "阿朗",
    role: "本地项目经理",
    anchor: asset("char-ah-long-anchor-candidate-[a-d]-v01.png"),
    imageAlt: "阿朗的角色设定表，展示全身、正面、侧面和随身物件",
    profile: "熟悉香港办公室的言外之意，语气放松，但观察细致。",
    signal: "他会给提示，却不会替你下结论；真正的功课是把暗示翻译成待确认信息。",
    acts: "第三幕 · 茶水间试探",
  },
  {
    id: "mrs-ho",
    name: "何太",
    role: "你的直属经理",
    anchor: asset("char-mrs-ho-anchor-candidate-[a-d]-v01.png"),
    imageAlt: "何太的角色设定表，展示全身、正面、侧面和随身物件",
    profile: "务实、沉稳，关注团队能否把口头共识收束成可执行承诺。",
    signal: "她不鼓励为了成交而自降价值，更重视范围、指标与责任人的边界。",
    acts: "第五幕 · 湾仔收口",
  },
];

export const cinematicByScene = {
  "admiralty-onboarding": {
    establishing: {
      image: asset("establishing-admiralty-morning-act1-v01.png"),
      eyebrow: "08:42 · ADMIRALTY",
      title: "第一天，先学会让人放心",
      copy: "清晨的金钟刚刚亮起来。十点前，你要让客户在半分钟内知道：你是谁，以及你能替这次合作解决什么。",
      imageAlt: "清晨的金钟写字楼入口，暖色晨光映在玻璃与石材上",
    },
    reaction: {
      image: asset("reaction-vincent-act1-reference-v01.png"),
      frames: 4,
      positiveFrame: 1,
      neutralFrame: 2,
      negativeFrame: 3,
      imageAlt: "Vincent 对玩家回答的不同反应",
    },
    inserts: [
      {
        image: asset("insert-vincent-folder-act1-v01.png"),
        title: "项目文件推到你面前",
        copy: "文件夹不是履历面试题。Vincent 要你先找到自己在这次合作中的责任位置。",
        imageAlt: "Vincent 把黑色项目文件夹推到桌面前方",
      },
      {
        image: asset("insert-player-elevator-reflection-act1-v01.png"),
        title: "电梯门合上前",
        copy: "你把开场白压缩成一句角色、一句价值。镜面里没有完整的脸，只有第一次真正进入香港职场的自己。",
        imageAlt: "第一人称视角在电梯镜面前整理衬衫领口",
      },
    ],
  },
  "central-client-brief": {
    establishing: {
      image: asset("establishing-central-sunset-act2-v01.png"),
      eyebrow: "17:36 · CENTRAL",
      title: "完整方案，不等于值得现在行动",
      copy: "夕阳越过维港，会议室却没有人急着签字。你需要证明的不是方案有多厚，而是下一步怎样被验证。",
      imageAlt: "中环高层会议室的黄昏天际线，桌面放着未签署文件",
    },
    reaction: {
      image: asset("reaction-chen-jiamin-act2-reference-v01.png"),
      frames: 4,
      positiveFrame: 3,
      neutralFrame: 2,
      negativeFrame: 1,
      imageAlt: "陈嘉敏在客户会议中的不同反应",
    },
    inserts: [
      {
        image: asset("insert-unsigned-proposal-act2-v01.png"),
        title: "签字页仍然空白",
        copy: "客户没有否定方向，她只是不愿为一句“市场机会”承担不可逆的风险。",
        imageAlt: "中环会议桌上的未签署方案、金属笔和文件夹",
      },
      {
        image: asset("insert-chen-jiamin-pause-act2-v01.png"),
        title: "陈嘉敏停下笔",
        copy: "她抬眼等你把紧迫感变成证据，把大承诺缩成一个可撤回的试点。",
        imageAlt: "陈嘉敏坐在黄昏会议室中停笔抬眼",
      },
    ],
  },
  "pantry-colleague-signal": {
    establishing: {
      image: asset("establishing-pantry-bluehour-act3-v01.png"),
      eyebrow: "18:18 · ADMIRALTY",
      title: "有些答案，不会在会议室里直接说",
      copy: "人群散去，茶水间只剩咖啡机的低响。阿朗给你的不是内幕，而是一道关于“再睇下”的语境题。",
      imageAlt: "蓝调时刻的安静办公室茶水间，台面上放着两杯咖啡",
    },
    reaction: {
      image: asset("reaction-ah-long-act3-reference-v01.png"),
      frames: 4,
      positiveFrame: 1,
      neutralFrame: 2,
      negativeFrame: 3,
      imageAlt: "阿朗对玩家判断的不同反应",
    },
    inserts: [
      {
        image: asset("insert-two-coffees-act3-v01.png"),
        title: "两杯咖啡，一次非正式试探",
        copy: "香港办公室的真正提示常常发生在正式议程之外，但提示仍然需要被验证。",
        imageAlt: "夜色办公室茶水间台面上的两杯无品牌咖啡",
      },
      {
        image: asset("insert-meeting-reflection-act3-v01.png"),
        title: "远处的会议室仍亮着",
        copy: "“再睇下”留下的不是句号，而是一张待补清单：责任边界、退出机制，以及谁来承担交付风险。",
        imageAlt: "茶水间玻璃倒影里远处仍亮着的会议室",
      },
    ],
  },
  "client-crisis-repair": {
    establishing: {
      image: asset("establishing-central-rain-act4-v01.png"),
      eyebrow: "20:47 · CENTRAL",
      title: "雨夜里，确定感比解释更重要",
      copy: "两组数字对不上，手机消息仍在增加。危机沟通的第一步不是找替罪羊，而是给出事实边界、负责人和更新时间。",
      imageAlt: "雨夜的中环高层办公室，玻璃上有雨痕和城市灯光",
    },
    reaction: {
      image: asset("reaction-chen-jiamin-act4-reference-v01.png"),
      frames: 3,
      positiveFrame: 2,
      neutralFrame: 1,
      negativeFrame: 0,
      imageAlt: "陈嘉敏在危机会议中的不同反应",
    },
    inserts: [
      {
        image: asset("insert-data-mismatch-act4-v01.png"),
        title: "两组数据出现分歧",
        copy: "图表给出了异常，却还没有给出责任结论。现在最危险的是在核对前说得太满。",
        imageAlt: "雨夜桌面上两份走势不一致的数据图表",
      },
      {
        image: asset("insert-chen-phone-light-act4-v01.png"),
        title: "客户的消息还在进来",
        copy: "陈嘉敏需要一句可以转述给客户的话：谁在查、影响多大、几点更新。",
        imageAlt: "手机冷光照亮雨夜办公室里的陈嘉敏侧脸",
      },
      {
        image: asset("insert-player-checklist-act4-v01.png"),
        title: "九点前的一页清单",
        copy: "你把混乱拆成三件事：差异范围、核对负责人、补救时间。危机第一次变得可以被管理。",
        imageAlt: "第一人称视角在数据文件旁手写核对清单",
      },
    ],
  },
  "manager-lunch-close": {
    establishing: {
      image: asset("establishing-wanchai-night-act5-v01.png"),
      eyebrow: "21:32 · WAN CHAI",
      title: "最后一步，是把“可以试”写清楚",
      copy: "湾仔雨后的街灯映在路面。预算不会增加，但合作仍有机会——前提是你能把范围和价值重新组合。",
      imageAlt: "雨后的湾仔夜街与暖光茶餐厅门面",
    },
    reaction: {
      image: asset("reaction-mrs-ho-act5-reference-v01.png"),
      frames: 4,
      positiveFrame: 3,
      neutralFrame: 1,
      negativeFrame: 2,
      imageAlt: "何太对玩家收口方案的不同反应",
    },
    inserts: [
      {
        image: asset("insert-tea-plan-act5-v01.png"),
        title: "茶杯旁的一页计划",
        copy: "一句“可以试”还不算承诺。真正的收口，要让双方都看见下一步是什么。",
        imageAlt: "茶餐厅桌上的茶杯、奶茶和折叠的一页计划",
      },
      {
        image: asset("insert-pilot-scope-act5-v01.png"),
        title: "范围减半，指标不减",
        copy: "你没有用降价换点头，而是把预算边界变成一份可验证的试点结构。",
        imageAlt: "桌面上一页没有可读文字的试点范围图形摘要",
      },
      {
        image: asset("insert-player-leaves-wanchai-act5-v01.png"),
        title: "离开湾仔时",
        copy: "雨停了。你带走的不只是一次客户机会，还有一套能在真实关系中工作的香港商务表达方法。",
        imageAlt: "第一人称视角拿着折叠文件离开雨后湾仔茶餐厅",
      },
    ],
  },
};

export const cinematicImages = [
  ...characterDossiers.map((character) => character.anchor),
  ...Object.values(cinematicByScene).flatMap((cinematic) => [
    cinematic.establishing.image,
    cinematic.reaction.image,
    ...cinematic.inserts.map((insert) => insert.image),
  ]),
];

export function getCinematic(sceneId) {
  return cinematicByScene[sceneId] ?? cinematicByScene["admiralty-onboarding"];
}
