// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JudgeShowcase } from "./JudgeShowcase.jsx";
import {
  preparedShowcaseCustomInput,
  preparedShowcasePracticeResponse,
} from "../data/judgeShowcase.js";

afterEach(() => cleanup());

describe("JudgeShowcase", () => {
  it("walks through mainline, practice, custom scenario and review without persistence", () => {
    const storageWrite = vi.spyOn(Storage.prototype, "setItem");
    render(<JudgeShowcase onClose={vi.fn()} onEnterCampaign={vi.fn()} />);

    expect(screen.getByText("同一句粤语，先看关系与任务")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /看专题训练/ }));

    const practiceInput = screen.getByRole("textbox", { name: "预置演示回应（可编辑）" });
    expect(practiceInput.value).toBe(preparedShowcasePracticeResponse);
    fireEvent.click(screen.getByRole("button", { name: /展示离线参考反馈/ }));
    fireEvent.click(screen.getByRole("button", { name: /看现实情境/ }));

    const customInput = screen.getByRole("textbox", { name: /自定义现实情境/ });
    expect(customInput.value).toBe(preparedShowcaseCustomInput);
    fireEvent.click(screen.getByRole("button", { name: /生成匿名演示训练/ }));
    expect(screen.getByText("跨部门伙伴")).toBeTruthy();
    expect(screen.getByText("柔性跟进")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /进入危机抉择/ }));

    fireEvent.click(screen.getByRole("button", { name: /承担核对/ }));
    fireEvent.click(screen.getByRole("button", { name: /看学习复盘/ }));
    expect(screen.getByText("把一句“可以试”写成可执行承诺")).toBeTruthy();
    expect(storageWrite).not.toHaveBeenCalled();
    storageWrite.mockRestore();
  });

  it("invalidates the custom preview after editing until it is generated again", () => {
    render(<JudgeShowcase onClose={vi.fn()} onEnterCampaign={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /看专题训练/ }));
    fireEvent.click(screen.getByRole("button", { name: /展示离线参考反馈/ }));
    fireEvent.click(screen.getByRole("button", { name: /看现实情境/ }));
    fireEvent.click(screen.getByRole("button", { name: /生成匿名演示训练/ }));

    const next = screen.getByRole("button", { name: /进入危机抉择/ });
    expect(next.disabled).toBe(false);
    fireEvent.change(screen.getByRole("textbox", { name: /自定义现实情境/ }), {
      target: { value: `${preparedShowcaseCustomInput} 请再确认一次。` },
    });
    expect(next.disabled).toBe(true);
  });
});
