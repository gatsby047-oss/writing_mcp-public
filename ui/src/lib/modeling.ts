export type AppView = "workbench" | "profile" | "settings" | "bookshelf";
export type ModelMode = "mock" | "openai-compatible";
export type ProviderMode = ModelMode | "mock-fallback";
export type ChapterStatus = "draft" | "review" | "complete";
export type GenerationAction =
  | "continue"
  | "polish"
  | "summarize"
  | "write-from-outline";
export type AnalysisAction = "chapter-diagnosis";
export type LearningSource =
  | "accepted_generation"
  | "accepted_polish"
  | "manual_feedback"
  | "edited_after_ai";
export type OutlineQuestionRound = "initial" | "follow-up";

export interface SignalScore {
  label: string;
  weight: number;
  reason: string;
}

export interface StyleFingerprint {
  narrativePerspective: string;
  pacing: string;
  sentenceRhythm: string;
  detailDensity: string;
  dialoguePreference: string;
  emotionalRegister: string;
  revisionBias: string[];
}

export interface LearningEvent {
  id: string;
  source: LearningSource;
  beforeText?: string;
  afterText: string;
  inferredChanges: string[];
  appliedToProfile: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  version: number;
  enabled: boolean;
  autoLearningEnabled: boolean;
  styleFingerprint: StyleFingerprint;
  preferenceSignals: SignalScore[];
  avoidanceSignals: SignalScore[];
  recentLearningEvents: LearningEvent[];
  updatedAt: string;
}

export interface ProjectStyleOverlay {
  audience: string;
  toneNotes: string;
  styleNotes: string;
  doMoreOf: string[];
  avoid: string[];
}

export interface ChapterOutline {
  opening: string;
  development: string;
  turn: string;
  endingHook: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  summary: string;
  status: ChapterStatus;
  targetWordCount: number;
  outline: ChapterOutline;
  updatedAt: string;
}

export interface Character {
  id: string;
  name: string;
  role: "protagonist" | "supporting" | "antagonist" | "observer";
  goal: string;
  emotion: string;
  arc: string;
  notes: string;
}

export interface Foreshadow {
  id: string;
  content: string;
  plantedChapterId: string;
  status: "open" | "resolved";
  resolutionNote?: string;
}

export interface Project {
  id: string;
  name: string;
  genre: string;
  tone: string;
  createdAt: string;
  updatedAt: string;
  chapters: Chapter[];
  characters: Character[];
  foreshadows: Foreshadow[];
  bannedPhrases: string[];
  projectStyleOverlay: ProjectStyleOverlay;
}

export interface QCReport {
  dimension: string;
  score: number;
  issues: string[];
  suggestions: string[];
  passed: boolean;
}

export interface ModelSettings {
  mode: ModelMode;
  apiKey: string;
  baseUrl: string;
  model: string;
  hasStoredApiKey?: boolean;
}

export interface ProjectContextPayload {
  projectId?: string;
  projectName?: string;
  genre?: string;
  tone?: string;
  chapterId?: string;
  chapterTitle?: string;
  chapterSummary?: string;
  outline?: ChapterOutline;
  characters?: Character[];
  foreshadows?: Foreshadow[];
  bannedPhrases?: string[];
  projectStyleOverlay?: ProjectStyleOverlay;
}

export interface GenerateTextRequest {
  action: GenerationAction;
  text: string;
  context?: ProjectContextPayload;
}

export interface GenerateTextResponse {
  action: GenerationAction;
  summary: string;
  previewText: string;
  providerMode: ProviderMode;
  usedPersona: boolean;
}

export interface AnalyzeTextRequest {
  action: AnalysisAction;
  text: string;
  context?: ProjectContextPayload;
}

export interface AnalyzeTextResponse {
  action: AnalysisAction;
  summary: string;
  findings: string[];
  suggestions: string[];
  nextSteps: string[];
  providerMode: ProviderMode;
  usedPersona: boolean;
}

export interface OutlineQuestion {
  id: string;
  question: string;
  placeholder: string;
  intent: string;
  round: OutlineQuestionRound;
}

export interface OutlineAnswer {
  id: string;
  question: string;
  answer: string;
  round?: OutlineQuestionRound;
}

export interface OutlineQuestionsRequest {
  text: string;
  context?: ProjectContextPayload;
}

export interface OutlineFollowUpQuestionsRequest {
  text: string;
  context?: ProjectContextPayload;
  answers: OutlineAnswer[];
}

export interface OutlineQuestionsResponse {
  summary: string;
  questions: OutlineQuestion[];
  providerMode: ProviderMode;
  usedPersona: boolean;
  round: OutlineQuestionRound;
  guidance?: string;
}

export interface GenerateOutlineRequest {
  text: string;
  context?: ProjectContextPayload;
  answers: OutlineAnswer[];
}

export interface GenerateOutlineResponse {
  summary: string;
  chapterSummary: string;
  outline: ChapterOutline;
  notes: string[];
  providerMode: ProviderMode;
  usedPersona: boolean;
}

export interface LearnProfileRequest {
  source: LearningSource;
  afterText: string;
  beforeText?: string;
}

export interface LearnProfileResponse {
  profile: UserProfile;
  event: LearningEvent;
  learned: string[];
  summary: string;
}

export interface ProfilePatch {
  enabled?: boolean;
  autoLearningEnabled?: boolean;
}
