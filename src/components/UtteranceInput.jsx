import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  DownloadSimple,
  Microphone,
  MicrophoneSlash,
  Play,
  Trash,
  UploadSimple,
  Waveform,
  X,
} from "@phosphor-icons/react";
import {
  clearAudioAssets,
  deleteAudioAsset,
  listAudioAssets,
  saveAudioAsset,
} from "../services/recordingStore.js";
import {
  createLiveSpeechSocket,
  DEFAULT_SPEECH_CAPABILITIES,
  getSpeechCapabilities,
  transcribeAudio,
} from "../services/speechApi.js";

let voiceConsentGranted = false;

const scopeLabels = {
  "campaign-turn": "主线回应",
  "practice-turn": "训练回应",
  "scenario-intake": "现实情境",
  "custom-turn": "自定义训练",
};

function preferredRecordingType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/mp4;codecs=mp4a.40.2",
    "audio/webm",
    "audio/mp4",
  ];
  return candidates.find((type) => globalThis.MediaRecorder?.isTypeSupported?.(type)) ?? "";
}

function audioDuration(blob) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio();
    const finish = (value) => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(value) ? Math.round(value * 1000) : 0);
    };
    audio.preload = "metadata";
    audio.onloadedmetadata = () => finish(audio.duration);
    audio.onerror = () => finish(0);
    audio.src = url;
  });
}

function extensionFor(mimeType) {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("mpeg")) return "mp3";
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("aac")) return "aac";
  return "webm";
}

function RecordingRow({ asset, onTranscribe, onDelete }) {
  const url = useMemo(() => URL.createObjectURL(asset.blob), [asset.blob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <article className="voice-library__item">
      <div>
        <strong>{asset.displayName}</strong>
        <small>
          {Math.max(1, Math.round(asset.durationMs / 1000))} 秒 · {asset.origin === "uploaded" ? "上传" : "录制"}
        </small>
      </div>
      <audio controls preload="metadata" src={url} />
      <div className="voice-library__actions">
        <button type="button" onClick={() => onTranscribe(asset)}>
          <Play weight="fill" /> 转写
        </button>
        <a href={url} download={`${asset.displayName}.${extensionFor(asset.mimeType)}`}>
          <DownloadSimple weight="bold" /> 下载
        </a>
        <button type="button" onClick={() => onDelete(asset.id)}>
          <Trash weight="bold" /> 删除
        </button>
      </div>
    </article>
  );
}

export function UtteranceInput({
  id,
  label,
  value,
  onChange,
  maxLength,
  rows = 3,
  placeholder,
  scope,
  disabled = false,
}) {
  const [capabilities, setCapabilities] = useState(DEFAULT_SPEECH_CAPABILITIES);
  const [phase, setPhase] = useState("idle");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [interim, setInterim] = useState("");
  const [transcriptPreview, setTranscriptPreview] = useState("");
  const [pendingTranscript, setPendingTranscript] = useState("");
  const [showConsent, setShowConsent] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [assets, setAssets] = useState([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const pendingAction = useRef(null);
  const fileInput = useRef(null);
  const mediaRecorder = useRef(null);
  const mediaStream = useRef(null);
  const recordingChunks = useRef([]);
  const liveSocket = useRef(null);
  const audioContext = useRef(null);
  const audioNode = useRef(null);
  const recordingTimer = useRef(null);
  const recordingStartedAt = useRef(0);
  const finalTranscript = useRef("");
  const finalSequence = useRef(0);
  const liveComplete = useRef(false);
  const valueRef = useRef(value);

  valueRef.current = value;

  async function refreshLibrary() {
    try {
      setAssets(await listAudioAssets());
    } catch {
      setAssets([]);
    }
  }

  useEffect(() => {
    getSpeechCapabilities().then(setCapabilities);
    refreshLibrary();
  }, []);

  useEffect(
    () => () => {
      window.clearInterval(recordingTimer.current);
      liveSocket.current?.close();
      audioNode.current?.disconnect();
      audioContext.current?.close();
      mediaStream.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  function withConsent(action) {
    if (voiceConsentGranted) {
      action();
      return;
    }
    pendingAction.current = action;
    setShowConsent(true);
  }

  function acceptConsent() {
    voiceConsentGranted = true;
    setShowConsent(false);
    const action = pendingAction.current;
    pendingAction.current = null;
    action?.();
  }

  function offerTranscript(text) {
    const normalized = text.trim();
    if (!normalized) return;
    setTranscriptPreview(normalized);
    if (valueRef.current.trim()) {
      setPendingTranscript(normalized);
    } else {
      onChange(normalized);
      setPendingTranscript("");
    }
  }

  async function persistAsset(blob, origin, durationMs = 0) {
    const now = new Date();
    const safeDuration = durationMs || (await audioDuration(blob));
    const asset = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      origin,
      scope,
      blob,
      mimeType: blob.type || "audio/webm",
      size: blob.size,
      durationMs: safeDuration,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 30 * 86_400_000).toISOString(),
      displayName: `${scopeLabels[scope]} ${now.toLocaleString("zh-HK", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
    };
    try {
      await saveAudioAsset(asset);
      await refreshLibrary();
    } catch {
      setWarning("本机录音空间不足；本次音频仍可转写，请立即下载保存。");
    }
    return asset;
  }

  async function requestTranscription(asset) {
    if (!capabilities.uploadSupported) {
      setError("港话通文件转写尚未配置；录音已保留，可下载或继续键盘输入。");
      return;
    }
    setPhase("transcribing");
    setError("");
    try {
      const result = await transcribeAudio(asset.blob, scope);
      offerTranscript(result.transcript);
      setPhase("ready");
    } catch (transcriptionError) {
      setError(transcriptionError.message || "转写失败；录音仍保留在本机。");
      setPhase("error");
    }
  }

  async function handleFile(file) {
    if (!file) return;
    if (file.size > capabilities.maxUploadBytes) {
      setError("录音文件不能超过 25MB。");
      return;
    }
    if (!capabilities.acceptedMimeTypes.includes(file.type)) {
      setError("请上传 WAV、MP3、M4A、AAC、Ogg 或 WebM 录音。");
      return;
    }
    setPhase("saving");
    const asset = await persistAsset(file, "uploaded");
    await requestTranscription(asset);
  }

  async function connectLiveTranscription(stream) {
    let socket = null;
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      const context = new Context();
      audioContext.current = context;
      await context.audioWorklet.addModule("/audio-pcm-worklet.js");
      const source = context.createMediaStreamSource(stream);
      const node = new AudioWorkletNode(context, "cantonese-biz-pcm");
      const silent = context.createGain();
      silent.gain.value = 0;
      node.port.onmessage = (event) => {
        setAudioLevel(event.data.level || 0);
        if (socket?.readyState === WebSocket.OPEN) socket.send(event.data.pcm);
      };
      source.connect(node);
      node.connect(silent);
      silent.connect(context.destination);
      audioNode.current = node;
    } catch {
      setWarning("音量反馈初始化失败；录音仍会正常保留。");
    }
    if (!capabilities.liveSupported) return;
    try {
      socket = createLiveSpeechSocket();
      liveSocket.current = socket;
      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            type: "start",
            scope,
            sample_rate: 16_000,
            encoding: "pcm_s16le",
          }),
        );
      };
      socket.onmessage = (message) => {
        const event = JSON.parse(message.data);
        if (event.type === "interim") setInterim(event.text || "");
        if (event.type === "final" && event.sequence > finalSequence.current) {
          finalSequence.current = event.sequence;
          finalTranscript.current = `${finalTranscript.current} ${event.text || ""}`.trim();
          setTranscriptPreview(finalTranscript.current);
          setInterim("");
        }
        if (event.type === "complete") {
          liveComplete.current = true;
          finalTranscript.current = event.transcript || finalTranscript.current;
          offerTranscript(finalTranscript.current);
          setPhase("ready");
          socket.close();
        }
        if (event.type === "error") {
          liveComplete.current = false;
          setWarning(`${event.message || "实时字幕中断"}；停止后会尝试文件转写。`);
        }
      };
      socket.onerror = () => {
        liveComplete.current = false;
        setWarning("实时字幕连接失败；录音仍会保留并在停止后转写。");
      };
    } catch {
      setWarning("实时字幕连接失败；录音仍会保留并在停止后转写。");
    }
  }

  async function startRecording() {
    setError("");
    setWarning("");
    setInterim("");
    setTranscriptPreview("");
    setPendingTranscript("");
    finalTranscript.current = "";
    finalSequence.current = 0;
    liveComplete.current = false;
    setAudioLevel(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.current = stream;
      const mimeType = preferredRecordingType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorder.current = recorder;
      recordingChunks.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) recordingChunks.current.push(event.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(recordingChunks.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const durationMs = Date.now() - recordingStartedAt.current;
        const asset = await persistAsset(blob, "recorded", durationMs);
        window.setTimeout(() => {
          if (liveComplete.current && finalTranscript.current) {
            offerTranscript(finalTranscript.current);
            setPhase("ready");
          } else {
            requestTranscription(asset);
          }
        }, capabilities.liveSupported ? 1200 : 0);
      };
      recorder.start(500);
      recordingStartedAt.current = Date.now();
      setElapsedMs(0);
      setPhase("recording");
      connectLiveTranscription(stream);
      recordingTimer.current = window.setInterval(() => {
        const elapsed = Date.now() - recordingStartedAt.current;
        setElapsedMs(elapsed);
        if (elapsed >= capabilities.recordingLimitsMs[scope]) stopRecording();
      }, 250);
    } catch (permissionError) {
      setPhase("error");
      setError(
        permissionError?.name === "NotAllowedError"
          ? "麦克风权限被拒绝；仍可上传录音或使用键盘。"
          : "此浏览器暂时无法开始录音；仍可上传录音或使用键盘。",
      );
    }
  }

  function stopRecording() {
    if (mediaRecorder.current?.state === "recording") mediaRecorder.current.stop();
    window.clearInterval(recordingTimer.current);
    liveSocket.current?.readyState === WebSocket.OPEN &&
      liveSocket.current.send(JSON.stringify({ type: "finish" }));
    audioNode.current?.disconnect();
    audioContext.current?.close();
    mediaStream.current?.getTracks().forEach((track) => track.stop());
    setAudioLevel(0);
    setPhase("saving");
  }

  const microphoneSupported = Boolean(
    window.isSecureContext &&
      navigator.mediaDevices?.getUserMedia &&
      globalThis.MediaRecorder,
  );
  const overLimit = value.length > maxLength;

  return (
    <div className={`utterance-input utterance-input--${phase}`}>
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={phase === "recording" ? undefined : maxLength}
        rows={rows}
        placeholder={placeholder}
        readOnly={phase === "recording"}
        disabled={disabled}
      />
      <div className="voice-toolbar" aria-label="语音输入工具">
        {microphoneSupported && (
          <button
            type="button"
            className={phase === "recording" ? "is-recording" : ""}
            onClick={() =>
              phase === "recording" ? stopRecording() : withConsent(startRecording)
            }
            disabled={disabled || ["saving", "transcribing"].includes(phase)}
          >
            {phase === "recording" ? <MicrophoneSlash weight="fill" /> : <Microphone weight="fill" />}
            {phase === "recording" ? `停止 ${Math.floor(elapsedMs / 1000)}s` : "语音输入"}
          </button>
        )}
        <button
          type="button"
          onClick={() => withConsent(() => fileInput.current?.click())}
          disabled={disabled || ["saving", "transcribing", "recording"].includes(phase)}
        >
          <UploadSimple weight="bold" /> 上传录音
        </button>
        <button type="button" onClick={() => setShowLibrary((visible) => !visible)}>
          <Waveform weight="duotone" /> 本机录音 {assets.length ? `(${assets.length})` : ""}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept={capabilities.acceptedMimeTypes.join(",")}
          hidden
          onChange={(event) => {
            handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>

      {(phase === "recording" || interim || transcriptPreview) && (
        <div className="voice-live" aria-live="polite">
          <span><i /> {phase === "recording" ? "港话通实时转写" : "港话通语音转写"}</span>
          {phase === "recording" && (
            <span className="voice-level" aria-label="麦克风音量">
              <i style={{ transform: `scaleX(${Math.max(0.04, audioLevel)})` }} />
            </span>
          )}
          <strong>{[transcriptPreview, interim].filter(Boolean).join(" ") || "正在聆听…"}</strong>
        </div>
      )}
      {phase === "transcribing" && <p className="voice-status"><i /> 港话通正在转写录音…</p>}
      {pendingTranscript && (
        <div className="voice-merge">
          <strong>文字区已有内容，如何采用这段转写？</strong>
          <p>{pendingTranscript}</p>
          <div>
            <button type="button" onClick={() => { onChange(`${value.trim()} ${pendingTranscript}`.trim()); setPendingTranscript(""); }}>
              追加
            </button>
            <button type="button" onClick={() => { onChange(pendingTranscript); setPendingTranscript(""); }}>
              替换
            </button>
            <button type="button" onClick={() => setPendingTranscript("")}>保留原文</button>
          </div>
        </div>
      )}
      {overLimit && <p className="voice-error">转写超过 {maxLength} 字，请缩短后再提交；系统没有静默截断。</p>}
      {error && <p className="voice-error">{error}</p>}
      {warning && <p className="voice-warning">{warning}</p>}

      {showConsent && (
        <div className="voice-consent" role="alertdialog" aria-labelledby={`${id}-voice-consent`}>
          <button type="button" className="voice-consent__close" onClick={() => setShowConsent(false)} aria-label="关闭">
            <X weight="bold" />
          </button>
          <strong id={`${id}-voice-consent`}>录音与隐私说明</strong>
          <p>音频会保存在此浏览器最多 30 天或最近 20 条，并发送至港话通进行转写；后端不长期保存。现实情境音频会在文字脱敏之前发送。</p>
          <button type="button" className="voice-consent__accept" onClick={acceptConsent}>
            <Check weight="bold" /> 我明白，继续
          </button>
        </div>
      )}

      {showLibrary && (
        <section className="voice-library" aria-label="本机录音库">
          <header>
            <div>
              <strong>本机录音</strong>
              <small>只存此浏览器 · 最多 20 条 · 30 天自动清理</small>
            </div>
            {assets.length > 0 && (
              <button type="button" onClick={async () => { await clearAudioAssets(); await refreshLibrary(); }}>
                全部清空
              </button>
            )}
          </header>
          {assets.length ? assets.map((asset) => (
            <RecordingRow
              key={asset.id}
              asset={asset}
              onTranscribe={requestTranscription}
              onDelete={async (assetId) => { await deleteAudioAsset(assetId); await refreshLibrary(); }}
            />
          )) : <p>还没有本机录音。</p>}
        </section>
      )}
    </div>
  );
}
