# 公开双模型部署（Cloudflare Workers + D1）

GitHub Pages 继续负责静态前端；`cloudflare/` 提供公开 HTTPS API，D1 持久保存
全站与匿名访客额度。FastAPI 仍用于本地开发和容器部署，但不是公开 Pages 的
运行时。模型密钥只进入 Cloudflare Secrets。

当前生产 Worker：
`https://cantonese-biz-dual-model-api.cantonese-biz-galgame.workers.dev`。
远程 D1 已迁移，首次真实双模型验收已确认额度从 100 减至 99。

## 免费边界

- Workers Free：每天 100,000 次请求、每次 10 ms CPU；等待两个模型 HTTP
  响应不计为 CPU 执行时长。
- D1 Free：每天 5,000,000 行读取、100,000 行写入、总计 5 GB 存储。
- 本项目只允许 100 个公开双模型回合，每个客户端最多 5 回合，远低于上述
  托管额度。DeepSeek 与港话通自身仍会产生模型费用。

若达到 Cloudflare 免费限额，请求会失败并由前端回退本地训练，不会自动切换到
Workers Paid。供应商账户仍应使用单独的小额余额或账单硬上限。

## 1. 登录并创建 D1

```bash
npx wrangler login
npx wrangler d1 create cantonese-biz-public-budget
```

将输出的 `database_id` 写入根目录 `wrangler.jsonc` 的 `d1_databases[0]`，然后：

```bash
npm run worker:migrate:remote
```

迁移只创建 `public_ai_reservations` 表和客户端哈希索引，不包含 IP、回答、场景或
模型输出。每次通过校验的回合使用单条条件 `INSERT` 同时检查全站和访客上限。

## 2. 首次部署与 Secrets

先部署缺少密钥的安全版本；此时 `/health` 返回 503，回合不会扣额度：

```bash
npm run worker:deploy
```

再分别输入三个 Secret。命令会交互读取值，不要把值写进命令行、源码或聊天：

```bash
npx wrangler secret put DEEPSEEK_API_KEY
npx wrangler secret put HKCHAT_API_KEY
npx wrangler secret put PUBLIC_AI_CLIENT_HASH_SALT
```

`PUBLIC_AI_CLIENT_HASH_SALT` 应使用新的随机值，不能复用模型密钥。Cloudflare
Dashboard 与 Wrangler 之后均不会显示 Secret 明文。

## 3. 验证 Worker

部署地址形如：

```text
https://cantonese-biz-dual-model-api.<SUBDOMAIN>.workers.dev
```

先做不消耗模型额度的只读检查：

```bash
npm run verify:public-api -- https://YOUR-WORKER.workers.dev
```

确认 `provider=deepseek+hkchat`、`dual_model_ready=true`、`enabled=true`。随后只执行
一次真实烟雾测试：

```bash
npm run verify:public-api -- https://YOUR-WORKER.workers.dev --spend-turn
```

脚本要求响应来源仍为 `deepseek+hkchat`，并验证 D1 `used_turns` 恰好增加 1。

## 4. 连接 GitHub Pages

只有真实烟雾测试通过后，才设置仓库变量并重新发布：

```bash
gh variable set PUBLIC_API_BASE_URL \
  --repo dragon-zhang-woo/cantonese-biz-galgame \
  --body "https://YOUR-WORKER.workers.dev"

gh workflow run pages.yml \
  --repo dragon-zhang-woo/cantonese-biz-galgame \
  --ref main
```

`PUBLIC_API_BASE_URL` 必须为 HTTPS 且不要带路径。模型密钥绝不能进入 GitHub
Actions Variable、`VITE_*`、源码或 Pages Secrets。

## 5. 线上验收

1. 首页显示“双模型在线”、全站剩余回合和每位访客上限。
2. 在训练或现实情境中提交一条无敏感信息的自由回答。
3. 回合来源同时显示 `DeepSeek` 与 `港话通`，不能是本地保底。
4. 再读 `/api/public/quota`，确认 `used_turns` 只增加 1。
5. 浏览器 Network 只向 Worker 发请求；不得出现模型密钥、`localhost:8000`
   或浏览器直连供应商 API。
6. 断网或额度耗尽时，固定剧情、训练库、现实情境规则编排和评委演示仍可用。

公开 Worker 明确返回语音能力未配置，因此录音仍保留在浏览器本机并可下载；
浏览器 Web Speech 实验性字幕不受影响。公开版不会上传音频或启用未经预算保护的
港话通 Speech。
