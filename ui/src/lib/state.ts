"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  AppView,
  Chapter,
  Character,
  Foreshadow,
  Project,
  ProjectStyleOverlay,
} from "@/lib/modeling";
import { DEFAULT_UI_LANGUAGE, type UILanguage } from "@/lib/i18n";
import { countWords } from "@/lib/qc";
import { now, createId } from "@/lib/utils";

interface AIWSState {
  hasHydrated: boolean;
  language: UILanguage;
  view: AppView;
  projects: Project[];
  currentProjectId: string | null;
  currentChapterId: string | null;
  setHasHydrated: (value: boolean) => void;
  setLanguage: (language: UILanguage) => void;
  setView: (view: AppView) => void;
  addProject: (input: { name: string; genre?: string; tone?: string; audience?: string }) => void;
  setCurrentProject: (projectId: string) => void;
  setCurrentChapter: (chapterId: string) => void;
  updateProject: (
    projectId: string,
    patch: Partial<Pick<Project, "name" | "genre" | "tone">>
  ) => void;
  updateProjectOverlay: (projectId: string, patch: Partial<ProjectStyleOverlay>) => void;
  addChapter: (title?: string) => void;
  updateChapter: (chapterId: string, patch: Partial<Omit<Chapter, "id">>) => void;
  updateChapterContent: (chapterId: string, content: string) => void;
  addCharacter: (input: Omit<Character, "id">) => void;
  updateCharacter: (characterId: string, patch: Partial<Character>) => void;
  addForeshadow: (input: Omit<Foreshadow, "id">) => void;
  resolveForeshadow: (foreshadowId: string, resolutionNote?: string) => void;
  addBannedPhrase: (phrase: string) => void;
  removeBannedPhrase: (phrase: string) => void;
  deleteProject: (projectId: string) => void;
  duplicateProject: (projectId: string) => void;
  reorderProjects: (fromIndex: number, toIndex: number) => void;
  renameProject: (projectId: string, name: string) => void;
}

type PersistedState = Pick<
  AIWSState,
  "language" | "view" | "projects" | "currentProjectId" | "currentChapterId"
>;

const STORAGE_KEY = "aiws-public-v1";

function defaultOutline() {
  return {
    opening: "",
    development: "",
    turn: "",
    endingHook: "",
  };
}

function defaultOverlay(audience?: string): ProjectStyleOverlay {
  return {
    audience: audience ?? "",
    toneNotes: "",
    styleNotes: "",
    doMoreOf: [],
    avoid: [],
  };
}

function createChapter(chapterNumber: number, title?: string): Chapter {
  return {
    id: createId("chapter"),
    title: title?.trim() || `第 ${chapterNumber} 章`,
    content: "",
    summary: "",
    status: "draft",
    targetWordCount: 1800,
    outline: defaultOutline(),
    updatedAt: now(),
  };
}

function createProject(input: {
  name: string;
  genre?: string;
  tone?: string;
  audience?: string;
}): Project {
  const timestamp = now();
  return {
    id: createId("project"),
    name: input.name.trim(),
    genre: input.genre?.trim() ?? "",
    tone: input.tone?.trim() ?? "",
    createdAt: timestamp,
    updatedAt: timestamp,
    chapters: [createChapter(1)],
    characters: [],
    foreshadows: [],
    bannedPhrases: [],
    projectStyleOverlay: defaultOverlay(input.audience?.trim()),
  };
}

function touchProject(project: Project): Project {
  return {
    ...project,
    updatedAt: now(),
  };
}

function parseListInput(value: string) {
  return value
    .split(/[，,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeChapter(input: Partial<Chapter>, index: number): Chapter {
  const content = input.content ?? "";
  return {
    id: input.id ?? createId("chapter"),
    title: input.title?.trim() || `第 ${index + 1} 章`,
    content,
    summary: input.summary ?? "",
    status: input.status ?? "draft",
    targetWordCount: Number(input.targetWordCount ?? 1800) || 1800,
    outline: {
      ...defaultOutline(),
      ...(input.outline ?? {}),
    },
    updatedAt: input.updatedAt ?? now(),
  };
}

function normalizeProject(input: Partial<Project>, index: number): Project {
  const base = createProject({
    name: input.name?.trim() || `未命名项目 ${index + 1}`,
    genre: input.genre,
    tone: input.tone,
  });

  return {
    ...base,
    id: input.id ?? base.id,
    createdAt: input.createdAt ?? base.createdAt,
    updatedAt: input.updatedAt ?? base.updatedAt,
    chapters: Array.isArray(input.chapters)
      ? input.chapters.map((chapter, chapterIndex) => normalizeChapter(chapter, chapterIndex))
      : base.chapters,
    characters: Array.isArray(input.characters)
      ? input.characters.map((character) => ({
          id: character.id ?? createId("character"),
          name: character.name ?? "",
          role: character.role ?? "supporting",
          goal: character.goal ?? "",
          emotion: character.emotion ?? "",
          arc: character.arc ?? "",
          notes: character.notes ?? "",
        }))
      : [],
    foreshadows: Array.isArray(input.foreshadows)
      ? input.foreshadows.map((foreshadow) => ({
          id: foreshadow.id ?? createId("foreshadow"),
          content: foreshadow.content ?? "",
          plantedChapterId: foreshadow.plantedChapterId ?? base.chapters[0].id,
          status: foreshadow.status ?? "open",
          resolutionNote: foreshadow.resolutionNote,
        }))
      : [],
    bannedPhrases: Array.isArray(input.bannedPhrases)
      ? input.bannedPhrases.filter(Boolean)
      : Object.keys((input as { bannedPhrases?: Record<string, unknown> }).bannedPhrases ?? {}),
    projectStyleOverlay: {
      ...defaultOverlay(),
      ...(input.projectStyleOverlay ?? {}),
      doMoreOf: Array.isArray(input.projectStyleOverlay?.doMoreOf)
        ? input.projectStyleOverlay.doMoreOf
        : [],
      avoid: Array.isArray(input.projectStyleOverlay?.avoid)
        ? input.projectStyleOverlay.avoid
        : [],
    },
  };
}

export const useAIWSStore = create<AIWSState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      language: DEFAULT_UI_LANGUAGE,
      view: "workbench",
      projects: [],
      currentProjectId: null,
      currentChapterId: null,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setLanguage: (language) => set({ language }),
      setView: (view) => set({ view }),
      addProject: (input) => {
        const project = createProject(input);
        set((state) => ({
          projects: [project, ...state.projects],
          currentProjectId: project.id,
          currentChapterId: project.chapters[0]?.id ?? null,
          view: "workbench",
        }));
      },
      setCurrentProject: (projectId) => {
        const project = get().projects.find((item) => item.id === projectId) ?? null;
        set({
          currentProjectId: projectId,
          currentChapterId: project?.chapters[0]?.id ?? null,
        });
      },
      setCurrentChapter: (chapterId) => set({ currentChapterId: chapterId }),
      updateProject: (projectId, patch) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? touchProject({
                  ...project,
                  name: patch.name?.trim() ?? project.name,
                  genre: patch.genre?.trim() ?? project.genre,
                  tone: patch.tone?.trim() ?? project.tone,
                })
              : project
          ),
        })),
      updateProjectOverlay: (projectId, patch) =>
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            return touchProject({
              ...project,
              projectStyleOverlay: {
                ...project.projectStyleOverlay,
                ...patch,
                doMoreOf:
                  typeof patch.doMoreOf === "string"
                    ? parseListInput(patch.doMoreOf)
                    : patch.doMoreOf ?? project.projectStyleOverlay.doMoreOf,
                avoid:
                  typeof patch.avoid === "string"
                    ? parseListInput(patch.avoid)
                    : patch.avoid ?? project.projectStyleOverlay.avoid,
              },
            });
          }),
        })),
      addChapter: (title) =>
        set((state) => {
          const activeProjectId = state.currentProjectId;
          if (!activeProjectId) return state;
          let nextChapterId = state.currentChapterId;
          const projects = state.projects.map((project) => {
            if (project.id !== activeProjectId) return project;
            const chapter = createChapter(project.chapters.length + 1, title);
            nextChapterId = chapter.id;
            return touchProject({
              ...project,
              chapters: [...project.chapters, chapter],
            });
          });
          return {
            projects,
            currentChapterId: nextChapterId,
          };
        }),
      updateChapter: (chapterId, patch) =>
        set((state) => ({
          projects: state.projects.map((project) => {
            const hasChapter = project.chapters.some((chapter) => chapter.id === chapterId);
            if (!hasChapter) return project;
            return touchProject({
              ...project,
              chapters: project.chapters.map((chapter) =>
                chapter.id === chapterId
                  ? {
                      ...chapter,
                      ...patch,
                      targetWordCount:
                        patch.targetWordCount !== undefined
                          ? Number(patch.targetWordCount) || chapter.targetWordCount
                          : chapter.targetWordCount,
                      outline: {
                        ...chapter.outline,
                        ...(patch.outline ?? {}),
                      },
                      updatedAt: now(),
                    }
                  : chapter
              ),
            });
          }),
        })),
      updateChapterContent: (chapterId, content) =>
        set((state) => ({
          projects: state.projects.map((project) => {
            const hasChapter = project.chapters.some((chapter) => chapter.id === chapterId);
            if (!hasChapter) return project;
            return touchProject({
              ...project,
              chapters: project.chapters.map((chapter) =>
                chapter.id === chapterId
                  ? {
                      ...chapter,
                      content,
                      updatedAt: now(),
                    }
                  : chapter
              ),
            });
          }),
        })),
      addCharacter: (input) =>
        set((state) => {
          const activeProjectId = state.currentProjectId;
          if (!activeProjectId) return state;
          return {
            projects: state.projects.map((project) =>
              project.id === activeProjectId
                ? touchProject({
                    ...project,
                    characters: [
                      ...project.characters,
                      {
                        ...input,
                        id: createId("character"),
                      },
                    ],
                  })
                : project
            ),
          };
        }),
      updateCharacter: (characterId, patch) =>
        set((state) => ({
          projects: state.projects.map((project) => {
            const hasCharacter = project.characters.some(
              (character) => character.id === characterId
            );
            if (!hasCharacter) return project;
            return touchProject({
              ...project,
              characters: project.characters.map((character) =>
                character.id === characterId ? { ...character, ...patch } : character
              ),
            });
          }),
        })),
      addForeshadow: (input) =>
        set((state) => {
          const activeProjectId = state.currentProjectId;
          if (!activeProjectId) return state;
          return {
            projects: state.projects.map((project) =>
              project.id === activeProjectId
                ? touchProject({
                    ...project,
                    foreshadows: [
                      ...project.foreshadows,
                      {
                        ...input,
                        id: createId("foreshadow"),
                      },
                    ],
                  })
                : project
            ),
          };
        }),
      resolveForeshadow: (foreshadowId, resolutionNote) =>
        set((state) => ({
          projects: state.projects.map((project) => {
            const hasForeshadow = project.foreshadows.some(
              (foreshadow) => foreshadow.id === foreshadowId
            );
            if (!hasForeshadow) return project;
            return touchProject({
              ...project,
              foreshadows: project.foreshadows.map((foreshadow) =>
                foreshadow.id === foreshadowId
                  ? {
                      ...foreshadow,
                      status: "resolved",
                      resolutionNote: resolutionNote?.trim() ?? foreshadow.resolutionNote,
                    }
                  : foreshadow
              ),
            });
          }),
        })),
      addBannedPhrase: (phrase) =>
        set((state) => {
          const normalized = phrase.trim();
          if (!normalized) return state;
          const activeProjectId = state.currentProjectId;
          if (!activeProjectId) return state;
          return {
            projects: state.projects.map((project) =>
              project.id === activeProjectId
                ? touchProject({
                    ...project,
                    bannedPhrases: Array.from(
                      new Set([...project.bannedPhrases, normalized])
                    ),
                  })
                : project
            ),
          };
        }),
      removeBannedPhrase: (phrase) =>
        set((state) => {
          const activeProjectId = state.currentProjectId;
          if (!activeProjectId) return state;
          return {
            projects: state.projects.map((project) =>
              project.id === activeProjectId
                ? touchProject({
                    ...project,
                    bannedPhrases: project.bannedPhrases.filter((item) => item !== phrase),
                  })
                : project
            ),
          };
        }),
      deleteProject: (projectId) =>
        set((state) => {
          const index = state.projects.findIndex((p) => p.id === projectId);
          if (index === -1) return state;
          const nextProjects = state.projects.filter((p) => p.id !== projectId);
          const nextCurrentProjectId =
            state.currentProjectId === projectId
              ? nextProjects[0]?.id ?? null
              : state.currentProjectId;
          const nextCurrentProject = nextProjects.find((p) => p.id === nextCurrentProjectId);
          const nextCurrentChapterId =
            nextCurrentProject?.chapters[0]?.id ?? null;
          return {
            projects: nextProjects,
            currentProjectId: nextCurrentProjectId,
            currentChapterId: nextCurrentChapterId,
          };
        }),
      duplicateProject: (projectId) =>
        set((state) => {
          const source = state.projects.find((p) => p.id === projectId);
          if (!source) return state;
          const timestamp = now();
          const duplicate: Project = {
            ...JSON.parse(JSON.stringify(source)),
            id: createId("project"),
            name: `${source.name}（副本）`,
            createdAt: timestamp,
            updatedAt: timestamp,
            chapters: source.chapters.map((ch) => ({
              ...ch,
              id: createId("chapter"),
              updatedAt: timestamp,
            })),
            characters: source.characters.map((c) => ({
              ...c,
              id: createId("character"),
            })),
            foreshadows: source.foreshadows.map((f) => ({
              ...f,
              id: createId("foreshadow"),
              plantedChapterId: "", // re-resolved after creation
            })),
          };
          // re-link foreshadow plantedChapterIds
          const chapterIdMap = new Map(
            source.chapters.map((oldCh, i) => [oldCh.id, duplicate.chapters[i].id])
          );
          duplicate.foreshadows = duplicate.foreshadows.map((f) => ({
            ...f,
            plantedChapterId: chapterIdMap.get(f.plantedChapterId) ?? duplicate.chapters[0].id,
          }));
          const insertIndex = state.projects.findIndex((p) => p.id === projectId) + 1;
          const nextProjects = [...state.projects];
          nextProjects.splice(insertIndex, 0, duplicate);
          return {
            projects: nextProjects,
            currentProjectId: duplicate.id,
            currentChapterId: duplicate.chapters[0]?.id ?? null,
          };
        }),
      reorderProjects: (fromIndex, toIndex) =>
        set((state) => {
          if (
            fromIndex < 0 ||
            fromIndex >= state.projects.length ||
            toIndex < 0 ||
            toIndex >= state.projects.length ||
            fromIndex === toIndex
          )
            return state;
          const nextProjects = [...state.projects];
          const [moved] = nextProjects.splice(fromIndex, 1);
          nextProjects.splice(toIndex, 0, moved);
          return { projects: nextProjects };
        }),
      renameProject: (projectId, name) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? touchProject({ ...project, name: name.trim() || project.name })
              : project
          ),
        })),
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedState => ({
        language: state.language,
        view: state.view,
        projects: state.projects,
        currentProjectId: state.currentProjectId,
        currentChapterId: state.currentChapterId,
      }),
      migrate: (persistedState) => {
        const raw = (persistedState ?? {}) as Partial<PersistedState & { projects?: unknown[] }>;
        const projects = Array.isArray(raw.projects)
          ? raw.projects.map((project, index) =>
              normalizeProject(project as Partial<Project>, index)
            )
          : [];
        const currentProjectId =
          raw.currentProjectId &&
          projects.some((project) => project.id === raw.currentProjectId)
            ? raw.currentProjectId
            : projects[0]?.id ?? null;
        const currentProject =
          projects.find((project) => project.id === currentProjectId) ?? null;
        const currentChapterId =
          raw.currentChapterId &&
          currentProject?.chapters.some((chapter) => chapter.id === raw.currentChapterId)
            ? raw.currentChapterId
            : currentProject?.chapters[0]?.id ?? null;
        return {
          language: raw.language === "en" ? "en" : DEFAULT_UI_LANGUAGE,
          view: raw.view ?? "workbench",
          projects,
          currentProjectId,
          currentChapterId,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export function getProjectWordCount(project: Project) {
  return project.chapters.reduce((sum, chapter) => sum + countWords(chapter.content), 0);
}
