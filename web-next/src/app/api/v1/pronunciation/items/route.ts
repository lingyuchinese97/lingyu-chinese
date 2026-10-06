/**
 * Phát âm của tôi (mục tự nhập hoặc lưu từ Thư viện LingYu). GET ?q&tag&from(all|library|mine)&sort(updated|newest|az)
 * → { items, total, all, fromLibrary, tags } · POST { hanzi, pinyin?, meaning?, note?, tags? } → 201 (trùng → 409).
 */
import { revalidatePath } from "next/cache";
import { api, body, query } from "@/server/api";
import { itemInputSchema, itemListSchema } from "@/features/pronunciation/schema";
import { createItem, listItems } from "@/features/pronunciation/items";

export const dynamic = "force-dynamic";
export const GET = api(async ({ user, req }) => listItems(user.id, itemListSchema.parse(query(req))));
export const POST = api(
  async ({ user, req }) => {
    const r = await createItem(user.id, itemInputSchema.parse(await body(req)));
    revalidatePath("/pronunciation", "layout");
    return r;
  },
  { status: 201 },
);
