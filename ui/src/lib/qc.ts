import type { QCReport } from "@/lib/modeling";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function countWords(text: string) {
  return text.replace(/\s/g, "").length;
}

export function analyzeQuality(input: {
  text: string;
  summary: string;
  bannedPhrases: string[];
}): { reports: QCReport[]; score: number } {
  const { text, summary, bannedPhrases } = input;
  const reports: QCReport[] = [];
  const words = countWords(text);

  const bannedIssues = bannedPhrases.filter((phrase) => phrase && text.includes(phrase));
  reports.push({
    dimension: "禁用表达",
    score: bannedIssues.length === 0 ? 100 : Math.max(45, 100 - bannedIssues.length * 18),
    issues: bannedIssues.map((phrase) => `检测到禁用表达：${phrase}`),
    suggestions:
      bannedIssues.length > 0 ? ["替换套话和高频口头禅，保留更具体的表达。"] : [],
    passed: bannedIssues.length === 0,
  });

  const structureIssues: string[] = [];
  if (words < 180) {
    structureIssues.push("正文偏短，当前内容更像草稿片段，建议补足完整场景推进。");
  }
  if (!summary.trim()) {
    structureIssues.push("本章摘要为空，后续 AI 辅助时上下文会比较弱。");
  }
  reports.push({
    dimension: "结构准备度",
    score: Math.max(50, 100 - structureIssues.length * 20),
    issues: structureIssues,
    suggestions:
      structureIssues.length > 0 ? ["补充章节摘要，并明确这章的推进目标和收尾钩子。"] : [],
    passed: structureIssues.length === 0,
  });

  const paragraphs = text.split(/\n{2,}/).filter((item) => item.trim());
  const pacingIssues: string[] = [];
  if (paragraphs.length > 0) {
    const longParagraphs = paragraphs.filter((item) => item.replace(/\n/g, "").length > 180);
    if (longParagraphs.length / paragraphs.length > 0.5) {
      pacingIssues.push("长段落偏多，阅读节奏容易发闷。");
    }
  }
  if (words > 600 && !/(突然|就在这时|然而|却|但下一秒|不料)/.test(text)) {
    pacingIssues.push("篇幅已经拉开，但转折信号偏少。");
  }
  reports.push({
    dimension: "节奏控制",
    score: Math.max(52, 100 - pacingIssues.length * 22),
    issues: pacingIssues,
    suggestions:
      pacingIssues.length > 0 ? ["适当切段，并在中后段补一个动作、信息差或情绪转折点。"] : [],
    passed: pacingIssues.length === 0,
  });

  const hookIssues: string[] = [];
  const lastSentence = text.split(/[。！？!?]/).filter(Boolean).pop()?.trim() ?? "";
  if (!lastSentence) {
    hookIssues.push("当前还没有稳定的章节收尾。");
  } else if (!/(？|！|危险|秘密|答案|门|脚步|来不及|忽然|却)/.test(lastSentence)) {
    hookIssues.push("章节结尾的悬念偏弱。");
  }
  reports.push({
    dimension: "结尾钩子",
    score: Math.max(55, 100 - hookIssues.length * 25),
    issues: hookIssues,
    suggestions:
      hookIssues.length > 0 ? ["用更具体的危机、发现或信息差来完成收尾。"] : [],
    passed: hookIssues.length === 0,
  });

  const repeatedIssues: string[] = [];
  const fragments = text.match(/[\u4e00-\u9fa5A-Za-z]{4,8}/g) ?? [];
  const repeatedFragment = Array.from(new Set(fragments)).find((fragment) => {
    const matches = text.match(new RegExp(escapeRegExp(fragment), "g")) ?? [];
    return matches.length > 3;
  });
  if (repeatedFragment) {
    repeatedIssues.push(`局部重复偏多：${repeatedFragment}`);
  }
  reports.push({
    dimension: "语言密度",
    score: repeatedIssues.length === 0 ? 100 : 76,
    issues: repeatedIssues,
    suggestions:
      repeatedIssues.length > 0 ? ["替换高频短语，避免连续段落使用相同发力方式。"] : [],
    passed: repeatedIssues.length === 0,
  });

  const score = Math.round(reports.reduce((sum, item) => sum + item.score, 0) / reports.length);
  return { reports, score };
}
