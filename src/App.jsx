import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowCounterClockwise,
  Brain,
  Briefcase,
  CaretLeft,
  CaretRight,
  CheckCircle,
  Cloud,
  CloudSlash,
  FilmStrip,
  Handshake,
  Headphones,
  IdentificationCard,
  PaperPlaneTilt,
  Sparkle,
  SpeakerHigh,
  UserFocus,
  X,
} from "@phosphor-icons/react";
import { getScene, initialStatus, scenes } from "./data/scenes.js";
import {
  characterDossiers,
  getCinematic,
} from "./data/storyAssets.js";
import {
  buildCustomOption,
  canSubmitFreeResponse,
  FREE_RESPONSE_MAX_LENGTH,
} from "./services/freeResponse.js";
import { requestAiTurn } from "./services/gameApi.js";
import {
  clearSession,
  hasMeaningfulProgress,
  readSession,
  writeSession,
} from "./services/sessionStore.js";

const statusMeta = {
  trust: { label: "信任", Icon: Handshake },
  professionalism: { label: "专业度", Icon: Briefcase },
  language: { label: "粤语自然度", Icon: SpeakerHigh },
  culture: { label: "文化适配", Icon: UserFocus },
};

const localizationMeta = [
  ["naturalness", "自然度"],
  ["politeness", "礼貌度"],
  ["businessFit", "商务适配"],
];

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

function providerLabel(provider) {
  const labels = {
    "deepseek+hkchat": "DeepSeek + 港话通",
    "deepseek+fallback": "DeepSeek + 本地纠偏",
    "fallback+hkchat": "标准剧情 + 港话通",
    fallback: "离线保底",
    story: "标准剧情",
  };
  return labels[provider] ?? provider;
}

function buildLocalFeedback(option) {
  const toScore = (value) => Math.max(0, Math.min(10, 5 + Math.round(value / 2)));
  return {
    naturalness: toScore(option.delta.language),
    politeness: toScore(option.delta.culture),
    businessFit: toScore(option.delta.professionalism),
    hkRewrite: option.text,
    comment: option.feedback,
    source: "fallback",
  };
}

function LocalizationReview({ feedback }) {
  return (
    <section className="localization-review" aria-label="香港商务语境评分">
      <div className="localization-scores">
        {localizationMeta.map(([key, label]) => (
          <div key={key}>
            <span>{label}</span>
            <strong>{feedback[key]}</strong>
            <i aria-hidden="true">
              <b style={{ width: `${feedback[key] * 10}%` }} />
            </i>
          </div>
        ))}
      </div>
      <div className="rewrite-row">
        <span>更港式的讲法</span>
        <strong>{feedback.hkRewrite}</strong>
      </div>
      <p>{feedback.comment}</p>
    </section>
  );
}

function ActPrelude({ cinematic, stage, onEnter }) {
  const shot = cinematic.establishing;
  return (
    <div
      className="cinematic-layer cinematic-layer--prelude"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prelude-title"
      style={{ "--cinematic-image": `url("${shot.image}")` }}
    >
      <div className="cinematic-backdrop" role="img" aria-label={shot.imageAlt} />
      <div className="cinematic-vignette" />
      <section className="prelude-card">
        <div className="cinematic-index">ACT {String(stage).padStart(2, "0")} / 05</div>
        <span>{shot.eyebrow}</span>
        <h2 id="prelude-title">{shot.title}</h2>
        <p>{shot.copy}</p>
        <button className="primary-cta prelude-cta" type="button" onClick={onEnter}>
          进入现场
          <ArrowRight weight="bold" aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}

function CharacterDossier({ activeIndex, onChange, onClose }) {
  const character = characterDossiers[activeIndex];
  return (
    <div className="dossier-layer" role="dialog" aria-modal="true" aria-labelledby="dossier-title">
      <section className="dossier-shell">
        <header>
          <div>
            <span>RELATIONSHIP INTELLIGENCE</span>
            <h2 id="dossier-title">人物档案</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭人物档案">
            <X weight="bold" />
          </button>
        </header>
        <div className="dossier-tabs" role="tablist" aria-label="选择人物">
          {characterDossiers.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={activeIndex === index}
              className={activeIndex === index ? "is-active" : ""}
              onClick={() => onChange(index)}
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className="dossier-content">
          <figure>
            <img src={character.anchor} alt={character.imageAlt} />
          </figure>
          <div className="dossier-copy">
            <span>{character.acts}</span>
            <h3>{character.name}</h3>
            <strong>{character.role}</strong>
            <p>{character.profile}</p>
            <div>
              <Sparkle weight="fill" aria-hidden="true" />
              <p><b>关系信号</b>{character.signal}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function reactionFrameFor(reaction, delta) {
  const score =
    (delta?.trust ?? 0) +
    (delta?.professionalism ?? 0) +
    (delta?.culture ?? 0);
  if (score >= 5) return reaction.positiveFrame;
  if (score < 0) return reaction.negativeFrame;
  return reaction.neutralFrame;
}

function ReactionFrame({ reaction, frame }) {
  return (
    <div className="reaction-frame">
      <img src={reaction.image} alt={reaction.imageAlt} />
      <span>本轮反应 · {frame + 1}/{reaction.frames}</span>
    </div>
  );
}

function Aftermath({
  scene,
  cinematic,
  resolvedTurn,
  index,
  onIndexChange,
  onAdvance,
  onClose,
}) {
  const items = [
    {
      id: "reaction",
      type: "reaction",
      title: `${scene.speaker}的即时反应`,
      copy: resolvedTurn.npcLineZh,
    },
    ...cinematic.inserts.map((insert, insertIndex) => ({
      ...insert,
      id: `insert-${insertIndex}`,
      type: "insert",
    })),
  ];
  const item = items[index];
  const isLast = index === items.length - 1;
  const frame = reactionFrameFor(cinematic.reaction, resolvedTurn.delta);

  return (
    <div className="aftermath-layer" role="dialog" aria-modal="true" aria-labelledby="aftermath-title">
      <section className="aftermath-shell">
        <header>
          <div>
            <span>现场后果 · {index + 1}/{items.length}</span>
            <strong>{scene.chapter}</strong>
          </div>
          <button className="text-button" type="button" onClick={onClose}>
            返回复盘
          </button>
        </header>
        <div className="aftermath-visual">
          {item.type === "reaction" ? (
            <ReactionFrame reaction={cinematic.reaction} frame={frame} />
          ) : (
            <img src={item.image} alt={item.imageAlt} />
          )}
          <div className="aftermath-gradient" />
          <div className="aftermath-caption">
            <span>{item.type === "reaction" ? "RELATION SHIFT" : "STORY EVIDENCE"}</span>
            <h2 id="aftermath-title">{item.title}</h2>
            <p>{item.copy}</p>
            {item.type === "reaction" && (
              <blockquote>「{resolvedTurn.npcLineYue}」</blockquote>
            )}
          </div>
        </div>
        <footer>
          <button
            className="aftermath-nav"
            type="button"
            onClick={() => onIndexChange(index - 1)}
            disabled={index === 0}
          >
            <CaretLeft weight="bold" /> 上一镜
          </button>
          <div className="aftermath-dots" aria-label={`当前第 ${index + 1} 个镜头，共 ${items.length} 个`}>
            {items.map((entry, dotIndex) => (
              <button
                key={entry.id}
                type="button"
                className={dotIndex === index ? "is-active" : ""}
                onClick={() => onIndexChange(dotIndex)}
                aria-label={`查看第 ${dotIndex + 1} 个镜头`}
              />
            ))}
          </div>
          {isLast ? (
            <button className="aftermath-nav aftermath-nav--primary" type="button" onClick={onAdvance}>
              {scene.nextSceneId ? "进入下一幕" : "查看学习报告"}
              <ArrowRight weight="bold" />
            </button>
          ) : (
            <button
              className="aftermath-nav aftermath-nav--primary"
              type="button"
              onClick={() => onIndexChange(index + 1)}
            >
              下一镜 <CaretRight weight="bold" />
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}

function IntroModal({ onStart, onRestart, resumeStage }) {
  const canResume = Boolean(resumeStage);
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <section className="intro-modal">
        <div className="intro-kicker">CANTONESEBIZ // CASE 01</div>
        <h1 id="intro-title">唔係背生词，<br />係学识点样倾。</h1>
        <p>
          你刚加入一家香港咨询公司。五次职场对话，将决定客户是否愿意把项目交给你。
        </p>
        <div className="intro-rule">
          <Brain weight="duotone" aria-hidden="true" />
          <span>AI 分析语境与关系后果；剧情控制始终由规则引擎掌握。</span>
        </div>
        <button className="primary-cta" type="button" onClick={onStart}>
          {canResume ? `继续第 ${resumeStage} 幕` : "从金钟入职"}
          <ArrowRight weight="bold" aria-hidden="true" />
        </button>
        {canResume && (
          <button className="secondary-cta" type="button" onClick={onRestart}>
            重新开始本次演练
          </button>
        )}
        <small>
          {canResume
            ? "进度仅保存在本机；不会保存 API 密钥或你的自由作答原文"
            : "约 5 分钟 · 支持完全离线演示"}
        </small>
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
  const savedSessionRef = useRef(demoMode ? null : readSession());
  const savedSession = savedSessionRef.current;
  const [started, setStarted] = useState(demoMode);
  const [sceneId, setSceneId] = useState(savedSession?.sceneId ?? scenes[0].id);
  const [status, setStatus] = useState(savedSession?.status ?? initialStatus);
  const [mode, setMode] = useState(savedSession?.mode ?? "story");
  const [selected, setSelected] = useState(null);
  const [resolvedTurn, setResolvedTurn] = useState(null);
  const [history, setHistory] = useState(savedSession?.history ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnded, setIsEnded] = useState(savedSession?.isEnded ?? false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const [freeText, setFreeText] = useState("");
  const [submittedText, setSubmittedText] = useState("");
  const [showPrelude, setShowPrelude] = useState(false);
  const [showDossiers, setShowDossiers] = useState(false);
  const [dossierIndex, setDossierIndex] = useState(0);
  const [showAftermath, setShowAftermath] = useState(false);
  const [aftermathIndex, setAftermathIndex] = useState(0);
  const [resumeAvailable, setResumeAvailable] = useState(
    hasMeaningfulProgress(savedSession),
  );
  const timeoutRef = useRef(null);

  const scene = useMemo(() => getScene(sceneId), [sceneId]);
  const cinematic = useMemo(() => getCinematic(sceneId), [sceneId]);
  const activeLine = resolvedTurn?.npcLineYue ?? scene.npcLineYue;
  const activeTranslation =
    resolvedTurn?.npcLineZh ?? scene.npcLineZh;
  const hasBlockingLayer =
    !started || showPrelude || showDossiers || showAftermath || isEnded;

  useEffect(() => {
    return () => window.clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = hasBlockingLayer ? "hidden" : previousOverflow;
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [hasBlockingLayer]);

  useEffect(() => {
    if (demoMode || !started || isLoading || (selected && !isEnded)) return;
    writeSession({ sceneId, status, history, mode, isEnded });
    setResumeAvailable(
      hasMeaningfulProgress({ sceneId, status, history, mode, isEnded }),
    );
  }, [demoMode, history, isEnded, isLoading, mode, sceneId, selected, started, status]);

  async function chooseOption(option) {
    if (selected || isLoading) return;
    setSelected(option.id);
    setSubmittedText(option.isCustom ? option.text : "");
    setIsLoading(true);
    setLiveMessage("正在分析你的语境选择");

    const baseResult = {
      npcLineYue: option.responseYue,
      npcLineZh: option.responseZh,
      coachFeedback: option.feedback,
      delta: option.delta,
      localization: buildLocalFeedback(option),
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
        learningPoint: option.isCustom
          ? result.coachFeedback
          : option.learningPoint,
      },
    ]);
    setIsLoading(false);
    setLiveMessage(
      provider === "deepseek+hkchat"
        ? "双模型剧情与港式纠偏已生成"
        : provider.includes("fallback")
          ? "部分服务不可用，已启用可靠降级"
          : "选择结果已生成",
    );
  }

  function submitFreeResponse(event) {
    event.preventDefault();
    if (!canSubmitFreeResponse(freeText) || selected || isLoading) return;
    chooseOption(buildCustomOption(scene, freeText));
  }

  function advanceStory() {
    if (!selected) return;
    setShowAftermath(false);
    setAftermathIndex(0);
    if (!scene.nextSceneId) {
      setIsEnded(true);
      return;
    }
    setSceneId(scene.nextSceneId);
    setSelected(null);
    setResolvedTurn(null);
    setFreeText("");
    setSubmittedText("");
    setShowGlossary(false);
    setShowPrelude(true);
    setLiveMessage("进入下一幕");
  }

  function restart() {
    clearSession();
    savedSessionRef.current = null;
    setSceneId(scenes[0].id);
    setStatus(initialStatus);
    setSelected(null);
    setResolvedTurn(null);
    setHistory([]);
    setMode("story");
    setIsEnded(false);
    setStarted(true);
    setShowGlossary(false);
    setFreeText("");
    setSubmittedText("");
    setShowPrelude(true);
    setShowDossiers(false);
    setShowAftermath(false);
    setAftermathIndex(0);
    setResumeAvailable(false);
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
            onClick={() => setShowDossiers(true)}
            aria-label="查看人物档案"
            title="人物档案"
          >
            <IdentificationCard weight="duotone" />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={speakLine}
            aria-label="播放当前粤语台词"
          >
            <Headphones weight="duotone" />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={restart}
            aria-label="重新开始演练"
            title="重新开始"
          >
            <ArrowCounterClockwise weight="duotone" />
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
          {resolvedTurn?.provider && <em>{providerLabel(resolvedTurn.provider)}</em>}
        </div>

        {resolvedTurn?.localization && (
          <LocalizationReview feedback={resolvedTurn.localization} />
        )}

        {submittedText && (
          <div className="player-utterance">
            <span>你刚才讲</span>
            <strong>{submittedText}</strong>
          </div>
        )}

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

        {mode === "ai" && !selected && (
          <>
            <div className="free-response-divider">
              <span>或者由你自己讲</span>
            </div>
            <form className="free-response-form" onSubmit={submitFreeResponse}>
              <label htmlFor="free-response">自由回应客户</label>
              <div className="free-response-field">
                <textarea
                  id="free-response"
                  value={freeText}
                  onChange={(event) => setFreeText(event.target.value)}
                  maxLength={FREE_RESPONSE_MAX_LENGTH}
                  rows="2"
                  placeholder="用粤语、普通话或中英夹杂回答…"
                />
                <button
                  type="submit"
                  disabled={!canSubmitFreeResponse(freeText) || isLoading}
                >
                  <PaperPlaneTilt weight="fill" aria-hidden="true" />
                  让双模型回应
                </button>
              </div>
              <div className="free-response-meta">
                <span>DeepSeek 推演后果 · 港话通纠正港式表达</span>
                <output>{freeText.length}/{FREE_RESPONSE_MAX_LENGTH}</output>
              </div>
            </form>
          </>
        )}

        {selected && !isLoading && (
          <button
            className="continue-button"
            type="button"
            onClick={() => {
              setAftermathIndex(0);
              setShowAftermath(true);
            }}
          >
            <FilmStrip weight="fill" />
            查看现场后果
          </button>
        )}
        {isLoading && (
          <div className="loading-row">
            <i /> DeepSeek 推演角色反应，港话通检查港式表达…
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
      {!started && (
        <IntroModal
          onStart={() => {
            setStarted(true);
            setShowPrelude(true);
          }}
          onRestart={restart}
          resumeStage={resumeAvailable ? scene.stage : null}
        />
      )}
      {started && showPrelude && (
        <ActPrelude
          cinematic={cinematic}
          stage={scene.stage}
          onEnter={() => setShowPrelude(false)}
        />
      )}
      {showDossiers && (
        <CharacterDossier
          activeIndex={dossierIndex}
          onChange={setDossierIndex}
          onClose={() => setShowDossiers(false)}
        />
      )}
      {showAftermath && resolvedTurn && (
        <Aftermath
          scene={scene}
          cinematic={cinematic}
          resolvedTurn={resolvedTurn}
          index={aftermathIndex}
          onIndexChange={setAftermathIndex}
          onAdvance={advanceStory}
          onClose={() => setShowAftermath(false)}
        />
      )}
      {isEnded && <Ending status={status} history={history} onRestart={restart} />}
    </main>
  );
}
