import type {
  AnalyzeTextRequest,
  AnalyzeTextResponse,
  GenerateOutlineRequest,
  GenerateOutlineResponse,
  GenerateTextRequest,
  GenerateTextResponse,
  LearnProfileRequest,
  LearnProfileResponse,
  ModelSettings,
  OutlineFollowUpQuestionsRequest,
  OutlineQuestionsRequest,
  OutlineQuestionsResponse,
  ProfilePatch,
  UserProfile,
} from "@/lib/modeling";

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "error" in payload && payload.error
        ? payload.error
        : "请求失败";
    throw new Error(message);
  }
  return payload;
}

export async function fetchModelSettings() {
  return readJson<{ settings: ModelSettings }>(
    await fetch("/api/settings/model", { cache: "no-store" })
  );
}

export async function saveModelSettings(input: ModelSettings) {
  return readJson<{ settings: ModelSettings }>(
    await fetch("/api/settings/model", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    })
  );
}

export async function fetchProfile() {
  return readJson<{ profile: UserProfile }>(
    await fetch("/api/profile", { cache: "no-store" })
  );
}

export async function updateProfile(input: ProfilePatch) {
  return readJson<{ profile: UserProfile }>(
    await fetch("/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    })
  );
}

export async function learnProfile(input: LearnProfileRequest) {
  return readJson<LearnProfileResponse>(
    await fetch("/api/profile/learn", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    })
  );
}

export async function fetchLearningHistory() {
  return readJson<{ events: UserProfile["recentLearningEvents"] }>(
    await fetch("/api/profile/learning-history", { cache: "no-store" })
  );
}

export async function undoLearning() {
  return readJson<{ profile: UserProfile }>(
    await fetch("/api/profile/undo", {
      method: "POST",
    })
  );
}

export async function generateText(input: GenerateTextRequest) {
  return readJson<GenerateTextResponse>(
    await fetch("/api/ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    })
  );
}

export async function analyzeText(input: AnalyzeTextRequest) {
  return readJson<AnalyzeTextResponse>(
    await fetch("/api/ai/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    })
  );
}

export async function createOutlineQuestions(input: OutlineQuestionsRequest) {
  return readJson<OutlineQuestionsResponse>(
    await fetch("/api/ai/outline", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "questions",
        ...input,
      }),
    })
  );
}

export async function createOutlineFollowUpQuestions(
  input: OutlineFollowUpQuestionsRequest
) {
  return readJson<OutlineQuestionsResponse>(
    await fetch("/api/ai/outline", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "follow-up",
        ...input,
      }),
    })
  );
}

export async function generateOutline(input: GenerateOutlineRequest) {
  return readJson<GenerateOutlineResponse>(
    await fetch("/api/ai/outline", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "generate",
        ...input,
      }),
    })
  );
}
