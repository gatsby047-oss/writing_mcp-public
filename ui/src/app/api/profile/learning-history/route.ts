import { fail, ok } from "@/lib/server/api-response";
import { listLearningHistory } from "@/lib/server/profile-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    return ok({ events: await listLearningHistory() });
  } catch (error) {
    return fail(error, 500);
  }
}
