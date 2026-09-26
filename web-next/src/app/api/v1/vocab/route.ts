/** Từ vựng của người đang đăng nhập. GET: danh sách (lọc, tìm, sắp xếp, phân trang) · POST: thêm từ. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body, query } from "@/server/api";
import { listParamsSchema, vocabInputSchema } from "@/features/vocabulary/schema";
import { createVocab, listVocab } from "@/features/vocabulary/service";

export const dynamic = "force-dynamic";

const pageSize = z.coerce.number().int().min(1).max(100).catch(20);

export const GET = api(async ({ user, req }) => {
  const q = query(req);
  return listVocab(user.id, listParamsSchema.parse(q), pageSize.parse(q.pageSize ?? 20));
});

export const POST = api(
  async ({ user, req }) => {
    const input = vocabInputSchema.parse(await body(req));
    const id = await createVocab(user.id, input, null);
    revalidatePath("/vocabulary");
    return { id };
  },
  { status: 201 },
);
