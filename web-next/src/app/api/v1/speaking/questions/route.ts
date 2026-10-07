/**
 * Luyện giao tiếp — câu hỏi của tôi. GET ?q&tag&hsk&starred&sort(newest|oldest|az)&page&size → danh sách + tag + số câu mỗi HSK.
 * POST { questions: [{ zh, pinyin?, meaning?, hsk?, tags? }, …] } → 201 { ids } (pinyin / nghĩa bỏ trống thì tự sinh).
 * DELETE { ids: [...] } → xoá nhiều câu (chỉ của mình).
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body, query } from "@/server/api";
import { questionBatchSchema, questionListSchema } from "@/features/speaking/schema";
import { createQuestions, deleteQuestions, listQuestions } from "@/features/speaking/service";

export const dynamic = "force-dynamic";
export const GET = api(async ({ user, req }) => listQuestions(user.id, questionListSchema.parse(query(req))));
export const POST = api(
  async ({ user, req }) => {
    const r = await createQuestions(user.id, questionBatchSchema.parse(await body(req)).questions);
    revalidatePath("/speaking", "layout");
    return r;
  },
  { status: 201 },
);
export const DELETE = api(async ({ user, req }) => {
  const { ids } = z.object({ ids: z.array(z.uuid()).max(200) }).parse(await body(req));
  const r = await deleteQuestions(user.id, ids);
  revalidatePath("/speaking", "layout");
  return r;
});
