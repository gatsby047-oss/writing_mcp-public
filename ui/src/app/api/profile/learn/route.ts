import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/server/api-response";
import { learnUserProfile } from "@/lib/server/profile-service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body?.source || !body?.afterText) {
      return fail("请提供 source 和 afterText。", 400);
    }
    return ok(await learnUserProfile(body));
  } catch (error) {
    return fail(error, 400);
  }
}
