# 粤商通视觉资产生产文档

## 阅读顺序

1. [`VISUAL_BIBLE.md`](VISUAL_BIBLE.md)：正式视觉资产圣经，是色彩、镜头、服装、角色连续性和生产流程的唯一视觉规范。
2. [`CHARACTER_BIBLE.md`](CHARACTER_BIBLE.md)：四名主要 NPC 与第一人称玩家的角色执行清单。
3. [`STORY_ASSET_MAP.md`](STORY_ASSET_MAP.md)：五幕剧情与新增资产的精确映射；当前规划为 5 张建立镜头、12 张剧情插图和 5 组人物反应立绘。
4. [`GPT_IMAGE_2_PROMPT_TEMPLATES.md`](GPT_IMAGE_2_PROMPT_TEMPLATES.md)：角色锚点、主场景、编辑和道具图提示词模板。
5. [`GPT_IMAGE_2_CONCRETE_PROMPTS.md`](GPT_IMAGE_2_CONCRETE_PROMPTS.md)：可直接复制使用的四名角色锚点、五组反应参考、五张建立镜头和十二张剧情插图提示词。
6. [`ASSET_GENERATION_LOG.csv`](ASSET_GENERATION_LOG.csv)：逐资产生成、编辑、输入参考和 QA 台账。
7. [`GPT_IMAGE_2_SHOWCASE_PROMPT.md`](GPT_IMAGE_2_SHOWCASE_PROMPT.md)：评委演示模式第四幕关键后果镜头及修订记录。
8. [`../../ASSET_SOURCES.md`](../../ASSET_SOURCES.md)：正式素材来源、原创性与第三方许可台账。
9. [`../../AGENTS.md`](../../AGENTS.md)：项目长期视觉约束和不可破坏的实现决策。

## 事实与创作标准

当前代码和既有剧情明确了角色姓名、职务、场景和剧情功能。人物年龄、具体外貌、主服装和视觉识别属于视觉生产新增的统一创作标准。Vincent 在代码与文档中统一为“项目带教经理”；何太是玩家的直属经理和最终复盘负责人。

## 生产状态与门槛

2026-07-24 已接收并验收四名主要 NPC 的角色锚点、五组反应参考、五张建立镜头和十二张剧情插图，当前 26 张新增资产已进入游戏。供应 PNG 没有内嵌提供方生成 ID，因此台账如实记录为 `not exported with supplied PNG`，不得虚构编号。

后续生产仍必须从已批准角色锚点开始，并把锚点作为新增立绘和场景编辑输入。所有被采用的结果都必须同步更新正式 `ASSET_SOURCES.md` 和 `ASSET_GENERATION_LOG.csv`。
