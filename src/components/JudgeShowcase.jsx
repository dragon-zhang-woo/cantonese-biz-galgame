import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  FilmStrip,
  House,
  PencilSimpleLine,
  ShieldCheck,
  Sparkle,
  Target,
} from "@phosphor-icons/react";
import {
  judgeShowcaseSteps,
  preparedShowcaseCustomInput,
  preparedShowcasePracticeResponse,
  showcaseLearningReport,
} from "../data/judgeShowcase.js";
import { getPracticeScenario } from "../data/practiceScenarios.js";
import { getScene } from "../data/scenes.js";
import { getCinematic } from "../data/storyAssets.js";
import { sanitizeCustomDescription } from "../services/customScenario.js";
import { inferScenario } from "../services/scenarioInference.js";

const metricLabels = {
  trust: "信任",
  professionalism: "专业度",
  language: "粤语自然度",
  culture: "文化适配",
};

function DeltaComparison({ scene, selectedId }) {
  return (
    <div className="showcase-comparison" aria-label="两种选择的关系后果对比">
      {scene.options.map((option) => {
        const total = Object.values(option.delta).reduce((sum, value) => sum + value, 0);
        return (
          <div key={option.id} className={selectedId === option.id ? "is-selected" : ""}>
            <span>{option.id === "verify-and-repair" ? "承担核对" : "先划清责任"}</span>
            <strong>{total >= 0 ? `+${total}` : total} 综合变化</strong>
            <small>
              信任 {option.delta.trust >= 0 ? "+" : ""}{option.delta.trust} · 专业度 {option.delta.professionalism >= 0 ? "+" : ""}{option.delta.professionalism}
            </small>
          </div>
        );
      })}
    </div>
  );
}

function PracticeShowcase({ practice, value, onChange, revealed, onReveal }) {
  return (
    <div className="showcase-module showcase-practice">
      <div className="showcase-module__brief">
        <span><BookOpen weight="duotone" /> {practice.skill} · {practice.relation}</span>
        <strong>{practice.speaker}：「{practice.npcLineYue}」</strong>
        <p>{practice.objective}</p>
      </div>
      <div className="showcase-module__input">
        <label htmlFor="showcase-practice-response">预置演示回应（可编辑）</label>
        <textarea
          id="showcase-practice-response"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={160}
        />
        <div>
          <small>{value.length}/160 · 录屏时可直接使用</small>
          <button type="button" onClick={onReveal} disabled={!value.trim()}>
            展示离线参考反馈 <ArrowRight weight="bold" />
          </button>
        </div>
        {revealed && (
          <section className="showcase-module__feedback" aria-live="polite">
            <strong>{practice.options[0].responseYue}</strong>
            <p>{practice.options[0].learningPoint}</p>
          </section>
        )}
      </div>
    </div>
  );
}

function CustomShowcase({ value, onChange, preview, onPreview }) {
  const focusLabel = preview?.inference.focus.value === "催进度"
    ? "柔性跟进"
    : preview?.inference.focus.value;
  return (
    <div className="showcase-module showcase-custom">
      <div className="showcase-module__brief">
        <span><Sparkle weight="fill" /> 已准备的无敏感信息样例</span>
        <strong>跨部门同事催数据</strong>
        <p>可以现场改写；点击后只运行浏览器脱敏与共享规则，不请求后端或模型。</p>
      </div>
      <div className="showcase-module__input">
        <label htmlFor="showcase-custom-input"><PencilSimpleLine weight="duotone" /> 自定义现实情境</label>
        <textarea
          id="showcase-custom-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={1000}
        />
        <div>
          <small>{value.length}/1000 · 至少 20 字</small>
          <button type="button" onClick={onPreview} disabled={value.trim().length < 20}>
            生成匿名演示训练 <ArrowRight weight="bold" />
          </button>
        </div>
        {preview && (
          <section className="showcase-custom-result" aria-live="polite">
            <div><span>关系</span><strong>{preview.inference.relation.value}</strong></div>
            <div>
              <span>渠道</span><strong>{preview.inference.channel.value}</strong>
              <small>{preview.inference.channel.confidence === "low" ? "请确认" : preview.inference.channel.confidence}</small>
            </div>
            <div>
              <span>训练重点</span><strong>{focusLabel}</strong>
              {focusLabel !== preview.inference.focus.value && <small>{preview.inference.focus.value}</small>}
            </div>
            <p>浏览器脱敏 {preview.redaction.count} 项 · 原文不写入演示存档</p>
          </section>
        )}
      </div>
    </div>
  );
}

export function JudgeShowcase({ onClose, onEnterCampaign }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [practiceResponse, setPracticeResponse] = useState(preparedShowcasePracticeResponse);
  const [showPracticeFeedback, setShowPracticeFeedback] = useState(false);
  const [customDraft, setCustomDraft] = useState(preparedShowcaseCustomInput);
  const [customPreview, setCustomPreview] = useState(null);
  const step = judgeShowcaseSteps[stepIndex];
  const scene = useMemo(
    () => (step.kind === "scene" ? getScene(step.sceneId) : null),
    [step.kind, step.sceneId],
  );
  const cinematic = useMemo(
    () => (step.kind === "scene" ? getCinematic(step.sceneId) : null),
    [step.kind, step.sceneId],
  );
  const practice = useMemo(
    () => (step.kind === "practice" ? getPracticeScenario(step.practiceScenarioId) : null),
    [step.kind, step.practiceScenarioId],
  );
  const selected = scene?.options.find((option) => option.id === selectedId);
  const isPractice = step.kind === "practice";
  const isCustom = step.kind === "custom";
  const isCrisis = step.id === "crisis-choice";
  const isFinal = stepIndex === judgeShowcaseSteps.length - 1;
  const image =
    isCrisis && selectedId === "verify-and-repair"
      ? step.positiveAsset
      : practice?.background ?? step.image ?? cinematic?.establishing.image;
  const imageAlt =
    isCrisis && selectedId === "verify-and-repair"
      ? step.positiveAssetAlt
      : practice?.imageAlt ?? step.imageAlt ?? cinematic?.establishing.imageAlt;
  const canAdvance =
    (!isCrisis || Boolean(selectedId)) &&
    (!isPractice || showPracticeFeedback) &&
    (!isCustom || Boolean(customPreview));

  function next() {
    if (!canAdvance) return;
    setStepIndex((index) => Math.min(index + 1, judgeShowcaseSteps.length - 1));
    setSelectedId(null);
  }

  function previous() {
    setStepIndex((index) => Math.max(index - 1, 0));
    setSelectedId(null);
  }

  function previewCustomScenario() {
    const redaction = sanitizeCustomDescription(customDraft);
    if (redaction.text.length < 20) return;
    setCustomPreview({ redaction, inference: inferScenario(redaction.text).inference });
  }

  return (
    <div className="showcase-layer" role="dialog" aria-modal="true" aria-labelledby="showcase-title">
      <section className="showcase-shell">
        <header>
          <div>
            <span>3-MINUTE JUDGE SHOWCASE</span>
            <strong>精选导览 {stepIndex + 1}/{judgeShowcaseSteps.length}</strong>
          </div>
          <div className="showcase-header-actions">
            <button className="text-button" type="button" onClick={onEnterCampaign}>
              <FilmStrip weight="duotone" /> 进入完整主线
            </button>
            <button className="home-button overlay-home-button" type="button" onClick={onClose}>
              <House weight="duotone" /> 退出演示
            </button>
          </div>
        </header>

        <div
          className="showcase-progress"
          style={{ gridTemplateColumns: `repeat(${judgeShowcaseSteps.length}, 1fr)` }}
          aria-label={`当前第 ${stepIndex + 1} 段，共 ${judgeShowcaseSteps.length} 段`}
        >
          {judgeShowcaseSteps.map((item, index) => (
            <span key={item.id} className={index <= stepIndex ? "is-active" : ""} />
          ))}
        </div>

        <div className="showcase-stage">
          <img src={image} alt={imageAlt} />
          <i aria-hidden="true" />
          <div className="showcase-copy">
            <span>{step.label}{scene ? ` · ACT ${String(scene.stage).padStart(2, "0")}` : " · MODULE"}</span>
            <h2 id="showcase-title">{step.title}</h2>
            <p>{step.copy}</p>
            <div className="showcase-boundary">
              <ShieldCheck weight="duotone" />
              <strong>本导览只用本地演示状态：零网络、零存档写入，不改变五幕故事图。</strong>
            </div>
          </div>
        </div>

        {isPractice && (
          <PracticeShowcase
            practice={practice}
            value={practiceResponse}
            onChange={(value) => {
              setPracticeResponse(value);
              setShowPracticeFeedback(false);
            }}
            revealed={showPracticeFeedback}
            onReveal={() => setShowPracticeFeedback(true)}
          />
        )}

        {isCustom && (
          <CustomShowcase
            value={customDraft}
            onChange={(value) => {
              setCustomDraft(value);
              setCustomPreview(null);
            }}
            preview={customPreview}
            onPreview={previewCustomScenario}
          />
        )}

        {isCrisis && (
          <div className="showcase-decision">
            <div>
              <span>{scene.speaker} · {scene.role}</span>
              <strong>「{selected?.responseYue ?? scene.npcLineYue}」</strong>
              <p>{selected?.responseZh ?? scene.npcLineZh}</p>
            </div>
            {!selected ? (
              <div className="showcase-options">
                {scene.options.map((option, index) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-label={`${option.id === "verify-and-repair" ? "承担核对" : "先划清责任"}：${option.text}`}
                    onClick={() => setSelectedId(option.id)}
                  >
                    <span>{String.fromCharCode(65 + index)}</span>
                    <strong>{option.text}</strong>
                    <ArrowRight weight="bold" />
                  </button>
                ))}
              </div>
            ) : (
              <>
                <DeltaComparison scene={scene} selectedId={selectedId} />
                <div className="showcase-deltas">
                  {Object.entries(selected.delta).map(([key, value]) => (
                    <span key={key}>{metricLabels[key]} <strong>{value >= 0 ? "+" : ""}{value}</strong></span>
                  ))}
                </div>
                <p className="showcase-feedback"><Target weight="duotone" />{selected.feedback}</p>
              </>
            )}
          </div>
        )}

        {isFinal && (
          <div className="showcase-ending">
            <div>
              <span>{scene.speaker} · {scene.role}</span>
              <strong>「{scene.options[0].responseYue}」</strong>
              <p>{scene.options[0].feedback}</p>
            </div>
            <ul>
              {showcaseLearningReport.map((item) => (
                <li key={item}><CheckCircle weight="fill" />{item}</li>
              ))}
            </ul>
          </div>
        )}

        <footer>
          <span>演示选择不会改变你的主线进度</span>
          <div className="showcase-footer-actions">
            {stepIndex > 0 && (
              <button className="text-button" type="button" onClick={previous}>
                <ArrowLeft weight="bold" /> 上一段
              </button>
            )}
            {!isFinal ? (
              <button className="primary-cta" type="button" onClick={next} disabled={!canAdvance}>
                {step.nextLabel}<ArrowRight weight="bold" />
              </button>
            ) : (
              <button className="primary-cta" type="button" onClick={onEnterCampaign}>
                进入完整五幕主线<ArrowRight weight="bold" />
              </button>
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}
