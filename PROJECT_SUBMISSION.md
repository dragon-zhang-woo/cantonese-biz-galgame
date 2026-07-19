# Firebird Hackathon submission draft

## Project name

粤商通 CantoneseBiz

## One-line pitch

在香港职场真实关系中练习商务粤语的 AI 互动视觉小说：玩家的每句
回应都会改变人物信任，并由 AI 解释语言正确性与社会效果的差异。

## Target users

- 初次赴港工作的普通话母语者；
- 大湾区高校中准备赴港实习或求职的非粤语母语学生；
- 需要香港文化与沟通 onboarding 的企业团队。

## Core problem

语言学习工具通常训练词汇、语法与发音，却无法低风险地复现客户
谈判、同事试探和经理反馈中的关系压力。用户可能“每个字都说对了”，
仍因语气、责任边界或隐含含义误判而失去信任。

## Solution

一个三幕式 AI Galgame：

1. 玩家进入香港本地商务场景；
2. 对沟通压力做选择；
3. NPC 根据人物利益与玩家状态即时回应；
4. 程序更新关系数值；
5. AI 教练解释社会语用后果；
6. 结局形成个人学习画像。

## Innovation

- 用“关系后果”而不是背词驱动语言学习；
- 把 Galgame 的角色记忆与商务情境训练结合；
- 将可生成内容限制在角色表演和教练解释，故事图保持确定；
- AI / 离线双模式，现场可稳定运行。

## AI implementation

- DeepSeek V4 Flash：结构化 NPC 反应与语境点评；
- JSON Output + Pydantic：字段和分数边界验证；
- Provider abstraction：可插入 HKGAI Studio 文本/语音模型；
- browser SpeechSynthesis：可选粤语朗读；
- Mock Provider：API、额度或网络失败时无缝降级。

## Demo completeness

- Three original scenes and characters;
- one complete start-to-ending path;
- responsive web UI;
- automated frontend/backend tests;
- Docker deployment;
- asset and third-party license ledgers.

## Human–AI boundary

AI provides contextual rehearsal, not authoritative judgments about Hong Kong
people or one universally correct communication style. The system does not
make employment decisions, store personal conversations or provide
professional advice.

## Development potential

- B2C scenario packs for job seekers;
- enterprise onboarding and role-specific training;
- university career-center programs;
- HKGAI speech integration for pronunciation and code-switching feedback;
- authoring tools for HR trainers to create private scenarios.
