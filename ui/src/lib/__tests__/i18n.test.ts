import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatRelativeDate,
  providerModeLabel,
  uiText,
} from "@/lib/i18n";

describe("i18n helpers", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the correct localized copy", () => {
    expect(uiText("zh-CN", "中文", "English")).toBe("中文");
    expect(uiText("en", "中文", "English")).toBe("English");
  });

  it("formats relative dates in both languages", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-31T12:00:00Z"));

    expect(formatRelativeDate("2026-03-31T11:30:00Z", "zh-CN")).toBe("30 分钟前");
    expect(formatRelativeDate("2026-03-31T11:30:00Z", "en")).toBe("30 min ago");
  });

  it("labels provider modes cleanly", () => {
    expect(providerModeLabel("zh-CN", "openai-compatible")).toBe("OpenAI 兼容");
    expect(providerModeLabel("en", "mock-fallback")).toBe("Mock fallback");
  });
});
