import type { ModelSettings } from "@/lib/modeling";
import { readJsonFile, writeJsonFile } from "@/lib/server/local-store";

const fileName = "model-settings.json";
const DEFAULT_BASE_URL = "https://coding.dashscope.aliyuncs.com/v1";
const DEFAULT_MODEL = "kimi-k2.5";

const defaultSettings: ModelSettings = {
  mode: "mock",
  apiKey: "",
  baseUrl: DEFAULT_BASE_URL,
  model: DEFAULT_MODEL,
  hasStoredApiKey: false,
};

function toPublicSettings(settings: ModelSettings): ModelSettings {
  return {
    ...settings,
    apiKey: "",
    hasStoredApiKey: Boolean(settings.apiKey.trim()),
  };
}

export async function getModelSettings(): Promise<ModelSettings> {
  // 优先从环境变量读取（生产推荐方式），fallback 到文件
  const envApiKey = process.env.DASHSCOPE_API_KEY ?? "";
  const envBaseUrl = process.env.DASHSCOPE_BASE_URL ?? "";
  const envModel = process.env.DASHSCOPE_MODEL ?? "";

  const fileSettings = await readJsonFile(fileName, defaultSettings);

  // 环境变量覆盖文件设置
  const apiKey = envApiKey || fileSettings.apiKey;
  const mode: ModelSettings["mode"] =
    apiKey && envApiKey ? "openai-compatible" : fileSettings.mode;

  return {
    mode,
    apiKey,
    baseUrl: envBaseUrl || fileSettings.baseUrl,
    model: envModel || fileSettings.model,
    hasStoredApiKey: Boolean(apiKey.trim()),
  };
}

export async function getPublicModelSettings(): Promise<ModelSettings> {
  return toPublicSettings(await getModelSettings());
}

export async function saveModelSettings(input: ModelSettings) {
  const currentSettings = await readJsonFile(fileName, defaultSettings);
  const nextApiKey = input.apiKey?.trim();
  const normalized: ModelSettings = {
    mode: input.mode,
    apiKey: nextApiKey || (input.hasStoredApiKey ? currentSettings.apiKey : ""),
    baseUrl: input.baseUrl?.trim() || DEFAULT_BASE_URL,
    model: input.model?.trim() || DEFAULT_MODEL,
    hasStoredApiKey: undefined,
  };
  await writeJsonFile(fileName, normalized);
  return normalized;
}

export async function savePublicModelSettings(input: ModelSettings) {
  return toPublicSettings(await saveModelSettings(input));
}
