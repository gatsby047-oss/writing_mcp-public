"use client";

import { useState } from "react";
import {
  BookOpen,
  BookPlus,
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  FilePlus2,
  Layers,
  MoreHorizontal,
  Pencil,
  Trash2,
  Type,
  X,
} from "lucide-react";
import type { Project } from "@/lib/modeling";
import { getProjectWordCount, useAIWSStore } from "@/lib/state";

const GENRE_COVER_PALETTE: Record<string, { bg: string; accent: string; label: string }> = {
  "悬疑": { bg: "from-[#17324d] to-[#1e4d6b]", accent: "#9db8bb", label: "悬疑" },
  "都市": { bg: "from-[#4a5568] to-[#718096]", accent: "#a0aec0", label: "都市" },
  "科幻": { bg: "from-[#2c6e49] to-[#4c7c59]", accent: "#a7f3d0", label: "科幻" },
  "奇幻": { bg: "from-[#5c3d99] to-[#7c5fc4]", accent: "#d0bfff", label: "奇幻" },
  "玄幻": { bg: "from-[#7b2d00] to-[#9e4500]", accent: "#fed7aa", label: "玄幻" },
  "武侠": { bg: "from-[#92400e] to-[#b45309]", accent: "#fde68a", label: "武侠" },
  "言情": { bg: "from-[#9d174d] to-[#be185d]", accent: "#fbcfe8", label: "言情" },
  "历史": { bg: "from-[#78350f] to-[#92400e]", accent: "#fde68a", label: "历史" },
  "恐怖": { bg: "from-[#1f1f1f] to-[#3d3d3d]", accent: "#9ca3af", label: "恐怖" },
  "短篇": { bg: "from-[#5b6b5c] to-[#7a8c7b]", accent: "#d1fae5", label: "短篇" },
  "长文": { bg: "from-[#17324d] to-[#2d5a7b]", accent: "#93c5fd", label: "长文" },
  "悬疑长文": { bg: "from-[#0f2a3d] to-[#1e3d5c]", accent: "#7dd3fc", label: "悬疑长文" },
};

const DEFAULT_COVER = { bg: "from-[#6b7c6c] to-[#8a9e8c]", accent: "#d1fae5", label: "其他" };

function getGenreCover(genre: string) {
  const key = genre?.trim() || "";
  for (const k of Object.keys(GENRE_COVER_PALETTE)) {
    if (key.includes(k)) return GENRE_COVER_PALETTE[k];
  }
  return DEFAULT_COVER;
}

function genreColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 38%, 42%)`;
}

function bookCoverStyle(project: Project) {
  const cover = getGenreCover(project.genre);
  const bgClass = `bg-gradient-to-br ${cover.bg}`;
  const accentColor = cover.accent;
  return { bgClass, accentColor, cover };
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 30) return `${days} 天前`;
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

function ChapterProgress({ project }: { project: Project }) {
  const total = project.chapters.length;
  const completed = project.chapters.filter((c) => c.status === "complete").length;
  const inReview = project.chapters.filter((c) => c.status === "review").length;
  const ratio = total === 0 ? 0 : completed / total;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] text-white/70">
        <span>{completed}/{total} 章节完成</span>
        <span>{Math.round(ratio * 100)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-white/80 transition-all duration-500"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      {inReview > 0 && (
        <p className="text-[11px] text-white/60">{inReview} 章节审阅中</p>
      )}
    </div>
  );
}

function ProjectMenu({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const deleteProject = useAIWSStore((s) => s.deleteProject);
  const duplicateProject = useAIWSStore((s) => s.duplicateProject);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(project.name);
  const renameProject = useAIWSStore((s) => s.renameProject);

  function handleRename() {
    if (renameValue.trim() && renameValue.trim() !== project.name) {
      renameProject(project.id, renameValue.trim());
    }
    setRenaming(false);
  }

  return (
    <div
      className="absolute right-3 top-3 z-10 w-44 overflow-hidden rounded-[20px] border border-stone-200 bg-white shadow-[0_12px_32px_rgba(148,163,184,0.22)]"
      onMouseLeave={onClose}
    >
      {renaming ? (
        <div className="p-3">
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") setRenaming(false);
            }}
            className="w-full rounded-[14px] border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-[#88aeb3] focus:ring-2 focus:ring-[#e4eff0]"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleRename}
              className="flex-1 rounded-[14px] bg-[#17324d] px-3 py-1.5 text-xs font-semibold text-white"
            >
              确认
            </button>
            <button
              onClick={() => setRenaming(false)}
              className="flex-1 rounded-[14px] border border-stone-200 px-3 py-1.5 text-xs text-stone-600"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-stone-100 text-sm">
          <button
            onClick={() => setRenaming(true)}
            className="flex w-full items-center gap-3 px-4 py-3 text-slate-700 hover:bg-stone-50"
          >
            <Edit3 className="h-4 w-4 text-stone-400" />
            重命名
          </button>
          <button
            onClick={() => duplicateProject(project.id)}
            className="flex w-full items-center gap-3 px-4 py-3 text-slate-700 hover:bg-stone-50"
          >
            <Copy className="h-4 w-4 text-stone-400" />
            复制项目
          </button>
          <button
            onClick={() => {
              if (confirm(`确定删除「${project.name}」吗？此操作不可撤销。`)) {
                deleteProject(project.id);
              }
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
            删除项目
          </button>
        </div>
      )}
    </div>
  );
}

function BookCard({ project }: { project: Project }) {
  const setCurrentProject = useAIWSStore((s) => s.setCurrentProject);
  const setView = useAIWSStore((s) => s.setView);
  const [menuOpen, setMenuOpen] = useState(false);
  const { bgClass, accentColor, cover } = bookCoverStyle(project);
  const wordCount = getProjectWordCount(project);
  const totalWords = project.chapters.reduce((s, c) => s + c.targetWordCount, 0);
  const completedChapters = project.chapters.filter((c) => c.status === "complete").length;
  const latestChapter = project.chapters[project.chapters.length - 1];

  function handleEnter() {
    setCurrentProject(project.id);
    setView("workbench");
  }

  return (
    <div className="group relative flex flex-col">
      {/* Book cover */}
      <button
        onClick={handleEnter}
        className={`relative flex flex-col overflow-hidden rounded-[28px] ${bgClass} p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(0,0,0,0.24)] active:translate-y-0 active:shadow-[0_12px_28px_rgba(0,0,0,0.18)] cursor-pointer`}
      >
        {/* Decorative spine line */}
        <div
          className="absolute left-4 top-0 bottom-0 w-0.5 rounded-full opacity-40"
          style={{ backgroundColor: accentColor }}
        />

        {/* Cover top decoration */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-white/60" />
            <span
              className="rounded-full border border-white/20 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/80"
              style={{ borderColor: "rgba(255,255,255,0.25)" }}
            >
              {cover.label}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-left font-serif text-xl font-semibold leading-snug text-white">
          {project.name}
        </h3>

        {/* Tone */}
        {project.tone && (
          <p className="mt-1.5 text-left text-xs text-white/60">{project.tone}</p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom stats */}
        <div className="mt-6 space-y-2">
          <ChapterProgress project={project} />

          <div className="flex items-center justify-between text-[11px] text-white/60">
            <span className="flex items-center gap-1">
              <Type className="h-3 w-3" />
              {wordCount.toLocaleString()} 字
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(project.updatedAt)}
            </span>
          </div>
        </div>
      </button>

      {/* Menu overlay */}
      {menuOpen && (
        <ProjectMenu project={project} onClose={() => setMenuOpen(false)} />
      )}

      {/* Project name below card */}
      <p className="mt-3 text-center text-sm font-semibold text-slate-800 line-clamp-1">
        {project.name}
      </p>
      {latestChapter && (
        <p className="mt-0.5 text-center text-xs text-stone-500">
          最新：{latestChapter.title}
        </p>
      )}
    </div>
  );
}

function NewProjectCard({
  onCreate,
}: {
  onCreate: (input: { name: string; genre: string; tone: string; audience: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", genre: "", tone: "", audience: "" });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="group flex flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-stone-300 bg-white/50 p-6 text-stone-400 transition-all duration-200 hover:border-[#9db8bb] hover:bg-white hover:text-[#9db8bb]"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-dashed border-current bg-white/60 transition-colors group-hover:bg-[#eef5f5]">
          <BookPlus className="h-7 w-7" />
        </div>
        <p className="mt-4 text-sm font-semibold">新建作品</p>
        <p className="mt-1 text-xs text-stone-400">开始一本新小说</p>
      </button>
    );
  }

  return (
    <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-[0_16px_40px_rgba(148,163,184,0.12)]">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">新建作品</p>
        <button
          onClick={() => setOpen(false)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-3">
        <input
          autoFocus
          placeholder="作品标题"
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.name.trim()) {
              onCreate(draft);
              setOpen(false);
            }
          }}
          className="w-full rounded-[18px] border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-[#88aeb3] focus:ring-2 focus:ring-[#e4eff0]"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="题材（如：悬疑）"
            value={draft.genre}
            onChange={(e) => setDraft((d) => ({ ...d, genre: e.target.value }))}
            className="w-full rounded-[18px] border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-[#88aeb3] focus:ring-2 focus:ring-[#e4eff0]"
          />
          <input
            placeholder="基调（如：冷静压迫）"
            value={draft.tone}
            onChange={(e) => setDraft((d) => ({ ...d, tone: e.target.value }))}
            className="w-full rounded-[18px] border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-[#88aeb3] focus:ring-2 focus:ring-[#e4eff0]"
          />
        </div>
        <input
          placeholder="目标读者（可选）"
          value={draft.audience}
          onChange={(e) => setDraft((d) => ({ ...d, audience: e.target.value }))}
          className="w-full rounded-[18px] border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-[#88aeb3] focus:ring-2 focus:ring-[#e4eff0]"
        />
        <button
          disabled={!draft.name.trim()}
          onClick={() => {
            if (draft.name.trim()) {
              onCreate(draft);
              setDraft({ name: "", genre: "", tone: "", audience: "" });
              setOpen(false);
            }
          }}
          className="w-full rounded-[18px] bg-[#17324d] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(23,50,77,0.18)] transition hover:-translate-y-0.5 hover:bg-[#1b4266] disabled:cursor-not-allowed disabled:opacity-50"
        >
          创建作品
        </button>
      </div>
    </div>
  );
}

export default function BookshelfView() {
  const projects = useAIWSStore((s) => s.projects);
  const addProject = useAIWSStore((s) => s.addProject);
  const setCurrentProject = useAIWSStore((s) => s.setCurrentProject);
  const setView = useAIWSStore((s) => s.setView);

  const totalWords = projects.reduce((s, p) => s + getProjectWordCount(p), 0);
  const totalChapters = projects.reduce((s, p) => s + p.chapters.length, 0);
  const completedChapters = projects.reduce(
    (s, p) => s + p.chapters.filter((c) => c.status === "complete").length,
    0
  );

  function handleCreateProject(input: {
    name: string;
    genre: string;
    tone: string;
    audience: string;
  }) {
    addProject(input);
    // After creation, go to workbench
    setView("workbench");
  }

  function handleQuickEnter(projectId: string) {
    setCurrentProject(projectId);
    setView("workbench");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-stone-500">Collection</p>
          <h2 className="mt-2 font-serif text-4xl text-slate-900">我的书架</h2>
          <p className="mt-2 text-sm text-stone-600">
            {projects.length === 0
              ? "还没有任何作品，开始你的第一本小说吧"
              : `${projects.length} 本作品 · ${totalChapters} 章 · ${completedChapters} 已完成 · ${totalWords.toLocaleString()} 字`}
          </p>
        </div>
      </div>

      {/* Stats ribbon */}
      {projects.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: BookOpen, label: "作品", value: projects.length },
            { icon: Layers, label: "章节", value: totalChapters },
            { icon: CheckCircle2, label: "已完成", value: completedChapters },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-[22px] border border-stone-200 bg-white/80 px-4 py-3 shadow-[0_8px_20px_rgba(148,163,184,0.08)]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#eef5f5]">
                <Icon className="h-4 w-4 text-[#3f7f7d]" />
              </div>
              <div>
                <p className="text-xs text-stone-500">{label}</p>
                <p className="text-lg font-semibold text-slate-900">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Book grid */}
      {projects.length > 0 ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {projects.map((project) => (
            <BookCard key={project.id} project={project} />
          ))}
          {/* New project card */}
          <NewProjectCard onCreate={handleCreateProject} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[36px] border border-dashed border-stone-300 bg-white/40 py-20">
          {/* Decorative empty shelf */}
          <div className="mb-8 flex items-end gap-3">
            {[70, 90, 60, 80].map((h, i) => (
              <div
                key={i}
                className="w-6 rounded-t-lg border border-stone-200 border-b-0 bg-stone-100 opacity-40"
                style={{ height: h }}
              />
            ))}
          </div>

          <h3 className="text-lg font-semibold text-slate-700">书架空空如也</h3>
          <p className="mt-2 text-sm text-stone-500">创建你的第一本作品，开始写作之旅</p>
          <button
            onClick={() => {
              const name = prompt("作品标题：");
              if (name?.trim()) {
                addProject({ name: name.trim() });
                setView("workbench");
              }
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-[22px] bg-[#17324d] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(23,50,77,0.18)] transition hover:-translate-y-0.5 hover:bg-[#1b4266]"
          >
            <FilePlus2 className="h-4 w-4" />
            创建第一本作品
          </button>
        </div>
      )}
    </div>
  );
}
