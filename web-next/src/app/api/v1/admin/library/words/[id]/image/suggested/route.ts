/** Admin: đặt ảnh minh hoạ từ ảnh gợi ý. PUT { title: "File:…" } — máy chủ tự tải từ upload.wikimedia.org, lưu kèm ghi công. */
import { revalidatePath } from "next/cache";
import { api, body } from "@/server/api";
import { suggestedImageSchema } from "@/features/library/schema";
import { setSuggestedImage } from "@/features/library/service";
import { wordId as wid } from "@/features/library/ids";
import { assertAdmin } from "../../../../../_guard";

export const dynamic = "force-dynamic";
export const PUT = api<{ id: string }>(async ({ user, req, params }) => {
  assertAdmin(user);
  const { title } = suggestedImageSchema.parse(await body(req));
  const r = await setSuggestedImage(wid(params.id), title);
  revalidatePath("/library/vocabulary");
  return r;
});
