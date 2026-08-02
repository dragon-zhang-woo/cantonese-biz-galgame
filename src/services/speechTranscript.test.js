import { describe, expect, it } from "vitest";
import {
  createTranscriptAccumulator,
  mergeTranscriptValue,
  microphoneErrorMessage,
  recordingCompletionAction,
  resolveAudioUploadMimeType,
  transcriptExceedsLimit,
} from "./speechTranscript.js";

describe("speech transcript state", () => {
  it("orders interim/final events and ignores duplicate or stale sequences", () => {
    const accumulator = createTranscriptAccumulator();

    expect(accumulator.consume({ type: "interim", sequence: 1, text: "我想" })).toEqual({
      type: "interim",
      interim: "我想",
      transcript: "",
    });
    expect(accumulator.consume({ type: "interim", sequence: 1, text: "重复" })).toBeNull();
    expect(accumulator.consume({ type: "final", sequence: 2, text: "我想确认" })).toEqual({
      type: "final",
      interim: "",
      transcript: "我想确认",
    });
    expect(accumulator.consume({ type: "final", sequence: 2, text: "重复" })).toBeNull();
    expect(accumulator.consume({ type: "interim", sequence: 1, text: "倒退" })).toBeNull();
    expect(accumulator.consume({ type: "final", sequence: 3, text: "负责人。" })).toEqual({
      type: "final",
      interim: "",
      transcript: "我想确认 负责人。",
    });
    expect(accumulator.consume({ type: "complete", transcript: "" })).toEqual({
      type: "complete",
      interim: "",
      transcript: "我想确认 负责人。",
      source: "hkchat-speech",
    });
    expect(accumulator.consume({ type: "complete", transcript: "重复" })).toBeNull();
  });

  it("keeps manual text unchanged until an explicit append or replace choice", () => {
    const current = "我已经写好的回应";
    const transcript = "请确认负责人和时间";

    expect(mergeTranscriptValue(current, transcript, "keep")).toBe(current);
    expect(mergeTranscriptValue(current, transcript, "append")).toBe(
      "我已经写好的回应 请确认负责人和时间",
    );
    expect(mergeTranscriptValue(current, transcript, "replace")).toBe(transcript);
  });

  it("reports over-limit transcripts without truncating them", () => {
    const transcript = "粤".repeat(321);

    expect(transcriptExceedsLimit(transcript, 320)).toBe(true);
    expect(mergeTranscriptValue("", transcript, "replace")).toHaveLength(321);
  });

  it("maps microphone permission failures and preserves file fallback decisions", () => {
    expect(microphoneErrorMessage({ name: "NotAllowedError" })).toContain("权限被拒绝");
    expect(microphoneErrorMessage({ name: "NotFoundError" })).toContain("没有可用麦克风");
    expect(recordingCompletionAction({ liveComplete: true, transcript: "完成" })).toBe(
      "adopt-live",
    );
    expect(recordingCompletionAction({ liveComplete: false, transcript: "部分" })).toBe(
      "transcribe-file",
    );
  });

  it("accepts iOS M4A uploads with an empty or vendor-specific MIME without retaining the name", () => {
    const accepted = ["audio/mp4", "audio/wav"];

    expect(resolveAudioUploadMimeType({ name: "客户会议.m4a", type: "" }, accepted)).toBe(
      "audio/mp4",
    );
    expect(
      resolveAudioUploadMimeType(
        { name: "客户会议.m4a", type: "audio/x-m4a" },
        accepted,
      ),
    ).toBe("audio/mp4");
    expect(resolveAudioUploadMimeType({ name: "image.png", type: "image/png" }, accepted)).toBe(
      "",
    );
  });
});
