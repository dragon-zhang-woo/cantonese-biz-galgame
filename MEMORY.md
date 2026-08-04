# 粤商通项目记忆

最后更新：2026-08-04

## 在线双模型部署修复（已完成）

- Render 付费方案已由用户明确放弃；未创建 Render 服务，也无需添加银行卡。
- PR #24 已合入 `develop`，PR #25 已将同一批前端状态、FastAPI 双模型守门和
  验证脚本提升至 `main`；两批 CI 与 Pages 发布均成功。
- 新分支 `fix/cloudflare-dual-model` 基于最新 `origin/develop`，将公开后端改为
  Cloudflare Workers Free + D1，FastAPI 继续保留为本地/容器后端。
- Worker 已实现 `/health`、`/api/public/quota`、`/api/game/turn` 和公开语音能力
  探测；缺失任一模型密钥时回合接口 503 且不扣额度。
- D1 使用单条条件 `INSERT ... RETURNING` 原子预留回合：¥5 总预算、每次保守
  ¥0.05、全站最多 100 回合、每个加盐哈希客户端最多 5 回合，不保存 IP 或文本。
- DeepSeek 与港话通并行请求并独立降级；Worker 对输入长度、字段和数值边界做
  白名单校验，拒绝无效 Origin，模型密钥只通过 Cloudflare Secrets 注入。
- Worker 7 项单测、ESLint、Wrangler dry-run 和本地 D1 migration 已通过；本地
  HTTP 验证健康、CORS、100 回合初始额度及无效请求不扣额度均正确。
- Cloudflare OAuth 已完成；远程 D1 `cantonese-biz-public-budget`
  (`771cfad3-66b3-4ad5-acb4-635452f656d1`) 已创建并应用迁移，三个 Secret 均已
  加密写入 Worker。
- Worker 已部署到
  `https://cantonese-biz-dual-model-api.cantonese-biz-galgame.workers.dev`；真实
  烟雾测试返回 `deepseek+hkchat` 和 `localization.source=hkchat`，D1 从 0 精确
  增加到 1、剩余 99。
- PR #26 已合入 `develop`，发布 PR #27 已合入 `main`；Pages run
  `30923908538` 构建与部署成功，仓库变量 `PUBLIC_API_BASE_URL` 指向上述 Worker。
- 真实 Pages UI 已显示“双模型在线”和剩余 99 回合；从电影化主线切换 AI 即兴后，
  一条无敏感信息的自由回答返回 `DeepSeek + 港话通`、港式三维评分与改写，D1
  从 1 精确增加到 2、剩余 98。当前页面控制台无 error/warning，资源请求主机只有
  GitHub Pages 与该 Worker，没有 `localhost` 或浏览器直连模型供应商。

## 当前状态

- 代码库：`D:\火鸟黑客松竞赛\粤商通 Galgame`
- 稳定发布：`origin/main` 的 `6e872b2`；PR #20 已合入 `develop`，PR #21
  已提升至 `main`。
- 在线体验：`https://dragon-zhang-woo.github.io/cantonese-biz-galgame/`；
  GitHub Pages 使用 Actions workflow 构建并强制 HTTPS。
- 公开版已经完成 1440×1024 真实线上浏览器验收：五段评委演示完整通过，
  控制台 0 error/0 warning、无 API 请求、无横向溢出、存储保持为空。
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
- 只读“3 分钟评委演示”现在用五段覆盖五幕主线、12 项训练、可编辑的
  预置现实情境、第四幕后果对比与学习复盘；零模型调用、零存档写入。
- 演示预置“跨部门同事催数据”无敏感文本与柔性跟进回应；浏览器规则稳定
  显示“跨部门伙伴＋柔性跟进”，渠道无明确线索时标记“请确认”。
- `DEMO-01` 第四幕危机补救交接图已完成素材 QA 与台账。

## 语音输入 V1

- 主线 AI 回应、12 项训练回应、自定义情境描述和自定义逐轮回应统一使用
  `UtteranceInput`；训练库搜索框保持文本输入。
- 麦克风通过 `MediaRecorder` 保存原始 Blob，同时由 `AudioWorklet` 输出
  16 kHz 单声道 PCM 和音量反馈；支持 WAV、MP3、M4A/AAC、
  Ogg 和 WebM 文件上传。
- 录音只进入专用 IndexedDB：最多最近 20 条、30 天；不保存原文件名、
  转写文本、情境内容或模型结果，并提供回放、下载、重新转写、删除和清空。
- 后端新增独立 `SpeechTranscriptionModule`、能力探测、JSON/Base64 文件转写和
  受能力门控的 WebSocket 流式入口；PyAV 负责文件头/解码校验和 16 kHz
  单声道归一化。当前未配置未经供应商证明的实时 ASR 上游。
- 音频并发限制为每客户端 2 个任务、每分钟 10 次启动；实时接口校验 Origin，
  上传结束后立即关闭 `UploadFile`，音频不进入 `GameEngine`、`TurnCache` 或存档。
- `/api/game/turn` 新增兼容字段 `player_action.input_kind`；新自由回答显式标记
  `free`，旧 `custom-response` 与 `custom-round-*` 仍兼容。
- 港话通 Speech 转写来源与 DeepSeek 角色反应、港话通文本复盘来源分开显示；
  用户确认可编辑文字后才进入原有双模型回合。
- 桌面 Chrome/Edge 支持浏览器 Web Speech 实验性实时字幕，来源固定为
  `browser-speech`；优先请求 `yue-Hant-HK`，不支持时切换 `zh-HK`。实时
  interim 只显示在预览，final 合并完成后才进入可编辑字段。
- HKGAI Studio 已确认文件识别为 Bearer 鉴权的
  `POST /server_proxy/api/v1/speech_recognize`，请求使用 JSON/Base64，结果位于
  `data.result`；当前只公布 TTS WebSocket，没有实时 ASR 契约。
- 文件识别可凭 Speech API Key 开启；港话通服务端实时能力继续如实关闭，
  不使用 TTS WebSocket，也不以整段轮询伪装实时。浏览器客户端实时能力不改写
  后端 `live_supported`，失败后自动尝试一次港话通文件转写。
- 供应商成功响应中的空值、空白或非字符串结果一律映射为可恢复的
  `upstream_unavailable`，禁止把 JSON `null` 字符串化为用户转写。新一次
  转写开始时只清除旧预览/待合并状态，不清除用户已确认文字。
- IndexedDB 写入失败时保留当前内存 Blob 和下载入口；只有配额错误提示空间
  不足，其他浏览器存储错误准确提示“本机录音库暂时不可用”。
- 上传文件无论浏览器声明何种 MIME 都先重新封装为匿名 `Blob`，避免 `File`
  对象把原始文件名带入 IndexedDB；流式完成稿采用过程幂等，卸载时取消延迟
  文件转写，不会重复弹出“追加/替换”。
- HTTP 语音请求只有在成功取得并发槽后才释放，拒绝的第三个任务不会误释放
  其他仍在处理的请求。

## 验证基线

- 前端：63 项测试通过；ESLint 与 Vite production build 通过。
- 后端：隔离 `.venv` 中 68 项测试通过。
- Playwright 已在 1440×1024 与 390×844 确认主线、训练回应、自定义描述和
  自定义逐轮回应的语音控制；训练库搜索框无语音按钮。
- 两种视口均无横向溢出，浏览器控制台 0 错误；首次上传隐私说明和不支持
  文件的错误恢复已验证。
- 本机未安装 Docker CLI；PR CI 已成功构建 Web/API Docker 镜像。真实港话通
  文件识别已用 2.64 秒无敏感粤语短句通过端到端验收，返回来源
  `hkchat-speech` 且无警告；港话通服务端实时 ASR 仍等待主办方契约。
- 审计新增真实六类容器解码、流式 sequence 去重/合并、PCM 时长限制、取消、
  上游错误映射、录音组件权限/启停和配额失败内存下载覆盖。
- 麦克风权限被拒后会隐藏录音启动能力；快速停止会关闭尚在连接的实时
  Socket，录音器初始化失败会释放媒体轨道。组件测试新增追加/替换、超长
  保留和本机录音失败重试；文件测试新增字段时长上限与失败请求资源关闭。
- PR #18 已合并；后续草稿 PR #19 的前端、后端及两个 Docker 镜像构建均
  通过。官方文件识别已完成真实验收；客户端浏览器实时字幕已补充实现，
  港话通服务端实时 ASR 仍等待主办方提供独立 WebSocket 契约。
- HKGAI Studio Speech 专用前端脚本只实现 TTS、整文件识别和会议转写：识别
  路径先用 `FileReader` 读取完整文件再提交 JSON/Base64；专用脚本和已加载资源
  均无实时 ASR / WebSocket 调用。生产代码已移除猜测式上游 WebSocket Relay。
- `docs/hkchat-live-asr-contract-request.md` 汇总了向主办方索取流式 ASR 时必需的
  连接、鉴权、帧格式、事件、错误、隐私与验收问题；取得正式答复后再实现
  production live Adapter。
- Microsoft Edge 与 Playwright WebKit 已完成 1440×1024、390×844 兼容性
  复验；WebKit 同源引擎检查通过上传/降级与搜索框隔离，真实 Safari/iOS
  硬件验收仍待执行。
- 提交前范围改为桌面优先；新版五段评委演示已在 1920×1080 与
  1440×1024 完整跑通，无横向溢出、控制台 0 错误，演示前后
  localStorage/sessionStorage 均为空，退出后仍保持第一幕进度。
- 浏览器实时字幕已在真实 Chrome/Edge 确认接口存在且页面为安全上下文；两种
  桌面视口无横向溢出、控制台 0 error/0 warning。自动化覆盖 interim/final、
  粤语语言切换、幂等采用及网络错误后的港话通文件回退；录制前仍需用无敏感
  短句做一次真实麦克风准确率校准。
- 9 页路演 PPTX 已生成并逐页渲染检查，`slides_test.py` 报告无溢出；
  三分钟横版视频镜头单已改为直接跟随五段评委演示录制。

## 公开部署与额度决策

- GitHub Pages 构建只在 `VITE_DEPLOY_TARGET=github-pages` 时使用仓库子路径，
  不再让普通 CI/Release 因 `GITHUB_ACTIONS=true` 误用 Pages base。
- 公开页面没有显式 `VITE_API_BASE_URL` 时不发模型、编排或港话通 Speech 后端
  请求，也不会尝试访问评委电脑的 `localhost:8000`；主线、训练、自定义规则
  编排、评委导览、键盘输入、本机录音和浏览器实时字幕仍可使用。
- 可选公开后端预算为 ¥5，总计保守预留 100 个双模型回合，每个匿名客户端
  最多 5 回合；SQLite 只持久化哈希客户端标识和计数。模型账户仍须使用单独的
  小额余额作为最终账单止损，语音转写不纳入公开额度。
- 三分钟 Demo 成片只录产品界面，不插入 PPT、代码或终端；AI 边界直接使用
  第五段学习报告和演示模块内的零网络/零存档说明。

## 关键入口

- 主游戏与入口：`src/App.jsx`
- 自定义体验：`src/components/CustomScenarioExperience.jsx`
- 评委演示：`src/components/JudgeShowcase.jsx`
- 统一语音输入：`src/components/UtteranceInput.jsx`
- 本机录音存储：`src/services/recordingStore.js`
- 语音 API 客户端：`src/services/speechApi.js`
- 浏览器实时字幕 Adapter：`src/services/browserSpeechRecognition.js`
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
- 音频只允许进入专用本机 IndexedDB、浏览器厂商 SpeechRecognition 和港话通
  Speech 转写链路；不交给 DeepSeek 或港话通文本模型，不建立后端音频库或
  跨设备同步。
- 所有新视觉必须原创、从批准角色锚点出发，并同时更新素材来源和 26 字段台账。
- `develop` 是集成分支，`main` 是稳定发布分支；功能 PR 先进入 `develop`。
