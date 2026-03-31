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

function flowStep(index: number, title: string, active: boolean) {
  return (
    <div
      className={`rounded-[22px] border px-4 py-3 transition ${
        active
          ? "border-[#9db8bb] bg-[#eef5f5] shadow-[0_12px_22px_rgba(100,162,162,0.12)]"
          : "border-stone-200 bg-white"
      }`}
    >
      <div className="text-[11px] uppercase tracking-[0.24em] text-stone-500">
        Step {index}
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-900">{title}</p>
    </div>
  );
}

type ChapterShape = Project["chapters"][number];

export default function WorkbenchView(props: {
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

  const recommendedAction = useMemo(() => {
    if (!currentChapter) {
      return {
        title: "先创建一个项目",
        detail: "创建后就能进入写作、提问、大纲生成和正文起草的完整流程。",
      };
    }

    if (outlineQuestions.length === 0 && !currentOutlineReady) {
      return {
        title: "先做一轮大纲澄清",
        detail: "让系统先提 2 到 3 个关键问题，再根据你的回答生成当前章节大纲。",
      };
    }

    if (canCreateFollowUp) {
      return {
        title: "继续收窄关键约束",
        detail: "第一轮回答已经够用，可以再追问一轮，把代价、人物变化或结尾钩子压得更实。",
      };
    }

    if (outlineQuestions.length > 0 && !outlineResult) {
      return {
        title: "先回答澄清问题",
        detail: "补齐至少两个回答后再生成大纲，这样章节结构会更贴近你的真实意图。",
      };
    }

    if (outlineResult) {
      return {
        title: "先应用这版大纲",
        detail: "把大纲写回当前章节，再用“按大纲写本章”生成一版完整草稿。",
      };
    }

    if (!currentChapter.content.trim() && currentOutlineReady) {
      return {
        title: "按大纲写本章",
        detail: "当前结构已经足够，直接根据大纲生成草稿会比盲目续写更稳定。",
      };
    }

    if (previewResult) {
      return {
        title: "应用这次预览",
        detail: "应用后画像会更新，下一步可以切到 Profile 查看最近学习事件。",
      };
    }

    if (analysisResult) {
      return {
        title: "根据诊断补一个推进点",
        detail: "补完后再继续写或润色，内容会更连贯。",
      };
    }

    return {
      title: "继续写或局部润色",
      detail: "如果当前大纲稳定，优先按大纲推进正文；如果已有正文，再做局部润色。",
    };
  }, [
    analysisResult,
    canCreateFollowUp,
    currentChapter,
    currentOutlineReady,
    outlineQuestions.length,
    outlineResult,
    previewResult,
  ]);

  const flowTitles = [
    "补齐章节意图",
    "生成结构化大纲",
    "应用大纲并写正文",
    "接受结果让画像学习",
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
              Persona Writing Loop
            </div>
            <h2 className="mt-7 max-w-3xl font-serif text-4xl leading-tight text-slate-900 lg:text-5xl">
              先建一个项目，再让系统开始记住你的写作偏好。
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              这版工作台不追求大而全，而是把“澄清需求、生成大纲、起草章节、记录采纳”
              串成一条可解释、可展示、也真正可用的创作链路。
            </p>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                ["互动式大纲生成", "不是直接出结果，而是先问关键问题，再补出更贴近意图的章节结构。"],
                ["大纲直连正文", "应用大纲后可以直接根据结构起草章节，不用手动再组织一次。"],
                ["画像持续学习", "当你接受结果或手动投喂文本时，系统会更新长期风格偏好。"],
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
              <p className="text-sm font-semibold text-slate-900">创建项目</p>
              <p className="text-sm text-stone-500">先设定题材和基调，再进入当前章节的策划与写作。</p>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-700">项目标题</span>
              <input
                value={projectDraft.name}
                onChange={(event) =>
                  setProjectDraft((state) => ({ ...state, name: event.target.value }))
                }
                placeholder="例如：《冷雾港》"
                className={inputClass}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-700">题材</span>
                <input
                  value={projectDraft.genre}
                  onChange={(event) =>
                    setProjectDraft((state) => ({ ...state, genre: event.target.value }))
                  }
                  placeholder="悬疑 / 都市 / 长文"
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-700">基调</span>
                <input
                  value={projectDraft.tone}
                  onChange={(event) =>
                    setProjectDraft((state) => ({ ...state, tone: event.target.value }))
                  }
                  placeholder="冷静 / 压迫 / 温柔"
                  className={inputClass}
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-700">目标读者</span>
              <input
                value={projectDraft.audience}
                onChange={(event) =>
                  setProjectDraft((state) => ({ ...state, audience: event.target.value }))
                }
                placeholder="例如：偏爱悬疑推进的中文读者"
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
              进入写作工作台
            </button>

            <button onClick={loadSampleProject} className={`${subtleButtonClass} w-full`}>
              载入示例项目
            </button>
            <p className="text-xs leading-6 text-stone-500">
              这会自动生成项目、首章内容、角色、伏笔和上下文配置。
            </p>
          </div>
        </section>
      </div>
    );
  }

  const stats = [
    { label: "章节", value: currentProject.chapters.length, tone: "text-[#17324d]" },
    { label: "角色", value: currentProject.characters.length, tone: "text-[#5a756b]" },
    {
      label: "未回收伏笔",
      value: currentProject.foreshadows.filter((item) => item.status === "open").length,
      tone: "text-[#bc7f45]",
    },
    { label: "累计字数", value: getProjectWordCount(currentProject), tone: "text-[#7a4a57]" },
    { label: "学习事件", value: profile.recentLearningEvents.length, tone: "text-[#3f7f7d]" },
    {
      label: "模型模式",
      value: settings.mode === "mock" ? "Mock" : "OpenAI",
      tone: "text-[#17324d]",
    },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-stone-200 bg-[rgba(255,255,255,0.72)] p-4 shadow-[0_16px_34px_rgba(148,163,184,0.1)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-stone-500">建议流程</p>
            <p className="mt-2 text-sm text-slate-700">
              当前版本更推荐先补齐章节意图，再生成大纲、按大纲写正文，最后决定哪些结果值得被系统学习。
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-4 xl:min-w-[760px]">
            {flowTitles.map((title, index) => flowStep(index + 1, title, activeFlowStep === index + 1))}
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
          <span className="font-semibold">Mock 模式</span>
          {" —— "}当前使用本地模拟数据，不消耗 API 配额。
          前往 Settings 切换到 OpenAI 兼容接口以启用真实模型。
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)_410px]">
        <div className="space-y-5">
          {panel("项目目录", "把当前写作限制在一个项目和一个章节里，更容易保持上下文稳定。", (
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
                      {project.genre || "未设定题材"}
                      {project.tone ? ` / ${project.tone}` : ""}
                    </p>
                  </button>
                ))}
              </div>

              <div className="rounded-[26px] border border-stone-200 bg-[#fffdf8] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">章节列表</p>
                    <p className="mt-1 text-xs text-stone-500">每个项目都围绕一个个章节逐步推进。</p>
                  </div>
                  <button
                    onClick={() => {
                      addChapter(chapterTitle.trim() || undefined);
                      setChapterTitle("");
                    }}
                    className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-slate-700 transition hover:bg-stone-50"
                  >
                    新章节
                  </button>
                </div>
                <input
                  value={chapterTitle}
                  onChange={(event) => setChapterTitle(event.target.value)}
                  placeholder="可选：输入章节标题"
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
                        {countWords(chapter.content)} 字 / 目标 {chapter.targetWordCount}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {panel("长期风格画像", "这些信号会进入 AI 提示词，帮助系统持续贴近你的写作习惯。", (
            <div className="space-y-3">
              <p className="rounded-[24px] border border-stone-200 bg-[#fffdf8] px-4 py-4 text-sm leading-7 text-slate-700">
                {profile.styleFingerprint.narrativePerspective}，{profile.styleFingerprint.pacing}，
                {profile.styleFingerprint.sentenceRhythm}，整体更偏向
                {profile.styleFingerprint.dialoguePreference}。
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.preferenceSignals.slice(0, 5).map((item) => chip(item.label))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-5">
          {panel("稿纸与结构", "把设定、摘要、大纲和正文放在一处，方便连续策划与写作。", (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-stone-500">
                    项目名
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
                    章节标题
                  </span>
                  <input
                    value={currentChapter.title}
                    onChange={(event) =>
                      updateChapter(currentChapter.id, { title: event.target.value })
                    }
                    className={inputClass}
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-stone-500">状态</span>
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
                        {s === "draft" ? "草稿" : s === "review" ? "审阅" : "完成"}
                      </button>
                    ))}
                  </div>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-stone-500">
                    题材
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
                    基调
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
                    目标字数
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
                  章节摘要
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
                    ["opening", "开场"],
                    ["development", "发展"],
                    ["turn", "转折"],
                    ["endingHook", "结尾钩子"],
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
                  <span>正文</span>
                  <span>{countWords(currentChapter.content)} 字</span>
                </span>
                <textarea
                  value={currentChapter.content}
                  onChange={(event) =>
                    updateChapterContent(currentChapter.id, event.target.value)
                  }
                  placeholder="开始写作，或先通过右侧的大纲策划补齐章节结构。"
                  className="min-h-[460px] w-full rounded-[30px] border border-[#eadfce] bg-[#fffdf8] px-6 py-5 text-sm leading-8 text-slate-800 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(234,223,206,0.55)] transition placeholder:text-stone-400 focus:border-[#d2c1aa] focus:ring-4 focus:ring-[#f3eadf]"
                />
              </label>
            </div>
          ))}
        </div>

        <div className="space-y-5">
          {panel("大纲策划", "先和系统补齐关键约束，再生成这一章的结构化大纲。", (
            <div className="space-y-4">
              <div className="rounded-[24px] border border-[#e8d1b6] bg-[#fff6eb] px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#8f6036]">建议流程</p>
                  <span className="rounded-full border border-[#e6c9a8] bg-white/80 px-3 py-1 text-[11px] font-medium text-[#8f6036]">
                    {outlineRound === "follow-up" ? "追问轮次" : "首轮澄清"}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  已回答 {answeredQuestionCount} / {outlineQuestions.length || 3} 个问题
                </p>
                <p className="mt-2 text-sm leading-7 text-stone-600">
                  系统会先问关键问题，再决定是否进入第二轮追问，避免无脑直接出大纲。
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
                          {item.round === "follow-up" ? "追问" : "首轮"}
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
                  还没有澄清问题。可以先让系统根据当前项目和画像提出一轮关键问题。
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button onClick={onCreateOutlineQuestions} className={primaryButtonClass}>
                  {busyAction === "outline-questions"
                    ? "提问中..."
                    : outlineQuestions.length > 0
                      ? "重新开始"
                      : "开始澄清"}
                </button>
                <button
                  onClick={onCreateOutlineFollowUp}
                  disabled={!canCreateFollowUp}
                  className={subtleButtonClass}
                >
                  {busyAction === "outline-follow-up" ? "追问中..." : "继续追问"}
                </button>
                <button
                  onClick={onGenerateOutline}
                  disabled={outlineQuestions.length === 0}
                  className={subtleButtonClass}
                >
                  {busyAction === "generate-outline" ? "生成中..." : "根据回答生成大纲"}
                </button>
              </div>

              {outlineResult ? (
                <div className="rounded-[26px] border border-[#d9ebe9] bg-[#f2f8f8] p-4 shadow-[0_16px_30px_rgba(100,162,162,0.12)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">大纲预览</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {outlineResult.providerMode} / {outlineResult.usedPersona ? "已注入画像" : "未注入画像"}
                      </p>
                    </div>
                    <Sparkles className="h-4 w-4 text-[#3f7f7d]" />
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-700">{outlineResult.chapterSummary}</p>
                  <div className="mt-4 space-y-3 rounded-[20px] border border-[#d9ebe9] bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                    <p><span className="font-semibold text-slate-900">开场：</span>{outlineResult.outline.opening}</p>
                    <p><span className="font-semibold text-slate-900">发展：</span>{outlineResult.outline.development}</p>
                    <p><span className="font-semibold text-slate-900">转折：</span>{outlineResult.outline.turn}</p>
                    <p><span className="font-semibold text-slate-900">结尾钩子：</span>{outlineResult.outline.endingHook}</p>
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
                      应用到当前章节
                    </button>
                    <button
                      onClick={() => onGenerate("write-from-outline")}
                      className={subtleButtonClass}
                    >
                      按大纲写本章
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}

          {panel("AI 协作", "大纲稳定后再生成正文，会比直接盲写更稳。", (
            <div className="space-y-4">
              <div className="rounded-[24px] border border-[#e8d1b6] bg-[#fff6eb] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[#8f6036]">推荐下一步</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {recommendedAction.title}
                </p>
                <p className="mt-2 text-sm leading-7 text-stone-600">
                  {recommendedAction.detail}
                </p>
              </div>

              <div className="rounded-[24px] border border-stone-200 bg-[#fffdf9] px-4 py-3 text-xs leading-6 text-stone-600">
                当前模式：
                <span className="ml-1 font-semibold text-slate-900">
                  {settings.mode === "mock" ? "Mock" : "OpenAI Compatible"}
                </span>
                ，画像驱动
                <span className="mx-1 font-semibold text-slate-900">
                  {profile.enabled ? "已开启" : "已关闭"}
                </span>
                ，自动学习
                <span className="ml-1 font-semibold text-slate-900">
                  {profile.autoLearningEnabled ? "已开启" : "已关闭"}
                </span>
                。
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => onGenerate("write-from-outline")}
                  disabled={!currentOutlineReady}
                  className={primaryButtonClass}
                >
                  {busyAction === "write-from-outline" ? "起草中..." : "按大纲写本章"}
                </button>
                <button
                  onClick={() => onGenerate("continue")}
                  className={subtleButtonClass}
                >
                  {busyAction === "continue" ? "处理中..." : "续写"}
                </button>
                <button
                  onClick={() => onGenerate("polish")}
                  className={subtleButtonClass}
                >
                  {busyAction === "polish" ? "处理中..." : "润色"}
                </button>
                <button
                  onClick={() => onGenerate("summarize")}
                  className={subtleButtonClass}
                >
                  {busyAction === "summarize" ? "处理中..." : "总结"}
                </button>
              </div>

              <button onClick={onAnalyze} className={`${warmButtonClass} w-full`}>
                <WandSparkles className="h-4 w-4" />
                {busyAction === "chapter-diagnosis" ? "诊断中..." : "章节诊断"}
              </button>

              {previewResult ? (
                <div className="rounded-[26px] border border-[#cfe1e1] bg-[#f2f8f8] p-4 shadow-[0_16px_30px_rgba(100,162,162,0.12)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">预览结果</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {previewResult.providerMode} / {previewResult.usedPersona ? "已注入画像" : "未注入画像"}
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
                      应用到工作台
                    </button>
                    {!profile.autoLearningEnabled ? (
                      <button onClick={onLearnFromPreview} className={subtleButtonClass}>
                        手动学习这次结果
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
                      <p className="font-semibold text-[#8f6036]">发现</p>
                      <div className="mt-2 space-y-2 text-stone-600">
                        {analysisResult.findings.map((item) => (
                          <p key={item}>- {item}</p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-[#8f6036]">建议</p>
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
          ))}

          {panel("项目上下文微调", "这些信息会和用户画像一起进入模型，决定每次输出的偏移方向。", (
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-stone-500">
                  目标读者
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
                  语气备注
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
                  额外风格备注
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
                  请更多使用
                </span>
                <input
                  value={currentProject.projectStyleOverlay.doMoreOf.join("，")}
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
                  尽量避免
                </span>
                <input
                  value={currentProject.projectStyleOverlay.avoid.join("，")}
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
          ))}

          {panel("角色与伏笔", "保留最有价值的轻量上下文，不把工作台做成复杂后台。", (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-slate-900">角色</p>
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
                        placeholder="角色目标、状态变化或当前章节里的作用"
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
                      placeholder="新增角色名"
                      className={inputClass}
                    />
                    <textarea
                      value={characterDraft.notes}
                      onChange={(event) =>
                        setCharacterDraft((state) => ({ ...state, notes: event.target.value }))
                      }
                      placeholder="备注：这个角色在当前章节最重要的功能"
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
                      添加角色
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">伏笔</p>
                <div className="mt-3 space-y-3">
                  {currentProject.foreshadows.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[22px] border border-stone-200 bg-[#fffdf8] px-4 py-4"
                    >
                      <p className="text-sm text-slate-800">{item.content}</p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-xs text-stone-500">
                          {item.status === "open" ? "待回收" : "已回收"}
                        </span>
                        {item.status === "open" ? (
                          <button
                            onClick={() => resolveForeshadow(item.id, "已在后续章节回收")}
                            className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-slate-700 transition hover:bg-stone-50"
                          >
                            标记已回收
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  <div className="rounded-[22px] border border-dashed border-stone-300 bg-white p-4">
                    <textarea
                      value={foreshadowText}
                      onChange={(event) => setForeshadowText(event.target.value)}
                      placeholder="新增一条当前章节埋下的伏笔"
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
                      添加伏笔
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {panel("QC 与禁用表达", "基础规则质检仍然保留，避免生成内容越写越散。", (
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
                  placeholder="新增禁用表达"
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
                  添加
                </button>
              </div>

              {qc ? (
                <div className="space-y-3">
                  <div className="rounded-[22px] border border-[#d9ebe9] bg-[#f2f8f8] px-4 py-4">
                    <p className="text-sm font-semibold text-slate-900">当前 QC 分数</p>
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
          ))}
        </div>
      </div>
    </div>
  );
}
