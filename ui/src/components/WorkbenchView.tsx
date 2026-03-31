"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  BrainCircuit,
  CheckCheck,
  FilePlus2,
  FolderPen,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import type {
  AnalyzeTextResponse,
  GenerateOutlineResponse,
  GenerateTextResponse,
  GenerationAction,
  ModelSettings,
  OutlineAnswer,
  OutlineQuestion,
  OutlineQuestionRound,
  Project,
  UserProfile,
} from "@/lib/modeling";
import {
  chapterStatusLabel,
  providerModeLabel,
  uiText,
  type UILanguage,
} from "@/lib/i18n";
import { analyzeQuality, countWords } from "@/lib/qc";
import { getProjectWordCount, useAIWSStore } from "@/lib/state";
import { hasOutlineContent } from "@/lib/utils";

const panelClass =
  "rounded-[30px] border border-stone-200 bg-[rgba(255,255,255,0.84)] p-5 shadow-[0_18px_40px_rgba(148,163,184,0.14)] backdrop-blur-xl";
const inputClass =
  "w-full rounded-[22px] border border-stone-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-stone-400 focus:border-[#88aeb3] focus:ring-4 focus:ring-[#e4eff0]";
const textareaClass =
  "w-full rounded-[24px] border border-stone-200 bg-white px-4 py-3 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-stone-400 focus:border-[#88aeb3] focus:ring-4 focus:ring-[#e4eff0]";
const subtleButtonClass =
  "rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60";
const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-[#17324d] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(23,50,77,0.18)] transition hover:-translate-y-[1px] hover:bg-[#1b4266] disabled:cursor-not-allowed disabled:opacity-60";
const warmButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-[#bc7f45] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(188,127,69,0.18)] transition hover:-translate-y-[1px] hover:bg-[#aa7040] disabled:cursor-not-allowed disabled:opacity-60";

function panel(title: string, description: string, children: ReactNode) {
  return (
    <section className={panelClass}>
      <div className="mb-4">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-xs leading-6 text-stone-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

function chip(value: string) {
  return (
    <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-slate-700">
      {value}
    </span>
  );
}

function statusCard(tone: "success" | "error", text: string) {
  const styles =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-rose-200 bg-rose-50 text-rose-900";
  return <div className={`rounded-[24px] border px-4 py-3 text-sm ${styles}`}>{text}</div>;
}

function flowStep(index: number, title: string, active: boolean, language: UILanguage) {
  return (
    <div
      className={`rounded-[22px] border px-4 py-3 transition ${
        active
          ? "border-[#9db8bb] bg-[#eef5f5] shadow-[0_12px_22px_rgba(100,162,162,0.12)]"
          : "border-stone-200 bg-white"
      }`}
    >
      <div className="text-[11px] uppercase tracking-[0.24em] text-stone-500">
        {uiText(language, `步骤 ${index}`, `Step ${index}`)}
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-900">{title}</p>
    </div>
  );
}

type ChapterShape = Project["chapters"][number];

export default function WorkbenchView(props: {
  language: UILanguage;
  profile: UserProfile;
  settings: ModelSettings;
  currentProject: Project | null;
  currentChapter: ChapterShape | null;
  previewResult: GenerateTextResponse | null;
  analysisResult: AnalyzeTextResponse | null;
  outlineQuestions: OutlineQuestion[];
  outlineAnswers: OutlineAnswer[];
  outlineResult: GenerateOutlineResponse | null;
  outlineRound: OutlineQuestionRound;
  outlineGuidance: string | null;
  busyAction: string | null;
  statusMessage: string | null;
  errorMessage: string | null;
  onGenerate: (action: GenerationAction) => void;
  onAnalyze: () => void;
  onCreateOutlineQuestions: () => void;
  onCreateOutlineFollowUp: () => void;
  onOutlineAnswerChange: (questionId: string, answer: string) => void;
  onGenerateOutline: () => void;
  onApplyOutline: () => void;
  onApplyPreview: () => void;
  onLearnFromPreview: () => void;
}) {
  const {
    language,
    profile,
    settings,
    currentProject,
    currentChapter,
    previewResult,
    analysisResult,
    outlineQuestions,
    outlineAnswers,
    outlineResult,
    outlineRound,
    outlineGuidance,
    busyAction,
    statusMessage,
    errorMessage,
    onGenerate,
    onAnalyze,
    onCreateOutlineQuestions,
    onCreateOutlineFollowUp,
    onOutlineAnswerChange,
    onGenerateOutline,
    onApplyOutline,
    onApplyPreview,
    onLearnFromPreview,
  } = props;

  function t(zh: string, en: string) {
    return uiText(language, zh, en);
  }

  const listSeparator = language === "en" ? ", " : "，";

  const projects = useAIWSStore((state) => state.projects);
  const currentProjectId = useAIWSStore((state) => state.currentProjectId);
  const currentChapterId = useAIWSStore((state) => state.currentChapterId);
  const addProject = useAIWSStore((state) => state.addProject);
  const setCurrentProject = useAIWSStore((state) => state.setCurrentProject);
  const setCurrentChapter = useAIWSStore((state) => state.setCurrentChapter);
  const addChapter = useAIWSStore((state) => state.addChapter);
  const updateProject = useAIWSStore((state) => state.updateProject);
  const updateProjectOverlay = useAIWSStore((state) => state.updateProjectOverlay);
  const updateChapter = useAIWSStore((state) => state.updateChapter);
  const updateChapterContent = useAIWSStore((state) => state.updateChapterContent);
  const addCharacter = useAIWSStore((state) => state.addCharacter);
  const updateCharacter = useAIWSStore((state) => state.updateCharacter);
  const addForeshadow = useAIWSStore((state) => state.addForeshadow);
  const resolveForeshadow = useAIWSStore((state) => state.resolveForeshadow);
  const addBannedPhrase = useAIWSStore((state) => state.addBannedPhrase);
  const removeBannedPhrase = useAIWSStore((state) => state.removeBannedPhrase);

  const [projectDraft, setProjectDraft] = useState({
    name: "",
    genre: "",
    tone: "",
    audience: "",
  });
  const [chapterTitle, setChapterTitle] = useState("");
  const [characterDraft, setCharacterDraft] = useState({
    name: "",
    role: "supporting" as const,
    goal: "",
    emotion: "",
    arc: "",
    notes: "",
  });
  const [foreshadowText, setForeshadowText] = useState("");
  const [bannedPhrase, setBannedPhrase] = useState("");

  const qc = useMemo(() => {
    if (!currentChapter || !currentProject) return null;
    return analyzeQuality({
      text: currentChapter.content,
      summary: currentChapter.summary,
      bannedPhrases: currentProject.bannedPhrases,
    });
  }, [currentChapter, currentProject]);

  const answeredQuestionCount = outlineAnswers.filter((item) => item.answer.trim()).length;
  const currentOutlineReady = currentChapter ? hasOutlineContent(currentChapter.outline) : false;
  const hasFollowUpQuestions = outlineQuestions.some((item) => item.round === "follow-up");
  const canCreateFollowUp =
    outlineQuestions.length > 0 &&
    !outlineResult &&
    !hasFollowUpQuestions &&
    answeredQuestionCount >= Math.min(2, outlineAnswers.length);

  function loadSampleProject() {
    addProject({
      name: "冷雾港",
      genre: "悬疑长文",
      tone: "冷静压迫",
      audience: "偏爱悬疑推进、人物张力和潮湿氛围的中文读者",
    });

    const store = useAIWSStore.getState();
    const chapterId = store.currentChapterId;
    const projectId = store.currentProjectId;

    if (!chapterId || !projectId) return;

    updateProjectOverlay(projectId, {
      audience: "偏爱悬疑推进、人物张力和潮湿氛围的中文读者",
      toneNotes: "整体保持冷静、压迫、略带潮湿感的叙事气质。",
      styleNotes: "多用动作细节和环境声响制造不安，不要一开始解释过满。",
      doMoreOf: ["用动作推进信息", "保留结尾悬念", "增强场景湿度与空间感"],
      avoid: ["直白解释动机", "过度抒情", "套路化热血口号"],
    });

    updateChapter(chapterId, {
      title: "第一章 雾港来信",
      summary:
        "沈知序回到海港旧宅，收到一封没有署名的来信。信里只提醒他今夜不要去码头，但他最终还是去了。",
      outline: {
        opening: "夜雾、旧宅、来信出现。",
        development: "主角怀疑来信来源，决定逆着警告去码头。",
        turn: "码头出现异常灯光与陌生脚步声。",
        endingHook: "一只本不该出现在港口的黑伞停在雾里。",
      },
    });

    updateChapterContent(
      chapterId,
      "雨水顺着旧宅的屋檐一滴滴砸进石阶缝里，发出细而冷的回响。沈知序推门的时候，门板像是被潮气泡过太久，发出一声迟钝的闷响。\n\n桌上那封信来得毫无道理。没有邮戳，没有署名，纸面却干净得过分，像是刚刚才被人放进来。信里只有一行字：今夜别去码头。\n\n他盯着那行字看了很久，心里先冒出来的不是害怕，而是一种近乎本能的逆反。越是这种含糊的警告，越像有人故意把他往另一个方向推。\n\n窗外的雾已经压到路灯下面，昏黄的光被切成一截一截。沈知序把信折好塞进口袋，还是拿起外套，向码头走去。"
    );

    addCharacter({
      name: "沈知序",
      role: "protagonist",
      goal: "查清匿名来信的来源",
      emotion: "警惕克制",
      arc: "从被动卷入转向主动追查",
      notes: "偏理性，越被警告越会继续往前。",
    });

    addCharacter({
      name: "林浮",
      role: "supporting",
      goal: "隐藏自己和码头事件的关系",
      emotion: "平静却躲闪",
      arc: "从旁观者逐渐暴露成关键知情人",
      notes: "前期只以名字和背影出现，保持神秘。",
    });

    addForeshadow({
      content: "那封没有邮戳的信，纸边带着极淡的盐霜。",
      plantedChapterId: chapterId,
      status: "open",
    });

    addBannedPhrase("忽然之间");
  }

  const recommendedAction = (() => {
    if (!currentChapter) {
      return {
        title: t("先创建一个项目", "Create a project first"),
        detail: t(
          "创建后就能进入写作、提问、大纲生成和正文起草的完整流程。",
          "Once a project exists, you can move through writing, clarifying questions, outlining, and drafting in one loop."
        ),
      };
    }

    if (outlineQuestions.length === 0 && !currentOutlineReady) {
      return {
        title: t("先做一轮大纲澄清", "Run one outline clarification round"),
        detail: t(
          "让系统先提 2 到 3 个关键问题，再根据你的回答生成当前章节大纲。",
          "Let the system ask 2 to 3 key questions before generating a chapter outline from your answers."
        ),
      };
    }

    if (canCreateFollowUp) {
      return {
        title: t("继续收窄关键约束", "Tighten the key constraints"),
        detail: t(
          "第一轮回答已经够用，可以再追问一轮，把代价、人物变化或结尾钩子压得更实。",
          "The first round is already useful; add one follow-up round to tighten stakes, character change, or the ending hook."
        ),
      };
    }

    if (outlineQuestions.length > 0 && !outlineResult) {
      return {
        title: t("先回答澄清问题", "Answer the clarification questions"),
        detail: t(
          "补齐至少两个回答后再生成大纲，这样章节结构会更贴近你的真实意图。",
          "Answer at least two questions before generating the outline so the chapter structure aligns with your intent."
        ),
      };
    }

    if (outlineResult) {
      return {
        title: t("先应用这版大纲", "Apply this outline first"),
        detail: t(
          "把大纲写回当前章节，再用“按大纲写本章”生成一版完整草稿。",
          'Write the outline back into the chapter, then use "Write from outline" to draft the full scene.'
        ),
      };
    }

    if (!currentChapter.content.trim() && currentOutlineReady) {
      return {
        title: t("按大纲写本章", "Write from outline"),
        detail: t(
          "当前结构已经足够，直接根据大纲生成草稿会比盲目续写更稳定。",
          "The structure is ready, so generating from the outline will be more stable than blind continuation."
        ),
      };
    }

    if (previewResult) {
      return {
        title: t("应用这次预览", "Apply this preview"),
        detail: t(
          "应用后画像会更新，下一步可以切到 Profile 查看最近学习事件。",
          "Applying the preview can update persona memory, and the next step is to inspect the latest learning event in Profile."
        ),
      };
    }

    if (analysisResult) {
      return {
        title: t("根据诊断补一个推进点", "Add one concrete revision after diagnosis"),
        detail: t(
          "补完后再继续写或润色，内容会更连贯。",
          "Patch one key issue from the diagnosis before continuing or polishing, and the chapter will read more coherently."
        ),
      };
    }

    return {
      title: t("继续写或局部润色", "Continue writing or polish locally"),
      detail: t(
        "如果当前大纲稳定，优先按大纲推进正文；如果已有正文，再做局部润色。",
        "If the outline is stable, move the draft forward from the structure; if text already exists, polish a smaller slice."
      ),
    };
  })();

  const flowTitles = [
    t("补齐章节意图", "Clarify chapter intent"),
    t("生成结构化大纲", "Generate a structured outline"),
    t("应用大纲并写正文", "Apply the outline and draft"),
    t("接受结果让画像学习", "Accept output and let the persona learn"),
  ];

  const activeFlowStep = outlineResult ? 3 : outlineQuestions.length > 0 ? 2 : 1;

  if (!currentProject || !currentChapter) {
    return (
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden rounded-[38px] border border-stone-200 bg-[linear-gradient(145deg,#fffefb,#f6efe5)] p-8 shadow-[0_30px_60px_rgba(148,163,184,0.16)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_12%,rgba(100,162,162,0.16),transparent_18%),radial-gradient(circle_at_18%_22%,rgba(223,165,96,0.18),transparent_28%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-stone-600">
              <BrainCircuit className="h-3.5 w-3.5 text-[#3f7f7d]" />
              {t("画像写作闭环", "Persona writing loop")}
            </div>
            <h2 className="mt-7 max-w-3xl font-serif text-4xl leading-tight text-slate-900 lg:text-5xl">
              {t(
                "先建一个项目，再让系统开始记住你的写作偏好。",
                "Create one project first, then let the system start remembering your writing preferences."
              )}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              {t(
                "这版工作台不追求大而全，而是把“澄清需求、生成大纲、起草章节、记录采纳”串成一条可解释、可展示、也真正可用的创作链路。",
                'This workbench is intentionally narrow. Instead of chasing feature breadth, it turns "clarify -> outline -> draft -> accept" into one explainable, demoable, and genuinely usable creative loop.'
              )}
            </p>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                [
                  t("互动式大纲生成", "Interactive outlining"),
                  t(
                    "不是直接出结果，而是先问关键问题，再补出更贴近意图的章节结构。",
                    "The system asks key questions first, then produces a structure that fits the intended chapter more closely."
                  ),
                ],
                [
                  t("大纲直连正文", "Outline-to-draft flow"),
                  t(
                    "应用大纲后可以直接根据结构起草章节，不用手动再组织一次。",
                    "Once applied, the outline feeds directly into drafting so the structure does not need to be rebuilt manually."
                  ),
                ],
                [
                  t("画像持续学习", "Continuous persona learning"),
                  t(
                    "当你接受结果或手动投喂文本时，系统会更新长期风格偏好。",
                    "When you accept output or feed a text sample manually, the system updates long-term style preferences."
                  ),
                ],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-[28px] border border-stone-200 bg-white/80 p-4 shadow-[0_12px_24px_rgba(148,163,184,0.08)]"
                >
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[38px] border border-stone-200 bg-[rgba(255,255,255,0.9)] p-8 shadow-[0_30px_60px_rgba(148,163,184,0.16)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#bc7f45,#d9a15b)] text-white shadow-[0_14px_28px_rgba(188,127,69,0.2)]">
              <FolderPen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {t("创建项目", "Create a project")}
              </p>
              <p className="text-sm text-stone-500">
                {t(
                  "先设定题材和基调，再进入当前章节的策划与写作。",
                  "Set the genre and tone first, then move into chapter planning and drafting."
                )}
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-700">
                {t("项目标题", "Project title")}
              </span>
              <input
                value={projectDraft.name}
                onChange={(event) =>
                  setProjectDraft((state) => ({ ...state, name: event.target.value }))
                }
                placeholder={t("例如：《冷雾港》", 'For example: "Cold Fog Harbor"')}
                className={inputClass}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-700">{t("题材", "Genre")}</span>
                <input
                  value={projectDraft.genre}
                  onChange={(event) =>
                    setProjectDraft((state) => ({ ...state, genre: event.target.value }))
                  }
                  placeholder={t("悬疑 / 都市 / 长文", "Suspense / Urban / Long-form")}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-700">{t("基调", "Tone")}</span>
                <input
                  value={projectDraft.tone}
                  onChange={(event) =>
                    setProjectDraft((state) => ({ ...state, tone: event.target.value }))
                  }
                  placeholder={t("冷静 / 压迫 / 温柔", "Restrained / Tense / Gentle")}
                  className={inputClass}
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-700">
                {t("目标读者", "Audience")}
              </span>
              <input
                value={projectDraft.audience}
                onChange={(event) =>
                  setProjectDraft((state) => ({ ...state, audience: event.target.value }))
                }
                placeholder={t(
                  "例如：偏爱悬疑推进的中文读者",
                  "For example: readers who enjoy suspense with strong momentum"
                )}
                className={inputClass}
              />
            </label>

            <button
              onClick={() => {
                if (!projectDraft.name.trim()) return;
                addProject(projectDraft);
                setProjectDraft({ name: "", genre: "", tone: "", audience: "" });
              }}
              className={`${primaryButtonClass} w-full`}
            >
              <FilePlus2 className="h-4 w-4" />
              {t("进入写作工作台", "Enter the workbench")}
            </button>

            <button onClick={loadSampleProject} className={`${subtleButtonClass} w-full`}>
              {t("载入示例项目", "Load sample project")}
            </button>
            <p className="text-xs leading-6 text-stone-500">
              {t(
                "这会自动生成项目、首章内容、角色、伏笔和上下文配置。",
                "This instantly creates a demo project with a first chapter, characters, foreshadowing, and context settings."
              )}
            </p>
          </div>
        </section>
      </div>
    );
  }

  const stats = [
    { label: t("章节", "Chapters"), value: currentProject.chapters.length, tone: "text-[#17324d]" },
    { label: t("角色", "Characters"), value: currentProject.characters.length, tone: "text-[#5a756b]" },
    {
      label: t("未回收伏笔", "Open foreshadowing"),
      value: currentProject.foreshadows.filter((item) => item.status === "open").length,
      tone: "text-[#bc7f45]",
    },
    {
      label: t("累计字数", "Total chars"),
      value: getProjectWordCount(currentProject),
      tone: "text-[#7a4a57]",
    },
    { label: t("学习事件", "Learning events"), value: profile.recentLearningEvents.length, tone: "text-[#3f7f7d]" },
    {
      label: t("模型模式", "Model mode"),
      value: providerModeLabel(language, settings.mode),
      tone: "text-[#17324d]",
    },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-stone-200 bg-[rgba(255,255,255,0.72)] p-4 shadow-[0_16px_34px_rgba(148,163,184,0.1)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
              {t("建议流程", "Suggested flow")}
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {t(
                "当前版本更推荐先补齐章节意图，再生成大纲、按大纲写正文，最后决定哪些结果值得被系统学习。",
                "This version works best when you clarify intent first, generate an outline second, draft from the outline third, and only then decide what should be learned."
              )}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-4 xl:min-w-[760px]">
            {flowTitles.map((title, index) =>
              flowStep(index + 1, title, activeFlowStep === index + 1, language)
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-[26px] border border-stone-200 bg-[rgba(255,255,255,0.78)] p-4 shadow-[0_18px_30px_rgba(148,163,184,0.1)] backdrop-blur-xl"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">{item.label}</p>
            <p className={`mt-2 text-2xl font-semibold ${item.tone}`}>{item.value}</p>
          </div>
        ))}
      </section>

      {statusMessage ? statusCard("success", statusMessage) : null}
      {errorMessage ? statusCard("error", errorMessage) : null}

      {settings.mode === "mock" || (previewResult && previewResult.providerMode.includes("mock")) ? (
        <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">{t("Mock 模式", "Mock mode")}</span>
          {" — "}
          {t(
            "当前使用本地模拟数据，不消耗 API 配额。前往设置页切换到 OpenAI 兼容接口以启用真实模型。",
            "Local mock responses are active, so no API quota is used. Switch to an OpenAI-compatible endpoint in Settings to enable live model calls."
          )}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)_410px]">
        <div className="space-y-5">
          {panel(
            t("项目目录", "Project index"),
            t(
              "把当前写作限制在一个项目和一个章节里，更容易保持上下文稳定。",
              "Keep the workbench scoped to one project and one chapter at a time so context stays stable."
            ),
            (
            <div className="space-y-4">
              <div className="space-y-2">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setCurrentProject(project.id)}
                    className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                      project.id === currentProjectId
                        ? "border-[#9db8bb] bg-[#eef5f5] shadow-[0_12px_24px_rgba(100,162,162,0.12)]"
                        : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                    <p className="mt-2 text-xs text-stone-500">
                      {project.genre || t("未设定题材", "Genre not set")}
                      {project.tone ? ` / ${project.tone}` : ""}
                    </p>
                  </button>
                ))}
              </div>

              <div className="rounded-[26px] border border-stone-200 bg-[#fffdf8] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {t("章节列表", "Chapter list")}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {t("每个项目都围绕一个个章节逐步推进。", "Each project progresses chapter by chapter.")}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      addChapter(chapterTitle.trim() || undefined);
                      setChapterTitle("");
                    }}
                    className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-slate-700 transition hover:bg-stone-50"
                  >
                    {t("新章节", "New chapter")}
                  </button>
                </div>
                <input
                  value={chapterTitle}
                  onChange={(event) => setChapterTitle(event.target.value)}
                  placeholder={t("可选：输入章节标题", "Optional: enter a chapter title")}
                  className={`mt-3 ${inputClass}`}
                />
                <div className="mt-3 space-y-2">
                  {currentProject.chapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      onClick={() => setCurrentChapter(chapter.id)}
                      className={`w-full rounded-[22px] border px-4 py-3 text-left transition ${
                        chapter.id === currentChapterId
                          ? "border-[#d8b58e] bg-[#fbf3ea] shadow-[0_12px_22px_rgba(217,161,91,0.12)]"
                          : "border-stone-200 bg-white hover:bg-stone-50"
                      }`}
                    >
                      <p className="text-sm font-medium text-slate-900">{chapter.title}</p>
                      <p className="mt-2 text-xs text-stone-500">
                        {t(
                          `${countWords(chapter.content)} 字 / 目标 ${chapter.targetWordCount}`,
                          `${countWords(chapter.content)} chars / target ${chapter.targetWordCount}`
                        )}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
          )}

          {panel(
            t("长期风格画像", "Long-term persona"),
            t(
              "这些信号会进入 AI 提示词，帮助系统持续贴近你的写作习惯。",
              "These signals are injected into the AI prompt so the system can stay closer to your writing habits."
            ),
            (
            <div className="space-y-3">
              <p className="rounded-[24px] border border-stone-200 bg-[#fffdf8] px-4 py-4 text-sm leading-7 text-slate-700">
                {profile.styleFingerprint.narrativePerspective}，{profile.styleFingerprint.pacing}，
                {profile.styleFingerprint.sentenceRhythm}
                {t("，整体更偏向", ", leaning overall toward ")}
                {profile.styleFingerprint.dialoguePreference}
                {t("。", ".")}
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.preferenceSignals.slice(0, 5).map((item) => chip(item.label))}
              </div>
            </div>
          )
          )}
        </div>

        <div className="space-y-5">
          {panel(
            t("稿纸与结构", "Draft and structure"),
            t(
              "把设定、摘要、大纲和正文放在一处，方便连续策划与写作。",
              "Keep settings, summary, outline, and draft in one place for continuous planning and writing."
            ),
            (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-stone-500">
                    {t("项目名", "Project name")}
                  </span>
                  <input
                    value={currentProject.name}
                    onChange={(event) =>
                      updateProject(currentProject.id, { name: event.target.value })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-stone-500">
                    {t("章节标题", "Chapter title")}
                  </span>
                  <input
                    value={currentChapter.title}
                    onChange={(event) =>
                      updateChapter(currentChapter.id, { title: event.target.value })
                    }
                    className={inputClass}
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-stone-500">{t("状态", "Status")}</span>
                    {(["draft", "review", "complete"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() =>
                          updateChapter(currentChapter.id, { status: s })
                        }
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          currentChapter.status === s
                            ? s === "draft"
                              ? "border-amber-300 bg-amber-50 text-amber-700"
                              : s === "review"
                                ? "border-blue-300 bg-blue-50 text-blue-700"
                                : "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "border-stone-200 bg-white text-stone-400 hover:border-stone-300 hover:text-stone-600"
                        }`}
                      >
                        {chapterStatusLabel(language, s)}
                      </button>
                    ))}
                  </div>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-stone-500">
                    {t("题材", "Genre")}
                  </span>
                  <input
                    value={currentProject.genre}
                    onChange={(event) =>
                      updateProject(currentProject.id, { genre: event.target.value })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-stone-500">
                    {t("基调", "Tone")}
                  </span>
                  <input
                    value={currentProject.tone}
                    onChange={(event) =>
                      updateProject(currentProject.id, { tone: event.target.value })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-stone-500">
                    {t("目标字数", "Target chars")}
                  </span>
                  <input
                    value={String(currentChapter.targetWordCount)}
                    onChange={(event) =>
                      updateChapter(currentChapter.id, {
                        targetWordCount:
                          Number(event.target.value) || currentChapter.targetWordCount,
                      })
                    }
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-stone-500">
                  {t("章节摘要", "Chapter summary")}
                </span>
                <textarea
                  value={currentChapter.summary}
                  onChange={(event) =>
                    updateChapter(currentChapter.id, { summary: event.target.value })
                  }
                  className={`min-h-24 ${textareaClass}`}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                {(
                  [
                    ["opening", t("开场", "Opening")],
                    ["development", t("发展", "Development")],
                    ["turn", t("转折", "Turn")],
                    ["endingHook", t("结尾钩子", "Ending hook")],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-stone-500">
                      {label}
                    </span>
                    <textarea
                      value={currentChapter.outline[key]}
                      onChange={(event) =>
                        updateChapter(currentChapter.id, {
                          outline: {
                            ...currentChapter.outline,
                            [key]: event.target.value,
                          },
                        })
                      }
                      className={`min-h-24 ${textareaClass}`}
                    />
                  </label>
                ))}
              </div>

              <label className="block">
                <span className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-stone-500">
                  <span>{t("正文", "Draft")}</span>
                  <span>{t(`${countWords(currentChapter.content)} 字`, `${countWords(currentChapter.content)} chars`)}</span>
                </span>
                <textarea
                  value={currentChapter.content}
                  onChange={(event) =>
                    updateChapterContent(currentChapter.id, event.target.value)
                  }
                  placeholder={t(
                    "开始写作，或先通过右侧的大纲策划补齐章节结构。",
                    "Start writing here, or use the outline planner on the right to shape the chapter first."
                  )}
                  className="min-h-[460px] w-full rounded-[30px] border border-[#eadfce] bg-[#fffdf8] px-6 py-5 text-sm leading-8 text-slate-800 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(234,223,206,0.55)] transition placeholder:text-stone-400 focus:border-[#d2c1aa] focus:ring-4 focus:ring-[#f3eadf]"
                />
              </label>
            </div>
          )
          )}
        </div>

        <div className="space-y-5">
          {panel(
            t("大纲策划", "Outline planning"),
            t(
              "先和系统补齐关键约束，再生成这一章的结构化大纲。",
              "Clarify the key constraints with the system first, then generate a structured outline for this chapter."
            ),
            (
            <div className="space-y-4">
              <div className="rounded-[24px] border border-[#e8d1b6] bg-[#fff6eb] px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#8f6036]">
                    {t("建议流程", "Suggested flow")}
                  </p>
                  <span className="rounded-full border border-[#e6c9a8] bg-white/80 px-3 py-1 text-[11px] font-medium text-[#8f6036]">
                    {outlineRound === "follow-up" ? t("追问轮次", "Follow-up round") : t("首轮澄清", "Initial round")}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {t(
                    `已回答 ${answeredQuestionCount} / ${outlineQuestions.length || 3} 个问题`,
                    `${answeredQuestionCount} / ${outlineQuestions.length || 3} questions answered`
                  )}
                </p>
                <p className="mt-2 text-sm leading-7 text-stone-600">
                  {t(
                    "系统会先问关键问题，再决定是否进入第二轮追问，避免无脑直接出大纲。",
                    "The system asks key questions first, then decides whether a follow-up round is needed instead of jumping straight to an outline."
                  )}
                </p>
                {outlineGuidance ? (
                  <p className="mt-3 rounded-[18px] border border-[#ecd9c2] bg-white/70 px-3 py-2 text-xs leading-6 text-[#7a5d41]">
                    {outlineGuidance}
                  </p>
                ) : null}
              </div>

              {outlineQuestions.length > 0 ? (
                <div className="space-y-3">
                  {outlineQuestions.map((item) => {
                    const currentAnswer =
                      outlineAnswers.find((answer) => answer.id === item.id)?.answer ?? "";
                    return (
                      <div
                        key={item.id}
                        className="rounded-[24px] border border-stone-200 bg-white p-4"
                      >
                        <span className="inline-flex rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] text-stone-600">
                          {item.round === "follow-up" ? t("追问", "Follow-up") : t("首轮", "Initial")}
                        </span>
                        <p className="text-sm font-semibold text-slate-900">{item.question}</p>
                        <p className="mt-1 text-xs leading-6 text-stone-500">{item.intent}</p>
                        <textarea
                          value={currentAnswer}
                          onChange={(event) =>
                            onOutlineAnswerChange(item.id, event.target.value)
                          }
                          placeholder={item.placeholder}
                          className={`mt-3 min-h-20 ${textareaClass}`}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-stone-300 bg-white px-4 py-4 text-sm leading-7 text-stone-600">
                  {t(
                    "还没有澄清问题。可以先让系统根据当前项目和画像提出一轮关键问题。",
                    "There are no clarification questions yet. Ask the system for an initial round based on the current project and persona."
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button onClick={onCreateOutlineQuestions} className={primaryButtonClass}>
                  {busyAction === "outline-questions"
                    ? t("提问中...", "Preparing...")
                    : outlineQuestions.length > 0
                      ? t("重新开始", "Restart")
                      : t("开始澄清", "Start clarifying")}
                </button>
                <button
                  onClick={onCreateOutlineFollowUp}
                  disabled={!canCreateFollowUp}
                  className={subtleButtonClass}
                >
                  {busyAction === "outline-follow-up" ? t("追问中...", "Following up...") : t("继续追问", "Ask follow-up")}
                </button>
                <button
                  onClick={onGenerateOutline}
                  disabled={outlineQuestions.length === 0}
                  className={subtleButtonClass}
                >
                  {busyAction === "generate-outline" ? t("生成中...", "Generating...") : t("根据回答生成大纲", "Generate outline from answers")}
                </button>
              </div>

              {outlineResult ? (
                <div className="rounded-[26px] border border-[#d9ebe9] bg-[#f2f8f8] p-4 shadow-[0_16px_30px_rgba(100,162,162,0.12)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {t("大纲预览", "Outline preview")}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {providerModeLabel(language, outlineResult.providerMode)} /{" "}
                        {outlineResult.usedPersona ? t("已注入画像", "Persona on") : t("未注入画像", "Persona off")}
                      </p>
                    </div>
                    <Sparkles className="h-4 w-4 text-[#3f7f7d]" />
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-700">{outlineResult.chapterSummary}</p>
                  <div className="mt-4 space-y-3 rounded-[20px] border border-[#d9ebe9] bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                    <p><span className="font-semibold text-slate-900">{t("开场：", "Opening: ")}</span>{outlineResult.outline.opening}</p>
                    <p><span className="font-semibold text-slate-900">{t("发展：", "Development: ")}</span>{outlineResult.outline.development}</p>
                    <p><span className="font-semibold text-slate-900">{t("转折：", "Turn: ")}</span>{outlineResult.outline.turn}</p>
                    <p><span className="font-semibold text-slate-900">{t("结尾钩子：", "Ending hook: ")}</span>{outlineResult.outline.endingHook}</p>
                  </div>
                  {outlineResult.notes.length > 0 ? (
                    <div className="mt-4 space-y-2 text-sm text-stone-600">
                      {outlineResult.notes.map((item) => (
                        <p key={item}>- {item}</p>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button onClick={onApplyOutline} className={primaryButtonClass}>
                      <CheckCheck className="h-4 w-4" />
                      {t("应用到当前章节", "Apply to chapter")}
                    </button>
                    <button
                      onClick={() => onGenerate("write-from-outline")}
                      className={subtleButtonClass}
                    >
                      {t("按大纲写本章", "Write from outline")}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )
          )}

          {panel(
            t("AI 协作", "AI collaboration"),
            t(
              "大纲稳定后再生成正文，会比直接盲写更稳。",
              "Generating after the outline is stable is usually more reliable than drafting blind."
            ),
            (
            <div className="space-y-4">
              <div className="rounded-[24px] border border-[#e8d1b6] bg-[#fff6eb] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[#8f6036]">
                  {t("推荐下一步", "Recommended next step")}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {recommendedAction.title}
                </p>
                <p className="mt-2 text-sm leading-7 text-stone-600">
                  {recommendedAction.detail}
                </p>
              </div>

              <div className="rounded-[24px] border border-stone-200 bg-[#fffdf9] px-4 py-3 text-xs leading-6 text-stone-600">
                {t("当前模式：", "Current mode: ")}
                <span className="ml-1 font-semibold text-slate-900">
                  {providerModeLabel(language, settings.mode)}
                </span>
                {t("，画像驱动", ", persona injection ")}
                <span className="mx-1 font-semibold text-slate-900">
                  {profile.enabled ? t("已开启", "on") : t("已关闭", "off")}
                </span>
                {t("，自动学习", ", auto-learning ")}
                <span className="ml-1 font-semibold text-slate-900">
                  {profile.autoLearningEnabled ? t("已开启", "on") : t("已关闭", "off")}
                </span>
                。
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => onGenerate("write-from-outline")}
                  disabled={!currentOutlineReady}
                  className={primaryButtonClass}
                >
                  {busyAction === "write-from-outline" ? t("起草中...", "Drafting...") : t("按大纲写本章", "Write from outline")}
                </button>
                <button
                  onClick={() => onGenerate("continue")}
                  className={subtleButtonClass}
                >
                  {busyAction === "continue" ? t("处理中...", "Working...") : t("续写", "Continue")}
                </button>
                <button
                  onClick={() => onGenerate("polish")}
                  className={subtleButtonClass}
                >
                  {busyAction === "polish" ? t("处理中...", "Working...") : t("润色", "Polish")}
                </button>
                <button
                  onClick={() => onGenerate("summarize")}
                  className={subtleButtonClass}
                >
                  {busyAction === "summarize" ? t("处理中...", "Working...") : t("总结", "Summarize")}
                </button>
              </div>

              <button onClick={onAnalyze} className={`${warmButtonClass} w-full`}>
                <WandSparkles className="h-4 w-4" />
                {busyAction === "chapter-diagnosis" ? t("诊断中...", "Diagnosing...") : t("章节诊断", "Chapter diagnosis")}
              </button>

              {previewResult ? (
                <div className="rounded-[26px] border border-[#cfe1e1] bg-[#f2f8f8] p-4 shadow-[0_16px_30px_rgba(100,162,162,0.12)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {t("预览结果", "Preview result")}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {providerModeLabel(language, previewResult.providerMode)} /{" "}
                        {previewResult.usedPersona ? t("已注入画像", "Persona on") : t("未注入画像", "Persona off")}
                      </p>
                    </div>
                    <Sparkles className="h-4 w-4 text-[#3f7f7d]" />
                  </div>
                  <div className="mt-4 max-h-56 overflow-y-auto rounded-[20px] border border-[#d9ebe9] bg-white px-4 py-3 text-sm leading-7 text-slate-700">
                    {previewResult.previewText}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button onClick={onApplyPreview} className={`${primaryButtonClass} flex-1`}>
                      <CheckCheck className="h-4 w-4" />
                      {t("应用到工作台", "Apply to workspace")}
                    </button>
                    {!profile.autoLearningEnabled ? (
                      <button onClick={onLearnFromPreview} className={subtleButtonClass}>
                        {t("手动学习这次结果", "Learn from this preview")}
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {analysisResult ? (
                <div className="rounded-[26px] border border-[#e8d1b6] bg-[#fcf6ee] p-4 shadow-[0_16px_30px_rgba(188,127,69,0.1)]">
                  <p className="text-sm font-semibold text-slate-900">{analysisResult.summary}</p>
                  <div className="mt-4 space-y-4 text-sm text-slate-700">
                    <div>
                      <p className="font-semibold text-[#8f6036]">{t("发现", "Findings")}</p>
                      <div className="mt-2 space-y-2 text-stone-600">
                        {analysisResult.findings.map((item) => (
                          <p key={item}>- {item}</p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-[#8f6036]">{t("建议", "Suggestions")}</p>
                      <div className="mt-2 space-y-2 text-stone-600">
                        {analysisResult.suggestions.map((item) => (
                          <p key={item}>- {item}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )
          )}

          {panel(
            t("项目上下文微调", "Project context tuning"),
            t(
              "这些信息会和用户画像一起进入模型，决定每次输出的偏移方向。",
              "These fields travel with the persona into the model and steer the direction of each response."
            ),
            (
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-stone-500">
                  {t("目标读者", "Audience")}
                </span>
                <input
                  value={currentProject.projectStyleOverlay.audience}
                  onChange={(event) =>
                    updateProjectOverlay(currentProject.id, { audience: event.target.value })
                  }
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-stone-500">
                  {t("语气备注", "Tone notes")}
                </span>
                <textarea
                  value={currentProject.projectStyleOverlay.toneNotes}
                  onChange={(event) =>
                    updateProjectOverlay(currentProject.id, { toneNotes: event.target.value })
                  }
                  className={`min-h-20 ${textareaClass}`}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-stone-500">
                  {t("额外风格备注", "Extra style notes")}
                </span>
                <textarea
                  value={currentProject.projectStyleOverlay.styleNotes}
                  onChange={(event) =>
                    updateProjectOverlay(currentProject.id, { styleNotes: event.target.value })
                  }
                  className={`min-h-20 ${textareaClass}`}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-stone-500">
                  {t("请更多使用", "Do more of")}
                </span>
                <input
                  value={currentProject.projectStyleOverlay.doMoreOf.join(listSeparator)}
                  onChange={(event) =>
                    updateProjectOverlay(currentProject.id, {
                      doMoreOf: event.target.value
                        .split(/[，,\n]/)
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-stone-500">
                  {t("尽量避免", "Avoid")}
                </span>
                <input
                  value={currentProject.projectStyleOverlay.avoid.join(listSeparator)}
                  onChange={(event) =>
                    updateProjectOverlay(currentProject.id, {
                      avoid: event.target.value
                        .split(/[，,\n]/)
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                  className={inputClass}
                />
              </label>
            </div>
          )
          )}

          {panel(
            t("角色与伏笔", "Characters and foreshadowing"),
            t(
              "保留最有价值的轻量上下文，不把工作台做成复杂后台。",
              "Keep the most valuable lightweight context without turning the workbench into a complex admin panel."
            ),
            (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-slate-900">{t("角色", "Characters")}</p>
                <div className="mt-3 grid gap-3">
                  {currentProject.characters.map((character) => (
                    <div
                      key={character.id}
                      className="rounded-[22px] border border-stone-200 bg-[#fffdf8] px-4 py-4"
                    >
                      <input
                        value={character.name}
                        onChange={(event) =>
                          updateCharacter(character.id, { name: event.target.value })
                        }
                        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
                      />
                      <textarea
                        value={character.notes}
                        onChange={(event) =>
                          updateCharacter(character.id, { notes: event.target.value })
                        }
                        placeholder={t(
                          "角色目标、状态变化或当前章节里的作用",
                          "Character goal, emotional shift, or function in the current chapter"
                        )}
                        className="mt-2 min-h-16 w-full bg-transparent text-sm leading-6 text-stone-600 outline-none placeholder:text-stone-400"
                      />
                    </div>
                  ))}
                  <div className="rounded-[22px] border border-dashed border-stone-300 bg-white p-4">
                    <input
                      value={characterDraft.name}
                      onChange={(event) =>
                        setCharacterDraft((state) => ({ ...state, name: event.target.value }))
                      }
                      placeholder={t("新增角色名", "New character name")}
                      className={inputClass}
                    />
                    <textarea
                      value={characterDraft.notes}
                      onChange={(event) =>
                        setCharacterDraft((state) => ({ ...state, notes: event.target.value }))
                      }
                      placeholder={t(
                        "备注：这个角色在当前章节最重要的功能",
                        "Notes: the most important function of this character in the current chapter"
                      )}
                      className={`mt-3 min-h-16 ${textareaClass}`}
                    />
                    <button
                      onClick={() => {
                        if (!characterDraft.name.trim()) return;
                        addCharacter(characterDraft);
                        setCharacterDraft({
                          name: "",
                          role: "supporting",
                          goal: "",
                          emotion: "",
                          arc: "",
                          notes: "",
                        });
                      }}
                      className={`mt-3 ${subtleButtonClass}`}
                    >
                      {t("添加角色", "Add character")}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">{t("伏笔", "Foreshadowing")}</p>
                <div className="mt-3 space-y-3">
                  {currentProject.foreshadows.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[22px] border border-stone-200 bg-[#fffdf8] px-4 py-4"
                    >
                      <p className="text-sm text-slate-800">{item.content}</p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-xs text-stone-500">
                          {item.status === "open" ? t("待回收", "Open") : t("已回收", "Resolved")}
                        </span>
                        {item.status === "open" ? (
                          <button
                            onClick={() =>
                              resolveForeshadow(item.id, t("已在后续章节回收", "Resolved in a later chapter"))
                            }
                            className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-slate-700 transition hover:bg-stone-50"
                          >
                            {t("标记已回收", "Mark resolved")}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  <div className="rounded-[22px] border border-dashed border-stone-300 bg-white p-4">
                    <textarea
                      value={foreshadowText}
                      onChange={(event) => setForeshadowText(event.target.value)}
                      placeholder={t(
                        "新增一条当前章节埋下的伏笔",
                        "Add one new foreshadowing beat planted in this chapter"
                      )}
                      className={`min-h-16 ${textareaClass}`}
                    />
                    <button
                      onClick={() => {
                        if (!foreshadowText.trim()) return;
                        addForeshadow({
                          content: foreshadowText.trim(),
                          plantedChapterId: currentChapter.id,
                          status: "open",
                        });
                        setForeshadowText("");
                      }}
                      className={`mt-3 ${subtleButtonClass}`}
                    >
                      {t("添加伏笔", "Add foreshadowing")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
          )}

          {panel(
            t("QC 与禁用表达", "QC and banned phrases"),
            t(
              "基础规则质检仍然保留，避免生成内容越写越散。",
              "A lightweight QC layer stays in place so generated content does not drift too far off course."
            ),
            (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {currentProject.bannedPhrases.map((item) => (
                  <button
                    key={item}
                    onClick={() => removeBannedPhrase(item)}
                    className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-slate-700 transition hover:bg-stone-50"
                  >
                    {item} ×
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <input
                  value={bannedPhrase}
                  onChange={(event) => setBannedPhrase(event.target.value)}
                  placeholder={t("新增禁用表达", "Add a banned phrase")}
                  className={`flex-1 ${inputClass}`}
                />
                <button
                  onClick={() => {
                    if (!bannedPhrase.trim()) return;
                    addBannedPhrase(bannedPhrase);
                    setBannedPhrase("");
                  }}
                  className={subtleButtonClass}
                >
                  {t("添加", "Add")}
                </button>
              </div>

              {qc ? (
                <div className="space-y-3">
                  <div className="rounded-[22px] border border-[#d9ebe9] bg-[#f2f8f8] px-4 py-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {t("当前 QC 分数", "Current QC score")}
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-[#17324d]">{qc.score}</p>
                  </div>
                  {qc.reports.map((report) => (
                    <div
                      key={report.dimension}
                      className="rounded-[22px] border border-stone-200 bg-white px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">
                          {report.dimension}
                        </p>
                        <span className="text-xs text-stone-500">{report.score}</span>
                      </div>
                      <div className="mt-2 space-y-1 text-xs leading-6 text-stone-600">
                        {(report.issues.length > 0 ? report.issues : report.suggestions).map(
                          (item) => (
                            <p key={item}>- {item}</p>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )
          )}
        </div>
      </div>
    </div>
  );
}
