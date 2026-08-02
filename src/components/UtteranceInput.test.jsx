// @vitest-environment jsdom

import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const storeMocks = vi.hoisted(() => ({
  clearAudioAssets: vi.fn(),
  deleteAudioAsset: vi.fn(),
  listAudioAssets: vi.fn(),
  saveAudioAsset: vi.fn(),
}));
const speechMocks = vi.hoisted(() => ({
  createLiveSpeechSocket: vi.fn(),
  getSpeechCapabilities: vi.fn(),
  transcribeAudio: vi.fn(),
}));

vi.mock("../services/recordingStore.js", () => storeMocks);
vi.mock("../services/speechApi.js", () => ({
  ...speechMocks,
  DEFAULT_SPEECH_CAPABILITIES: {
    configured: false,
    liveSupported: false,
    uploadSupported: false,
    acceptedMimeTypes: ["audio/webm", "audio/wav"],
    maxUploadBytes: 25 * 1024 * 1024,
    recordingLimitsMs: {
      "campaign-turn": 90_000,
      "practice-turn": 90_000,
      "custom-turn": 120_000,
      "scenario-intake": 300_000,
    },
  },
}));

import { UtteranceInput } from "./UtteranceInput.jsx";

const capabilities = {
  configured: false,
  liveSupported: false,
  uploadSupported: false,
  acceptedMimeTypes: ["audio/webm", "audio/wav"],
  maxUploadBytes: 25 * 1024 * 1024,
  recordingLimitsMs: {
    "campaign-turn": 90_000,
    "practice-turn": 90_000,
    "custom-turn": 120_000,
    "scenario-intake": 300_000,
  },
};

class FakeMediaRecorder {
  static isTypeSupported() {
    return true;
  }

  constructor(stream, options = {}) {
    this.stream = stream;
    this.mimeType = options.mimeType || "audio/webm";
    this.state = "inactive";
  }

  start() {
    this.state = "recording";
  }

  stop() {
    this.state = "inactive";
    this.ondataavailable?.({
      data: new Blob(["recorded-audio"], { type: this.mimeType }),
    });
    this.onstop?.();
  }
}

function ControlledInput({ initialValue = "" }) {
  const [value, setValue] = useState(initialValue);
  return (
    <UtteranceInput
      id="voice-test"
      label="你的回应"
      value={value}
      onChange={setValue}
      maxLength={160}
      scope="campaign-turn"
    />
  );
}

function renderInput(props) {
  return render(<ControlledInput {...props} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  speechMocks.getSpeechCapabilities.mockResolvedValue(capabilities);
  storeMocks.listAudioAssets.mockResolvedValue([]);
  storeMocks.saveAudioAsset.mockImplementation(async (asset) => asset);
  Object.defineProperty(window, "isSecureContext", {
    configurable: true,
    value: true,
  });
  globalThis.MediaRecorder = FakeMediaRecorder;
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:voice-test"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
  globalThis.Audio = class FakeAudio {
    set src(_value) {
      queueMicrotask(() => this.onerror?.());
    }
  };
});

afterEach(() => {
  cleanup();
  delete window.SpeechRecognition;
  delete window.webkitSpeechRecognition;
});

describe("UtteranceInput recording lifecycle", () => {
  it("keeps keyboard and upload available when microphone permission is denied", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue({ name: "NotAllowedError" }),
      },
    });
    renderInput();

    fireEvent.click(screen.getByRole("button", { name: "语音输入" }));
    const consent = screen.queryByRole("alertdialog");
    if (consent) {
      fireEvent.click(screen.getByRole("button", { name: /我明白/ }));
    }

    expect(await screen.findByText(/麦克风权限被拒绝/)).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "你的回应" }).disabled).toBe(false);
    expect(screen.getByRole("button", { name: "上传录音" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "语音输入" })).toBeNull();
  });

  it("locks text while recording, stops cleanly and retains audio when ASR is unavailable", async () => {
    const stopTrack = vi.fn();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: stopTrack }],
        }),
      },
    });
    renderInput();

    fireEvent.click(screen.getByRole("button", { name: "语音输入" }));
    const consent = screen.queryByRole("alertdialog");
    if (consent) {
      fireEvent.click(screen.getByRole("button", { name: /我明白/ }));
    }

    const stopButton = await screen.findByRole("button", { name: /停止 0s/ });
    expect(screen.getByRole("textbox", { name: "你的回应" }).readOnly).toBe(true);
    fireEvent.click(stopButton);

    await waitFor(() => expect(storeMocks.saveAudioAsset).toHaveBeenCalledTimes(1));
    expect(stopTrack).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/文件转写尚未配置/)).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "你的回应" }).readOnly).toBe(false);
  });

  it("closes a still-connecting live socket when the learner stops quickly", async () => {
    const socket = {
      readyState: WebSocket.CONNECTING,
      close: vi.fn(),
      send: vi.fn(),
    };
    speechMocks.getSpeechCapabilities.mockResolvedValue({
      ...capabilities,
      configured: true,
      liveSupported: true,
      uploadSupported: true,
    });
    speechMocks.createLiveSpeechSocket.mockReturnValue(socket);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
    });
    renderInput();
    await waitFor(() => expect(speechMocks.getSpeechCapabilities).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "语音输入" }));
    const consent = screen.queryByRole("alertdialog");
    if (consent) fireEvent.click(screen.getByRole("button", { name: /我明白/ }));
    fireEvent.click(await screen.findByRole("button", { name: /停止 0s/ }));

    expect(socket.close).toHaveBeenCalledTimes(1);
    expect(socket.send).not.toHaveBeenCalled();
  });

  it("releases the microphone stream when recorder initialization fails", async () => {
    const stopTrack = vi.fn();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: stopTrack }],
        }),
      },
    });
    globalThis.MediaRecorder = class BrokenMediaRecorder {
      static isTypeSupported() {
        return true;
      }

      constructor() {
        throw new Error("recorder unavailable");
      }
    };
    renderInput();

    fireEvent.click(screen.getByRole("button", { name: "语音输入" }));
    const consent = screen.queryByRole("alertdialog");
    if (consent) fireEvent.click(screen.getByRole("button", { name: /我明白/ }));

    expect(await screen.findByText(/无法开始录音/)).toBeTruthy();
    expect(stopTrack).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("textbox", { name: "你的回应" }).disabled).toBe(false);
  });

  it("keeps authored text until the learner explicitly appends an uploaded transcript", async () => {
    speechMocks.getSpeechCapabilities.mockResolvedValue({
      ...capabilities,
      configured: true,
      uploadSupported: true,
    });
    speechMocks.transcribeAudio.mockResolvedValue({
      transcript: "请确认负责人同更新时间",
      detectedLanguage: "yue-HK",
      durationMs: 1200,
      transcriptionSource: "hkchat-speech",
      warnings: [],
    });
    const view = renderInput({ initialValue: "我会先核对影响范围" });
    await waitFor(() => expect(speechMocks.getSpeechCapabilities).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "上传录音" }));
    const consent = screen.queryByRole("alertdialog");
    if (consent) fireEvent.click(screen.getByRole("button", { name: /我明白/ }));
    fireEvent.change(view.container.querySelector('input[type="file"]'), {
      target: {
        files: [new File(["RIFFaudio"], "private-meeting.wav", { type: "audio/wav" })],
      },
    });

    expect(await screen.findByText(/文字区已有内容/)).toBeTruthy();
    const persistedUpload = storeMocks.saveAudioAsset.mock.calls.at(-1)[0];
    expect(persistedUpload.blob).toBeInstanceOf(Blob);
    expect(persistedUpload.blob).not.toBeInstanceOf(File);
    expect(persistedUpload.blob).not.toHaveProperty("name");
    expect(screen.getByRole("textbox", { name: "你的回应" }).value).toBe(
      "我会先核对影响范围",
    );
    fireEvent.click(screen.getByRole("button", { name: "追加" }));
    expect(screen.getByRole("textbox", { name: "你的回应" }).value).toBe(
      "我会先核对影响范围 请确认负责人同更新时间",
    );

    fireEvent.change(view.container.querySelector('input[type="file"]'), {
      target: {
        files: [new File(["RIFFaudio"], "second.wav", { type: "audio/wav" })],
      },
    });
    expect(await screen.findByText(/文字区已有内容/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "替换" }));
    expect(screen.getByRole("textbox", { name: "你的回应" }).value).toBe(
      "请确认负责人同更新时间",
    );
  });

  it("keeps an over-limit transcript intact and blocks it with a visible correction message", async () => {
    const longTranscript = "粤".repeat(161);
    speechMocks.getSpeechCapabilities.mockResolvedValue({
      ...capabilities,
      configured: true,
      uploadSupported: true,
    });
    speechMocks.transcribeAudio.mockResolvedValue({
      transcript: longTranscript,
      detectedLanguage: "yue-HK",
      durationMs: 1200,
      transcriptionSource: "hkchat-speech",
      warnings: [],
    });
    const view = renderInput();
    await waitFor(() => expect(speechMocks.getSpeechCapabilities).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "上传录音" }));
    const consent = screen.queryByRole("alertdialog");
    if (consent) fireEvent.click(screen.getByRole("button", { name: /我明白/ }));
    fireEvent.change(view.container.querySelector('input[type="file"]'), {
      target: {
        files: [new File(["RIFFaudio"], "voice.wav", { type: "audio/wav" })],
      },
    });

    expect(await screen.findByText(/转写超过 160 字/)).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "你的回应" }).value).toBe(longTranscript);
  });

  it("retries a failed transcription from the retained local recording", async () => {
    const retained = [];
    speechMocks.getSpeechCapabilities.mockResolvedValue({
      ...capabilities,
      configured: true,
      uploadSupported: true,
    });
    storeMocks.saveAudioAsset.mockImplementation(async (asset) => {
      retained.splice(0, retained.length, asset);
      return asset;
    });
    storeMocks.listAudioAssets.mockImplementation(async () => [...retained]);
    speechMocks.transcribeAudio
      .mockRejectedValueOnce(new Error("港话通暂时不可用"))
      .mockResolvedValueOnce({
        transcript: "重试后成功转写",
        detectedLanguage: "yue-HK",
        durationMs: 1200,
        transcriptionSource: "hkchat-speech",
        warnings: [],
      });
    const view = renderInput();
    await waitFor(() => expect(speechMocks.getSpeechCapabilities).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "上传录音" }));
    const consent = screen.queryByRole("alertdialog");
    if (consent) fireEvent.click(screen.getByRole("button", { name: /我明白/ }));
    fireEvent.change(view.container.querySelector('input[type="file"]'), {
      target: {
        files: [new File(["RIFFaudio"], "retry.wav", { type: "audio/wav" })],
      },
    });

    expect(await screen.findByText("港话通暂时不可用")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /本机录音 \(1\)/ }));
    fireEvent.click(await screen.findByRole("button", { name: "转写" }));

    expect(await screen.findByDisplayValue("重试后成功转写")).toBeTruthy();
    expect(speechMocks.transcribeAudio).toHaveBeenCalledTimes(2);
  });

  it("clears a stale transcript preview before a new transcription attempt", async () => {
    speechMocks.getSpeechCapabilities.mockResolvedValue({
      ...capabilities,
      configured: true,
      uploadSupported: true,
    });
    speechMocks.transcribeAudio
      .mockResolvedValueOnce({
        transcript: "第一段转写",
        detectedLanguage: "yue-HK",
        durationMs: 1200,
        transcriptionSource: "hkchat-speech",
        warnings: [],
      })
      .mockRejectedValueOnce(new Error("第二段没有可识别语音"));
    const view = renderInput();
    await waitFor(() => expect(speechMocks.getSpeechCapabilities).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "上传录音" }));
    const consent = screen.queryByRole("alertdialog");
    if (consent) fireEvent.click(screen.getByRole("button", { name: /我明白/ }));
    const fileInput = view.container.querySelector('input[type="file"]');
    fireEvent.change(fileInput, {
      target: {
        files: [new File(["RIFFaudio"], "first.wav", { type: "audio/wav" })],
      },
    });
    expect(await screen.findByDisplayValue("第一段转写")).toBeTruthy();
    expect(view.container.querySelector(".voice-live strong")?.textContent).toBe(
      "第一段转写",
    );

    fireEvent.change(fileInput, {
      target: {
        files: [new File(["RIFFaudio"], "silent.wav", { type: "audio/wav" })],
      },
    });

    expect(await screen.findByText("第二段没有可识别语音")).toBeTruthy();
    expect(view.container.querySelector(".voice-live")).toBeNull();
    expect(screen.getByRole("textbox", { name: "你的回应" }).value).toBe(
      "第一段转写",
    );
  });

  it("keeps a quota-failed recording in memory with an immediate download", async () => {
    storeMocks.saveAudioAsset.mockRejectedValueOnce(new Error("QuotaExceededError"));
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
    });
    renderInput();

    fireEvent.click(screen.getByRole("button", { name: "语音输入" }));
    const consent = screen.queryByRole("alertdialog");
    if (consent) fireEvent.click(screen.getByRole("button", { name: /我明白/ }));
    fireEvent.click(await screen.findByRole("button", { name: /停止 0s/ }));

    expect(await screen.findByText(/本机录音空间不足/)).toBeTruthy();
    expect(screen.getByRole("region", { name: "尚未保存的内存录音" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /下载/ }).getAttribute("href")).toBe(
      "blob:voice-test",
    );
    expect(screen.getByRole("textbox", { name: "你的回应" }).readOnly).toBe(false);
  });

  it("distinguishes an unavailable recording store from exhausted quota", async () => {
    storeMocks.saveAudioAsset.mockRejectedValueOnce(
      Object.assign(new Error("Blob storage is unavailable"), { name: "UnknownError" }),
    );
    speechMocks.getSpeechCapabilities.mockResolvedValue({
      ...capabilities,
      configured: true,
      uploadSupported: true,
    });
    speechMocks.transcribeAudio.mockRejectedValueOnce(new Error("没有可识别语音"));
    const view = renderInput();
    await waitFor(() => expect(speechMocks.getSpeechCapabilities).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "上传录音" }));
    const consent = screen.queryByRole("alertdialog");
    if (consent) fireEvent.click(screen.getByRole("button", { name: /我明白/ }));
    fireEvent.change(view.container.querySelector('input[type="file"]'), {
      target: {
        files: [new File(["RIFFaudio"], "voice.wav", { type: "audio/wav" })],
      },
    });

    expect(await screen.findByText(/本机录音库暂时不可用/)).toBeTruthy();
    expect(screen.getByRole("region", { name: "尚未保存的内存录音" })).toBeTruthy();
  });

  it("adopts a completed live transcript exactly once after recording stops", async () => {
    const socket = {
      readyState: WebSocket.OPEN,
      close: vi.fn(),
      send: vi.fn(),
    };
    speechMocks.getSpeechCapabilities.mockResolvedValue({
      ...capabilities,
      configured: true,
      liveSupported: true,
      uploadSupported: true,
    });
    speechMocks.createLiveSpeechSocket.mockReturnValue(socket);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
    });
    renderInput();
    await waitFor(() => expect(speechMocks.getSpeechCapabilities).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "语音输入" }));
    const consent = screen.queryByRole("alertdialog");
    if (consent) fireEvent.click(screen.getByRole("button", { name: /我明白/ }));
    fireEvent.click(await screen.findByRole("button", { name: /停止 0s/ }));

    socket.onmessage({
      data: JSON.stringify({ type: "final", sequence: 1, text: "请确认负责人" }),
    });
    socket.onmessage({
      data: JSON.stringify({
        type: "complete",
        transcript: "请确认负责人",
        source: "hkchat-speech",
      }),
    });

    expect(await screen.findByDisplayValue("请确认负责人")).toBeTruthy();
    await new Promise((resolve) => window.setTimeout(resolve, 1300));
    expect(screen.queryByText(/文字区已有内容/)).toBeNull();
    expect(screen.getByRole("textbox", { name: "你的回应" }).value).toBe(
      "请确认负责人",
    );
    expect(speechMocks.transcribeAudio).not.toHaveBeenCalled();
  });

  it("shows browser Cantonese interim text and keeps the final transcript without file ASR", async () => {
    const recognitionInstances = [];
    class FakeBrowserRecognition {
      constructor() {
        recognitionInstances.push(this);
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
    window.webkitSpeechRecognition = FakeBrowserRecognition;
    speechMocks.getSpeechCapabilities.mockResolvedValue({
      ...capabilities,
      configured: true,
      liveSupported: false,
      uploadSupported: true,
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
    });
    renderInput();
    await waitFor(() => expect(speechMocks.getSpeechCapabilities).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "语音输入" }));
    const consent = screen.queryByRole("alertdialog");
    if (consent) fireEvent.click(screen.getByRole("button", { name: /我明白/ }));
    await waitFor(() => expect(recognitionInstances).toHaveLength(1));
    const recognition = recognitionInstances[0];
    const interimResult = Object.assign([{ transcript: "我想确认负责人" }], {
      isFinal: false,
    });
    recognition.onresult({ resultIndex: 0, results: [interimResult] });

    expect(await screen.findByText("我想确认负责人")).toBeTruthy();
    expect(screen.getByText(/浏览器实时转写 · 实验性/)).toBeTruthy();

    const finalResult = Object.assign(
      [{ transcript: "我想确认负责人同更新时间" }],
      { isFinal: true },
    );
    recognition.onresult({ resultIndex: 0, results: [finalResult] });
    fireEvent.click(screen.getByRole("button", { name: /停止 0s/ }));
    recognition.onend();

    expect(await screen.findByDisplayValue("我想确认负责人同更新时间")).toBeTruthy();
    await new Promise((resolve) => window.setTimeout(resolve, 1600));
    expect(speechMocks.transcribeAudio).not.toHaveBeenCalled();
    expect(screen.queryByText(/文字区已有内容/)).toBeNull();
  });

  it("falls back to HKChat file transcription when browser live recognition fails", async () => {
    const recognitionInstances = [];
    class FailingBrowserRecognition {
      constructor() {
        recognitionInstances.push(this);
      }

      start() {}
      stop() {}
      abort() {}
    }
    window.webkitSpeechRecognition = FailingBrowserRecognition;
    speechMocks.getSpeechCapabilities.mockResolvedValue({
      ...capabilities,
      configured: true,
      liveSupported: false,
      uploadSupported: true,
    });
    speechMocks.transcribeAudio.mockResolvedValue({
      transcript: "港話通完成整段校準",
      transcriptionSource: "hkchat-speech",
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
    });
    renderInput();
    await waitFor(() => expect(speechMocks.getSpeechCapabilities).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "语音输入" }));
    const consent = screen.queryByRole("alertdialog");
    if (consent) fireEvent.click(screen.getByRole("button", { name: /我明白/ }));
    await waitFor(() => expect(recognitionInstances).toHaveLength(1));

    recognitionInstances[0].onerror({ error: "network" });
    recognitionInstances[0].onend();
    expect(await screen.findByText(/浏览器实时识别中断/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /停止 0s/ }));
    await waitFor(() => expect(speechMocks.transcribeAudio).toHaveBeenCalledTimes(1));
    expect(await screen.findByDisplayValue("港話通完成整段校準")).toBeTruthy();
    expect(screen.getByText(/港话通语音转写/)).toBeTruthy();
  });
});
