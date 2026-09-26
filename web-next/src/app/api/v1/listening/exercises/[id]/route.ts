/** Một bài làm (chỉ của chính mình; của người khác → 404). GET · PUT (sửa toàn bộ, chấm lại) · DELETE. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body } from "@/server/api";
import { exerciseInputSchema } from "@/features/listening/schema";
import { deleteExercise, getExercise, ListeningError, updateExercise } from "@/features/listening/service";

export const dynamic = "force-dynamic";
type P = { id: string };
const eid = (id: string) => {
  const r = z.uuid().safeParse(id);
  if (!r.success) throw new ListeningError("not-found", "Không tìm thấy bài làm này. Có thể nó đã bị xóa.");
  return r.data;
};

export const GET = api<P>(async ({ user, params }) => getExercise(user.id, eid(params.id)));

export const PUT = api<P>(async ({ user, req, params }) => {
  const id = eid(params.id);
  await updateExercise(user.id, id, exerciseInputSchema.parse(await body(req)));
  revalidatePath("/listening", "layout");
  return getExercise(user.id, id);
});

export const DELETE = api<P>(async ({ user, params }) => {
  await deleteExercise(user.id, eid(params.id));
  revalidatePath("/listening", "layout");
  return { deleted: true };
});
