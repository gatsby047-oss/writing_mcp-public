import type {
  LearnProfileRequest,
  LearnProfileResponse,
  LearningEvent,
  ProfilePatch,
  SignalScore,
  StyleFingerprint,
  UserProfile,
} from "@/lib/modeling";
import { readJsonFile, writeJsonFile } from "@/lib/server/local-store";
import { now, createId, splitSentences } from "@/lib/utils";

interface StoredProfileState {
  profile: UserProfile;
  undoStack: UserProfile[];
}

const fileName = "profile-state.json";

/** Chains all write operations to prevent concurrent-read-write races. */
let writeQueue: Promise<unknown> = Promise.resolve();

function enqueueWrite<T>(operation: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(operation);
  writeQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

function defaultFingerprint(): StyleFingerprint {
  return {
    narrativePerspective: "尚未形成稳定偏好",
    pacing: "平衡推进",
    sentenceRhythm: "长短句混合",
    detailDensity: "适中",
    dialoguePreference: "叙述与对话均衡",
    emotionalRegister: "克制理性",
    revisionBias: [],
  };
}

function createDefaultProfile(): UserProfile {
  return {
    id: "single-user-profile",
    version: 1,
    enabled: true,
    autoLearningEnabled: true,
    styleFingerprint: defaultFingerprint(),
    preferenceSignals: [],
    avoidanceSignals: [],
    recentLearningEvents: [],
    updatedAt: now(),
  };
}

function createDefaultState(): StoredProfileState {
  return {
    profile: createDefaultProfile(),
    undoStack: [],
  };
}

function cloneProfile(profile: UserProfile) {
  return JSON.parse(JSON.stringify(profile)) as UserProfile;
}

async function readProfileState() {
  return readJsonFile(fileName, createDefaultState());
}

async function writeProfileState(state: StoredProfileState) {
  await writeJsonFile(fileName, state);
}

export function mergeSignals(existing: SignalScore[], next: SignalScore[]) {
  const merged = new Map<string, SignalScore>();
  for (const signal of existing) {
    merged.set(signal.label, { ...signal });
  }
  for (const signal of next) {
    const current = merged.get(signal.label);
    if (current) {
      merged.set(signal.label, {
        label: signal.label,
        weight: Math.min(10, current.weight + signal.weight),
        reason: signal.reason,
      });
    } else {
      merged.set(signal.label, signal);
    }
  }
  return Array.from(merged.values()).sort((a, b) => b.weight - a.weight).slice(0, 8);
}

export function keywordHits(text: string, keywords: string[]) {
  return keywords.reduce((sum, keyword) => sum + (text.includes(keyword) ? 1 : 0), 0);
}

export function detectFingerprint(text: string): StyleFingerprint {
  const sentences = splitSentences(text);
  const avgSentenceLength =
    sentences.length === 0
      ? 0
      : Math.round(
          sentences.reduce((sum, sentence) => sum + sentence.length, 0) / sentences.length
        );
  const paragraphCount = text.split(/\n{2,}/).filter((item) => item.trim()).length;
  const quoteCount = (text.match(/[“”"'「」]/g) ?? []).length;
  const firstPerson = (text.match(/我|我们/g) ?? []).length;
  const thirdPerson = (text.match(/他|她|他们|她们/g) ?? []).length;
  const suspenseHits = keywordHits(text, [
    "突然",
    "然而",
    "却",
    "不料",
    "隐约",
    "门后",
    "脚步",
    "危险",
  ]);
  const emotionalHits = keywordHits(text, [
    "心跳",
    "呼吸",
    "难过",
    "愤怒",
    "慌乱",
    "温柔",
    "压抑",
  ]);
  const detailHits = keywordHits(text, [
    "光",
    "影",
    "风",
    "雨",
    "气味",
    "颜色",
    "声音",
    "触感",
    "温度",
  ]);

  return {
    narrativePerspective:
      firstPerson > thirdPerson * 1.2
        ? "第一人称贴身叙述"
        : thirdPerson > firstPerson
          ? "第三人称观察叙述"
          : "视角相对灵活",
    pacing:
      paragraphCount >= 5 && avgSentenceLength < 20
        ? "轻快推进"
        : avgSentenceLength > 28
          ? "慢铺陈"
          : suspenseHits >= 2
            ? "悬念驱动"
            : "平衡推进",
    sentenceRhythm:
      avgSentenceLength <= 16
        ? "短句推进"
        : avgSentenceLength >= 28
          ? "长句铺陈"
          : "长短句混合",
    detailDensity: detailHits >= 4 ? "细节偏浓" : detailHits >= 2 ? "细节适中" : "细节克制",
    dialoguePreference:
      quoteCount >= 8 ? "对话驱动" : quoteCount >= 3 ? "对话与叙述均衡" : "叙述驱动",
    emotionalRegister:
      suspenseHits >= 2
        ? "悬疑压迫"
        : emotionalHits >= 4
          ? "情绪外放"
          : emotionalHits >= 2
            ? "细腻内敛"
            : "克制理性",
    revisionBias: [],
  };
}

export function inferLearning(input: LearnProfileRequest) {
  const beforeText = input.beforeText ?? "";
  const afterText = input.afterText;
  const beforeLength = beforeText.trim().length;
  const afterLength = afterText.trim().length;
  const beforeParagraphs = beforeText.split(/\n{2,}/).filter((item) => item.trim()).length;
  const afterParagraphs = afterText.split(/\n{2,}/).filter((item) => item.trim()).length;
  const beforeDialogue = (beforeText.match(/[“”"'「」]/g) ?? []).length;
  const afterDialogue = (afterText.match(/[“”"'「」]/g) ?? []).length;

  const learned: string[] = [];
  const preferenceSignals: SignalScore[] = [];
  const avoidanceSignals: SignalScore[] = [];

  if (input.source === "accepted_polish") {
    learned.push("愿意接受更顺滑、更稳定的语句打磨");
    preferenceSignals.push({
      label: "偏好更顺滑的表达",
      weight: 2,
      reason: "你接受了一次润色结果",
    });
  }

  if (input.source === "accepted_generation") {
    learned.push("愿意接受在原文基础上继续向前推进的创作方式");
    preferenceSignals.push({
      label: "偏好延展式续写",
      weight: 2,
      reason: "你接受了一次续写结果",
    });
  }

  if (input.source === "manual_feedback") {
    learned.push("主动提交了一份希望系统学习的风格样本");
    preferenceSignals.push({
      label: "主动标记风格样本",
      weight: 2,
      reason: "你手动提交了这段文本",
    });
  }

  if (beforeLength > 0 && afterLength < beforeLength * 0.88) {
    learned.push("倾向压缩冗余说明");
    preferenceSignals.push({
      label: "偏好更利落的表达",
      weight: 3,
      reason: "采纳后的文本明显更精炼",
    });
    avoidanceSignals.push({
      label: "避免拖沓复述",
      weight: 2,
      reason: "你没有保留原来的冗长表达",
    });
  }

  if (afterLength > beforeLength * 1.12) {
    learned.push("倾向扩写场景或情绪层次");
    preferenceSignals.push({
      label: "偏好补足场景层次",
      weight: 2,
      reason: "采纳后的文本长度明显增加",
    });
  }

  if (afterParagraphs > beforeParagraphs && afterParagraphs >= 3) {
    learned.push("偏好更轻、更易读的段落节奏");
    preferenceSignals.push({
      label: "偏好更轻的分段",
      weight: 2,
      reason: "采纳后的文本分段更加清晰",
    });
  }

  if (afterDialogue > beforeDialogue + 2) {
    learned.push("偏好更强的对话驱动感");
    preferenceSignals.push({
      label: "偏好对话推进",
      weight: 2,
      reason: "采纳后的文本对话占比更高",
    });
  }

  if (/(突然|却|然而|不料|就在这时|门后|脚步)/.test(afterText)) {
    learned.push("偏好带转折或悬念的收尾方式");
    preferenceSignals.push({
      label: "偏好悬念式推进",
      weight: 2,
      reason: "采纳后的文本带有明显转折或悬念词",
    });
  }

  if (learned.length === 0) {
    learned.push("系统捕捉到一份新的风格样本，正在微调整体画像");
  }

  return {
    fingerprint: detectFingerprint(afterText),
    learned,
    preferenceSignals,
    avoidanceSignals,
  };
}

export function summarizeProfile(profile: UserProfile) {
  const topPreferences = profile.preferenceSignals.slice(0, 3).map((item) => item.label);
  return [
    `叙述视角：${profile.styleFingerprint.narrativePerspective}`,
    `节奏偏好：${profile.styleFingerprint.pacing}`,
    `句式倾向：${profile.styleFingerprint.sentenceRhythm}`,
    topPreferences.length > 0
      ? `偏好信号：${topPreferences.join("、")}`
      : "偏好信号仍在积累",
  ].join("；");
}

export function buildPersonaPrompt(profile: UserProfile) {
  const lines = [
    "用户画像摘要：",
    `- 叙述视角：${profile.styleFingerprint.narrativePerspective}`,
    `- 节奏：${profile.styleFingerprint.pacing}`,
    `- 句式：${profile.styleFingerprint.sentenceRhythm}`,
    `- 细节密度：${profile.styleFingerprint.detailDensity}`,
    `- 对话倾向：${profile.styleFingerprint.dialoguePreference}`,
    `- 情绪气质：${profile.styleFingerprint.emotionalRegister}`,
  ];

  if (profile.preferenceSignals.length > 0) {
    lines.push(
      `- 正向偏好：${profile.preferenceSignals
        .slice(0, 4)
        .map((item) => item.label)
        .join("、")}`
    );
  }

  if (profile.avoidanceSignals.length > 0) {
    lines.push(
      `- 尽量避免：${profile.avoidanceSignals
        .slice(0, 3)
        .map((item) => item.label)
        .join("、")}`
    );
  }

  if (profile.styleFingerprint.revisionBias.length > 0) {
    lines.push(
      `- 修订倾向：${profile.styleFingerprint.revisionBias.join("；")}`
    );
  }

  return lines.join("\n");
}

export async function getUserProfile() {
  const state = await readProfileState();
  return state.profile;
}

export async function updateUserProfile(patch: ProfilePatch) {
  const state = await readProfileState();
  state.profile = {
    ...state.profile,
    enabled: patch.enabled ?? state.profile.enabled,
    autoLearningEnabled:
      patch.autoLearningEnabled ?? state.profile.autoLearningEnabled,
    updatedAt: now(),
  };
  await writeProfileState(state);
  return state.profile;
}

export async function listLearningHistory() {
  const state = await readProfileState();
  return state.profile.recentLearningEvents;
}

async function writeLearn(input: LearnProfileRequest): Promise<LearnProfileResponse> {
  const state = await readProfileState();
  const profileBefore = cloneProfile(state.profile);
  const result = inferLearning(input);

  const event: LearningEvent = {
    id: createId("learning"),
    source: input.source,
    beforeText: input.beforeText,
    afterText: input.afterText,
    inferredChanges: result.learned,
    appliedToProfile: true,
    createdAt: now(),
  };

  const revisionBias = Array.from(
    new Set([
      ...state.profile.styleFingerprint.revisionBias,
      ...result.learned.filter((item) => item.includes("偏好") || item.includes("倾向")),
    ])
  ).slice(-6);

  state.profile = {
    ...state.profile,
    styleFingerprint: {
      ...state.profile.styleFingerprint,
      ...result.fingerprint,
      revisionBias,
    },
    preferenceSignals: mergeSignals(
      state.profile.preferenceSignals,
      result.preferenceSignals
    ),
    avoidanceSignals: mergeSignals(
      state.profile.avoidanceSignals,
      result.avoidanceSignals
    ),
    recentLearningEvents: [event, ...state.profile.recentLearningEvents].slice(0, 8),
    updatedAt: now(),
    version: state.profile.version + 1,
  };
  state.undoStack = [profileBefore, ...state.undoStack].slice(0, 12);

  await writeProfileState(state);

  return {
    profile: state.profile,
    event,
    learned: result.learned,
    summary: summarizeProfile(state.profile),
  };
}

async function writeUndo(): Promise<{ profile: UserProfile; undone: boolean }> {
  const state = await readProfileState();
  if (state.undoStack.length === 0) {
    return { profile: state.profile, undone: false };
  }
  const previous = state.undoStack.shift()!;
  state.profile = {
    ...previous,
    updatedAt: now(),
  };
  await writeProfileState(state);
  return { profile: state.profile, undone: true };
}

export async function learnUserProfile(
  input: LearnProfileRequest
): Promise<LearnProfileResponse> {
  return enqueueWrite(() => writeLearn(input));
}

export async function undoLastLearning(): Promise<{ profile: UserProfile; undone: boolean }> {
  return enqueueWrite(writeUndo);
}
