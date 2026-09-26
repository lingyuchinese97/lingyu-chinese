/** Nộp bài (phải làm hết, nếu chưa → 400) → kết quả (như `last-result`). */
import { revalidatePath } from "next/cache";
import { api } from "@/server/api";
import { completeSentenceSession, getLastSentenceResult } from "@/features/sentences/review-service";
import { sessId, type P } from "../../../../_ids";

export const dynamic = "force-dynamic";

export const POST = api<P>(async ({ user, params }) => {
  await completeSentenceSession(user.id, sessId(params.id));
  revalidatePath("/sentences", "layout");
  return getLastSentenceResult(user.id);
});
