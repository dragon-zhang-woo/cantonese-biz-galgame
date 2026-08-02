# 港话通实时 ASR 接口契约请求

> 当前桌面版已用浏览器 Web Speech API 提供独立标注的实验性实时字幕，
> 停录后仍由港话通整段识别兜底。该客户端降级不改变本文件对港话通正式
> 流式接口的契约要求，也不会被标示为 `hkchat-speech`。

## 背景

粤商通已经按 HKGAI Studio 的正式说明接入整文件语音识别：

- `POST https://openspeech.hkgai.net/server_proxy/api/v1/speech_recognize`
- `Authorization: Bearer <Speech API Key>`
- JSON/Base64 音频请求，识别文字位于 `data.result`

项目需要在用户录音期间显示粤语 interim/final 字幕。Studio 当前公开的
WebSocket 仅用于 TTS；Speech 页面实际只实现 TTS、整文件识别和会议转写。
为了避免误连 TTS Socket 或用整文件轮询伪装实时，请主办方确认是否提供真正
的流式 ASR，并补充以下最小契约。

## 必需信息

### 1. 连接与鉴权

- 流式 ASR 的完整 `wss://` 地址及生产/测试环境差异；
- Bearer Key 放在握手 Header、query string，还是首个 JSON 消息；
- 浏览器是否允许直连，或是否必须由服务端代理；
- 允许的 `Origin`、TLS 要求及单 Key/单 IP 并发上限。

### 2. 开始消息

请提供完整 JSON 示例及字段约束，至少说明：

- 请求 ID；
- 语言：自动识别或 `yue-HK`；
- 编码：`pcm_s16le`；
- 采样率：16 kHz；
- 声道：mono；
- 是否支持标点、繁简体选择、热词和领域提示。

### 3. 音频帧

- PCM 使用二进制帧还是 Base64 JSON；
- 推荐单帧时长/字节数及最大发送频率；
- 是否要求固定 chunk、sequence 或 timestamp；
- 背压、最大缓冲、静音和最长会话限制；
- keepalive / ping-pong 规则。

### 4. 结束与取消

- 正常结束消息及服务端最终确认；
- 用户取消消息；
- 客户端断开后服务端是否立即停止处理；
- 是否允许断线重连或从 sequence 恢复。

### 5. 服务端事件

请提供 `ready`、`interim`、`final`、`complete`、`error` 的真实示例，并说明：

- sequence 是否严格递增；
- interim 是完整当前句还是增量片段；
- final 是否可能被修订或重复；
- complete 是否包含完整合并稿；
- detected language、标点和繁简体字段；
- 错误码、是否可重试及建议重试时间。

### 6. 错误与服务边界

- 鉴权失败、限流、上游超时、格式错误、时长超限和服务不可用的状态/错误码；
- 计费单位及配额查询方式；
- 音频、interim/final 文本、请求 ID 和日志的保留策略；
- 可用于 CI 之外人工验收的测试 Key 或沙箱。

## 最小验收标准

拿到契约后，粤商通将以一段无敏感信息的广东话短句验证：

1. 录音期间至少收到一个 interim；
2. final 顺序稳定，重复 sequence 不造成重复文字；
3. finish 后收到完整 transcript；
4. cancel 后供应商停止处理；
5. 断线时保留本机完整录音，并只自动尝试一次正式文件转写；
6. 鉴权失败、429、超时和 5xx 映射为稳定、可恢复的产品错误。

若目前不提供流式 ASR，也请明确确认；产品将继续使用“停止录音后快速转写”，
并保持 `live_supported=false`，不把 TTS WebSocket 或整文件轮询包装成实时字幕。
