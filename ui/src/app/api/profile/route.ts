import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/server/api-response";
import { getUserProfile, updateUserProfile } from "@/lib/server/profile-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    return ok({ profile: await getUserProfile() });
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return fail("请求体格式错误。", 400);
    }
    return ok({ profile: await updateUserProfile(body) });
  } catch (error) {
    return fail(error, 400);
  }
}
