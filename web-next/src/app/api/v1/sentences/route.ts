/** Kho câu (Ôn dịch câu). GET: danh sách (`q`, `tag` — tên tag hoặc `__fav` = Yêu thích, `page`, `pageSize`) · POST: thêm câu. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body, query } from "@/server/api";
import { sentenceInputSchema, sentenceListSchema } from "@/features/sentences/schema";
import { createSentence, getSentence, listSentences } from "@/features/sentences/service";

export const dynamic = "force-dynamic";
const pageSize = z.coerce.number().int().min(1).max(100).catch(20);

export const GET = api(async ({ user, req }) => {
  const q = query(req);
  return listSentences(user.id, sentenceListSchema.parse(q), pageSize.parse(q.pageSize ?? 20));
});

export const POST = api(
  async ({ user, req }) => {
    const id = await createSentence(user.id, sentenceInputSchema.parse(await body(req)));
    revalidatePath("/sentences", "layout");
    return getSentence(user.id, id);
  },
  { status: 201 },
);
