import { describe, expect, it, vi } from "vitest";
import {
  browserSpeechRecognitionSupported,
  createBrowserSpeechRecognition,
} from "./browserSpeechRecognition.js";

function recognitionHarness() {
  const instances = [];
  class FakeRecognition {
    constructor() {
      instances.push(this);
    }

    start() {
      this.started = true;
    }

    stop() {
      this.stopped = true;
    }

    abort() {
      this.aborted = true;
    }
  }
  const target = {
    webkitSpeechRecognition: FakeRecognition,
    setTimeout,
    clearTimeout,
  };
  return { instances, target };
}

function result(text, isFinal) {
  return Object.assign([{ transcript: text }], { isFinal });
}

describe("browser speech recognition adapter", () => {
  it("merges interim and final Cantonese results and completes after stop", () => {
    const { instances, target } = recognitionHarness();
    const onInterim = vi.fn();
    const onFinal = vi.fn();
    const onComplete = vi.fn();
    const controller = createBrowserSpeechRecognition({
      target,
      onInterim,
      onFinal,
      onComplete,
    });

    controller.start();
    const recognition = instances[0];
    expect(recognition.lang).toBe("yue-Hant-HK");
    expect(recognition.continuous).toBe(true);
    expect(recognition.interimResults).toBe(true);

    recognition.onresult({
      resultIndex: 0,
      results: [result("我想确认", true), result("负责人", false)],
    });
    expect(onFinal).toHaveBeenLastCalledWith({
      transcript: "我想确认",
      source: "browser-speech",
    });
    expect(onInterim).toHaveBeenLastCalledWith({
      text: "负责人",
      transcript: "我想确认",
      source: "browser-speech",
    });

    recognition.onresult({
      resultIndex: 1,
      results: [result("我想确认", true), result("负责人同更新时间", true)],
    });
    controller.stop();
    recognition.onend();

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({
      transcript: "我想确认负责人同更新时间",
      source: "browser-speech",
    });
  });

  it("falls back from Chrome Cantonese to Edge Hong Kong Cantonese", async () => {
    vi.useFakeTimers();
    const { instances, target } = recognitionHarness();
    const onLanguageFallback = vi.fn();
    const controller = createBrowserSpeechRecognition({ target, onLanguageFallback });

    controller.start();
    instances[0].onerror({ error: "language-not-supported" });
    instances[0].onend();
    await vi.runAllTimersAsync();

    expect(onLanguageFallback).toHaveBeenCalledWith({ language: "zh-HK" });
    expect(instances).toHaveLength(2);
    expect(instances[1].lang).toBe("zh-HK");
    controller.abort();
    vi.useRealTimers();
  });

  it("reports unsupported browsers and stable recognition failures", () => {
    expect(browserSpeechRecognitionSupported({})).toBe(false);
    const { instances, target } = recognitionHarness();
    const onError = vi.fn();
    const controller = createBrowserSpeechRecognition({ target, onError });

    controller.start();
    instances[0].onerror({ error: "network" });
    instances[0].onend();

    expect(onError).toHaveBeenCalledWith({ code: "network", recoverable: true });
    expect(instances).toHaveLength(1);
  });
});
