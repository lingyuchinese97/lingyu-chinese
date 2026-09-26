/** Ngữ pháp của tôi. GET: danh sách (tìm, lọc thẻ, sắp xếp, đã lưu) · POST: thêm ngữ pháp. */
import { revalidatePath } from "next/cache";
import { api, body, query } from "@/server/api";
import { grammarInputSchema, grammarListSchema } from "@/features/grammar/schema";
import { createGrammar, getOwnGrammar, listGrammar } from "@/features/grammar/service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user, req }) => {
  const q = query(req);
  return listGrammar(user.id, grammarListSchema.parse({ ...q, view: q.view === "saved" ? "saved" : "all" }));
});

export const POST = api(
  async ({ user, req }) => {
    const id = await createGrammar(user.id, grammarInputSchema.parse(await body(req)));
    revalidatePath("/grammar", "layout");
    return getOwnGrammar(user.id, id);
  },
  { status: 201 },
);
