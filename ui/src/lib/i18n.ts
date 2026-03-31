"use client";

import type { ChapterStatus, LearningSource, ModelMode, ProviderMode } from "@/lib/modeling";

export type UILanguage = "zh-CN" | "en";

export const DEFAULT_UI_LANGUAGE: UILanguage = "zh-CN";

export function uiText<T>(language: UILanguage, zh: T, en: T): T {
  return language === "en" ? en : zh;
}

export function localeForLanguage(language: UILanguage) {
  return language === "en" ? "en-US" : "zh-CN";
}

export function formatDateTime(
  value: string,
  language: UILanguage,
  options: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat(localeForLanguage(language), options).format(new Date(value));
}

export function formatRelativeDate(value: string, language: UILanguage) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return uiText(language, "刚刚", "Just now");
  if (minutes < 60) return uiText(language, `${minutes} 分钟前`, `${minutes} min ago`);
  if (hours < 24) return uiText(language, `${hours} 小时前`, `${hours} hr ago`);
  if (days < 30) return uiText(language, `${days} 天前`, `${days} d ago`);

  return formatDateTime(value, language, {
    month: "short",
    day: "numeric",
  });
}

export function providerModeLabel(
  language: UILanguage,
  mode: ProviderMode | ModelMode | "openai-compatible"
) {
  switch (mode) {
    case "mock":
      return "Mock";
    case "mock-fallback":
      return uiText(language, "Mock 兜底", "Mock fallback");
    case "openai-compatible":
      return uiText(language, "OpenAI 兼容", "OpenAI compatible");
    default:
      return "Mock";
  }
}

export function chapterStatusLabel(language: UILanguage, status: ChapterStatus) {
  switch (status) {
    case "draft":
      return uiText(language, "草稿", "Draft");
    case "review":
      return uiText(language, "审阅", "In review");
    case "complete":
      return uiText(language, "完成", "Complete");
    default:
      return status;
  }
}

export function learningSourceLabel(language: UILanguage, source: LearningSource) {
  switch (source) {
    case "accepted_generation":
      return uiText(language, "采纳生成结果", "Accepted generation");
    case "accepted_polish":
      return uiText(language, "采纳润色结果", "Accepted polish");
    case "manual_feedback":
      return uiText(language, "手动投喂样本", "Manual sample");
    case "edited_after_ai":
      return uiText(language, "基于 AI 结果再编辑", "Edited after AI");
    default:
      return source;
  }
}
