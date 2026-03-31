"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { BrainCircuit, BookOpen, Languages, PanelsTopLeft, Settings2, Sparkles } from "lucide-react";
import { uiText } from "@/lib/i18n";
import { useAIWSStore } from "@/lib/state";

const navItems = [
  {
    id: "bookshelf" as const,
    label: {
      "zh-CN": "书架",
      en: "Library",
    },
    description: {
      "zh-CN": "管理全部作品与演示项目",
      en: "Manage all projects and demo samples",
    },
    icon: BookOpen,
  },
  {
    id: "workbench" as const,
    label: {
      "zh-CN": "工作台",
      en: "Workbench",
    },
    description: {
      "zh-CN": "策划、大纲、起草与 AI 协作",
      en: "Plan, outline, draft, and collaborate with AI",
    },
    icon: PanelsTopLeft,
  },
  {
    id: "profile" as const,
    label: {
      "zh-CN": "画像",
      en: "Profile",
    },
    description: {
      "zh-CN": "查看长期风格画像与学习记录",
      en: "Inspect persona memory and learning history",
    },
    icon: BrainCircuit,
  },
  {
    id: "settings" as const,
    label: {
      "zh-CN": "设置",
      en: "Settings",
    },
    description: {
      "zh-CN": "切换模型模式与行为开关",
      en: "Tune model mode and behavior switches",
    },
    icon: Settings2,
  },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const view = useAIWSStore((state) => state.view);
  const setView = useAIWSStore((state) => state.setView);
  const language = useAIWSStore((state) => state.language);
  const setLanguage = useAIWSStore((state) => state.setLanguage);
  const projects = useAIWSStore((state) => state.projects);
  const currentProjectId = useAIWSStore((state) => state.currentProjectId);
  const currentProject = projects.find((project) => project.id === currentProjectId) ?? null;

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(233,191,134,0.18),transparent_26%),radial-gradient(circle_at_92%_8%,rgba(123,163,168,0.14),transparent_22%),radial-gradient(circle_at_70%_100%,rgba(255,255,255,0.38),transparent_30%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 pb-10 pt-6 lg:px-6">
        <header className="fade-up-soft rounded-[34px] border border-stone-200/90 bg-[rgba(255,255,255,0.94)] px-6 py-5 shadow-[0_28px_60px_rgba(148,163,184,0.14)] backdrop-blur-xl">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#17324d,#3f7f7d)] text-white shadow-[0_18px_30px_rgba(23,50,77,0.22)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.34em] text-stone-600">
                  {uiText(language, "面向演示的个性化写作 MVP", "Interview-facing writing MVP")}
                </p>
                <h1 className="mt-3 font-serif text-4xl text-[#2c3138]">
                  {uiText(language, "AI 个性化写作工作台", "AI Persona Writing Studio")}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
                  {uiText(
                    language,
                    "这是一个迈向自学习进化、打造个人 IP 写作工具的初步探索项目，来自个人尝试与多次迭代。",
                    "An early exploration toward a self-learning writing tool for a creator's personal IP, shaped through personal experiments and repeated iteration."
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-3 xl:w-[500px]">
              <div className="flex items-center justify-end">
                <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/90 px-2 py-2 shadow-[0_10px_24px_rgba(148,163,184,0.1)]">
                  <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-stone-600">
                    <Languages className="h-3.5 w-3.5" />
                    {uiText(language, "界面语言", "UI language")}
                  </span>
                  {(["zh-CN", "en"] as const).map((item) => {
                    const active = language === item;
                    return (
                      <button
                        key={item}
                        onClick={() => setLanguage(item)}
                        className={clsx(
                          "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                          active
                            ? "bg-[#17324d] text-white shadow-[0_8px_18px_rgba(23,50,77,0.16)]"
                            : "text-stone-600 hover:bg-stone-100"
                        )}
                      >
                        {item === "zh-CN" ? "中文" : "EN"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                <div className="rounded-[26px] border border-stone-200 bg-[#fffdf9] px-5 py-4 shadow-[0_14px_30px_rgba(120,136,153,0.06)]">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-stone-600">
                    {uiText(language, "当前项目", "Active project")}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="text-base font-semibold text-slate-900">
                      {currentProject?.name ??
                        uiText(
                          language,
                          "还没有项目，先创建一个示例项目。",
                          "No active project yet. Start with a demo project."
                        )}
                    </span>
                    {currentProject?.genre ? (
                      <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-slate-700">
                        {currentProject.genre}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs leading-6 text-stone-700">
                    {currentProject?.tone
                      ? uiText(language, `当前基调：${currentProject.tone}`, `Current tone: ${currentProject.tone}`)
                      : uiText(
                          language,
                          "创建后即可进入策划、大纲、正文和学习闭环。",
                          "Once created, you can move straight into planning, outlining, drafting, and the learning loop."
                        )}
                  </p>
                </div>

                <div className="rounded-[26px] border border-stone-200 bg-[linear-gradient(180deg,#fffdf7,#f4ede2)] px-5 py-4 shadow-[0_14px_30px_rgba(120,136,153,0.06)]">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-stone-600">
                    {uiText(language, "仓库定位", "Repo framing")}
                  </div>
                  <p className="mt-3 font-semibold text-slate-900">
                    {uiText(language, "面向面试演示的最小 MVP", "Interview-facing minimal MVP")}
                  </p>
                  <p className="mt-2 text-xs leading-6 text-stone-700">
                    {uiText(
                      language,
                      "默认中文界面，可切英文；保留样例内容，方便快速演示产品判断与迭代思路。",
                      "Chinese-first by default, with an English UI toggle and intact sample content for quick product demos."
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <nav className="fade-up-soft mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const selected = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={clsx(
                  "group rounded-[28px] border px-5 py-4 text-left transition duration-200",
                  selected
                    ? "border-stone-300 bg-[rgba(255,255,255,0.94)] shadow-[0_18px_34px_rgba(148,163,184,0.14)]"
                    : "border-stone-200/60 bg-[rgba(255,255,255,0.78)] hover:border-stone-300 hover:bg-[rgba(255,255,255,0.92)]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      "flex h-11 w-11 items-center justify-center rounded-[18px] transition",
                      selected
                        ? "bg-[linear-gradient(135deg,#17324d,#3f7f7d)] text-white shadow-[0_12px_24px_rgba(23,50,77,0.18)]"
                        : "bg-white text-slate-700 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.18)] group-hover:text-slate-900"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {item.label[language]}
                    </p>
                    <p className="mt-1 text-xs leading-6 text-stone-700">
                      {item.description[language]}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        <main className="fade-up-soft mt-5 flex-1">{children}</main>
      </div>
    </div>
  );
}
