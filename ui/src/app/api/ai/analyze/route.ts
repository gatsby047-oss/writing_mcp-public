import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/server/api-response";
import { runAnalyze } from "@/lib/server/ai-service-core";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (
      !body ||
      typeof body !== "object" ||
      typeof body.action !== "string" ||
      typeof body.text !== "string"
    ) {
      return fail("请提供合法的 action 和 text。", 400);
    }
    return ok(await runAnalyze(body));
  } catch (error) {
    return fail(error, 400);
  }
}
