/** Một câu (chỉ của chính mình; của người khác → 404). GET · PUT (sửa toàn bộ) · DELETE. */
import { revalidatePath } from "next/cache";
import { api, body } from "@/server/api";
import { sentenceInputSchema } from "@/features/sentences/schema";
import { deleteSentences, getSentence, SentenceError, updateSentence } from "@/features/sentences/service";
import { sentId, type P } from "../_ids";

export const dynamic = "force-dynamic";

export const GET = api<P>(async ({ user, params }) => getSentence(user.id, sentId(params.id)));

export const PUT = api<P>(async ({ user, req, params }) => {
  const id = sentId(params.id);
  await updateSentence(user.id, id, sentenceInputSchema.parse(await body(req)));
  revalidatePath("/sentences", "layout");
  return getSentence(user.id, id);
});

export const DELETE = api<P>(async ({ user, params }) => {
  const n = await deleteSentences(user.id, [sentId(params.id)]);
  if (!n) throw new SentenceError("not-found", "Không tìm thấy câu này. Có thể nó đã bị xóa.");
  revalidatePath("/sentences", "layout");
  return { deleted: true };
});
