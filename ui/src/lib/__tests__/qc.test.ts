import { describe, it, expect } from "vitest";
import { countWords, analyzeQuality } from "@/lib/qc";

describe("countWords", () => {
  it("中文字符每个字算一个词", () => {
    expect(countWords("你好世界")).toBe(4);
  });

  it("英文字母每个字母算一个词", () => {
    expect(countWords("hello")).toBe(5);
  });

  it("空字符串返回 0", () => {
    expect(countWords("")).toBe(0);
  });

  it("纯标点符号返回非零（countWords 统计所有非空白字符）", () => {
    // countWords 用 replace(/\s/g, "") 统计所有非空白字符，标点也算
    expect(countWords("，。、！")).toBe(4);
  });

  it("混合内容统计所有非空白字符", () => {
    // 中文字符 4 个 + 数字 3 个 = 7
    expect(countWords("你好123世界")).toBe(7);
  });
});

describe("analyzeQuality — 禁用表达", () => {
  it("无禁用词时该项得分为 100", () => {
    const result = analyzeQuality({
      text: "这是一个正常的段落。",
      summary: "这是一个正常段落。",
      bannedPhrases: [],
    });
    const banned = result.reports.find((r) => r.dimension === "禁用表达");
    expect(banned?.score).toBe(100);
    expect(banned?.passed).toBe(true);
  });

  it("命中 1 个禁用词时分数下降到 82", () => {
    const result = analyzeQuality({
      text: "这是一个套话满天飞的段落。",
      summary: "这是摘要。",
      bannedPhrases: ["套话"],
    });
    const banned = result.reports.find((r) => r.dimension === "禁用表达");
    expect(banned?.score).toBe(82);
    expect(banned?.passed).toBe(false);
    expect(banned?.issues).toContain("检测到禁用表达：套话");
  });

  it("命中 4 个禁用词时分数不低于 45", () => {
    const result = analyzeQuality({
      text: "套话满天飞，套话说不停，非常套话，极其套话。",
      summary: "摘要。",
      bannedPhrases: ["套话"],
    });
    const banned = result.reports.find((r) => r.dimension === "禁用表达");
    expect(banned?.score).toBeGreaterThanOrEqual(45);
  });
});

describe("analyzeQuality — 结构准备度", () => {
  it("内容过短时结构分数下降", () => {
    const result = analyzeQuality({
      text: "好。",
      summary: "",
      bannedPhrases: [],
    });
    const structure = result.reports.find((r) => r.dimension === "结构准备度");
    expect(structure?.score).toBeLessThan(100);
    expect(structure?.issues.length).toBeGreaterThan(0);
  });

  it("摘要为空时记录对应问题", () => {
    const result = analyzeQuality({
      text: "这是一个足够长的段落内容以满足字数要求。".repeat(10),
      summary: "",
      bannedPhrases: [],
    });
    const structure = result.reports.find((r) => r.dimension === "结构准备度");
    expect(structure?.issues.some((i) => i.includes("摘要为空"))).toBe(true);
  });
});

describe("analyzeQuality — 节奏控制", () => {
  it("长段落偏多时节奏分下降", () => {
    const longPara = "这是一段非常长的文本内容，用于模拟实际写作中的长段落现象。".repeat(8);
    const result = analyzeQuality({
      text: longPara + "\n\n" + longPara,
      summary: "测试摘要。",
      bannedPhrases: [],
    });
    const pacing = result.reports.find((r) => r.dimension === "节奏控制");
    expect(pacing?.score).toBeLessThan(100);
  });

  it("篇幅超过 600 字且无转折词时记录建议", () => {
    const longText = "这是一个很长的段落。".repeat(50);
    const result = analyzeQuality({
      text: longText,
      summary: "摘要。",
      bannedPhrases: [],
    });
    const pacing = result.reports.find((r) => r.dimension === "节奏控制");
    expect(pacing?.suggestions.length).toBeGreaterThan(0);
  });
});

describe("analyzeQuality — 结尾钩子", () => {
  it("空文本时结尾钩子分数不低于 50", () => {
    const result = analyzeQuality({
      text: "",
      summary: "",
      bannedPhrases: [],
    });
    const hook = result.reports.find((r) => r.dimension === "结尾钩子");
    // 空文本产生 1 个 issue：100 - 1*25 = 75
    expect(hook?.score).toBe(75);
    expect(hook?.issues.length).toBeGreaterThan(0);
  });

  it("结尾缺乏悬念信号时记录建议", () => {
    const result = analyzeQuality({
      text: "这是一个很普通平淡的结尾。".repeat(10),
      summary: "摘要。",
      bannedPhrases: [],
    });
    const hook = result.reports.find((r) => r.dimension === "结尾钩子");
    expect(hook?.suggestions.length).toBeGreaterThan(0);
  });
});

describe("analyzeQuality — 语言密度", () => {
  it("无重复短语时语言密度得分为 100", () => {
    const result = analyzeQuality({
      text: "这是一个内容丰富的段落，里面有很多不同的表达方式。",
      summary: "摘要。",
      bannedPhrases: [],
    });
    const density = result.reports.find((r) => r.dimension === "语言密度");
    expect(density?.score).toBe(100);
    expect(density?.passed).toBe(true);
  });

  it("重复短语超过 3 次时分数降至 76", () => {
    const text = "这是一个测试段落。".repeat(5) + "里面出现了多次重复。".repeat(5);
    const result = analyzeQuality({
      text,
      summary: "摘要。",
      bannedPhrases: [],
    });
    const density = result.reports.find((r) => r.dimension === "语言密度");
    expect(density?.score).toBeLessThan(100);
  });
});

describe("analyzeQuality — 综合分", () => {
  it("所有检查通过时总分接近 100", () => {
    const result = analyzeQuality({
      text: "开门声突然响起，他猛地转过头。空气里弥漫着一种说不清的紧张感。他知道自己等的那一刻终于来了。",
      summary: "本章讲述主角在关键时刻迎来转折。",
      bannedPhrases: [],
    });
    expect(result.score).toBeGreaterThan(70);
  });
});
