# 粤商通项目记忆

最后更新：2026-08-01

## 当前状态

- 代码库：`D:\火鸟黑客松竞赛\粤商通 Galgame`
- 稳定基线：`develop` 的 `cae62b5`；v1.0.0、README 与宣传图更新已通过
  PR #9–#16 发布。
- 当前开发分支：`feature/custom-scenario-showcase-v2`。
- 项目是 2026 火鸟 AI 黑客松开放赛道作品：以香港职场关系后果驱动的
  商务粤语 AI 视觉小说与训练平台。

## 已实现基线

- 五幕固定主线、S/A/B 结局与离线完整通关；`nextSceneId` 由程序控制。
- 12 项独立训练任务和“我的现实情境”3–6 轮连续训练。
- DeepSeek 负责受约束 NPC 反应，港话通负责自然度、礼貌度、商务适配和
  港式改写；两个模型可独立降级。
- 浏览器脱敏、匿名情境编排、六维行为量表、官方来源技能卡和现实复用模板。
- 四名主要 NPC、五张建立镜头、五组反应图、十二张剧情插图、七张训练背景、
  六张自定义训练背景及完整来源台账。
- 1440×1024 桌面与 390×844 手机布局、粤语朗读、主线断点和训练本机分数。

## 本阶段新增

- 前端离线编排与 FastAPI 使用 `shared/scenario-inference.json` 的同一套关系、
  渠道、重点和视觉场景规则，并由 15 项共享夹具验证一致性。
- 修复“跨部门同事催数据”被误判为上司/优先级的问题；显式选择优先，
  高特异短语其次，任务评分再次，模板只作低置信度保底。
- 收紧地址脱敏规则：实际地址仍在浏览器发送前及服务端二次清理，普通的
  “不知道怎么说明”不再被误删。
- `/api/scenario/compose` 保持旧字段兼容，新增 `composition_source`、
  `visual_scene_id` 和带置信度/抽象理由的 `inference`。
- 自定义准备页区分服务端与离线编排，允许直接修正设置；匿名描述只在当前
  挂载体验中保留，不写存储。
- 训练页显示任务进度、关系信号、下一步和收口建议；复盘增加逐轮推进轨迹与
  显式复制的现实行动卡，行动卡不包含原始输入或逐轮回答。
- 新增只读“90 秒评委演示”：精选第 1、4、5 幕，零模型调用、零存档写入，
  可从导览进入完整主线。
- 新增 `DEMO-01` 第四幕危机补救交接图，已通过角色、构图安全区、手部道具、
  色板及无文字/品牌 QA，并写入两份素材台账。

## 验证基线

- 前端：38 项测试通过；ESLint 与 Vite production build 通过。
- 后端：隔离 `.venv` 中 19 项测试通过。
- Playwright 已在 1440×1024 与 390×844 跑通自定义准备、逐轮训练、两轮收口、
  复盘/行动卡及三段评委导览；无横向溢出、控制台错误或阻断控制。
- 评委导览在空存档下完整运行前后均未写入 `localStorage`；退出后仍处于原主线
  第一幕，`nextSceneId` 与主线数值未改变。
- 待完成：最终 diff 审查、提交推送与面向 `develop` 的草稿 PR。

## 关键入口

- 主游戏与入口：`src/App.jsx`
- 自定义体验：`src/components/CustomScenarioExperience.jsx`
- 评委演示：`src/components/JudgeShowcase.jsx`
- 浏览器离线编排：`src/services/customScenario.js`
- 共享推断：`src/services/scenarioInference.js`、`shared/scenario-inference.json`
- 后端编排：`backend/app/services/scenario_composer.py`
- 五幕数据与电影素材：`src/data/scenes.js`、`src/data/storyAssets.js`
- 视觉生产：`docs/visual-production/`、`ASSET_SOURCES.md`

## 不可破坏的约束

- 不改变五幕故事图、选项评分或 `nextSceneId`。
- AI 是增强能力，标准主线、训练路径和评委导览必须可离线运行。
- 不持久化原始现实描述、自由回答、密钥、个人资料或公司机密。
- 所有新视觉必须原创、从批准角色锚点出发，并同时更新素材来源和 26 字段台账。
- `develop` 是集成分支，`main` 是稳定发布分支；功能 PR 先进入 `develop`。
