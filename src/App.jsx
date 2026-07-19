import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowCounterClockwise,
  Brain,
  Briefcase,
  CheckCircle,
  Cloud,
  CloudSlash,
  Handshake,
  Headphones,
  Sparkle,
  SpeakerHigh,
  UserFocus,
  X,
} from "@phosphor-icons/react";
import { getScene, initialStatus, scenes } from "./data/scenes.js";
import { requestAiTurn } from "./services/gameApi.js";

const statusMeta = {
  trust: { label: "信任", Icon: Handshake },
  professionalism: { label: "专业度", Icon: Briefcase },
  language: { label: "粤语自然度", Icon: SpeakerHigh },
  culture: { label: "文化适配", Icon: UserFocus },
};

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function applyDelta(status, delta) {
  return Object.fromEntries(
    Object.entries(status).map(([key, value]) => [
      key,
      clamp(value + (delta?.[key] ?? 0)),
    ]),
  );
}

function ScorePill({ name, value, compact = false }) {
  const meta = statusMeta[name];
  const Icon = meta.Icon;
  return (
    <div className={`score-pill ${compact ? "score-pill--compact" : ""}`}>
      <Icon aria-hidden="true" weight="duotone" />
      <span>{meta.label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ModeToggle({ mode, onChange }) {
  const isAi = mode === "ai";
  return (
    <button
      className="mode-toggle"
      type="button"
      onClick={() => onChange(isAi ? "story" : "ai")}
      aria-label={`当前为${isAi ? "AI 即兴" : "标准剧情"}模式，点击切换`}
    >
      {isAi ? <Cloud weight="duotone" /> : <CloudSlash weight="duotone" />}
      <span>{isAi ? "AI 即兴" : "标准剧情"}</span>
      <i aria-hidden="true" />
    </button>
  );
}

function IntroModal({ onStart }) {
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <section className="intro-modal">
        <div className="intro-kicker">CANTONESEBIZ // CASE 01</div>
        <h1 id="intro-title">唔係背生词，<br />係学识点样倾。</h1>
        <p>
          你刚加入一家香港咨询公司。三次职场对话，将决定客户是否愿意把项目交给你。
        </p>
        <div className="intro-rule">
          <Brain weight="duotone" aria-hidden="true" />
          <span>AI 分析语境与关系后果；剧情控制始终由规则引擎掌握。</span>
        </div>
        <button className="primary-cta" type="button" onClick={onStart}>
          进入中环初会 <ArrowRight weight="bold" aria-hidden="true" />
        </button>
        <small>约 3 分钟 · 支持完全离线演示</small>
      </section>
    </div>
  );
}

function Ending({ status, history, onRestart }) {
  const average = Math.round(
    Object.values(status).reduce((sum, value) => sum + value, 0) /
      Object.values(status).length,
  );
  const ending =
    average >= 70
      ? {
          grade: "S",
          title: "合作敲定",
          copy: "你没有靠讨好换取信任，而是用清晰、可验证的行动让对方放心。",
        }
      : average >= 58
        ? {
            grade: "A",
            title: "进入下一轮",
            copy: "你的表达基本稳妥，但在回应隐含顾虑时仍可以更主动、更具体。",
          }
        : {
            grade: "B",
            title: "关系待修复",
            copy: "语言没有错，语境却没有接住。客户仍需要更多确定感。",
          };

  return (
    <div className="ending-layer">
      <section className="ending-card" aria-labelledby="ending-title">
        <div className="ending-grade">{ending.grade}</div>
        <div>
          <div className="intro-kicker">CASE COMPLETE</div>
          <h2 id="ending-title">{ending.title}</h2>
          <p>{ending.copy}</p>
        </div>
        <div className="ending-scores">
          {Object.entries(status).map(([name, value]) => (
            <ScorePill key={name} name={name} value={value} compact />
          ))}
        </div>
        <div className="learning-report">
          <div>
            <CheckCircle weight="fill" aria-hidden="true" />
            <strong>本局学习画像</strong>
          </div>
          <ul>
            {history.map((item) => (
              <li key={item.sceneId}>{item.learningPoint}</li>
            ))}
          </ul>
        </div>
        <button className="primary-cta" type="button" onClick={onRestart}>
          <ArrowCounterClockwise weight="bold" aria-hidden="true" /> 再演练一次
        </button>
      </section>
    </div>
  );
}

export function App() {
  const demoMode = new URLSearchParams(window.location.search).has("demo");
  const [started, setStarted] = useState(demoMode);
  const [sceneId, setSceneId] = useState(scenes[0].id);
  const [status, setStatus] = useState(initialStatus);
  const [mode, setMode] = useState("story");
  const [selected, setSelected] = useState(null);
  const [resolvedTurn, setResolvedTurn] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const timeoutRef = useRef(null);

  const scene = useMemo(() => getScene(sceneId), [sceneId]);
  const activeLine = resolvedTurn?.npcLineYue ?? scene.npcLineYue;
  const activeTranslation =
    resolvedTurn?.npcLineZh ?? scene.npcLineZh;

  useEffect(() => {
    return () => window.clearTimeout(timeoutRef.current);
  }, []);

  async function chooseOption(option) {
    if (selected || isLoading) return;
    setSelected(option.id);
    setIsLoading(true);
    setLiveMessage("正在分析你的语境选择");

    const baseResult = {
      npcLineYue: option.responseYue,
      npcLineZh: option.responseZh,
      coachFeedback: option.feedback,
      delta: option.delta,
    };

    let result = baseResult;
    let provider = "story";
    if (mode === "ai") {
      const response = await requestAiTurn({
        scene,
        option,
        status,
        fallback: baseResult,
      });
      result = response.turn;
      provider = response.provider;
    } else {
      await new Promise((resolve) => {
        timeoutRef.current = window.setTimeout(resolve, 320);
      });
    }

    const nextStatus = applyDelta(status, result.delta);
    setStatus(nextStatus);
    setResolvedTurn({ ...result, provider });
    setHistory((items) => [
      ...items,
      {
        sceneId: scene.id,
        choice: option.text,
        learningPoint: option.learningPoint,
      },
    ]);
    setIsLoading(false);
    setLiveMessage(
      provider === "deepseek"
        ? "AI 即兴点评已生成"
        : provider === "fallback"
          ? "网络不可用，已无缝切换标准剧情"
          : "选择结果已生成",
    );
  }

  function continueStory() {
    if (!selected) return;
    if (!scene.nextSceneId) {
      setIsEnded(true);
      return;
    }
    setSceneId(scene.nextSceneId);
    setSelected(null);
    setResolvedTurn(null);
    setShowGlossary(false);
    setLiveMessage("进入下一幕");
  }

  function restart() {
    setSceneId(scenes[0].id);
    setStatus(initialStatus);
    setSelected(null);
    setResolvedTurn(null);
    setHistory([]);
    setIsEnded(false);
    setStarted(true);
    setShowGlossary(false);
    setLiveMessage("演练已重新开始");
  }

  function speakLine() {
    if (!("speechSynthesis" in window)) {
      setLiveMessage("此浏览器没有可用语音引擎");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(activeLine);
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find((item) => item.lang.toLowerCase().includes("zh-hk")) ??
      voices.find((item) => item.lang.toLowerCase().includes("yue"));
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? "zh-HK";
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
    setLiveMessage("正在播放粤语台词");
  }

  return (
    <main
      className="game-shell"
      style={{ "--scene-image": `url("${scene.background}")` }}
    >
      <div className="scene-image" role="img" aria-label={scene.imageAlt} />
      <div className="scene-shade" />

      <header className="topbar">
        <div className="brand-block">
          <div className="brand">粤商通</div>
          <span aria-hidden="true" />
          <div>
            <strong>{scene.chapter}</strong>
            <small>{scene.location}</small>
          </div>
        </div>
        <div className="topbar-actions">
          <button
            className="icon-button"
            type="button"
            onClick={speakLine}
            aria-label="播放当前粤语台词"
          >
            <Headphones weight="duotone" />
          </button>
          <ModeToggle mode={mode} onChange={setMode} />
        </div>
      </header>

      <aside className="score-board" aria-label="玩家当前状态">
        {Object.entries(status).map(([name, value]) => (
          <ScorePill key={name} name={name} value={value} />
        ))}
      </aside>

      <section className="dialogue-console" aria-live="polite">
        <div className="speaker-row">
          <div>
            <span className="speaker-name">{scene.speaker}</span>
            <span className="speaker-role">{scene.role}</span>
          </div>
          <button
            className="text-button"
            type="button"
            onClick={() => setShowGlossary((value) => !value)}
          >
            <Sparkle weight="fill" /> 术语提示
          </button>
        </div>

        <div className="line-block">
          <p className="cantonese-line">「{activeLine}」</p>
          <p className="translation">{activeTranslation}</p>
        </div>

        {showGlossary && (
          <div className="glossary-panel">
            <div>
              <Sparkle weight="fill" aria-hidden="true" />
              <strong>{scene.glossary.term}</strong>
            </div>
            <p>{scene.glossary.explanation}</p>
            <button type="button" onClick={() => setShowGlossary(false)} aria-label="关闭术语提示">
              <X />
            </button>
          </div>
        )}

        <div className={`coach-strip ${resolvedTurn ? "coach-strip--resolved" : ""}`}>
          <Brain weight="duotone" aria-hidden="true" />
          <strong>{resolvedTurn ? "教练复盘" : "教练提示"}</strong>
          <span>{resolvedTurn?.coachFeedback ?? scene.coachHint}</span>
          {resolvedTurn?.provider === "deepseek" && <em>DeepSeek</em>}
          {resolvedTurn?.provider === "fallback" && <em>已降级</em>}
        </div>

        <div className="choice-stack">
          {scene.options.map((option, index) => (
            <button
              key={option.id}
              type="button"
              className={[
                "choice-button",
                selected === option.id ? "choice-button--selected" : "",
                selected && selected !== option.id ? "choice-button--muted" : "",
              ].join(" ")}
              onClick={() => chooseOption(option)}
              disabled={Boolean(selected) || isLoading}
            >
              <span>{String.fromCharCode(65 + index)}</span>
              <strong>{option.text}</strong>
              <ArrowRight weight="bold" aria-hidden="true" />
            </button>
          ))}
        </div>

        {selected && !isLoading && (
          <button className="continue-button" type="button" onClick={continueStory}>
            {scene.nextSceneId ? "进入下一幕" : "查看学习报告"}
            <ArrowRight weight="bold" />
          </button>
        )}
        {isLoading && (
          <div className="loading-row">
            <i /> 正在推演对方的真实反应…
          </div>
        )}
      </section>

      <div className="progress-rail" aria-label={`当前第 ${scene.stage} 幕，共 ${scenes.length} 幕`}>
        {scenes.map((item) => (
          <span
            key={item.id}
            className={item.stage <= scene.stage ? "is-active" : ""}
          />
        ))}
      </div>

      <p className="sr-only" aria-live="polite">{liveMessage}</p>
      {!started && <IntroModal onStart={() => setStarted(true)} />}
      {isEnded && <Ending status={status} history={history} onRestart={restart} />}
    </main>
  );
}
