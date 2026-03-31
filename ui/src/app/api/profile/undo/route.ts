import { fail, ok } from "@/lib/server/api-response";
import { undoLastLearning } from "@/lib/server/profile-service";

export const runtime = "nodejs";

export async function POST() {
  try {
    const result = await undoLastLearning();
    if (!result.undone) {
      return fail("撤销栈已空，没有可撤销的学习记录。", 409);
    }
    return ok({ profile: result.profile });
  } catch (error) {
    return fail(error, 400);
  }
}
