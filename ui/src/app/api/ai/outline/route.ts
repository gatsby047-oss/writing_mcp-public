import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/server/api-response";
import {
  runGenerateOutline,
  runOutlineFollowUpQuestions,
  runOutlineQuestions,
} from "@/lib/server/ai-service-core";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body?.mode === "questions") {
      if (typeof body?.text !== "string") {
        return fail("请提供 text。", 400);
      }
      return ok(
        await runOutlineQuestions({
          text: body.text,
          context: body.context,
        })
      );
    }

    if (body?.mode === "follow-up") {
      if (typeof body?.text !== "string" || !Array.isArray(body?.answers)) {
        return fail("请提供 text 和 answers。", 400);
      }
      return ok(
        await runOutlineFollowUpQuestions({
          text: body.text,
          context: body.context,
          answers: body.answers,
        })
      );
    }

    if (body?.mode === "generate") {
      if (typeof body?.text !== "string" || !Array.isArray(body?.answers)) {
        return fail("请提供 text 和 answers。", 400);
      }
      return ok(
        await runGenerateOutline({
          text: body.text,
          context: body.context,
          answers: body.answers,
        })
      );
    }

    return fail("请提供合法的 mode。", 400);
  } catch (error) {
    return fail(error, 400);
  }
}
