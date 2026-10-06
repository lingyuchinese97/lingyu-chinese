/** Một mục trong Phát âm của tôi (chỉ của chính mình; của người khác → 404). GET · PUT (sửa, thêm tag) · DELETE. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body } from "@/server/api";
import { itemInputSchema } from "@/features/pronunciation/schema";
import { deleteItem, getItem, updateItem } from "@/features/pronunciation/items";
import { PronunciationError } from "@/features/pronunciation/service";

export const dynamic = "force-dynamic";
type P = { id: string };
const iid = (id: string) => {
  const r = z.uuid().safeParse(id);
  if (!r.success) throw new PronunciationError("not-found", "Không tìm thấy mục phát âm này.");
  return r.data;
};
const refresh = () => revalidatePath("/pronunciation", "layout");

export const GET = api<P>(async ({ user, params }) => getItem(user.id, iid(params.id)));
export const PUT = api<P>(async ({ user, req, params }) => {
  const r = await updateItem(user.id, iid(params.id), itemInputSchema.parse(await body(req)));
  refresh();
  return r;
});
export const DELETE = api<P>(async ({ user, params }) => {
  const r = await deleteItem(user.id, iid(params.id));
  refresh();
  return r;
});
