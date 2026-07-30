import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle,
  Clock,
  Repeat,
  Sparkle,
  Target,
  WarningCircle,
  X,
} from "@phosphor-icons/react";

function difficultyTone(difficulty) {
  if (difficulty === "挑战") return "challenge";
  if (difficulty === "进阶") return "advanced";
  return "starter";
}

export function PracticeLibrary({
  scenarios,
  progress,
  onSelect,
  onClose,
}) {
  const completedCount = Object.keys(progress.completed).length;
  return (
    <div
      className="practice-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="practice-library-title"
    >
      <section className="practice-library">
        <header className="practice-library__header">
          <div>
            <span>PRACTICE LAB · 真实工作任务</span>
            <h2 id="practice-library-title">情境训练库</h2>
            <p>
              不是背标准答案，而是在不同关系与约束下练习可迁移的香港职场沟通。
            </p>
          </div>
          <div className="practice-library__summary" aria-label="训练进度">
            <strong>{completedCount}/{scenarios.length}</strong>
            <span>已完成</span>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="关闭情境训练库"
          >
            <X weight="bold" />
          </button>
        </header>

        <div className="practice-grid">
          {scenarios.map((scenario, index) => {
            const result = progress.completed[scenario.id];
            return (
              <button
                className="practice-card"
                key={scenario.id}
                type="button"
                onClick={() => onSelect(scenario)}
                aria-label={`开始训练：${scenario.chapter}`}
              >
                <img src={scenario.background} alt="" />
                <span className="practice-card__shade" aria-hidden="true" />
                <div className="practice-card__topline">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <i className={`difficulty difficulty--${difficultyTone(scenario.difficulty)}`}>
                    {scenario.difficulty}
                  </i>
                </div>
                <div className="practice-card__copy">
                  <small>{scenario.speaker} · {scenario.skill}</small>
                  <h3>{scenario.chapter.replace(/^情境 \d+ · /, "")}</h3>
                  <p>{scenario.objective}</p>
                  <div>
                    <span><Clock weight="fill" /> {scenario.duration}</span>
                    {result ? (
                      <strong>
                        <CheckCircle weight="fill" /> 最佳 {result.bestScore}
                      </strong>
                    ) : (
                      <strong>开始训练 <ArrowRight weight="bold" /></strong>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function PracticeBrief({ scenario, onEnter, onBack }) {
  return (
    <div
      className="practice-layer practice-layer--brief"
      role="dialog"
      aria-modal="true"
      aria-labelledby="practice-brief-title"
      style={{ "--practice-brief-image": `url("${scenario.background}")` }}
    >
      <div className="practice-brief__image" role="img" aria-label={scenario.imageAlt} />
      <div className="practice-brief__shade" />
      <section className="practice-brief">
        <button className="text-button" type="button" onClick={onBack}>
          <ArrowLeft weight="bold" /> 返回训练库
        </button>
        <span>{scenario.skill} · {scenario.difficulty} · {scenario.duration}</span>
        <h2 id="practice-brief-title">{scenario.chapter}</h2>
        <div className="practice-brief__task">
          <Target weight="duotone" aria-hidden="true" />
          <div>
            <strong>本轮任务</strong>
            <p>{scenario.objective}</p>
          </div>
        </div>
        <div className="practice-brief__risk">
          <WarningCircle weight="duotone" aria-hidden="true" />
          <div>
            <strong>隐藏关系风险</strong>
            <p>{scenario.hiddenRisk}</p>
          </div>
        </div>
        <button className="primary-cta" type="button" onClick={onEnter}>
          进入现场 <ArrowRight weight="bold" />
        </button>
      </section>
    </div>
  );
}

export function PracticeResult({
  scenario,
  turn,
  score,
  onRetry,
  onLibrary,
}) {
  return (
    <div
      className="practice-layer practice-layer--result"
      role="dialog"
      aria-modal="true"
      aria-labelledby="practice-result-title"
    >
      <section className="practice-result">
        <header>
          <div>
            <span>PRACTICE COMPLETE</span>
            <h2 id="practice-result-title">{scenario.skill}复盘</h2>
          </div>
          <div className="practice-result__score" aria-label={`本轮表现 ${score} 分`}>
            <strong>{score}</strong>
            <span>/ 100</span>
          </div>
        </header>

        <div className="practice-result__body">
          <section>
            <div className="practice-result__eyebrow">
              <Brain weight="duotone" />
              双模型反馈
            </div>
            <p className="practice-result__feedback">{turn.coachFeedback}</p>
            <div className="practice-result__rewrite">
              <span>更港式的讲法</span>
              <strong>{turn.localization.hkRewrite}</strong>
              <p>{turn.localization.comment}</p>
            </div>
          </section>

          <aside>
            <div className="practice-result__eyebrow">
              <Sparkle weight="fill" />
              带回现实工作
            </div>
            <p>{scenario.objective}</p>
            <div className="practice-result__template">
              <span>可直接复用的句式</span>
              <strong>{scenario.transferTemplate}</strong>
            </div>
          </aside>
        </div>

        <footer>
          <button className="secondary-cta" type="button" onClick={onRetry}>
            <Repeat weight="bold" /> 换一种讲法再练
          </button>
          <button className="primary-cta" type="button" onClick={onLibrary}>
            返回训练库 <ArrowRight weight="bold" />
          </button>
        </footer>
      </section>
    </div>
  );
}
