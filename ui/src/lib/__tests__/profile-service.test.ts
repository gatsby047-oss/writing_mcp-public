import { describe, it, expect } from "vitest";
import { inferLearning, mergeSignals, detectFingerprint } from "@/lib/server/profile-service";
import type { LearnProfileRequest } from "@/lib/modeling";

describe("mergeSignals — 权重合并逻辑", () => {
  it("权重相加不超过上限 10", () => {
    const existing = [{ label: "偏好A", weight: 7, reason: "原因A" }];
    const next = [{ label: "偏好A", weight: 5, reason: "原因B" }];
    const result = mergeSignals(existing, next);
    const signal = result.find((s) => s.label === "偏好A");
    expect(signal?.weight).toBeLessThanOrEqual(10);
  });

  it("相同标签的信号合并时保留最新 reason", () => {
    const existing = [{ label: "偏好B", weight: 3, reason: "旧原因" }];
    const next = [{ label: "偏好B", weight: 4, reason: "新原因" }];
    const result = mergeSignals(existing, next);
    const signal = result.find((s) => s.label === "偏好B");
    expect(signal?.reason).toBe("新原因");
  });

  it("不同标签的信号合并时保留双方", () => {
    const existing = [{ label: "偏好A", weight: 3, reason: "原因A" }];
    const next = [{ label: "偏好B", weight: 4, reason: "原因B" }];
    const result = mergeSignals(existing, next);
    expect(result).toHaveLength(2);
  });

  it("结果按权重降序排列", () => {
    const existing: Parameters<typeof mergeSignals>[0] = [];
    const next = [
      { label: "低", weight: 2, reason: "" },
      { label: "高", weight: 9, reason: "" },
      { label: "中", weight: 5, reason: "" },
    ];
    const result = mergeSignals(existing, next);
    expect(result[0].label).toBe("高");
    expect(result[1].label).toBe("中");
    expect(result[2].label).toBe("低");
  });

  it("结果最多保留 8 个信号", () => {
    const existing: Parameters<typeof mergeSignals>[0] = [];
    const next = Array.from({ length: 15 }, (_, i) => ({
      label: `偏好${i}`,
      weight: i + 1,
      reason: "",
    }));
    const result = mergeSignals(existing, next);
    expect(result.length).toBeLessThanOrEqual(8);
  });
});

describe("detectFingerprint — 叙述视角", () => {
  it("第一人称代词为主时识别为第一人称叙述", () => {
    const fp = detectFingerprint(
      "我走进房间，我觉得这件事不应该这样结束，我们都应该冷静下来思考。".repeat(5)
    );
    expect(fp.narrativePerspective).toBe("第一人称贴身叙述");
  });

  it("第三人称代词为主时识别为第三人称叙述", () => {
    const fp = detectFingerprint(
      "他走进房间，她觉得这件事不应该这样结束，他们都应该冷静下来。".repeat(5)
    );
    expect(fp.narrativePerspective).toBe("第三人称观察叙述");
  });

  it("空文本返回默认视角", () => {
    const fp = detectFingerprint("");
    expect(fp.narrativePerspective).toBe("视角相对灵活");
  });
});

describe("detectFingerprint — 句式节奏", () => {
  it("句子较短时识别为短句推进", () => {
    const fp = detectFingerprint("他走。他停。他看。".repeat(10));
    expect(fp.sentenceRhythm).toBe("短句推进");
  });

  it("句子较长时识别为长句铺陈", () => {
    const fp = detectFingerprint(
      "在经历了一系列复杂而又漫长的内心挣扎与外部环境的双重压迫之后，人物最终做出了一个出人意料却又合情合理的选择。".repeat(8)
    );
    expect(fp.sentenceRhythm).toBe("长句铺陈");
  });
});

describe("detectFingerprint — 对话密度", () => {
  it("对话密集时识别为对话驱动", () => {
    const text = `"你好。"他说。
"你好。"她回答。
"你还好吗？"他问。
"我很好。"她说。
"那就好。"他笑了笑。`.repeat(5);
    const fp = detectFingerprint(text);
    expect(fp.dialoguePreference).toBe("对话驱动");
  });

  it("对话稀少时识别为叙述驱动", () => {
    const fp = detectFingerprint("他慢慢走进了那个房间，空气里弥漫着一种说不清的气息。".repeat(10));
    expect(fp.dialoguePreference).toBe("叙述驱动");
  });
});

describe("detectFingerprint — 情绪气质", () => {
  it("悬疑关键词多时识别为悬疑压迫", () => {
    const fp = detectFingerprint(
      "突然门后传来脚步声，然而事情并不像他想象的那样，突然的变故让他感到危险，然而这一切都不对劲。".repeat(6)
    );
    expect(fp.emotionalRegister).toBe("悬疑压迫");
  });

  it("情绪词密集时识别为情绪外放", () => {
    const fp = detectFingerprint(
      "他感到心跳加速，呼吸变得急促，难过与愤怒同时涌上来，整个人都陷入了慌乱之中，然而内心深处又有一丝温柔在涌动。".repeat(6)
    );
    expect(fp.emotionalRegister).toBe("情绪外放");
  });
});

describe("inferLearning — 文本变化检测", () => {
  function makeRequest(
    before: string,
    after: string,
    source: LearnProfileRequest["source"]
  ): LearnProfileRequest {
    return { source, beforeText: before, afterText: after };
  }

  it("接受润色后产生偏好顺滑表达的信号", () => {
    const result = inferLearning(
      makeRequest(
        "他慢慢走进了那个房间。",
        "他慢慢走进了那个房间。",
        "accepted_polish"
      )
    );
    expect(result.learned.some((l) => l.includes("顺滑"))).toBe(true);
    expect(result.preferenceSignals.some((s) => s.label.includes("顺滑"))).toBe(true);
  });

  it("压缩超过 12% 时推断偏好精炼表达", () => {
    const result = inferLearning(
      makeRequest(
        "这是一个很长的冗余段落，里面有很多不必要的重复表达和啰嗦的描述。",
        "这是一个精炼的段落。",
        "accepted_polish"
      )
    );
    expect(result.preferenceSignals.some((s) => s.label.includes("利落"))).toBe(true);
    expect(result.avoidanceSignals.some((s) => s.label.includes("拖沓"))).toBe(true);
  });

  it("扩写超过 12% 时推断偏好补足场景层次", () => {
    const result = inferLearning(
      makeRequest(
        "他走进房间。",
        "他推开那扇沉重的木门，房间里弥漫着陈旧的气息，窗外的光线透过纱帘洒在地板上，尘埃在光柱中缓缓漂浮。",
        "accepted_generation"
      )
    );
    expect(result.preferenceSignals.some((s) => s.label.includes("场景层次"))).toBe(true);
  });

  it("接受续写时推断偏好延展式续写（记录在 preferenceSignals）", () => {
    const result = inferLearning(
      makeRequest("他走进房间。", "他走进房间。门在身后关上了。", "accepted_generation")
    );
    expect(result.learned.some((l) => l.includes("愿意接受"))).toBe(true);
    expect(result.preferenceSignals.some((s) => s.label.includes("延展式续写"))).toBe(true);
  });

  it("手动反馈时记录主动标记行为（记录在 preferenceSignals）", () => {
    const result = inferLearning(
      makeRequest("", "这是一段我非常满意的风格样本。", "manual_feedback")
    );
    expect(result.learned.some((l) => l.includes("主动提交"))).toBe(true);
    expect(result.preferenceSignals.some((s) => s.label.includes("主动标记"))).toBe(true);
  });

  it("对话明显增加时推断偏好对话推进", () => {
    const result = inferLearning(
      makeRequest(
        "他走进房间。他坐下来。他开始思考。",
        `"你好。"她说。"你好。"他回答。"我们需要谈谈。"她说。`,
        "accepted_polish"
      )
    );
    expect(result.preferenceSignals.some((s) => s.label.includes("对话推进"))).toBe(true);
  });

  it("采纳结果含悬疑转折词时推断偏好悬念式推进", () => {
    const result = inferLearning(
      makeRequest(
        "他走进房间，一切看起来很正常。",
        "他走进房间，然而就在这时，门后传来一阵脚步声，不料事情已经失控。",
        "accepted_generation"
      )
    );
    expect(result.preferenceSignals.some((s) => s.label.includes("悬念"))).toBe(true);
  });

  it("原文为空时不 crash 并正常返回结果", () => {
    const result = inferLearning(makeRequest("", "这是一个新增的段落。", "manual_feedback"));
    expect(result.learned).toBeDefined();
    expect(result.preferenceSignals).toBeDefined();
  });

  it("文本无显著变化时至少返回一个默认学习信息", () => {
    const result = inferLearning(
      makeRequest("这是一段内容。", "这是一段内容。", "accepted_polish")
    );
    expect(result.learned.length).toBeGreaterThan(0);
  });
});
