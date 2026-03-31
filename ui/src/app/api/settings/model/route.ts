import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/server/api-response";
import {
  getPublicModelSettings,
  savePublicModelSettings,
} from "@/lib/server/model-settings";

export const runtime = "nodejs";

export async function GET() {
  try {
    return ok({ settings: await getPublicModelSettings() });
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (
      !body ||
      typeof body !== "object" ||
      typeof body.mode !== "string" ||
      typeof body.model !== "string"
    ) {
      return fail("请提供合法的 mode 和 model。", 400);
    }
    return ok({ settings: await savePublicModelSettings(body) });
  } catch (error) {
    return fail(error, 400);
  }
}
