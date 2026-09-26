/** Bài làm luyện nghe của người đang đăng nhập. GET: danh sách (tìm, lọc thẻ, sắp xếp, phân trang) · POST: lưu bài làm. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body, query } from "@/server/api";
import { exerciseInputSchema, exerciseListSchema } from "@/features/listening/schema";
import { createExercise, getExercise, listExercises } from "@/features/listening/service";

export const dynamic = "force-dynamic";

const pageSize = z.coerce.number().int().min(1).max(100).catch(20);

export const GET = api(async ({ user, req }) => {
  const q = query(req);
  return listExercises(user.id, exerciseListSchema.parse(q), pageSize.parse(q.pageSize ?? 20));
});

export const POST = api(
  async ({ user, req }) => {
    const id = await createExercise(user.id, exerciseInputSchema.parse(await body(req)));
    revalidatePath("/listening", "layout");
    return getExercise(user.id, id);
  },
  { status: 201 },
);
