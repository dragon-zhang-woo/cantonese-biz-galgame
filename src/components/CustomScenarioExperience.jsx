import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle,
  Copy,
  EyeSlash,
  FileText,
  House,
  LockKey,
  PaperPlaneTilt,
  ShieldCheck,
  Sparkle,
  Target,
  WarningCircle,
} from "@phosphor-icons/react";
import { initialStatus } from "../data/scenes.js";
import { evaluateBehavior } from "../services/behaviorRubric.js";
import {
  buildCustomRoundScene,
  composeCustomScenario,
  CUSTOM_SCENARIO_MAX_LENGTH,
  CUSTOM_SCENARIO_MIN_LENGTH,
} from "../services/customScenario.js";
import { canSubmitFreeResponse } from "../services/freeResponse.js";
import { requestAiTurn } from "../services/gameApi.js";

const pressureLevels = ["温和", "直接", "高压"];
const relationOptions = ["自动", "上司", "客户", "跨部门伙伴", "同事", "带教经理"];
const channelOptions = [
  "自动",
  "当面",
  "会议",
  "电话",
  "即时消息",
  "邮件",
  "视频会议",
  "非正式会面",
];
const focusOptions = [
  "自动",
  "任务澄清",
  "优先级协商",
  "风险汇报",
  "范围控制",
  "催进度",
  "高层汇报",
  "资料边界",
  "表达异议",
];

function modelSources(provider = "fallback") {
  return {
    deepseek: provider.startsWith("deepseek"),
    hkchat: provider.endsWith("hkchat"),
  };
}

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

function localFeedback(text) {
  return {
    naturalness: 5,
    politeness: 5,
    businessFit: 5,
    hkRewrite: text,
    comment: "离线模式保留你的原意，不对自由回答作武断语言评分。",
    source: "fallback",
  };
}

function SourceList({ sources }) {
  return (
    <div className="source-list">
      {sources.map((source) => (
        <a
          key={source.id}
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className={source.riskLevel === "high" ? "is-high-risk" : ""}
        >
          <FileText weight="duotone" aria-hidden="true" />
          <span>
            <strong>{source.title}</strong>
            <small>{source.publisher}</small>
            <em>{source.usageNote}</em>
          </span>
          <ArrowRight weight="bold" aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}

function RubricGrid({ rubric }) {
  return (
    <div className="rubric-grid" aria-label={`任务表现 ${rubric.total}/${rubric.max}`}>
      {rubric.items.map((item) => (
        <div key={item.id} className={item.score >= 3 ? "is-strong" : "needs-work"}>
          <span>{item.label}</span>
          <strong>{item.score}/4</strong>
          <i aria-hidden="true">
            <b style={{ width: `${item.score * 25}%` }} />
          </i>
          <p>{item.evidence}</p>
        </div>
      ))}
    </div>
  );
}

function Intake({
  description,
  onDescription,
  pressure,
  onPressure,
  rounds,
  onRounds,
  relation,
  onRelation,
  channel,
  onChannel,
  focus,
  onFocus,
  onCompose,
  onHome,
  isLoading,
  error,
}) {
  const valid = description.trim().length >= CUSTOM_SCENARIO_MIN_LENGTH;
  return (
    <section className="custom-intake" aria-labelledby="custom-intake-title">
      <header>
        <div>
          <span>MY REAL SITUATION · 不保存原文</span>
          <h2 id="custom-intake-title">把现实困难变成安全练习</h2>
          <p>说清发生了什么，系统只保留匿名后的任务、关系、冲突和目标。</p>
        </div>
        <button className="home-button overlay-home-button" type="button" onClick={onHome}>
          <House weight="duotone" aria-hidden="true" />
          返回首页
        </button>
      </header>

      <div className="privacy-banner">
        <ShieldCheck weight="duotone" aria-hidden="true" />
        <div>
          <strong>请勿输入真实姓名、电话、电邮、地址、公司机密或账号凭证</strong>
          <span>提交前会先在浏览器内替换常见敏感信息；原始描述不会写入本机训练记录。</span>
        </div>
      </div>

      <label className="custom-description" htmlFor="custom-scenario-description">
        <span>你正在面对什么困难？</span>
        <textarea
          id="custom-scenario-description"
          value={description}
          onChange={(event) => onDescription(event.target.value)}
          minLength={CUSTOM_SCENARIO_MIN_LENGTH}
          maxLength={CUSTOM_SCENARIO_MAX_LENGTH}
          rows="6"
          placeholder="例如：经理要求我同时完成两件今天到期的任务，我不知道怎样提出优先级。"
        />
        <output>
          {description.length}/{CUSTOM_SCENARIO_MAX_LENGTH} · 至少 {CUSTOM_SCENARIO_MIN_LENGTH} 字
        </output>
      </label>

      <div className="custom-profile-grid">
        <label>
          <span>由谁和你对练</span>
          <select value={relation} onChange={(event) => onRelation(event.target.value)}>
            {relationOptions.map((option) => (
              <option key={option} value={option}>
                {option === "自动" ? "自动判断关系" : option}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>沟通渠道</span>
          <select value={channel} onChange={(event) => onChannel(event.target.value)}>
            {channelOptions.map((option) => (
              <option key={option} value={option}>
                {option === "自动" ? "自动判断渠道" : option}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>这次重点</span>
          <select value={focus} onChange={(event) => onFocus(event.target.value)}>
            {focusOptions.map((option) => (
              <option key={option} value={option}>
                {option === "自动" ? "自动组合任务" : option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="custom-controls">
        <fieldset>
          <legend>对方压力</legend>
          {pressureLevels.map((level) => (
            <button
              key={level}
              type="button"
              className={pressure === level ? "is-active" : ""}
              aria-pressed={pressure === level}
              onClick={() => onPressure(level)}
            >
              {level}
            </button>
          ))}
        </fieldset>
        <fieldset>
          <legend>建议轮数（两轮后可随时收口）</legend>
          {[3, 5, 6].map((count) => (
            <button
              key={count}
              type="button"
              className={rounds === count ? "is-active" : ""}
              aria-pressed={rounds === count}
              onClick={() => onRounds(count)}
            >
              {count} 轮
            </button>
          ))}
        </fieldset>
      </div>

      {error && <p className="custom-error">{error}</p>}
      <button
        className="primary-cta custom-compose-cta"
        type="button"
        onClick={onCompose}
        disabled={!valid || isLoading}
      >
        {isLoading ? <i className="button-spinner" /> : <Brain weight="duotone" />}
        {isLoading ? "正在脱敏、组合任务与角色…" : "生成动态匿名训练"}
        {!isLoading && <ArrowRight weight="bold" />}
      </button>
    </section>
  );
}

function Prepared({ scenario, onStart, onBack, onHome }) {
  return (
    <section className="custom-prepared" aria-labelledby="custom-prepared-title">
      <header>
        <button className="text-button" type="button" onClick={onBack}>
          <ArrowLeft weight="bold" /> 重新描述
        </button>
        <button className="home-button overlay-home-button" type="button" onClick={onHome}>
          <House weight="duotone" aria-hidden="true" />
          返回首页
        </button>
      </header>
      <div className="custom-prepared__hero">
        <span>ANONYMISED TRAINING PLAN</span>
        <h2 id="custom-prepared-title">{scenario.title}</h2>
        <p>{scenario.redactedDescription}</p>
        <div>
          <i>{scenario.relation}</i>
          <i>{scenario.channel}</i>
          <i>{scenario.pressure}压力</i>
          <i>建议 {scenario.rounds.length} 轮 · 两轮后可收口</i>
          <i>DeepSeek 角色推演 + 港话通语言反馈</i>
        </div>
      </div>

      <div className="redaction-receipt">
        <EyeSlash weight="duotone" aria-hidden="true" />
        <span>
          <strong>隐私清理完成</strong>
          {scenario.redaction.count
            ? `已替换 ${scenario.redaction.count} 处：${scenario.redaction.categories.join("、")}`
            : "没有发现常见个人资料；仍请自行确认没有公司机密。"}
        </span>
      </div>

      <div className="custom-prepared__grid">
        <section>
          <Target weight="duotone" />
          <span>训练目标</span>
          <strong>{scenario.objective}</strong>
        </section>
        <section>
          <WarningCircle weight="duotone" />
          <span>隐藏关系风险</span>
          <strong>{scenario.hiddenRisk}</strong>
        </section>
      </div>

      <div className="skill-stack">
        <span>系统检索到的技能卡</span>
        {scenario.skillCards.map((skill) => (
          <div key={skill.id}>
            <Brain weight="duotone" />
            <span>
              <strong>{skill.title}</strong>
              <small>{skill.steps.join(" → ")}</small>
            </span>
          </div>
        ))}
      </div>

      <details className="source-drawer">
        <summary>
          <FileText weight="duotone" />
          查看本次建议依据
          <span>{scenario.sources.length} 项</span>
        </summary>
        <SourceList sources={scenario.sources} />
        <p>{scenario.disclaimer}</p>
      </details>

      <button className="primary-cta" type="button" onClick={onStart}>
        进入第 1 轮 <ArrowRight weight="bold" />
      </button>
    </section>
  );
}

function Training({
  scenario,
  scene,
  index,
  value,
  onValue,
  result,
  onSubmit,
  onNext,
  onFinish,
  canFinish,
  isLoading,
  onHome,
}) {
  const sources = modelSources(result?.provider);
  const canContinue = index < scenario.rounds.length - 1;
  return (
    <section className="custom-training" aria-labelledby="custom-training-title">
      <div className="custom-training__image">
        <img src={scenario.background} alt="" />
        <i aria-hidden="true" />
      </div>
      <header>
        <div>
          <span>ROUND {index + 1} · 建议 {scenario.rounds.length} 轮</span>
          <h2 id="custom-training-title">{scene.chapter}</h2>
          <small>{scene.location}</small>
        </div>
        <button className="home-button overlay-home-button" type="button" onClick={onHome}>
          <House weight="duotone" aria-hidden="true" />
          返回首页
        </button>
      </header>
      <div className="custom-training__body">
        <div className="custom-round-purpose">
          <Target weight="duotone" />
          <span>{scenario.rounds[index].purpose}</span>
        </div>
        <div className="custom-npc-line">
          <span>{scene.speaker} · {scene.role}</span>
          <strong>「{result?.npcLineYue ?? scene.npcLineYue}」</strong>
          <p>{result?.npcLineZh ?? scene.npcLineZh}</p>
        </div>
        {result ? (
          <>
            <div className="custom-model-status" aria-label={`本轮模型来源 ${result.provider}`}>
              <span className={sources.deepseek ? "is-live" : "is-fallback"}>
                DeepSeek · {sources.deepseek ? "真实角色反应" : "本地保底"}
              </span>
              <span className={sources.hkchat ? "is-live" : "is-fallback"}>
                港话通 · {sources.hkchat ? "真实语言复盘" : "本地保底"}
              </span>
            </div>
            <div className="custom-coach-note">
              <Brain weight="duotone" />
              <span>
                <strong>本轮教练反馈</strong>
                {result.coachFeedback}
              </span>
            </div>
            <div className="custom-language-row">
              {[
                ["自然度", result.localization.naturalness],
                ["礼貌度", result.localization.politeness],
                ["商务适配", result.localization.businessFit],
              ].map(([label, score]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{score}/10</strong>
                </div>
              ))}
            </div>
            <div className="custom-progress-signal">
              <span>
                任务闭环进度
                <strong>{result.taskProgress}%</strong>
              </span>
              <i aria-hidden="true">
                <b style={{ width: `${result.taskProgress}%` }} />
              </i>
              <em>
                关系状态：{result.relationshipSignal}
                {result.shouldClose ? " · 对方认为可以收口" : ""}
              </em>
            </div>
            <div className="custom-rewrite">
              <Sparkle weight="fill" />
              <span>
                <small>更港式的讲法</small>
                <strong>{result.localization.hkRewrite}</strong>
              </span>
            </div>
            <div className="custom-round-actions">
              <button className="primary-cta" type="button" onClick={onNext}>
                {canContinue ? "承接真实反应，继续对话" : "完成并查看复盘"}
                <ArrowRight weight="bold" />
              </button>
              {canFinish && canContinue && (
                <button className="secondary-cta" type="button" onClick={onFinish}>
                  现在结束并复盘
                </button>
              )}
            </div>
          </>
        ) : (
          <form onSubmit={onSubmit} className="custom-answer-form">
            <label htmlFor="custom-round-answer">你的回应</label>
            <textarea
              id="custom-round-answer"
              value={value}
              onChange={(event) => onValue(event.target.value)}
              maxLength="320"
              rows="3"
              placeholder="用粤语、普通话或中英夹杂回应…"
            />
            <div>
              <span>{scene.coachHint}</span>
              <output>{value.length}/320</output>
            </div>
            {isLoading && (
              <div className="custom-model-live" role="status">
                <span><i /> DeepSeek 正在延续角色反应</span>
                <span><i /> 港话通正在检查自然度与商务语气</span>
              </div>
            )}
            <button
              className="primary-cta"
              type="submit"
              disabled={!canSubmitFreeResponse(value) || isLoading}
            >
              <PaperPlaneTilt weight="fill" />
              {isLoading ? "双模型正在并行回应…" : "提交本轮回应"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function Result({ scenario, responses, rubric, onRetry, onHome }) {
  const language = responses.reduce(
    (totals, response) => ({
      naturalness: totals.naturalness + response.turn.localization.naturalness,
      politeness: totals.politeness + response.turn.localization.politeness,
      businessFit: totals.businessFit + response.turn.localization.businessFit,
    }),
    { naturalness: 0, politeness: 0, businessFit: 0 },
  );
  const average = (key) => Math.round(language[key] / responses.length);
  const copyTemplate = () => navigator.clipboard?.writeText(scenario.transferTemplate);

  return (
    <section className="custom-result" aria-labelledby="custom-result-title">
      <header>
        <div>
          <span>CUSTOM PRACTICE COMPLETE</span>
          <h2 id="custom-result-title">{scenario.task}完整复盘</h2>
        </div>
        <div className={rubric.completed ? "is-complete" : "needs-retry"}>
          {rubric.completed ? <CheckCircle weight="fill" /> : <Target weight="duotone" />}
          <span>
            <strong>{rubric.completed ? "任务已形成闭环" : "任务尚未完全收口"}</strong>
            行为表现 {rubric.total}/{rubric.max}
          </span>
        </div>
        <button className="home-button overlay-home-button" type="button" onClick={onHome}>
          <House weight="duotone" aria-hidden="true" />
          返回首页
        </button>
      </header>

      <div className="custom-result__layout">
        <main>
          <h3>六项可解释任务评分</h3>
          <RubricGrid rubric={rubric} />
          <div className="custom-result__missing">
            <WarningCircle weight="duotone" />
            <span>
              <strong>下一次优先补上</strong>
              {rubric.missing.length ? rubric.missing.join("、") : "保持现在的清晰度，并缩短表达。"}
            </span>
          </div>
          <div className="response-comparison">
            <div>
              <span>第一次回答</span>
              <p>{responses[0].text}</p>
            </div>
            <ArrowRight weight="bold" />
            <div>
              <span>{responses.length > 1 ? "最后一轮回答" : "港式改写"}</span>
              <p>
                {responses.length > 1
                  ? responses.at(-1).text
                  : responses[0].turn.localization.hkRewrite}
              </p>
            </div>
          </div>
        </main>

        <aside>
          <h3>语言与现实行动</h3>
          <div className="custom-language-summary">
            <span>自然度 <strong>{average("naturalness")}/10</strong></span>
            <span>礼貌度 <strong>{average("politeness")}/10</strong></span>
            <span>商务适配 <strong>{average("businessFit")}/10</strong></span>
          </div>
          <div className="action-template">
            <Sparkle weight="fill" />
            <span>
              <small>可直接复用的行动模板</small>
              <strong>{scenario.transferTemplate}</strong>
            </span>
            <button type="button" onClick={copyTemplate} aria-label="复制行动模板">
              <Copy weight="bold" />
            </button>
          </div>
          <details className="source-drawer">
            <summary>
              <FileText weight="duotone" />
              本次建议依据
              <span>{scenario.sources.length} 项</span>
            </summary>
            <SourceList sources={scenario.sources} />
          </details>
          <div className="custom-result__privacy">
            <LockKey weight="duotone" />
            <span>
              <strong>训练已结束，原始描述没有保存</strong>
              重新训练只使用当前匿名情境。
            </span>
          </div>
        </aside>
      </div>

      <footer>
        <button className="secondary-cta custom-result__home" type="button" onClick={onHome}>
          <House weight="duotone" aria-hidden="true" />
          返回首页
        </button>
        {pressureLevels.map((level) => (
          <button
            key={level}
            className={level === scenario.pressure ? "secondary-cta is-active" : "secondary-cta"}
            type="button"
            aria-pressed={level === scenario.pressure}
            onClick={() => onRetry(level)}
          >
            {level === scenario.pressure ? `重练${level}版` : `改成${level}版`}
          </button>
        ))}
      </footer>
    </section>
  );
}

export function CustomScenarioExperience({ onHome }) {
  const [phase, setPhase] = useState("intake");
  const [description, setDescription] = useState("");
  const [pressure, setPressure] = useState("直接");
  const [rounds, setRounds] = useState(5);
  const [relation, setRelation] = useState("自动");
  const [channel, setChannel] = useState("自动");
  const [focus, setFocus] = useState("自动");
  const [scenario, setScenario] = useState(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [roundResult, setRoundResult] = useState(null);
  const [responses, setResponses] = useState([]);
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const scene = useMemo(
    () =>
      scenario
        ? buildCustomRoundScene(
            scenario,
            roundIndex,
            responses.at(-1)?.turn ?? null,
          )
        : null,
    [responses, roundIndex, scenario],
  );
  const rubric = useMemo(
    () =>
      evaluateBehavior({
        text: responses.at(-1)?.text ?? "",
        responses: responses.slice(0, -1).map((item) => item.text),
      }),
    [responses],
  );

  async function compose(nextPressure = pressure, source = description) {
    setIsLoading(true);
    setError("");
    try {
      const nextScenario = await composeCustomScenario({
        description: source,
        pressure: nextPressure,
        rounds,
        relation,
        channel,
        focus,
      });
      setScenario(nextScenario);
      setDescription("");
      setPressure(nextPressure);
      setPhase("prepared");
    } catch (composeError) {
      setError(composeError.message || "暂时无法生成训练，请检查输入后重试。");
    } finally {
      setIsLoading(false);
    }
  }

  function startTraining() {
    setRoundIndex(0);
    setAnswer("");
    setRoundResult(null);
    setResponses([]);
    setStatus(initialStatus);
    setPhase("training");
  }

  async function submitRound(event) {
    event.preventDefault();
    if (!canSubmitFreeResponse(answer) || !scene || isLoading) return;
    setIsLoading(true);
    const option = {
      id: `custom-round-${roundIndex + 1}`,
      text: answer.trim(),
      delta: { trust: 0, professionalism: 0, language: 0, culture: 0 },
    };
    const fallback = {
      npcLineYue: scene.freeformFallback.responseYue,
      npcLineZh: scene.freeformFallback.responseZh,
      coachFeedback: scene.freeformFallback.feedback,
      delta: option.delta,
      taskProgress: Math.round(((roundIndex + 1) / scenario.rounds.length) * 100),
      relationshipSignal: "稳定",
      shouldClose: roundIndex >= scenario.rounds.length - 1,
      nextMove: scene.coachHint,
      localization: localFeedback(option.text),
    };
    const response = await requestAiTurn({
      scene,
      option,
      status,
      fallback,
      history: responses,
    });
    setRoundResult({ ...response.turn, provider: response.provider });
    setStatus((current) => applyDelta(current, response.turn.delta));
    setIsLoading(false);
  }

  function currentResponse() {
    return {
      roundIndex: roundIndex + 1,
      npcLineYue: scene.npcLineYue,
      npcLineZh: scene.npcLineZh,
      text: answer.trim(),
      turn: roundResult,
      roundId: scene.id,
    };
  }

  function advanceRound() {
    const nextResponses = [
      ...responses,
      currentResponse(),
    ];
    setResponses(nextResponses);
    if (roundIndex >= scenario.rounds.length - 1) {
      setPhase("result");
      return;
    }
    setRoundIndex((value) => value + 1);
    setAnswer("");
    setRoundResult(null);
  }

  function finishTraining() {
    setResponses([...responses, currentResponse()]);
    setPhase("result");
  }

  async function retryAtPressure(nextPressure) {
    await compose(nextPressure, scenario.redactedDescription);
  }

  return (
    <div className={`custom-scenario-layer custom-scenario-layer--${phase}`} role="dialog" aria-modal="true">
      {phase === "intake" && (
        <Intake
          description={description}
          onDescription={setDescription}
          pressure={pressure}
          onPressure={setPressure}
          rounds={rounds}
          onRounds={setRounds}
          relation={relation}
          onRelation={setRelation}
          channel={channel}
          onChannel={setChannel}
          focus={focus}
          onFocus={setFocus}
          onCompose={() => compose()}
          onHome={onHome}
          isLoading={isLoading}
          error={error}
        />
      )}
      {phase === "prepared" && scenario && (
        <Prepared
          scenario={scenario}
          onStart={startTraining}
          onBack={() => setPhase("intake")}
          onHome={onHome}
        />
      )}
      {phase === "training" && scenario && scene && (
        <Training
          scenario={scenario}
          scene={scene}
          index={roundIndex}
          value={answer}
          onValue={setAnswer}
          result={roundResult}
          onSubmit={submitRound}
          onNext={advanceRound}
          onFinish={finishTraining}
          canFinish={roundIndex >= 1}
          isLoading={isLoading}
          onHome={onHome}
        />
      )}
      {phase === "result" && scenario && responses.length > 0 && (
        <Result
          scenario={scenario}
          responses={responses}
          rubric={rubric}
          onRetry={retryAtPressure}
          onHome={onHome}
        />
      )}
    </div>
  );
}
