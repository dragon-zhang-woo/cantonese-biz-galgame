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

function ControlledInput() {
  const [value, setValue] = useState("");
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

function renderInput() {
  return render(<ControlledInput />);
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
});

afterEach(() => cleanup());

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
});
