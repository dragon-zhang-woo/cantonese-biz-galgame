import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle,
  Clock,
  FileText,
  Funnel,
  MagnifyingGlass,
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
  const [query, setQuery] = useState("");
  const [relation, setRelation] = useState("全部关系");
  const [difficulty, setDifficulty] = useState("全部难度");
  const [channel, setChannel] = useState("全部渠道");
  const [skill, setSkill] = useState("全部技能");
  const completedCount = Object.keys(progress.completed).length;
  const choices = useMemo(
    () => ({
      relation: ["全部关系", ...new Set(scenarios.map((item) => item.relation))],
      difficulty: ["全部难度", ...new Set(scenarios.map((item) => item.difficulty))],
      channel: ["全部渠道", ...new Set(scenarios.map((item) => item.channel))],
      skill: ["全部技能", ...new Set(scenarios.map((item) => item.skill))],
    }),
    [scenarios],
  );
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return scenarios.filter((scenario) => {
      const matchesQuery =
        !normalized ||
        [
          scenario.chapter,
          scenario.objective,
          scenario.speaker,
          scenario.skill,
          scenario.relation,
          scenario.channel,
        ].some((value) => value.toLowerCase().includes(normalized));
      return (
        matchesQuery &&
        (relation === "全部关系" || scenario.relation === relation) &&
        (difficulty === "全部难度" || scenario.difficulty === difficulty) &&
        (channel === "全部渠道" || scenario.channel === channel) &&
        (skill === "全部技能" || scenario.skill === skill)
      );
    });
  }, [channel, difficulty, query, relation, scenarios, skill]);

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

        <div className="practice-filters">
          <label>
            <MagnifyingGlass weight="bold" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜任务、角色或技能"
            />
          </label>
          <div>
            <Funnel weight="duotone" aria-hidden="true" />
            <select value={relation} onChange={(event) => setRelation(event.target.value)} aria-label="按关系筛选">
              {choices.relation.map((value) => <option key={value}>{value}</option>)}
            </select>
            <select value={skill} onChange={(event) => setSkill(event.target.value)} aria-label="按技能筛选">
              {choices.skill.map((value) => <option key={value}>{value}</option>)}
            </select>
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} aria-label="按难度筛选">
              {choices.difficulty.map((value) => <option key={value}>{value}</option>)}
            </select>
            <select value={channel} onChange={(event) => setChannel(event.target.value)} aria-label="按渠道筛选">
              {choices.channel.map((value) => <option key={value}>{value}</option>)}
            </select>
            <span>{filtered.length} 项匹配</span>
          </div>
        </div>

        <div className="practice-grid">
          {filtered.map((scenario) => {
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
                  <span>{String(scenario.stage).padStart(2, "0")}</span>
                  <i className={`difficulty difficulty--${difficultyTone(scenario.difficulty)}`}>
                    {scenario.difficulty}
                  </i>
                </div>
                <div className="practice-card__copy">
                  <small>{scenario.relation} · {scenario.speaker} · {scenario.skill}</small>
                  <h3>{scenario.chapter.replace(/^情境 \d+ · /, "")}</h3>
                  <p>{scenario.objective}</p>
                  <div>
                    <span><Clock weight="fill" /> {scenario.duration}</span>
                    <span>{scenario.channel}</span>
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
          {filtered.length === 0 && (
            <div className="practice-empty">
              <MagnifyingGlass weight="duotone" />
              <strong>没有完全匹配的训练</strong>
              <span>放宽一个筛选条件，或到“我的现实情境”生成相似练习。</span>
            </div>
          )}
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
  rubric,
  sources,
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
              {rubric.completed ? <CheckCircle weight="fill" /> : <Target weight="duotone" />}
              {rubric.completed ? "任务已形成闭环" : "任务尚未完全收口"}
            </div>
            <p className="practice-result__feedback">{turn.coachFeedback}</p>
            <div className="practice-rubric">
              {rubric.items.map((item) => (
                <div key={item.id} className={item.score >= 3 ? "is-strong" : "needs-work"}>
                  <span>{item.label}</span>
                  <strong>{item.score}/4</strong>
                  <i aria-hidden="true"><b style={{ width: `${item.score * 25}%` }} /></i>
                  <small>{item.evidence}</small>
                </div>
              ))}
            </div>
            <div className="practice-result__gap">
              <WarningCircle weight="duotone" />
              <span>
                <strong>下一次优先补上</strong>
                {rubric.missing.length ? rubric.missing.join("、") : "保持现在的清晰度，并缩短表达。"}
              </span>
            </div>
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
            <details className="source-drawer practice-source-drawer">
              <summary>
                <FileText weight="duotone" />
                查看本次建议依据
                <span>{sources.length} 项</span>
              </summary>
              <div className="source-list">
                {sources.map((source) => (
                  <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
                    <FileText weight="duotone" />
                    <span>
                      <strong>{source.title}</strong>
                      <small>{source.publisher}</small>
                      <em>{source.usageNote}</em>
                    </span>
                    <ArrowRight weight="bold" />
                  </a>
                ))}
              </div>
              {sources.some((source) => source.riskLevel === "high") && (
                <p>高风险资料仅用于一般沟通训练；具体个案请使用正式流程或专业意见。</p>
              )}
            </details>
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
