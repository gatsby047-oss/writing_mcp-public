// 通用工具函数

export function now(): string {
  return new Date().toISOString();
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function splitSentences(text: string): string[] {
  return text
    .split(/[。！？!?]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function hasOutlineContent(outline: {
  opening: string;
  development: string;
  turn: string;
  endingHook: string;
} | null): boolean {
  if (!outline) return false;
  return !!(outline.opening || outline.development || outline.turn || outline.endingHook);
}
