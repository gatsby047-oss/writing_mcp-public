"use client";

import { History, RotateCcw, Sparkles } from "lucide-react";
import type { Chapter, UserProfile } from "@/lib/modeling";
import {
  formatDateTime,
  learningSourceLabel,
  uiText,
  type UILanguage,
} from "@/lib/i18n";

const panelClass =
  "rounded-[30px] border border-stone-200 bg-[rgba(255,255,255,0.84)] p-5 shadow-[0_18px_40px_rgba(148,163,184,0.14)] backdrop-blur-xl";
const textareaClass =
  "w-full rounded-[24px] border border-stone-200 bg-white px-4 py-3 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-stone-400 focus:border-[#88aeb3] focus:ring-4 focus:ring-[#e4eff0]";
const primaryButtonClass =
  "rounded-2xl bg-[#17324d] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(23,50,77,0.18)] transition hover:-translate-y-[1px] hover:bg-[#1b4266]";
const subtleButtonClass =
  "rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:border-stone-300 hover:bg-stone-50";

function toggleRow(
  title: string,
  description: string,
  checked: boolean,
  onChange: (value: boolean) => void,
  disabled?: boolean
) {
  return (
    <button
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className="flex w-full items-center justify-between gap-4 rounded-[24px] border border-stone-200 bg-white px-4 py-4 text-left transition disabled:opacity-70"
    >
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-xs leading-6 text-stone-500">{description}</p>
      </div>
      <div
        className={`relative h-7 w-12 rounded-full transition ${
          checked ? "bg-[#7ea8ab]" : "bg-stone-200"
        }`}
      >
        <div
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </div>
    </button>
  );
}

function chip(label: string) {
  return (
    <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-slate-700">
      {label}
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

export default function ProfileView({
  language,
  profile,
  currentChapter,
  busyAction,
  manualSample,
  onManualSampleChange,
  onTogglePersona,
  onToggleAutoLearning,
  onLearnSample,
  onLearnCurrentChapter,
  onUndoLearning,
  pending,
  statusMessage,
  errorMessage,
}: {
  language: UILanguage;
  profile: UserProfile;
  currentChapter: Chapter | null;
  busyAction: string | null;
  manualSample: string;
  onManualSampleChange: (value: string) => void;
  onTogglePersona: (enabled: boolean) => void;
  onToggleAutoLearning: (enabled: boolean) => void;
  onLearnSample: () => void;
  onLearnCurrentChapter: () => void;
  onUndoLearning: () => void;
  pending: boolean;
  statusMessage: string | null;
  errorMessage: string | null;
}) {
  return (
    <div className="space-y-5">
      {statusMessage ? statusCard("success", statusMessage) : null}
      {errorMessage ? statusCard("error", errorMessage) : null}

      <section className="rounded-[34px] border border-stone-200 bg-[linear-gradient(145deg,#fffefb,#f3ece1)] p-7 shadow-[0_24px_54px_rgba(148,163,184,0.16)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-4 py-1.5 text-xs uppercase tracking-[0.28em] text-stone-600">
          <Sparkles className="h-3.5 w-3.5 text-[#3f7f7d]" />
          {uiText(language, "用户画像记忆", "Persona memory")}
        </div>
        <h2 className="mt-7 font-serif text-4xl text-slate-900">
          {uiText(
            language,
            "系统目前是这样理解你的风格的",
            "How the system currently understands your style"
          )}
        </h2>
        <p className="mt-4 max-w-4xl text-base leading-8 text-slate-600">
          {profile.styleFingerprint.narrativePerspective}，{profile.styleFingerprint.pacing}，
          {profile.styleFingerprint.sentenceRhythm}
          {uiText(language, "，整体偏向", ", with an overall preference for ")}
          {profile.styleFingerprint.dialoguePreference}
          {uiText(language, "与", " and ")}
          {profile.styleFingerprint.emotionalRegister}
          {uiText(language, "。", ".")}
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-[22px] border border-stone-200 bg-white/85 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
              {uiText(language, "画像版本", "Profile version")}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">v{profile.version}</p>
          </div>
          <div className="rounded-[22px] border border-stone-200 bg-white/85 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
              {uiText(language, "自动学习", "Auto-learning")}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {profile.autoLearningEnabled
                ? uiText(language, "开启", "On")
                : uiText(language, "关闭", "Off")}
            </p>
          </div>
          <div className="rounded-[22px] border border-stone-200 bg-white/85 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
              {uiText(language, "学习事件", "Learning events")}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {profile.recentLearningEvents.length}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {profile.preferenceSignals.slice(0, 6).map((item) => chip(item.label))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-5">
          <section className={panelClass}>
            <div className="mb-4">
              <p className="text-sm font-semibold text-slate-900">
                {uiText(language, "画像开关", "Persona switches")}
              </p>
              <p className="mt-1 text-xs leading-6 text-stone-500">
                {uiText(
                  language,
                  "把“是否使用画像”和“是否自动学习”拆开，方便分别控制推理与记忆行为。",
                  'Separate "use persona" from "auto-learn" so generation and memory can be controlled independently.'
                )}
              </p>
            </div>
            <div className="space-y-3">
              {toggleRow(
                uiText(language, "启用画像驱动", "Enable persona-driven generation"),
                uiText(language, "关闭后，画像保留但不参与推理。", "When disabled, the persona is kept but not injected into generation."),
                profile.enabled,
                onTogglePersona,
                pending
              )}
              {toggleRow(
                uiText(language, "启用自动学习", "Enable auto-learning"),
                uiText(language, "开启后，接受 AI 结果会自动写入学习事件。", "Accepted AI output will automatically become a learning event."),
                profile.autoLearningEnabled,
                onToggleAutoLearning,
                pending
              )}
            </div>
          </section>

          <section className={panelClass}>
            <div className="mb-4">
              <p className="text-sm font-semibold text-slate-900">
                {uiText(language, "风格指纹", "Style fingerprint")}
              </p>
              <p className="mt-1 text-xs leading-6 text-stone-500">
                {uiText(
                  language,
                  "这些字段会直接参与服务端提示词拼接。",
                  "These fields are injected directly into the server-side prompt."
                )}
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                [uiText(language, "叙述视角", "Narrative perspective"), profile.styleFingerprint.narrativePerspective],
                [uiText(language, "节奏偏好", "Pacing"), profile.styleFingerprint.pacing],
                [uiText(language, "句式倾向", "Sentence rhythm"), profile.styleFingerprint.sentenceRhythm],
                [uiText(language, "细节密度", "Detail density"), profile.styleFingerprint.detailDensity],
                [uiText(language, "对话倾向", "Dialogue preference"), profile.styleFingerprint.dialoguePreference],
                [uiText(language, "情绪气质", "Emotional register"), profile.styleFingerprint.emotionalRegister],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[22px] border border-stone-200 bg-[#fffdf8] px-4 py-4"
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-stone-500">{label}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-800">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {profile.styleFingerprint.revisionBias.length > 0 ? (
                profile.styleFingerprint.revisionBias.map((item) => chip(item))
              ) : (
                <span className="text-sm text-stone-500">
                  {uiText(
                    language,
                    "还没有积累到明确的修订偏好。",
                    "No clear revision preference has been learned yet."
                  )}
                </span>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className={panelClass}>
            <div className="mb-4">
              <p className="text-sm font-semibold text-slate-900">
                {uiText(language, "手动学习入口", "Manual learning")}
              </p>
              <p className="mt-1 text-xs leading-6 text-stone-500">
                {uiText(
                  language,
                  "你可以直接投喂一段最像自己的文本，让画像变得更快。",
                  "Paste a representative sample to accelerate how the persona adapts."
                )}
              </p>
            </div>
            <textarea
              value={manualSample}
              onChange={(event) => onManualSampleChange(event.target.value)}
              placeholder={uiText(
                language,
                "贴一段你希望系统学习的文本样本。",
                "Paste a text sample you want the system to learn from."
              )}
              className={`min-h-40 ${textareaClass}`}
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={onLearnSample} className={primaryButtonClass}>
                {busyAction === "manual-learning"
                  ? uiText(language, "学习中...", "Learning...")
                  : uiText(language, "从这段样本学习", "Learn from this sample")}
              </button>
              {currentChapter ? (
                <button onClick={onLearnCurrentChapter} className={subtleButtonClass}>
                  {uiText(language, "从当前章节学习", "Learn from current chapter")}
                </button>
              ) : null}
            </div>
          </section>

          <section className={panelClass}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {uiText(language, "最近学习事件", "Recent learning events")}
                </p>
                <p className="mt-1 text-xs leading-6 text-stone-500">
                  {uiText(
                    language,
                    "这里会记录系统最近从哪些文本里学到了新的偏好信号。",
                    "This records which accepted texts most recently changed the persona."
                  )}
                </p>
              </div>
              <button
                onClick={onUndoLearning}
                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-slate-700 transition hover:bg-stone-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {busyAction === "undo-learning"
                  ? uiText(language, "撤销中...", "Reverting...")
                  : uiText(language, "撤销最近一次", "Undo latest")}
              </button>
            </div>
            <div className="space-y-3">
              {profile.recentLearningEvents.length > 0 ? (
                profile.recentLearningEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-[24px] border border-stone-200 bg-[#fffdf8] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-[16px] bg-[#eef5f5] text-[#3f7f7d]">
                        <History className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {learningSourceLabel(language, event.source)}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {formatDateTime(event.createdAt, language, {
                            month: "numeric",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <div className="mt-3 space-y-1 text-sm leading-7 text-slate-700">
                          {event.inferredChanges.map((item) => (
                            <p key={item}>• {item}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-[24px] border border-dashed border-stone-300 px-4 py-4 text-sm text-stone-500">
                  {uiText(
                    language,
                    "还没有学习事件。先去工作台接受一次 AI 结果，画像就会开始生长。",
                    "No learning events yet. Accept one AI result from the workbench to start growing the persona."
                  )}
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
