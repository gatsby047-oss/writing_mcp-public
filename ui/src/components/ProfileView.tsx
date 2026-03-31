"use client";

import { History, RotateCcw, Sparkles } from "lucide-react";
import type { Chapter, UserProfile } from "@/lib/modeling";

const panelClass =
  "rounded-[30px] border border-stone-200 bg-[rgba(255,255,255,0.84)] p-5 shadow-[0_18px_40px_rgba(148,163,184,0.14)] backdrop-blur-xl";
const textareaClass =
  "w-full rounded-[24px] border border-stone-200 bg-white px-4 py-3 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-stone-400 focus:border-[#88aeb3] focus:ring-4 focus:ring-[#e4eff0]";
const primaryButtonClass =
  "rounded-2xl bg-[#17324d] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(23,50,77,0.18)] transition hover:-translate-y-[1px] hover:bg-[#1b4266]";
const subtleButtonClass =
  "rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:border-stone-300 hover:bg-stone-50";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

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
          用户画像记忆
        </div>
        <h2 className="mt-7 font-serif text-4xl text-slate-900">系统认为你的风格像这样</h2>
        <p className="mt-4 max-w-4xl text-base leading-8 text-slate-600">
          {profile.styleFingerprint.narrativePerspective}，{profile.styleFingerprint.pacing}，
          {profile.styleFingerprint.sentenceRhythm}，整体偏向
          {profile.styleFingerprint.dialoguePreference}与
          {profile.styleFingerprint.emotionalRegister}。
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-[22px] border border-stone-200 bg-white/85 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">画像版本</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">v{profile.version}</p>
          </div>
          <div className="rounded-[22px] border border-stone-200 bg-white/85 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">自动学习</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {profile.autoLearningEnabled ? "开启" : "关闭"}
            </p>
          </div>
          <div className="rounded-[22px] border border-stone-200 bg-white/85 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">学习事件</p>
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
              <p className="text-sm font-semibold text-slate-900">画像开关</p>
              <p className="mt-1 text-xs leading-6 text-stone-500">
                把“是否使用画像”和“是否自动学习”拆开，方便分别控制推理与记忆行为。
              </p>
            </div>
            <div className="space-y-3">
              {toggleRow(
                "启用画像驱动",
                "关闭后，画像保留但不参与推理。",
                profile.enabled,
                onTogglePersona,
                pending
              )}
              {toggleRow(
                "启用自动学习",
                "开启后，接受 AI 结果会自动写入学习事件。",
                profile.autoLearningEnabled,
                onToggleAutoLearning,
                pending
              )}
            </div>
          </section>

          <section className={panelClass}>
            <div className="mb-4">
              <p className="text-sm font-semibold text-slate-900">风格指纹</p>
              <p className="mt-1 text-xs leading-6 text-stone-500">
                这些字段会直接参与服务端提示词拼接。
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["叙述视角", profile.styleFingerprint.narrativePerspective],
                ["节奏偏好", profile.styleFingerprint.pacing],
                ["句式倾向", profile.styleFingerprint.sentenceRhythm],
                ["细节密度", profile.styleFingerprint.detailDensity],
                ["对话倾向", profile.styleFingerprint.dialoguePreference],
                ["情绪气质", profile.styleFingerprint.emotionalRegister],
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
                <span className="text-sm text-stone-500">还没有积累到明确的修订偏好。</span>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className={panelClass}>
            <div className="mb-4">
              <p className="text-sm font-semibold text-slate-900">手动学习入口</p>
              <p className="mt-1 text-xs leading-6 text-stone-500">
                你可以直接投喂一段最像自己的文本，让画像变得更快。
              </p>
            </div>
            <textarea
              value={manualSample}
              onChange={(event) => onManualSampleChange(event.target.value)}
              placeholder="贴一段你希望系统学习的文本样本。"
              className={`min-h-40 ${textareaClass}`}
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={onLearnSample} className={primaryButtonClass}>
                {busyAction === "manual-learning" ? "学习中..." : "从这段样本学习"}
              </button>
              {currentChapter ? (
                <button onClick={onLearnCurrentChapter} className={subtleButtonClass}>
                  从当前章节学习
                </button>
              ) : null}
            </div>
          </section>

          <section className={panelClass}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">最近学习事件</p>
                <p className="mt-1 text-xs leading-6 text-stone-500">
                  这里会记录系统最近从哪些文本里学到了新的偏好信号。
                </p>
              </div>
              <button
                onClick={onUndoLearning}
                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-slate-700 transition hover:bg-stone-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {busyAction === "undo-learning" ? "撤销中..." : "撤销最近一次"}
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
                        <p className="text-sm font-semibold text-slate-900">{event.source}</p>
                        <p className="mt-1 text-xs text-stone-500">{formatDate(event.createdAt)}</p>
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
                  还没有学习事件。先去 Workbench 里接受一次 AI 结果，画像就会开始生长。
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
