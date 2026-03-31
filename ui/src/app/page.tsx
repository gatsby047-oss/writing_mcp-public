"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  analyzeText,
  createOutlineFollowUpQuestions,
  createOutlineQuestions,
  fetchModelSettings,
  fetchProfile,
  generateOutline,
  generateText,
  learnProfile,
  saveModelSettings,
  undoLearning,
  updateProfile,
} from "@/lib/model-client";
import type {
  AnalyzeTextResponse,
  GenerateOutlineResponse,
  GenerateTextResponse,
  LearningSource,
  ModelSettings,
  OutlineAnswer,
  OutlineQuestion,
  OutlineQuestionRound,
  UserProfile,
} from "@/lib/modeling";
import ProfileView from "@/components/ProfileView";
import BookshelfView from "@/components/BookshelfView";
import SettingsView from "@/components/SettingsView";
import WorkbenchView from "@/components/WorkbenchView";
import { useAIWSStore } from "@/lib/state";

function LoadingScreen() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="rounded-[28px] border border-stone-200 bg-white/90 px-6 py-5 text-center shadow-[0_18px_36px_rgba(148,163,184,0.12)]">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#bdd3d5] border-t-[#17324d]" />
        <p className="text-sm text-slate-700">正在恢复你的工作台与用户画像...</p>
      </div>
    </div>
  );
}

function hasOutlineContent(outline?: {
  opening: string;
  development: string;
  turn: string;
  endingHook: string;
}) {
  if (!outline) return false;
  return Object.values(outline).some((item) => item.trim().length > 0);
}

export default function Home() {
  const hasHydrated = useAIWSStore((state) => state.hasHydrated);
  const view = useAIWSStore((state) => state.view);
  const projects = useAIWSStore((state) => state.projects);
  const currentProjectId = useAIWSStore((state) => state.currentProjectId);
  const currentChapterId = useAIWSStore((state) => state.currentChapterId);
  const setCurrentProject = useAIWSStore((state) => state.setCurrentProject);
  const setCurrentChapter = useAIWSStore((state) => state.setCurrentChapter);
  const updateChapter = useAIWSStore((state) => state.updateChapter);
  const updateChapterContent = useAIWSStore((state) => state.updateChapterContent);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<ModelSettings | null>(null);
  const [previewResult, setPreviewResult] = useState<GenerateTextResponse | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeTextResponse | null>(null);
  const [outlineQuestions, setOutlineQuestions] = useState<OutlineQuestion[]>([]);
  const [outlineAnswers, setOutlineAnswers] = useState<OutlineAnswer[]>([]);
  const [outlineResult, setOutlineResult] = useState<GenerateOutlineResponse | null>(null);
  const [outlineRound, setOutlineRound] = useState<OutlineQuestionRound>("initial");
  const [outlineGuidance, setOutlineGuidance] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [manualSample, setManualSample] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!currentProjectId && projects.length > 0) {
      setCurrentProject(projects[0].id);
    }
  }, [currentProjectId, hasHydrated, projects, setCurrentProject]);

  useEffect(() => {
    if (!currentProjectId) return;
    const project = projects.find((item) => item.id === currentProjectId) ?? null;
    if (!project) return;
    if (!currentChapterId || !project.chapters.some((item) => item.id === currentChapterId)) {
      const fallback = project.chapters[0]?.id ?? null;
      if (fallback) {
        setCurrentChapter(fallback);
      }
    }
  }, [currentChapterId, currentProjectId, projects, setCurrentChapter]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const [profilePayload, settingsPayload] = await Promise.all([
          fetchProfile(),
          fetchModelSettings(),
        ]);
        if (cancelled) return;
        setProfile(profilePayload.profile);
        setSettings(settingsPayload.settings);
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error instanceof Error ? error.message : "初始化失败");
      }
    }

    if (hasHydrated) {
      void bootstrap();
    }

    return () => {
      cancelled = true;
    };
  }, [hasHydrated]);

  const currentProject = useMemo(
    () => projects.find((project) => project.id === currentProjectId) ?? null,
    [currentProjectId, projects]
  );

  const currentChapter = useMemo(
    () => currentProject?.chapters.find((chapter) => chapter.id === currentChapterId) ?? null,
    [currentChapterId, currentProject]
  );

  const projectContext = useMemo(() => {
    if (!currentProject || !currentChapter) return undefined;
    return {
      projectId: currentProject.id,
      projectName: currentProject.name,
      genre: currentProject.genre,
      tone: currentProject.tone,
      chapterId: currentChapter.id,
      chapterTitle: currentChapter.title,
      chapterSummary: currentChapter.summary,
      outline: currentChapter.outline,
      characters: currentProject.characters,
      foreshadows: currentProject.foreshadows,
      bannedPhrases: currentProject.bannedPhrases,
      projectStyleOverlay: currentProject.projectStyleOverlay,
    };
  }, [currentChapter, currentProject]);

  useEffect(() => {
    setPreviewResult(null);
    setAnalysisResult(null);
    setOutlineQuestions([]);
    setOutlineAnswers([]);
    setOutlineResult(null);
    setOutlineRound("initial");
    setOutlineGuidance(null);
  }, [currentChapterId, currentProjectId]);

  function resetAiMessages() {
    setErrorMessage(null);
    setStatusMessage(null);
  }

  function syncOutlineQuestions(
    questions: OutlineQuestion[],
    options?: {
      mode?: "replace" | "append";
      round?: OutlineQuestionRound;
      guidance?: string;
    }
  ) {
    const mode = options?.mode ?? "replace";

    setOutlineQuestions((currentQuestions) => {
      if (mode === "append") {
        return [...currentQuestions, ...questions];
      }
      return questions;
    });

    setOutlineAnswers((currentAnswers) => {
      const nextAnswers =
        mode === "append"
          ? [...currentAnswers]
          : [];

      for (const item of questions) {
        const existing = currentAnswers.find((answer) => answer.id === item.id);
        nextAnswers.push({
          id: item.id,
          question: item.question,
          answer: existing?.answer ?? "",
          round: item.round,
        });
      }

      return nextAnswers;
    });

    if (options?.round) {
      setOutlineRound(options.round);
    }
    setOutlineGuidance(options?.guidance ?? null);
  }

  async function syncProfilePatch(patch: Parameters<typeof updateProfile>[0]) {
    const payload = await updateProfile(patch);
    setProfile(payload.profile);
  }

  async function handleGenerate(action: GenerateTextResponse["action"]) {
    if (!currentChapter) return;

    if (action === "write-from-outline" && !hasOutlineContent(currentChapter.outline)) {
      setErrorMessage("先补齐当前章节大纲，再按大纲生成正文。");
      setStatusMessage(null);
      return;
    }

    setBusyAction(action);
    resetAiMessages();

    try {
      const result = await generateText({
        action,
        text: currentChapter.content,
        context: projectContext,
      });
      setPreviewResult(result);
      setAnalysisResult(null);
      setStatusMessage(`${result.summary}，当前使用 ${result.providerMode} 模式。`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "生成失败");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleAnalyze() {
    if (!currentChapter) return;
    setBusyAction("chapter-diagnosis");
    resetAiMessages();

    try {
      const result = await analyzeText({
        action: "chapter-diagnosis",
        text: currentChapter.content,
        context: projectContext,
      });
      setAnalysisResult(result);
      setStatusMessage(`${result.summary}，当前使用 ${result.providerMode} 模式。`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "诊断失败");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCreateOutlineQuestions() {
    if (!currentChapter) return;
    setBusyAction("outline-questions");
    resetAiMessages();

    try {
      const result = await createOutlineQuestions({
        text:
          currentChapter.content.trim() ||
          currentChapter.summary.trim() ||
          currentChapter.title.trim(),
        context: projectContext,
      });
      syncOutlineQuestions(result.questions, {
        mode: "replace",
        round: result.round,
        guidance: result.guidance,
      });
      setOutlineResult(null);
      setStatusMessage(`${result.summary}，当前使用 ${result.providerMode} 模式。`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "生成澄清问题失败");
    } finally {
      setBusyAction(null);
    }
  }

  function handleOutlineAnswerChange(questionId: string, answer: string) {
    setOutlineAnswers((state) =>
      state.map((item) => (item.id === questionId ? { ...item, answer } : item))
    );
  }

  async function handleCreateOutlineFollowUp() {
    if (!currentChapter || outlineQuestions.length === 0) return;

    const answeredCount = outlineAnswers.filter((item) => item.answer.trim()).length;
    if (answeredCount < Math.min(2, outlineAnswers.length)) {
      setErrorMessage("先回答至少两个问题，再进入下一轮追问。");
      setStatusMessage(null);
      return;
    }

    setBusyAction("outline-follow-up");
    resetAiMessages();

    try {
      const result = await createOutlineFollowUpQuestions({
        text:
          currentChapter.content.trim() ||
          currentChapter.summary.trim() ||
          currentChapter.title.trim(),
        context: projectContext,
        answers: outlineAnswers,
      });
      syncOutlineQuestions(result.questions, {
        mode: "append",
        round: result.round,
        guidance: result.guidance,
      });
      setOutlineResult(null);
      setStatusMessage(`${result.summary}，当前使用 ${result.providerMode} 模式。`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "生成追问失败");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleGenerateOutline() {
    if (!currentChapter || outlineAnswers.length === 0) {
      setErrorMessage("先获取澄清问题，再根据回答生成大纲。");
      setStatusMessage(null);
      return;
    }

    const answeredCount = outlineAnswers.filter((item) => item.answer.trim()).length;
    if (answeredCount < Math.min(2, outlineAnswers.length)) {
      setErrorMessage("先回答至少两个澄清问题，再生成大纲。");
      setStatusMessage(null);
      return;
    }

    setBusyAction("generate-outline");
    resetAiMessages();

    try {
      const result = await generateOutline({
        text: currentChapter.content,
        context: projectContext,
        answers: outlineAnswers,
      });
      setOutlineResult(result);
      setStatusMessage(`${result.summary}，当前使用 ${result.providerMode} 模式。`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "生成大纲失败");
    } finally {
      setBusyAction(null);
    }
  }

  function handleApplyOutline() {
    if (!currentChapter || !outlineResult) return;

    updateChapter(currentChapter.id, {
      summary: outlineResult.chapterSummary || currentChapter.summary,
      outline: outlineResult.outline,
    });
    setStatusMessage("大纲已应用到当前章节。");
    setErrorMessage(null);
  }

  async function applyPreviewResult(sourceOverride?: LearningSource) {
    if (!currentChapter || !previewResult || !profile) return;

    const previousContent = currentChapter.content;
    let nextContent = currentChapter.content;

    if (previewResult.action === "continue") {
      nextContent = [currentChapter.content.trim(), previewResult.previewText.trim()]
        .filter(Boolean)
        .join("\n\n");
      updateChapterContent(currentChapter.id, nextContent);
    } else if (
      previewResult.action === "polish" ||
      previewResult.action === "write-from-outline"
    ) {
      nextContent = previewResult.previewText.trim();
      updateChapterContent(currentChapter.id, nextContent);
    } else {
      updateChapter(currentChapter.id, { summary: previewResult.previewText.trim() });
    }

    setStatusMessage("预览结果已应用。");

    const source =
      sourceOverride ??
      (previewResult.action === "polish" ? "accepted_polish" : "accepted_generation");

    if (profile.autoLearningEnabled) {
      try {
        const learned = await learnProfile({
          source,
          beforeText:
            previewResult.action === "summarize" ? currentChapter.summary : previousContent,
          afterText:
            previewResult.action === "summarize"
              ? previewResult.previewText
              : nextContent,
        });
        setProfile(learned.profile);
        setStatusMessage(
          `预览结果已应用，并已更新用户画像：${learned.learned[0] ?? "已学习新的风格样本"}`
        );
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "画像学习失败");
      }
    }
  }

  async function handleManualLearn(sample: string, source: LearningSource) {
    const trimmed = sample.trim();
    if (!trimmed) return;

    setBusyAction("manual-learning");
    resetAiMessages();

    try {
      const result = await learnProfile({
        source,
        afterText: trimmed,
      });
      setProfile(result.profile);
      setStatusMessage(`画像已更新：${result.learned.join("、")}`);
      setManualSample("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "手动学习失败");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleUndoLearning() {
    setBusyAction("undo-learning");
    resetAiMessages();

    try {
      const payload = await undoLearning();
      setProfile(payload.profile);
      setStatusMessage("已撤销最近一次学习。");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "撤销失败");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSaveSettings(nextSettings: ModelSettings) {
    setBusyAction("save-settings");
    resetAiMessages();

    try {
      const payload = await saveModelSettings(nextSettings);
      setSettings(payload.settings);
      setStatusMessage("模型设置已保存。");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "保存设置失败");
    } finally {
      setBusyAction(null);
    }
  }

  if (!hasHydrated || !profile || !settings) {
    return <LoadingScreen />;
  }

  if (view === "profile") {
    return (
      <ProfileView
        profile={profile}
        currentChapter={currentChapter}
        busyAction={busyAction}
        manualSample={manualSample}
        onManualSampleChange={setManualSample}
        onTogglePersona={(enabled) =>
          startTransition(() => {
            void syncProfilePatch({ enabled });
          })
        }
        onToggleAutoLearning={(autoLearningEnabled) =>
          startTransition(() => {
            void syncProfilePatch({ autoLearningEnabled });
          })
        }
        onLearnSample={() => void handleManualLearn(manualSample, "manual_feedback")}
        onLearnCurrentChapter={() =>
          currentChapter
            ? void handleManualLearn(currentChapter.content, "edited_after_ai")
            : undefined
        }
        onUndoLearning={() => void handleUndoLearning()}
        pending={isPending}
        statusMessage={statusMessage}
        errorMessage={errorMessage}
      />
    );
  }

  if (view === "bookshelf") {
    return <BookshelfView />;
  }

  if (view === "settings") {
    return (
      <SettingsView
        profile={profile}
        settings={settings}
        busyAction={busyAction}
        onSave={handleSaveSettings}
        onTogglePersona={(enabled) =>
          startTransition(() => {
            void syncProfilePatch({ enabled });
          })
        }
        onToggleAutoLearning={(autoLearningEnabled) =>
          startTransition(() => {
            void syncProfilePatch({ autoLearningEnabled });
          })
        }
        pending={isPending}
        statusMessage={statusMessage}
        errorMessage={errorMessage}
      />
    );
  }

  return (
    <WorkbenchView
      profile={profile}
      settings={settings}
      currentProject={currentProject}
      currentChapter={currentChapter}
      previewResult={previewResult}
      analysisResult={analysisResult}
      outlineQuestions={outlineQuestions}
      outlineAnswers={outlineAnswers}
      outlineResult={outlineResult}
      outlineRound={outlineRound}
      outlineGuidance={outlineGuidance}
      busyAction={busyAction}
      statusMessage={statusMessage}
      errorMessage={errorMessage}
      onGenerate={(action) => void handleGenerate(action)}
      onAnalyze={() => void handleAnalyze()}
      onCreateOutlineQuestions={() => void handleCreateOutlineQuestions()}
      onCreateOutlineFollowUp={() => void handleCreateOutlineFollowUp()}
      onOutlineAnswerChange={handleOutlineAnswerChange}
      onGenerateOutline={() => void handleGenerateOutline()}
      onApplyOutline={handleApplyOutline}
      onApplyPreview={() => void applyPreviewResult()}
      onLearnFromPreview={() =>
        previewResult
          ? void handleManualLearn(
              previewResult.previewText,
              previewResult.action === "polish" ? "accepted_polish" : "accepted_generation"
            )
          : undefined
      }
    />
  );
}
