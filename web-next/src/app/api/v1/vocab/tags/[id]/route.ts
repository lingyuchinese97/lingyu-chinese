/** Một tag từ vựng của mình (của người khác → 404). PATCH { name } (đổi tên) · DELETE (gỡ tag, giữ từ). */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body } from "@/server/api";
import { tagNameSchema } from "@/features/vocabulary/schema";
import { deleteTag, renameTag, VocabError } from "@/features/vocabulary/service";

export const dynamic = "force-dynamic";
type P = { id: string };
const tid = (id: string) => {
  const r = z.uuid().safeParse(id);
  if (!r.success) throw new VocabError("not-found", "Không tìm thấy tag này. Có thể nó đã bị xóa.");
  return r.data;
};

export const PATCH = api<P>(async ({ user, req, params }) => {
  const id = tid(params.id);
  const { name } = z.object({ name: tagNameSchema }).parse(await body(req));
  const tag = await renameTag(user.id, id, name);
  revalidatePath("/vocabulary");
  return tag;
});

export const DELETE = api<P>(async ({ user, params }) => {
  const r = await deleteTag(user.id, tid(params.id));
  revalidatePath("/vocabulary");
  return r;
});
