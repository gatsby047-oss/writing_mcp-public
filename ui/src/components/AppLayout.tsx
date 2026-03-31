"use client";

import type { ReactNode } from "react";
import clsx from "clsx";
import { BrainCircuit, BookOpen, PanelsTopLeft, Settings2, Sparkles } from "lucide-react";
import { useAIWSStore } from "@/lib/state";

const navItems = [
  {
    id: "bookshelf" as const,
    label: "书架",
    description: "管理所有作品",
    icon: BookOpen,
  },
  {
    id: "workbench" as const,
    label: "Workbench",
    description: "编辑、采纳与学习闭环",
    icon: PanelsTopLeft,
  },
  {
    id: "profile" as const,
    label: "Profile",
    description: "查看用户画像和学习痕迹",
    icon: BrainCircuit,
  },
  {
    id: "settings" as const,
    label: "Settings",
    description: "模型模式、隐私和行为开关",
    icon: Settings2,
  },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const view = useAIWSStore((state) => state.view);
  const setView = useAIWSStore((state) => state.setView);
  const projects = useAIWSStore((state) => state.projects);
  const currentProjectId = useAIWSStore((state) => state.currentProjectId);
  const currentProject = projects.find((project) => project.id === currentProjectId) ?? null;

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
                  Persona-driven Editorial Studio
                </p>
                <h1 className="mt-3 font-serif text-4xl text-[#2c3138]">AI 写作工作台</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
                  用一次次采纳行为，把 AI 从通用工具慢慢调成更懂你风格的写作搭档。
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="rounded-[26px] border border-stone-200 bg-[#fffdf9] px-5 py-4 shadow-[0_14px_30px_rgba(120,136,153,0.06)]">
                <div className="text-[11px] uppercase tracking-[0.28em] text-stone-600">当前项目</div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="text-base font-semibold text-slate-900">
                    {currentProject?.name ?? "还没有项目，先创建一个示例项目"}
                  </span>
                  {currentProject?.genre ? (
                    <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-slate-700">
                      {currentProject.genre}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-xs leading-6 text-stone-700">
                  {currentProject?.tone
                    ? `当前基调：${currentProject.tone}`
                    : "创建后即可进入写作、采纳与画像更新的完整工作流。"}
                </p>
              </div>

              <div className="rounded-[26px] border border-stone-200 bg-[linear-gradient(180deg,#fffdf7,#f4ede2)] px-5 py-4 shadow-[0_14px_30px_rgba(120,136,153,0.06)]">
                <div className="text-[11px] uppercase tracking-[0.28em] text-stone-600">工作区状态</div>
                <p className="mt-3 font-semibold text-slate-900">白色稿纸基调</p>
                <p className="mt-2 text-xs leading-6 text-stone-700">
                  更接近内容工作台的阅读与写作体验。
                </p>
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
                    <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                    <p className="mt-1 text-xs leading-6 text-stone-700">{item.description}</p>
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
