export function createTranscriptAccumulator() {
  let lastSequence = 0;
  const finalSegments = [];
  let completed = false;

  return {
    consume(event) {
      if (event?.type === "complete") {
        if (completed) return null;
        completed = true;
        const transcript = String(event.transcript || "").trim() || finalSegments.join(" ");
        return {
          type: "complete",
          interim: "",
          transcript,
          source: "hkchat-speech",
        };
      }
      if (!event || !["interim", "final"].includes(event.type)) return null;
      const sequence = event.sequence;
      const text = String(event.text || "").trim();
      if (!Number.isInteger(sequence) || sequence <= lastSequence || !text) return null;
      lastSequence = sequence;
      if (event.type === "final") finalSegments.push(text);
      return {
        type: event.type,
        interim: event.type === "interim" ? text : "",
        transcript: finalSegments.join(" "),
      };
    },
  };
}

export function mergeTranscriptValue(current, transcript, mode) {
  const existing = String(current || "").trim();
  const next = String(transcript || "").trim();
  if (mode === "replace") return next;
  if (mode === "append") return [existing, next].filter(Boolean).join(" ");
  return current;
}

export function transcriptExceedsLimit(transcript, maxLength) {
  return String(transcript || "").length > Number(maxLength);
}

export function microphoneErrorMessage(error) {
  if (["NotAllowedError", "PermissionDeniedError"].includes(error?.name)) {
    return "麦克风权限被拒绝；仍可上传录音或使用键盘。";
  }
  if (["NotFoundError", "DevicesNotFoundError"].includes(error?.name)) {
    return "没有可用麦克风；仍可上传录音或使用键盘。";
  }
  return "此浏览器暂时无法开始录音；仍可上传录音或使用键盘。";
}

export function recordingCompletionAction({ liveComplete, transcript }) {
  return liveComplete && String(transcript || "").trim()
    ? "adopt-live"
    : "transcribe-file";
}

const uploadMimeByExtension = {
  ".aac": "audio/aac",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".mp4": "audio/mp4",
  ".oga": "audio/ogg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".webm": "audio/webm",
};

export function resolveAudioUploadMimeType(file, acceptedMimeTypes) {
  const declared = String(file?.type || "").split(";", 1)[0].toLowerCase();
  if (acceptedMimeTypes.includes(declared)) return declared;
  const lowerName = String(file?.name || "").toLowerCase();
  const extension = Object.keys(uploadMimeByExtension).find((suffix) =>
    lowerName.endsWith(suffix),
  );
  const inferred = extension ? uploadMimeByExtension[extension] : "";
  return acceptedMimeTypes.includes(inferred) ? inferred : "";
}
