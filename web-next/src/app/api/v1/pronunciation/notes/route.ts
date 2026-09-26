/** Ghi chú phát âm của tôi. GET: danh sách · POST: tạo ghi chú tự do, hoặc lưu ghi chú của một mục (`topic`). */
import { revalidatePath } from "next/cache";
import { api, body, json } from "@/server/api";
import { noteInputSchema } from "@/features/pronunciation/schema";
import { listNotes, saveNote } from "@/features/pronunciation/service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user }) => listNotes(user.id));

export const POST = api(async ({ user, req }) => {
  const input = noteInputSchema.parse(await body(req));
  const note = await saveNote(user.id, input);
  revalidatePath("/pronunciation", "layout");
  // Ghi chú tự do mới → 201; ghi chú của mục → 200 (null nếu nội dung rỗng = đã xoá).
  return json({ ok: true, data: note }, input.topic ? 200 : 201);
});
