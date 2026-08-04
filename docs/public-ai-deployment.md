# 公开双模型部署

GitHub Pages 继续负责静态前端，`backend/` 作为独立 HTTPS 服务运行。模型密钥
只存在后端托管平台；Pages 构建只接收非敏感的 API 基地址。

## 1. 创建后端服务

仓库根目录的 `render.yaml` 定义了单实例 Render Web Service、Singapore 区域、
1 GB 持久卷、健康检查、双模型强制就绪和 ¥5 公开预算。将 Blueprint 连接到本
仓库后，在首次创建时填写：

- `DEEPSEEK_API_KEY`
- `HKCHAT_API_KEY`

不要填写 `HKCHAT_SPEECH_API_KEY`。公开语音转写尚未纳入双模型预算闸门。

Blueprint 使用付费 `starter` 实例，因为 Render 免费实例不能挂载持久卷。
SQLite 位于 `/app/data/public_api_budget.sqlite3`；删除服务或持久卷会丢失额度
计数。服务保持单实例，不能在 SQLite 预算实现下横向扩容。

## 2. 验证后端

部署完成后，先执行只读检查：

```bash
npm run verify:public-api -- https://YOUR-SERVICE.onrender.com
```

确认输出中的 `provider` 为 `deepseek+hkchat`、`dual_model_ready` 为 `true`、
`enabled` 为 `true`。随后执行一次真实、会消耗一回合额度的烟雾测试：

```bash
npm run verify:public-api -- https://YOUR-SERVICE.onrender.com --spend-turn
```

脚本要求真实响应仍为 `deepseek+hkchat`，并验证全局已用回合只增加 1。

## 3. 连接 GitHub Pages

只有后端通过上述真实测试后，才设置仓库变量并重新部署 Pages：

```bash
gh variable set PUBLIC_API_BASE_URL \
  --repo dragon-zhang-woo/cantonese-biz-galgame \
  --body "https://YOUR-SERVICE.onrender.com"

gh workflow run pages.yml \
  --repo dragon-zhang-woo/cantonese-biz-galgame \
  --ref main
```

`PUBLIC_API_BASE_URL` 必须是 HTTPS 且不要带路径。DeepSeek、港话通密钥绝不能
写进 GitHub Actions Variable、`VITE_*` 变量、源码或 Pages Secrets。

## 4. 线上验收

1. 打开公开网站首页，状态应显示“双模型在线”和全站剩余回合。
2. 进入专题训练或“我的现实情境”，提交一条无敏感信息的自由回答。
3. 复盘来源必须同时显示 `DeepSeek` 与 `港话通`，不能出现本地保底。
4. 再次读取 `/api/public/quota`，确认 `used_turns` 增加 1。
5. 检查浏览器 Network：模型请求只能发往已配置的 HTTPS 后端，不能出现模型
   密钥、`localhost:8000` 或浏览器直连供应商 API。

供应商账户还应使用单独的小额余额或账单硬上限。应用的固定回合预算是第二道
防线，不等同于供应商真实账单。
