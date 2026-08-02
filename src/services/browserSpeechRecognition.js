const CANTONESE_LANGUAGE_CANDIDATES = ["yue-Hant-HK", "zh-HK"];

export function getBrowserSpeechRecognitionConstructor(target = globalThis) {
  return target?.SpeechRecognition ?? target?.webkitSpeechRecognition ?? null;
}

export function browserSpeechRecognitionSupported(target = globalThis) {
  return Boolean(getBrowserSpeechRecognitionConstructor(target));
}

function normalizeTranscript(value) {
  return String(value || "").trim();
}

function joinSegments(segments) {
  return segments
    .map(normalizeTranscript)
    .filter(Boolean)
    .reduce((joined, segment) => {
      if (!joined) return segment;
      const joinsWithoutSpace =
        /[\p{Script=Han}]$/u.test(joined) && /^[\p{Script=Han}]/u.test(segment);
      return `${joined}${joinsWithoutSpace ? "" : " "}${segment}`;
    }, "");
}

export function createBrowserSpeechRecognition({
  target = globalThis,
  languages = CANTONESE_LANGUAGE_CANDIDATES,
  onInterim = () => {},
  onFinal = () => {},
  onComplete = () => {},
  onError = () => {},
  onLanguageFallback = () => {},
} = {}) {
  const Recognition = getBrowserSpeechRecognitionConstructor(target);
  if (!Recognition) throw new Error("browser_speech_unsupported");

  const languageCandidates = [...new Set(languages.filter(Boolean))];
  if (!languageCandidates.length) languageCandidates.push("yue-Hant-HK");

  let recognition = null;
  let languageIndex = 0;
  let shouldRun = false;
  let stopping = false;
  let disposed = false;
  let restartAfterEnd = false;
  let restartTimer = null;
  const committedSegments = [];
  const sessionFinals = new Map();

  function currentTranscript() {
    return joinSegments([
      ...committedSegments,
      ...[...sessionFinals.entries()]
        .sort(([left], [right]) => left - right)
        .map(([, text]) => text),
    ]);
  }

  function commitSession() {
    const sessionText = joinSegments(
      [...sessionFinals.entries()]
        .sort(([left], [right]) => left - right)
        .map(([, text]) => text),
    );
    if (sessionText) committedSegments.push(sessionText);
    sessionFinals.clear();
    return joinSegments(committedSegments);
  }

  function scheduleRestart() {
    if (!shouldRun || stopping || disposed) return;
    target.clearTimeout?.(restartTimer);
    restartTimer = target.setTimeout?.(() => startSession(), 80);
  }

  function startSession() {
    if (!shouldRun || stopping || disposed) return;
    recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = languageCandidates[languageIndex];
    restartAfterEnd = false;

    recognition.onresult = (event) => {
      let interim = "";
      for (let index = event.resultIndex ?? 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = normalizeTranscript(result?.[0]?.transcript);
        if (!text) continue;
        if (result.isFinal) sessionFinals.set(index, text);
        else interim = joinSegments([interim, text]);
      }
      const transcript = currentTranscript();
      if (transcript) onFinal({ transcript, source: "browser-speech" });
      onInterim({ text: interim, transcript, source: "browser-speech" });
    };

    recognition.onerror = (event) => {
      const code = String(event?.error || "unknown");
      if (code === "language-not-supported" && languageIndex < languageCandidates.length - 1) {
        languageIndex += 1;
        restartAfterEnd = true;
        onLanguageFallback({ language: languageCandidates[languageIndex] });
        return;
      }
      if (code === "no-speech") {
        restartAfterEnd = true;
        return;
      }
      if (code === "aborted" && (stopping || disposed)) return;
      shouldRun = false;
      onError({ code, recoverable: true });
    };

    recognition.onend = () => {
      const transcript = commitSession();
      if (stopping) {
        onComplete({ transcript, source: "browser-speech" });
        return;
      }
      if (shouldRun || restartAfterEnd) scheduleRestart();
    };

    try {
      recognition.start();
    } catch (error) {
      shouldRun = false;
      onError({ code: error?.name || "start_failed", recoverable: true });
    }
  }

  return {
    get language() {
      return languageCandidates[languageIndex];
    },
    start() {
      if (disposed || shouldRun) return;
      shouldRun = true;
      stopping = false;
      startSession();
    },
    stop() {
      if (disposed || stopping) return;
      shouldRun = false;
      stopping = true;
      target.clearTimeout?.(restartTimer);
      try {
        recognition?.stop();
      } catch {
        onComplete({ transcript: currentTranscript(), source: "browser-speech" });
      }
    },
    abort() {
      if (disposed) return;
      disposed = true;
      shouldRun = false;
      stopping = false;
      target.clearTimeout?.(restartTimer);
      try {
        recognition?.abort();
      } catch {
        // The browser may already have ended the recognition session.
      }
    },
  };
}
