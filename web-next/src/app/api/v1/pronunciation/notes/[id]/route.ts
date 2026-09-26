/** Một ghi chú phát âm (chỉ của chính mình; của người khác → 404). GET · PUT · DELETE. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body } from "@/server/api";
import { noteUpdateSchema } from "@/features/pronunciation/schema";
import { deleteNote, getNote, PronunciationError, updateNote } from "@/features/pronunciation/service";

export const dynamic = "force-dynamic";
type P = { id: string };
const nid = (id: string) => {
  const r = z.uuid().safeParse(id);
  if (!r.success) throw new PronunciationError("not-found", "Không tìm thấy ghi chú này. Có thể nó đã bị xóa.");
  return r.data;
};

export const GET = api<P>(async ({ user, params }) => getNote(user.id, nid(params.id)));

export const PUT = api<P>(async ({ user, req, params }) => {
  const note = await updateNote(user.id, nid(params.id), noteUpdateSchema.parse(await body(req)));
  revalidatePath("/pronunciation", "layout");
  return note;
});

export const DELETE = api<P>(async ({ user, params }) => {
  await deleteNote(user.id, nid(params.id));
  revalidatePath("/pronunciation", "layout");
  return { deleted: true };
});
