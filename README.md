# 粤商通 CantoneseBiz

> 一款由职场关系后果驱动的香港商务粤语 AI 互动视觉小说。

![CantoneseBiz 游戏界面](docs/preview.png)

**在线演示：**
[dragon-zhang-woo.github.io/cantonese-biz-galgame](https://dragon-zhang-woo.github.io/cantonese-biz-galgame/)

玩家不是背诵词汇，而是在客户初会、同事试探和经理复盘中做沟通
决策。每个选择都会改变信任、专业度、粤语自然度和文化适配度；AI
教练解释为什么一句话在语法上正确，却可能在香港商务语境中失效。

这是为 2026 火鸟 AI 黑客松开放赛道制作的原创可运行原型。

## 为什么值得做

传统语言学习产品擅长教“怎么说”，却很少训练“在什么关系里、以
什么方式说”。CantoneseBiz 把语言、语境、关系和后果放进同一条
可演示闭环：

```text
真实职场场景 → 玩家选择 → NPC 反应 → 关系数值变化 → AI 教练复盘
```

## 当前可玩内容

- 三幕完整剧情：中环客户初会、办公室茶水间、湾仔茶餐厅；
- 四维状态：信任、专业度、粤语自然度、文化适配；
- 两种运行方式：
  - **标准剧情**：完全离线、固定且可重复；
  - **AI 即兴**：DeepSeek 生成受约束的角色反应，港话通负责香港商务
    语境纠偏；
- 本地化复盘：自然度、礼貌度、商务适配、港式改写与解释；
- 浏览器粤语朗读与术语提示；
- 模型、余额、网络或 JSON 失败时自动回退，不中断剧情；
- 相同回合短期缓存，重复演示无需再次等待模型；
- 结局页与个人学习画像；
- 桌面与 390px 手机布局。

## AI 为什么是核心能力

模型不是给固定 Galgame “套一层聊天框”。它承担两个难以靠穷举
脚本覆盖的任务：

1. 在人物利益、关系和当前状态约束下表演即时反应；
2. 区分语言正确性与社会效果，解释表达在具体职场语境中的后果。

剧情图、允许跳转和最终数值控制仍由确定性程序掌握。这个设计同时
提升可解释性和现场稳定性。

## 架构

```text
React/Vite 视觉小说 UI
        │
        ├── 标准剧情模式 ── 本地三幕故事图
        │
        └── AI 即兴模式 ─── FastAPI
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
              DeepSeek Provider        HKChat Provider
                 角色反应                本地化纠偏
                    └──────────┬──────────┘
                         独立失败降级
                              │
                    结构化校验 + 内存缓存
                              │
                         静态可靠回退
```

FastAPI 会验证模型输出、限制每个分数变化范围，并在异常时返回预写
结果。模型不可以创建节点或修改故事图。

## 本地运行

### 只运行可玩前端

```bash
npm install
npm run dev
```

即使 API 没有启动，标准剧情模式也可以完整通关。

GitHub Pages 版本默认提供可完整通关的标准剧情；本地启动 FastAPI
后可体验 AI 即兴模式。

### 启动 AI 即兴模式

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

在 `backend/.env` 中设置：

```env
AI_SCENE_PROVIDER=deepseek
AI_LOCALIZE_PROVIDER=hkchat
DEEPSEEK_API_KEY=your_key_here
DEEPSEEK_MODEL=deepseek-v4-pro
HKCHAT_API_KEY=your_key_here
HKCHAT_MODEL=t2_hkgai-v3_fp8_1m_e7
```

然后启动：

```bash
uvicorn app.main:app --reload --port 8000
```

前端默认连接 `http://localhost:8000`。如需修改，复制根目录
`.env.example` 为 `.env.local` 并设置 `VITE_API_BASE_URL`。

## 验证

```bash
npm run lint
npm test
npm run build

cd backend
pytest
```

## Docker

创建 `backend/.env` 后：

```bash
docker compose up --build
```

前端位于 `http://localhost:8080`，API 位于
`http://localhost:8000`。

## 演示路径

1. 进入“中环初会”，选择“先讲风险，再用两星期试点验证”；
2. 展示 NPC 反应、信任值变化和“语言正确 vs. 社会效果”点评；
3. 切换“AI 即兴 / 标准剧情”，证明网络故障不会破坏 Demo；
4. 完成三幕，在学习报告页展示个人沟通画像。

更完整的 90 秒与 3 分钟脚本见
[`docs/demo-script.md`](docs/demo-script.md)。

## 安全与边界

- 产品用于语言与职场文化练习，不提供法律、投资、医疗或雇佣决策；
- AI 反馈是情境化学习建议，不宣称存在唯一正确的“香港表达”；
- MVP 不保存用户自由输入，不收集个人身份信息；
- 角色与事件均为虚构。

## 原创与许可证

- 代码、故事、人物和交互结构为本项目原创；
- 三张场景图为项目专门生成，记录见
  [`ASSET_SOURCES.md`](ASSET_SOURCES.md)；
- 第三方依赖与许可证见
  [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)；
- 项目代码采用 MIT License。
