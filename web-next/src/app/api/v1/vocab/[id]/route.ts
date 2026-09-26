/** Một từ vựng (chỉ của chính mình; của người khác → 404). GET · PUT (sửa toàn bộ) · DELETE. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body } from "@/server/api";
import { vocabInputSchema } from "@/features/vocabulary/schema";
import { deleteVocab, getVocab, updateVocab, VocabError } from "@/features/vocabulary/service";

export const dynamic = "force-dynamic";
type P = { id: string };
const vid = (id: string) => {
  const r = z.uuid().safeParse(id);
  if (!r.success) throw new VocabError("not-found", "Không tìm thấy từ vựng này. Có thể nó đã bị xóa.");
  return r.data;
};

export const GET = api<P>(async ({ user, params }) => getVocab(user.id, vid(params.id)));

export const PUT = api<P>(async ({ user, req, params }) => {
  const id = vid(params.id);
  const input = vocabInputSchema.parse(await body(req));
  await updateVocab(user.id, id, input, undefined);
  revalidatePath("/vocabulary");
  return getVocab(user.id, id);
});

export const DELETE = api<P>(async ({ user, params }) => {
  const id = vid(params.id);
  const removed = await deleteVocab(user.id, [id]);
  if (!removed) throw new VocabError("not-found", "Không tìm thấy từ vựng này. Có thể nó đã bị xóa.");
  revalidatePath("/vocabulary");
  return { removed };
});
