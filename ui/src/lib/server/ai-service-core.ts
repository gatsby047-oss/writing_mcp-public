import type {
  AnalyzeTextRequest,
  AnalyzeTextResponse,
  ChapterOutline,
  GenerateOutlineRequest,
  GenerateOutlineResponse,
  GenerateTextRequest,
  GenerateTextResponse,
  ModelSettings,
  OutlineAnswer,
  OutlineFollowUpQuestionsRequest,
  OutlineQuestion,
  OutlineQuestionRound,
  OutlineQuestionsRequest,
  OutlineQuestionsResponse,
  ProjectContextPayload,
  ProviderMode,
} from "@/lib/modeling";
import { getModelSettings } from "@/lib/server/model-settings";
import { buildPersonaPrompt, getUserProfile } from "@/lib/server/profile-service";

function compactText(value: string) {
  return value.trim().replace(/\n{3,}/g, "\n\n");
}

function hasOutlineContent(outline?: ChapterOutline) {
  if (!outline) return false;
  return Object.values(outline).some((item) => item.trim().length > 0);
}

function formatOutline(outline?: ChapterOutline) {
  if (!outline || !hasOutlineContent(outline)) return "";
  return [
    outline.opening ? `开场：${outline.opening}` : "",
    outline.development ? `发展：${outline.development}` : "",
    outline.turn ? `转折：${outline.turn}` : "",
    outline.endingHook ? `结尾钩子：${outline.endingHook}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildContextBlock(context?: ProjectContextPayload) {
  if (!context) return "暂无额外项目上下文。";

  const parts = [
    context.projectName ? `项目名：${context.projectName}` : "",
    context.genre ? `题材：${context.genre}` : "",
    context.tone ? `基调：${context.tone}` : "",
    context.chapterTitle ? `章节：${context.chapterTitle}` : "",
    context.chapterSummary ? `章节摘要：${context.chapterSummary}` : "",
    formatOutline(context.outline),
    context.projectStyleOverlay?.audience
      ? `目标读者：${context.projectStyleOverlay.audience}`
      : "",
    context.projectStyleOverlay?.toneNotes
      ? `语气备注：${context.projectStyleOverlay.toneNotes}`
      : "",
    context.projectStyleOverlay?.styleNotes
      ? `风格备注：${context.projectStyleOverlay.styleNotes}`
      : "",
    context.projectStyleOverlay?.doMoreOf?.length
      ? `希望更多出现：${context.projectStyleOverlay.doMoreOf.join("、")}`
      : "",
    context.projectStyleOverlay?.avoid?.length
      ? `尽量避免：${context.projectStyleOverlay.avoid.join("、")}`
      : "",
    context.characters?.length
      ? `角色参考：${context.characters
          .map((item) => `${item.name}（${item.role}）`)
          .join("、")}`
      : "",
    context.foreshadows?.some((item) => item.status === "open")
      ? `未回收伏笔：${context.foreshadows
          .filter((item) => item.status === "open")
          .map((item) => item.content)
          .slice(0, 4)
          .join("、")}`
      : "",
    context.bannedPhrases?.length ? `禁用表达：${context.bannedPhrases.join("、")}` : "",
  ].filter(Boolean);

  return parts.length > 0 ? parts.join("\n") : "暂无额外项目上下文。";
}

function summarizeGenerateAction(action: GenerateTextRequest["action"]) {
  switch (action) {
    case "continue":
      return "延续当前章节内容，继续推动情节。";
    case "polish":
      return "保留原意，优化句子、节奏和细节表现。";
    case "summarize":
      return "提炼当前章节摘要。";
    case "write-from-outline":
      return "严格根据当前章节大纲起草正文，并让四段结构都真实落地。";
    default:
      return "完成写作辅助任务。";
  }
}

function buildGenerateSystemPrompt(input: {
  action: GenerateTextRequest["action"];
  context?: ProjectContextPayload;
  personaPrompt?: string;
}) {
  const actionHint =
    input.action === "write-from-outline"
      ? "输出必须是一版可直接进入编辑器的章节草稿，不要解释过程，不要列提纲，不要加多余标题。"
      : "输出必须自然、具体、可直接使用，不要解释你自己。";

  return [
    "你是一个帮助中文作者持续产出的 AI 写作搭档。",
    actionHint,
    input.personaPrompt ?? "当前不使用用户画像。",
    "项目上下文：",
    buildContextBlock(input.context),
    `当前任务：${summarizeGenerateAction(input.action)}`,
  ].join("\n\n");
}

function buildAnalyzeSystemPrompt(input: {
  context?: ProjectContextPayload;
  personaPrompt?: string;
}) {
  return [
    "你是一个中文写作诊断助手。",
    '只返回 JSON，对象字段必须包含 "summary"、"findings"、"suggestions"、"nextSteps"。',
    '"findings"、"suggestions"、"nextSteps" 必须都是字符串数组。',
    input.personaPrompt ?? "当前不使用用户画像。",
    "项目上下文：",
    buildContextBlock(input.context),
  ].join("\n\n");
}

function buildOutlineQuestionsSystemPrompt(input: {
  context?: ProjectContextPayload;
  personaPrompt?: string;
}) {
  return [
    "你是中文写作策划助手，任务是先补齐信息，再生成大纲。",
    '只返回 JSON，对象字段必须包含 "summary"、"guidance" 和 "questions"。',
    '"questions" 必须是长度为 2 到 3 的数组，每项包含 "id"、"question"、"placeholder"、"intent"。',
    "不要重复询问上下文里已经明确给出的信息，优先问最影响章节大纲的未知项。",
    "问题要具体、可回答，适合作者直接输入一到两句。",
    input.personaPrompt ?? "当前不使用用户画像。",
    "项目上下文：",
    buildContextBlock(input.context),
  ].join("\n\n");
}

function buildOutlineFollowUpSystemPrompt(input: {
  context?: ProjectContextPayload;
  personaPrompt?: string;
}) {
  return [
    "你是中文写作策划助手，当前处于第二轮追问阶段。",
    '只返回 JSON，对象字段必须包含 "summary"、"guidance" 和 "questions"。',
    '"questions" 必须是长度为 1 到 2 的数组，每项包含 "id"、"question"、"placeholder"、"intent"。',
    "基于作者上一轮已给出的回答，只追问仍然模糊、但会明显影响大纲质量的点。",
    "不要重复前面已经问过的问题，不要再问宽泛背景。",
    input.personaPrompt ?? "当前不使用用户画像。",
    "项目上下文：",
    buildContextBlock(input.context),
  ].join("\n\n");
}

function buildOutlineGenerationSystemPrompt(input: {
  context?: ProjectContextPayload;
  personaPrompt?: string;
}) {
  return [
    "你是中文写作策划助手，需要根据上下文和作者回答生成一版可执行的大纲。",
    '只返回 JSON，对象字段必须包含 "summary"、"chapterSummary"、"outline"、"notes"。',
    '"outline" 必须是对象，并且包含 "opening"、"development"、"turn"、"endingHook" 四个字符串字段。',
    '"notes" 必须是字符串数组，用来提示后续写作时要注意的风格和推进点。',
    "最终大纲要体现项目上下文、用户画像，以及用户这次的澄清和追问回答。",
    input.personaPrompt ?? "当前不使用用户画像。",
    "项目上下文：",
    buildContextBlock(input.context),
  ].join("\n\n");
}

// Mock 模板：根据题材（genre）和基调（tone）选择语气，
// 并将用户已写内容的后 80 字作为 seed 无缝衔接，
// 避免每次输出相同的套话。
const MOCK_TEMPLATES = {
  悬疑: [
    (seed: string) =>
      seed
        ? `${seed}\n\n事情到这一步已经没有退路了。他没有回头，只是放慢了脚步——身后那点动静在寂静里格外清晰，像是有人刻意让他听见。`
        : `空气里凝着一层冷意，他没有动。窗外那条路的尽头，灯灭了。这是第三次了——每次他觉得自己快接近真相，就会有东西把局面重新搅乱。`,
    (seed: string) =>
      seed
        ? `${seed}\n\n脚步声停在了门外。屋里只剩下时钟的声音，一格一格，像在倒数。`
        : `她说完了那句话就转身走了。他站在原地，发现自己根本不知道该追上去问什么。答案明明就在嘴边，可他每次想开口，喉咙就像被什么东西堵住了。`,
  ],
  都市: [
    (seed: string) =>
      seed
        ? `${seed}\n\n他还是把那句话咽了回去。有些事情说出来就变味了，不如就这样拖着，至少还能假装一切正常。`
        : `下班的时候雨刚停，路灯亮起来的瞬间，整条街都变得不像白天那么冷漠。他走到地铁口，想起早上出门时她还没醒，冰箱里给她留的那份早餐，不知道她吃了没有。`,
    (seed: string) =>
      seed
        ? `${seed}\n\n这座城市每天都有无数人在错过，他们不过是其中最普通的一对。`
        : `咖啡凉的比他想的快。他看了一眼手机，对话框还停在昨晚那句"算了"，再往上看，全是一些当时觉得非说不可、现在看来全是废话的话。`,
  ],
  科幻: [
    (seed: string) =>
      seed
        ? `${seed}\n\n数据层面的问题终于暴露了。他的推测是对的——这不是漏洞，是设计者留下的后门。`
        : `系统提示在屏幕上闪了三下，每一下都像在提醒他时间不多了。他知道按照正常的逻辑，这件事不可能发生——除非有人比他更早动手，把规则改了。`,
    (seed: string) =>
      seed
        ? `${seed}\n\n当变量被控制之后，结果就只剩下一种可能。他关掉终端，这一次没有犹豫。`
        : `他花了两周才确认那不是偶发故障。日志里每一次异常的间隔都精确到秒，太规律了，规律到像是故意的。`,
  ],
  默认: [
    (seed: string) =>
      seed
        ? `${seed}\n\n事情在往他没预料到的方向发展。他原本以为只要再坚持一下就能看到转机，现在才明白，有些困局不是撑过去的，是要换个思路才能走出来。`
        : `人物还没来得及把情绪整理清楚，视线却已经被新的异动牵了过去。他先是下意识停住脚步，随后才意识到眼前这点变化并不是表面的波纹，而是会把后面的局势一点点推开的开端。`,
    (seed: string) =>
      seed
        ? `${seed}\n\n有些话到嘴边又咽了回去。不是不想说，是说完之后不知道该怎么收场。`
        : `他站在原地，没有动。窗外的光线在变，暗下来的速度比平时更快，像是有什么东西在故意压缩时间。`,
  ],
};

function pickMockTemplate(
  genre: string,
  tone: string,
  seed: string
): (seed: string) => string {
  const genreMap: Record<string, (keyof typeof MOCK_TEMPLATES)[]> = {
    悬疑: ["悬疑"],
    推理: ["悬疑"],
    惊悚: ["悬疑"],
    都市: ["都市"],
    现实: ["都市"],
    情感: ["都市"],
    科幻: ["科幻"],
    奇幻: ["科幻"],
    玄幻: ["科幻"],
  };
  const matched = genreMap[genre] ?? [];
  const key = (matched[0] ?? "默认") as keyof typeof MOCK_TEMPLATES;
  const templates = MOCK_TEMPLATES[key];
  // 根据 seed 内容（用户文本结尾的情绪/长度）选择更合适的模板
  const useSecond = seed.length > 60 && !seed.includes("。");
  return templates[useSecond ? 1 : 0];
}

function createMockParagraph(
  seed: string,
  genre: string,
  tone: string,
  personaUsed: boolean
) {
  const toneIntro = tone ? `基调：${tone}。` : "";
  const personaNote = personaUsed
    ? "（本次参考用户画像调整了语气）"
    : "";
  const pickTemplate = pickMockTemplate(genre, tone, seed);
  const body = pickTemplate(seed);
  return compactText(`${toneIntro}${body}${personaNote}`);
}

function createOutlineDraft(
  outline: ChapterOutline,
  genre: string,
  tone: string,
  personaUsed: boolean
) {
  const genreNote =
    genre === "悬疑" || genre === "推理"
      ? "本版大纲侧重悬念铺设与信息差的逐步揭开。"
      : genre === "都市" || genre === "情感"
        ? "本版大纲侧重人物关系与内心层次的推进。"
        : genre === "科幻"
          ? "本版大纲侧重设定推进与认知边界的扩展。"
          : "";
  const toneNote = tone ? `整体维持${tone}的叙事质地。` : "";
  const personaNote = personaUsed
    ? "语言继续贴近当前用户画像。"
    : "语言保持中性通用。";
  return compactText(
    `${outline.opening || "故事从一个不稳定的开场进入。"}\n\n` +
      `${outline.development || "中段通过动作和信息差把局势推深。"}\n\n` +
      `${outline.turn || "转折处让人物认知或场面发生明显变化。"}\n\n` +
      `${outline.endingHook || "结尾用一个未说透的新信号把读者带向下一章。"}\n\n` +
      `${genreNote}${toneNote}${personaNote}`
  );
}

function createQuestion(
  id: string,
  round: OutlineQuestionRound,
  question: string,
  placeholder: string,
  intent: string
): OutlineQuestion {
  return {
    id,
    question,
    placeholder,
    intent,
    round,
  };
}

function buildInitialMockQuestions(context?: ProjectContextPayload): OutlineQuestion[] {
  const questions: OutlineQuestion[] = [
    createQuestion(
      "chapter-goal",
      "initial",
      "这一章最重要的推进目标是什么？",
      "例如：让主角拿到第一条关键线索，并意识到风险已经逼近",
      "明确本章功能，避免大纲只有氛围没有推进。"
    ),
    createQuestion(
      "turn-shape",
      "initial",
      "你希望这一章的转折更偏信息揭露、人物选择，还是场面升级？",
      "例如：偏人物选择，主角明知有风险也要继续靠近真相",
      "校准转折强度和后续推进方式。"
    ),
  ];

  if (!context?.projectStyleOverlay?.audience?.trim()) {
    questions.unshift(
      createQuestion(
        "target-reader",
        "initial",
        "这一章更想让哪类读者产生情绪共振？",
        "例如：偏爱悬疑推进、压迫感氛围和角色拉扯的读者",
        "补齐目标读者，避免大纲节奏过泛。"
      )
    );
  } else {
    questions.push(
      createQuestion(
        "ending-hook",
        "initial",
        "这一章结尾希望读者带着什么疑问进入下一章？",
        "例如：读者会开始怀疑匿名来信其实来自熟人",
        "让结尾钩子更明确，不只停在情绪收束。"
      )
    );
  }

  return questions.slice(0, 3);
}

function containsAny(text: string, patterns: string[]) {
  return patterns.some((pattern) => text.includes(pattern));
}

function buildFollowUpMockQuestions(
  input: OutlineFollowUpQuestionsRequest
): { guidance: string; questions: OutlineQuestion[] } {
  const answers = answerMap(input.answers);
  const combined = Array.from(answers.values()).join(" ");
  const questions: OutlineQuestion[] = [];

  if (answers.get("chapter-goal") && !containsAny(combined, ["代价", "风险", "失去", "暴露", "后果"])) {
    questions.push(
      createQuestion(
        "follow-up-stakes",
        "follow-up",
        "为了完成这个目标，主角这一章最可能付出的代价是什么？",
        "例如：拿到线索，但会暴露自己已经开始怀疑身边的人",
        "补齐推进成本，让大纲的冲突更具体。"
      )
    );
  }

  if (
    answers.get("turn-shape") &&
    !containsAny(combined, ["结尾", "钩子", "悬念", "下一章", "余味"])
  ) {
    questions.push(
      createQuestion(
        "follow-up-hook",
        "follow-up",
        "转折发生后，本章结尾最想留下哪一个悬念或未解释信号？",
        "例如：主角听见了熟人的脚步声，却没有看到人",
        "把转折和结尾钩子真正连起来。"
      )
    );
  }

  if (
    input.context?.characters?.length &&
    !containsAny(combined, ["关系", "怀疑", "情绪", "信任", "态度", "误解"])
  ) {
    questions.push(
      createQuestion(
        "follow-up-emotion",
        "follow-up",
        "这一章结束时，你最想让主角和关键人物的关系产生什么细微变化？",
        "例如：表面上仍然平静，但主角第一次开始怀疑对方",
        "补齐人物层的变化，让大纲不只有事件没有关系。"
      )
    );
  }

  if (questions.length === 0) {
    questions.push(
      createQuestion(
        "follow-up-focus",
        "follow-up",
        "如果只能强化一个点，你更想让这一章更重“压迫感”、更重“信息揭露”，还是更重“人物犹豫”？",
        "例如：更重信息揭露，但不要一次性说透",
        "帮助系统在已有回答基础上做最后收束。"
      )
    );
  }

  return {
    guidance: "第一轮已经补齐了章节目标，本轮继续收窄代价、人物变化和结尾拉力。",
    questions: questions.slice(0, 2),
  };
}

function mockOutlineQuestions(
  input: OutlineQuestionsRequest,
  options: { usedPersona: boolean; providerMode: ProviderMode }
): OutlineQuestionsResponse {
  return {
    summary: "已生成第一轮大纲澄清问题。",
    guidance: "先补齐章节目标、转折方向和读者预期，再进入大纲生成。",
    questions: buildInitialMockQuestions(input.context),
    providerMode: options.providerMode,
    usedPersona: options.usedPersona,
    round: "initial",
  };
}

function mockOutlineFollowUpQuestions(
  input: OutlineFollowUpQuestionsRequest,
  options: { usedPersona: boolean; providerMode: ProviderMode }
): OutlineQuestionsResponse {
  const payload = buildFollowUpMockQuestions(input);
  return {
    summary: "已根据上一轮回答生成追问。",
    guidance: payload.guidance,
    questions: payload.questions,
    providerMode: options.providerMode,
    usedPersona: options.usedPersona,
    round: "follow-up",
  };
}

function answerMap(answers: OutlineAnswer[]) {
  return new Map(
    answers
      .map((item) => [item.id, item.answer.trim()] as const)
      .filter(([, value]) => value.length > 0)
  );
}

function mockGenerateOutline(
  input: GenerateOutlineRequest,
  options: { usedPersona: boolean; providerMode: ProviderMode }
): GenerateOutlineResponse {
  const answers = answerMap(input.answers);
  const chapterGoal =
    answers.get("chapter-goal") ||
    "让主角在推进线索的同时意识到局势并不受自己控制";
  const turnPreference =
    answers.get("turn-shape") || "偏人物选择，转折来自主角主动越过安全边界";
  const stakes =
    answers.get("follow-up-stakes") || "主角推进真相的同时，也会暴露自己已经开始怀疑熟人";
  const endingHook =
    answers.get("ending-hook") ||
    answers.get("follow-up-hook") ||
    input.context?.outline?.endingHook ||
    "结尾留下一个比本章问题更大的新信号，让读者自然想进入下一章。";
  const reader =
    answers.get("target-reader") ||
    input.context?.projectStyleOverlay?.audience ||
    "当前项目读者";
  const tone =
    input.context?.tone || input.context?.projectStyleOverlay?.toneNotes || "克制而有压迫感";

  return {
    summary: "已生成章节大纲。",
    chapterSummary: `本章围绕“${chapterGoal}”推进，并让人物在“${stakes}”的压力下完成开场、发展、转折和结尾钩子。`,
    outline: {
      opening:
        input.context?.outline?.opening ||
        `用一场带有${tone}气息的场景开场，让读者迅速进入人物当前的不安状态。`,
      development: `${chapterGoal}。中段通过动作、环境细节和一次小型试探，把局势往前推半步，同时埋下“${stakes}”的成本。`,
      turn: `${turnPreference}，让人物在信息不足的情况下做出一次无法回退的选择。`,
      endingHook,
    },
    notes: [
      `这一章的节奏要贴近 ${reader} 的阅读预期。`,
      "写作时优先保留动作推进，而不是提前解释动机。",
      options.usedPersona
        ? "语言继续参考当前用户画像中的句式与节奏偏好。"
        : "语言保持通用写作模式。",
    ],
    providerMode: options.providerMode,
    usedPersona: options.usedPersona,
  };
}

function mockGenerate(
  input: GenerateTextRequest,
  options: { usedPersona: boolean; providerMode: ProviderMode }
): GenerateTextResponse {
  const genre = input.context?.genre ?? "";
  const tone = input.context?.tone || input.context?.projectStyleOverlay?.toneNotes || "";

  if (input.action === "summarize") {
    return {
      action: input.action,
      summary: "已生成章节摘要。",
      previewText: compactText(
        `本章围绕“${input.context?.chapterTitle || "当前章节"}”继续推进，核心是在现有 tension 上补出新的动作与信息差，并为后续冲突留下钩子。`
      ),
      providerMode: options.providerMode,
      usedPersona: options.usedPersona,
    };
  }

  if (input.action === "polish") {
    return {
      action: input.action,
      summary: "已生成润色预览。",
      previewText: compactText(
        `${input.text.trim()}\n\n这一版会更强调动作与情绪之间的联动，同时尽量收掉重复句式，让段落更稳。`
      ),
      providerMode: options.providerMode,
      usedPersona: options.usedPersona,
    };
  }

  if (input.action === "write-from-outline") {
    return {
      action: input.action,
      summary: "已根据大纲生成章节草稿。",
      previewText: createOutlineDraft(
        input.context?.outline ?? {
          opening: "",
          development: "",
          turn: "",
          endingHook: "",
        },
        genre,
        tone,
        options.usedPersona
      ),
      providerMode: options.providerMode,
      usedPersona: options.usedPersona,
    };
  }

  return {
    action: input.action,
    summary: "已生成 AI 预览。",
    previewText: createMockParagraph(input.text.slice(-80), input.context?.genre ?? "", tone, options.usedPersona),
    providerMode: options.providerMode,
    usedPersona: options.usedPersona,
  };
}

function mockAnalyze(
  input: AnalyzeTextRequest,
  options: { usedPersona: boolean; providerMode: ProviderMode }
): AnalyzeTextResponse {
  const findings: string[] = [];
  const suggestions: string[] = [];
  const nextSteps: string[] = [];
  const words = input.text.trim().length;

  if (words < 200) {
    findings.push("当前内容偏短，更像是场景草稿，还没有形成完整推进。");
    suggestions.push("先补齐一条明确的动作链，再决定是否调用润色。");
  } else {
    findings.push("文本已经形成基础场景，但中段还可以再增加一个更明显的推进点。");
    suggestions.push("在中后段补一个信息差或选择代价，会更容易拉高章节完成度。");
  }

  if (input.context?.chapterSummary) {
    findings.push("你已经维护了章节摘要，这会让后续 AI 辅助更加稳定。");
  } else {
    suggestions.push("建议补一版章节摘要，方便后续续写和诊断保持一致。");
  }

  if (options.usedPersona) {
    findings.push("这次诊断已经参考了用户画像中的长期风格偏好。");
  }

  nextSteps.push("决定本章结尾是收束情绪，还是继续把风险抬高。");
  nextSteps.push("如果准备继续写，先生成一版新内容，再决定是否局部润色。");

  return {
    action: input.action,
    summary: "已完成章节诊断。",
    findings,
    suggestions,
    nextSteps,
    providerMode: options.providerMode,
    usedPersona: options.usedPersona,
  };
}

async function callOpenAICompatible(
  settings: ModelSettings,
  input: {
    systemPrompt: string;
    userPrompt: string;
    jsonMode?: boolean;
    temperature?: number;
  }
) {
  const response = await fetch(`${settings.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      temperature: input.temperature ?? 0.7,
      response_format: input.jsonMode ? { type: "json_object" } : undefined,
      messages: [
        {
          role: "system",
          content: input.systemPrompt,
        },
        {
          role: "user",
          content: input.userPrompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "模型调用失败");
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  return payload.choices?.[0]?.message?.content?.trim() ?? "";
}

function parseJsonPayload<T>(raw: string): T {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned) as T;
}

function normalizeQuestions(
  payload: { summary?: string; guidance?: string; questions?: Array<Partial<OutlineQuestion>> },
  round: OutlineQuestionRound,
  maxCount: number
) {
  const prefix = round === "initial" ? "initial" : "follow-up";
  const questions = Array.isArray(payload.questions)
    ? payload.questions
        .slice(0, maxCount)
        .map((item, index) => ({
          id: item.id?.trim() || `${prefix}-${index + 1}`,
          question: item.question?.trim() || `补充问题 ${index + 1}`,
          placeholder: item.placeholder?.trim() || "用一到两句补充这个信息点",
          intent: item.intent?.trim() || "用于帮助系统补齐大纲关键信息。",
          round,
        }))
    : [];

  return {
    summary:
      payload.summary?.trim() ||
      (round === "initial" ? "已生成第一轮大纲问题。" : "已生成追问问题。"),
    guidance:
      payload.guidance?.trim() ||
      (round === "initial"
        ? "先补齐目标、转折和读者预期，再生成大纲。"
        : "继续补齐仍然模糊但会影响大纲质量的细节。"),
    questions,
  };
}

function normalizeOutlinePayload(payload: {
  summary?: string;
  chapterSummary?: string;
  outline?: Partial<ChapterOutline>;
  notes?: string[];
}) {
  return {
    summary: payload.summary?.trim() || "已生成章节大纲。",
    chapterSummary: payload.chapterSummary?.trim() || "",
    outline: {
      opening: payload.outline?.opening?.trim() || "",
      development: payload.outline?.development?.trim() || "",
      turn: payload.outline?.turn?.trim() || "",
      endingHook: payload.outline?.endingHook?.trim() || "",
    },
    notes: Array.isArray(payload.notes) ? payload.notes.filter(Boolean).slice(0, 5) : [],
  };
}

function buildOutlineAnswerBlock(answers: OutlineAnswer[]) {
  return answers
    .filter((item) => item.answer.trim())
    .map((item) => {
      const roundLabel = item.round === "follow-up" ? "追问" : "首轮";
      return `[${roundLabel}] ${item.question}\n回答：${item.answer.trim()}`;
    })
    .join("\n\n");
}

async function loadRuntime() {
  const [settings, profile] = await Promise.all([getModelSettings(), getUserProfile()]);
  const usedPersona = profile.enabled;
  return {
    settings,
    profile,
    usedPersona,
    personaPrompt: usedPersona ? buildPersonaPrompt(profile) : undefined,
  };
}

export async function runGenerate(input: GenerateTextRequest): Promise<GenerateTextResponse> {
  const runtime = await loadRuntime();

  if (runtime.settings.mode === "mock" || !runtime.settings.apiKey.trim()) {
    return mockGenerate(input, {
      providerMode: runtime.settings.mode === "mock" ? "mock" : "mock-fallback",
      usedPersona: runtime.usedPersona,
    });
  }

  try {
    const previewText = await callOpenAICompatible(runtime.settings, {
      systemPrompt: buildGenerateSystemPrompt({
        action: input.action,
        context: input.context,
        personaPrompt: runtime.personaPrompt,
      }),
      userPrompt:
        input.action === "write-from-outline"
          ? input.text.trim() || "请根据当前章节大纲起草正文。"
          : input.text || "请根据上下文继续完成当前任务。",
      temperature: input.action === "write-from-outline" ? 0.65 : 0.7,
    });

    return {
      action: input.action,
      summary:
        input.action === "summarize"
          ? "已生成章节摘要。"
          : input.action === "write-from-outline"
            ? "已根据大纲生成章节草稿。"
            : "已生成 AI 预览。",
      previewText,
      providerMode: "openai-compatible",
      usedPersona: runtime.usedPersona,
    };
  } catch {
    return mockGenerate(input, {
      providerMode: "mock-fallback",
      usedPersona: runtime.usedPersona,
    });
  }
}

export async function runAnalyze(input: AnalyzeTextRequest): Promise<AnalyzeTextResponse> {
  const runtime = await loadRuntime();

  if (runtime.settings.mode === "mock" || !runtime.settings.apiKey.trim()) {
    return mockAnalyze(input, {
      providerMode: runtime.settings.mode === "mock" ? "mock" : "mock-fallback",
      usedPersona: runtime.usedPersona,
    });
  }

  try {
    const raw = await callOpenAICompatible(runtime.settings, {
      systemPrompt: buildAnalyzeSystemPrompt({
        context: input.context,
        personaPrompt: runtime.personaPrompt,
      }),
      userPrompt: input.text,
      jsonMode: true,
      temperature: 0.4,
    });
    const parsed = parseJsonPayload<{
      summary?: string;
      findings?: string[];
      suggestions?: string[];
      nextSteps?: string[];
    }>(raw);
    return {
      action: input.action,
      summary: parsed.summary || "已完成章节诊断。",
      findings: Array.isArray(parsed.findings) ? parsed.findings : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
      providerMode: "openai-compatible",
      usedPersona: runtime.usedPersona,
    };
  } catch {
    return mockAnalyze(input, {
      providerMode: "mock-fallback",
      usedPersona: runtime.usedPersona,
    });
  }
}

export async function runOutlineQuestions(
  input: OutlineQuestionsRequest
): Promise<OutlineQuestionsResponse> {
  const runtime = await loadRuntime();

  if (runtime.settings.mode === "mock" || !runtime.settings.apiKey.trim()) {
    return mockOutlineQuestions(input, {
      providerMode: runtime.settings.mode === "mock" ? "mock" : "mock-fallback",
      usedPersona: runtime.usedPersona,
    });
  }

  try {
    const raw = await callOpenAICompatible(runtime.settings, {
      systemPrompt: buildOutlineQuestionsSystemPrompt({
        context: input.context,
        personaPrompt: runtime.personaPrompt,
      }),
      userPrompt: input.text.trim() || "请为当前章节生成第一轮澄清问题。",
      jsonMode: true,
      temperature: 0.45,
    });
    const parsed = normalizeQuestions(
      parseJsonPayload<{
        summary?: string;
        guidance?: string;
        questions?: Array<Partial<OutlineQuestion>>;
      }>(raw),
      "initial",
      3
    );

    if (parsed.questions.length === 0) {
      return mockOutlineQuestions(input, {
        providerMode: "mock-fallback",
        usedPersona: runtime.usedPersona,
      });
    }

    return {
      ...parsed,
      providerMode: "openai-compatible",
      usedPersona: runtime.usedPersona,
      round: "initial",
    };
  } catch {
    return mockOutlineQuestions(input, {
      providerMode: "mock-fallback",
      usedPersona: runtime.usedPersona,
    });
  }
}

export async function runOutlineFollowUpQuestions(
  input: OutlineFollowUpQuestionsRequest
): Promise<OutlineQuestionsResponse> {
  const runtime = await loadRuntime();

  if (runtime.settings.mode === "mock" || !runtime.settings.apiKey.trim()) {
    return mockOutlineFollowUpQuestions(input, {
      providerMode: runtime.settings.mode === "mock" ? "mock" : "mock-fallback",
      usedPersona: runtime.usedPersona,
    });
  }

  try {
    const raw = await callOpenAICompatible(runtime.settings, {
      systemPrompt: buildOutlineFollowUpSystemPrompt({
        context: input.context,
        personaPrompt: runtime.personaPrompt,
      }),
      userPrompt:
        [
          input.text.trim() ? `当前文本：\n${input.text.trim()}` : "",
          buildOutlineAnswerBlock(input.answers)
            ? `上一轮回答：\n${buildOutlineAnswerBlock(input.answers)}`
            : "上一轮尚未提供有效回答。",
        ]
          .filter(Boolean)
          .join("\n\n") || "请根据已有回答生成一到两条追问。",
      jsonMode: true,
      temperature: 0.4,
    });
    const parsed = normalizeQuestions(
      parseJsonPayload<{
        summary?: string;
        guidance?: string;
        questions?: Array<Partial<OutlineQuestion>>;
      }>(raw),
      "follow-up",
      2
    );

    if (parsed.questions.length === 0) {
      return mockOutlineFollowUpQuestions(input, {
        providerMode: "mock-fallback",
        usedPersona: runtime.usedPersona,
      });
    }

    return {
      ...parsed,
      providerMode: "openai-compatible",
      usedPersona: runtime.usedPersona,
      round: "follow-up",
    };
  } catch {
    return mockOutlineFollowUpQuestions(input, {
      providerMode: "mock-fallback",
      usedPersona: runtime.usedPersona,
    });
  }
}

export async function runGenerateOutline(
  input: GenerateOutlineRequest
): Promise<GenerateOutlineResponse> {
  const runtime = await loadRuntime();

  if (runtime.settings.mode === "mock" || !runtime.settings.apiKey.trim()) {
    return mockGenerateOutline(input, {
      providerMode: runtime.settings.mode === "mock" ? "mock" : "mock-fallback",
      usedPersona: runtime.usedPersona,
    });
  }

  try {
    const raw = await callOpenAICompatible(runtime.settings, {
      systemPrompt: buildOutlineGenerationSystemPrompt({
        context: input.context,
        personaPrompt: runtime.personaPrompt,
      }),
      userPrompt:
        [
          input.text.trim() ? `当前文本：\n${input.text.trim()}` : "",
          buildOutlineAnswerBlock(input.answers)
            ? `作者回答：\n${buildOutlineAnswerBlock(input.answers)}`
            : "作者尚未补充更多回答。",
        ]
          .filter(Boolean)
          .join("\n\n") || "请根据当前章节信息生成一版结构化大纲。",
      jsonMode: true,
      temperature: 0.55,
    });
    const parsed = normalizeOutlinePayload(
      parseJsonPayload<{
        summary?: string;
        chapterSummary?: string;
        outline?: Partial<ChapterOutline>;
        notes?: string[];
      }>(raw)
    );
    return {
      ...parsed,
      providerMode: "openai-compatible",
      usedPersona: runtime.usedPersona,
    };
  } catch {
    return mockGenerateOutline(input, {
      providerMode: "mock-fallback",
      usedPersona: runtime.usedPersona,
    });
  }
}
