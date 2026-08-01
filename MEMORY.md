# 粤商通项目记忆

最后更新：2026-08-02

## 当前状态

- 代码库：`D:\火鸟黑客松竞赛\粤商通 Galgame`
- 稳定基线：`develop` 的 `f34a7e1`；PR #17 已合并。
- 当前开发分支：`feature/voice-input-v1`。
- 草稿 PR：[#18](https://github.com/dragon-zhang-woo/cantonese-biz-galgame/pull/18)，
  目标分支 `develop`；首个功能提交为 `9bf9b40`。
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

## 自定义情境 V2 与评委导览

- 前端离线编排与 FastAPI 使用 `shared/scenario-inference.json` 的同一套关系、
  渠道、重点和视觉场景规则，并由 15 项共享夹具验证一致性。
- 修复“跨部门同事催数据”被误判为上司/优先级的问题；显式选择优先，
  高特异短语其次，任务评分再次，模板只作低置信度保底。
- `/api/scenario/compose` 保持旧字段兼容，新增 `composition_source`、
  `visual_scene_id` 和带置信度/抽象理由的 `inference`。
- 准备页允许修正设置；训练承接上一轮 NPC 反应；复盘提供逐轮轨迹与不含
  原始回答的现实行动卡。
- 只读“90 秒评委演示”精选第 1、4、5 幕，零模型调用、零存档写入；
  `DEMO-01` 第四幕危机补救交接图已完成素材 QA 与台账。

## 语音输入 V1

- 主线 AI 回应、12 项训练回应、自定义情境描述和自定义逐轮回应统一使用
  `UtteranceInput`；训练库搜索框保持文本输入。
- 麦克风通过 `MediaRecorder` 保存原始 Blob，同时由 `AudioWorklet` 输出
  16 kHz 单声道 PCM、实时字幕与音量反馈；支持 WAV、MP3、M4A/AAC、
  Ogg 和 WebM 文件上传。
- 录音只进入专用 IndexedDB：最多最近 20 条、30 天；不保存原文件名、
  转写文本、情境内容或模型结果，并提供回放、下载、重新转写、删除和清空。
- 后端新增独立 `SpeechTranscriptionModule`、能力探测、multipart 文件转写和
  真正 WebSocket 流式接口；PyAV 负责文件头/解码校验和 16 kHz 单声道归一化。
- 音频并发限制为每客户端 2 个任务、每分钟 10 次启动；实时接口校验 Origin，
  上传结束后立即关闭 `UploadFile`，音频不进入 `GameEngine`、`TurnCache` 或存档。
- `/api/game/turn` 新增兼容字段 `player_action.input_kind`；新自由回答显式标记
  `free`，旧 `custom-response` 与 `custom-round-*` 仍兼容。
- 港话通 Speech 转写来源与 DeepSeek 角色反应、港话通文本复盘来源分开显示；
  用户确认可编辑文字后才进入原有双模型回合。
- 公开资料只确认港话通支持广东话，未给出实时/文件端点和明确鉴权契约。
  只有填写主办方提供的显式 HTTP/WS URL 后才开放能力，不以整段轮询伪装实时。

## 验证基线

- 前端：48 项测试通过；ESLint 与 Vite production build 通过。
- 后端：隔离 `.venv` 中 51 项测试通过。
- Playwright 已在 1440×1024 与 390×844 确认主线、训练回应、自定义描述和
  自定义逐轮回应的语音控制；训练库搜索框无语音按钮。
- 两种视口均无横向溢出，浏览器控制台 0 错误；首次上传隐私说明和不支持
  文件的错误恢复已验证。
- 本机未安装 Docker CLI；PR CI 已成功构建 Web/API Docker 镜像。真实港话通
  Speech 验收仍等待主办方接口契约。
- 审计新增真实六类容器解码、流式 sequence 去重/合并、PCM 时长限制、取消、
  上游错误映射、录音组件权限/启停和配额失败内存下载覆盖。
- 草稿 PR #18 的前端、后端及两个 Docker 镜像构建均通过；只剩外部 Speech
  契约与真实供应商验收待补齐。

## 关键入口

- 主游戏与入口：`src/App.jsx`
- 自定义体验：`src/components/CustomScenarioExperience.jsx`
- 评委演示：`src/components/JudgeShowcase.jsx`
- 统一语音输入：`src/components/UtteranceInput.jsx`
- 本机录音存储：`src/services/recordingStore.js`
- 语音 API 客户端：`src/services/speechApi.js`
- 后端语音模块：`backend/app/services/speech.py`
- 浏览器离线编排：`src/services/customScenario.js`
- 共享推断：`src/services/scenarioInference.js`、`shared/scenario-inference.json`
- 后端编排：`backend/app/services/scenario_composer.py`
- 五幕数据与电影素材：`src/data/scenes.js`、`src/data/storyAssets.js`
- 视觉生产：`docs/visual-production/`、`ASSET_SOURCES.md`

## 不可破坏的约束

- 不改变五幕故事图、选项评分或 `nextSceneId`。
- AI 是增强能力，标准主线、训练路径和评委导览必须可离线运行。
- 原始现实描述、自由回答、密钥、个人资料或公司机密不得写入训练存档。
- 音频只允许进入专用本机 IndexedDB 和港话通 Speech 转写链路；不交给
  DeepSeek 或港话通文本模型，不建立后端音频库或跨设备同步。
- 所有新视觉必须原创、从批准角色锚点出发，并同时更新素材来源和 26 字段台账。
- `develop` 是集成分支，`main` 是稳定发布分支；功能 PR 先进入 `develop`。
