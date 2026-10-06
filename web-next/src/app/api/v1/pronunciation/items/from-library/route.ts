/**
 * Lưu từ ví dụ của một mục Thư viện LingYu vào Phát âm của tôi. POST { topic: "initial:b" | "final:ang" | "tone:3" |
 * "sandhi:bu", hanzi? } (bỏ trống = mọi ví dụ của mục) → { added, skipped }. Bản sao sửa / thêm tag tự do.
 */
import { revalidatePath } from "next/cache";
import { api, body } from "@/server/api";
import { getLocale } from "@/i18n/server";
import { fromLibrarySchema } from "@/features/pronunciation/schema";
import { saveFromLibrary } from "@/features/pronunciation/items";

export const dynamic = "force-dynamic";
export const POST = api(async ({ user, req }) => {
  const v = fromLibrarySchema.parse(await body(req));
  const r = await saveFromLibrary(user.id, v.topic, v.hanzi, await getLocale());
  revalidatePath("/pronunciation", "layout");
  return r;
});
