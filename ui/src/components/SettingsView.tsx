"use client";

import { useEffect, useState } from "react";
import { DatabaseZap, LockKeyhole, Sparkles } from "lucide-react";
import type { ModelSettings, UserProfile } from "@/lib/modeling";

const panelClass =
  "rounded-[30px] border border-stone-200 bg-[rgba(255,255,255,0.84)] p-5 shadow-[0_18px_40px_rgba(148,163,184,0.14)] backdrop-blur-xl";
const inputClass =
  "w-full rounded-[22px] border border-stone-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-stone-400 focus:border-[#88aeb3] focus:ring-4 focus:ring-[#e4eff0]";
const primaryButtonClass =
  "inline-flex items-center gap-2 rounded-2xl bg-[#17324d] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(23,50,77,0.18)] transition hover:-translate-y-[1px] hover:bg-[#1b4266]";

function statusCard(tone: "success" | "error", text: string) {
  const styles =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-rose-200 bg-rose-50 text-rose-900";
  return <div className={`rounded-[24px] border px-4 py-3 text-sm ${styles}`}>{text}</div>;
}

function switchRow(
  title: string,
  description: string,
  checked: boolean,
  onClick: () => void,
  disabled: boolean
) {
  return (
    <button
      onClick={onClick}
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

export default function SettingsView({
  profile,
  settings,
  busyAction,
  onSave,
  onTogglePersona,
  onToggleAutoLearning,
  pending,
  statusMessage,
  errorMessage,
}: {
  profile: UserProfile;
  settings: ModelSettings;
  busyAction: string | null;
  onSave: (settings: ModelSettings) => void;
  onTogglePersona: (enabled: boolean) => void;
  onToggleAutoLearning: (enabled: boolean) => void;
  pending: boolean;
  statusMessage: string | null;
  errorMessage: string | null;
}) {
  const [draft, setDraft] = useState<ModelSettings>(settings);
  const hasUnsavedApiKey = draft.apiKey.trim().length > 0;
  const hasStoredApiKey = Boolean(draft.hasStoredApiKey);
  const apiKeyHint = hasUnsavedApiKey
    ? hasStoredApiKey
      ? "保存后会用新的 API Key 覆盖当前已保存的密钥。"
      : "保存后会写入新的 API Key。"
    : hasStoredApiKey
      ? "已保存的 API Key 不会回显到浏览器；留空并保存会保留当前密钥。"
      : "当前未保存 API Key；在 mock 模式下可保持为空。";

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  return (
    <div className="space-y-5">
      {statusMessage ? statusCard("success", statusMessage) : null}
      {errorMessage ? statusCard("error", errorMessage) : null}

      <section className="rounded-[34px] border border-stone-200 bg-[linear-gradient(145deg,#fffefb,#eef4f3)] p-7 shadow-[0_24px_54px_rgba(148,163,184,0.16)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-4 py-1.5 text-xs uppercase tracking-[0.28em] text-stone-600">
          <DatabaseZap className="h-3.5 w-3.5 text-[#3f7f7d]" />
          运行设置
        </div>
        <h2 className="mt-7 font-serif text-4xl text-slate-900">模型与开关设置</h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
          默认推荐 `mock` 模式，方便稳定使用；需要真实模型效果时，再切到 OpenAI 兼容接口。
          画像和自动学习保留独立开关，方便控制系统行为。
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-[22px] border border-stone-200 bg-white/85 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">当前模式</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {settings.mode === "mock" ? "Mock" : "OpenAI"}
            </p>
          </div>
          <div className="rounded-[22px] border border-stone-200 bg-white/85 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">画像驱动</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {profile.enabled ? "开启" : "关闭"}
            </p>
          </div>
          <div className="rounded-[22px] border border-stone-200 bg-white/85 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">自动学习</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {profile.autoLearningEnabled ? "开启" : "关闭"}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <section className={panelClass}>
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-900">模型配置</p>
            <p className="mt-1 text-xs leading-6 text-stone-500">
              只保留一个清晰的运行模式入口，不再暴露旧项目里冗余的 provider 管理面板。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-stone-500">
                运行模式
              </span>
              <select
                value={draft.mode}
                onChange={(event) =>
                  setDraft((state) => ({
                    ...state,
                    mode: event.target.value as ModelSettings["mode"],
                  }))
                }
                className={inputClass}
              >
                <option value="mock">Mock</option>
                <option value="openai-compatible">OpenAI Compatible</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-stone-500">
                模型名
              </span>
              <input
                value={draft.model}
                onChange={(event) =>
                  setDraft((state) => ({ ...state, model: event.target.value }))
                }
                className={inputClass}
              />
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-stone-500">
              Base URL
            </span>
            <input
              value={draft.baseUrl}
              onChange={(event) =>
                setDraft((state) => ({ ...state, baseUrl: event.target.value }))
              }
              className={inputClass}
            />
          </label>

          <label className="mt-4 block">
            <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-stone-500">
              API Key
            </span>
            <input
              type="password"
              value={draft.apiKey}
              onChange={(event) =>
                setDraft((state) => ({ ...state, apiKey: event.target.value }))
              }
               placeholder={draft.mode === "mock" ? "Mock 模式下可留空" : "输入兼容 OpenAI 的 API Key"}
               className={inputClass}
             />
             <p className="mt-2 text-xs leading-6 text-stone-500">{apiKeyHint}</p>
          </label>

          <button onClick={() => onSave(draft)} className={`mt-5 ${primaryButtonClass}`}>
            <Sparkles className="h-4 w-4" />
            {busyAction === "save-settings" ? "保存中..." : "保存模型设置"}
          </button>
        </section>

        <div className="space-y-5">
          <section className={panelClass}>
            <div className="mb-4">
              <p className="text-sm font-semibold text-slate-900">画像与学习开关</p>
              <p className="mt-1 text-xs leading-6 text-stone-500">
                在这里控制画像是否参与生成，以及系统是否自动学习。
              </p>
            </div>
            <div className="space-y-3">
              {switchRow(
                "画像驱动",
                "决定 AI 请求是否注入用户画像摘要。",
                profile.enabled,
                () => onTogglePersona(!profile.enabled),
                pending
              )}
              {switchRow(
                "自动学习",
                "决定采纳 AI 结果后是否自动写入学习事件。",
                profile.autoLearningEnabled,
                () => onToggleAutoLearning(!profile.autoLearningEnabled),
                pending
              )}
            </div>
          </section>

          <section className={panelClass}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[#fbf3ea] text-[#bc7f45]">
                <LockKeyhole className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">隐私与数据边界</p>
                <p className="mt-1 text-xs leading-6 text-stone-500">
                  这里说明内容、画像和设置分别保存在什么位置。
                </p>
              </div>
            </div>
            <div className="space-y-3 text-sm leading-7 text-slate-700">
              <p>1. 项目内容保存在浏览器本地，不依赖账号体系和云端环境。</p>
              <p>2. 用户画像与模型设置保存在本地文件中，方便 API 读取、学习和撤销。</p>
              <p>3. `mock` 模式是默认兜底，确保没有 key 时也能完整使用个性化链路。</p>
              <p>4. 画像驱动和自动学习分开控制，强调“用户可控”而不是黑盒记忆。</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
