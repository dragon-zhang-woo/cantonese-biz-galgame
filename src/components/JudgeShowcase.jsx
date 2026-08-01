import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle,
  FilmStrip,
  House,
  ShieldCheck,
  Target,
} from "@phosphor-icons/react";
import {
  judgeShowcaseSteps,
  showcaseLearningReport,
} from "../data/judgeShowcase.js";
import { getScene } from "../data/scenes.js";
import { getCinematic } from "../data/storyAssets.js";

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

export function JudgeShowcase({ onClose, onEnterCampaign }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const step = judgeShowcaseSteps[stepIndex];
  const scene = useMemo(() => getScene(step.sceneId), [step.sceneId]);
  const cinematic = useMemo(() => getCinematic(step.sceneId), [step.sceneId]);
  const selected = scene.options.find((option) => option.id === selectedId);
  const isCrisis = step.id === "crisis-choice";
  const isFinal = stepIndex === judgeShowcaseSteps.length - 1;
  const image =
    isCrisis && selectedId === "verify-and-repair"
      ? step.positiveAsset
      : cinematic.establishing.image;
  const imageAlt =
    isCrisis && selectedId === "verify-and-repair"
      ? step.positiveAssetAlt
      : cinematic.establishing.imageAlt;

  function next() {
    if (isCrisis && !selectedId) return;
    setStepIndex((index) => Math.min(index + 1, judgeShowcaseSteps.length - 1));
    setSelectedId(null);
  }

  return (
    <div className="showcase-layer" role="dialog" aria-modal="true" aria-labelledby="showcase-title">
      <section className="showcase-shell">
        <header>
          <div>
            <span>90-SECOND JUDGE SHOWCASE</span>
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

        <div className="showcase-progress" aria-label={`当前第 ${stepIndex + 1} 段，共 3 段`}>
          {judgeShowcaseSteps.map((item, index) => (
            <span key={item.id} className={index <= stepIndex ? "is-active" : ""} />
          ))}
        </div>

        <div className="showcase-stage">
          <img src={image} alt={imageAlt} />
          <i aria-hidden="true" />
          <div className="showcase-copy">
            <span>{step.label} · ACT {String(scene.stage).padStart(2, "0")}</span>
            <h2 id="showcase-title">{step.title}</h2>
            <p>{step.copy}</p>
            <div className="showcase-boundary">
              <ShieldCheck weight="duotone" />
              <strong>本导览零网络、零存档写入；完整主线仍保持五幕固定故事图。</strong>
            </div>
          </div>
        </div>

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
                  <button key={option.id} type="button" onClick={() => setSelectedId(option.id)}>
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
          {!isFinal ? (
            <button className="primary-cta" type="button" onClick={next} disabled={isCrisis && !selectedId}>
              {isCrisis ? "继续看范围收口" : "进入危机抉择"}<ArrowRight weight="bold" />
            </button>
          ) : (
            <button className="primary-cta" type="button" onClick={onEnterCampaign}>
              进入完整五幕主线<ArrowRight weight="bold" />
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
