/** Nộp bài (mọi câu phải đã trả lời) → kết quả. */
import { revalidatePath } from "next/cache";
import { api } from "@/server/api";
import { completeSession, getLastResult } from "@/features/review/service";
import { sid, type P } from "../../../_ids";

export const dynamic = "force-dynamic";

export const POST = api<P>(async ({ user, params }) => {
  await completeSession(user.id, sid(params.id));
  revalidatePath("/review");
  return getLastResult(user.id);
});
