import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const dataDir = path.join(process.cwd(), ".aiws-data");

async function ensureDataDir() {
  await mkdir(dataDir, { recursive: true });
}

export async function readJsonFile<T>(fileName: string, fallback: T): Promise<T> {
  await ensureDataDir();
  const fullPath = path.join(dataDir, fileName);
  try {
    const content = await readFile(fullPath, "utf8");
    return JSON.parse(content) as T;
  } catch {
    await writeJsonFile(fileName, fallback);
    return fallback;
  }
}

export async function writeJsonFile<T>(fileName: string, payload: T) {
  await ensureDataDir();
  const fullPath = path.join(dataDir, fileName);
  await writeFile(fullPath, JSON.stringify(payload, null, 2), "utf8");
}
