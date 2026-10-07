/** Một câu hỏi Luyện giao tiếp (chỉ của chính mình; của người khác → 404). GET (kèm câu trả lời, nhận xét, vị trí) · PUT · DELETE. */
import { revalidatePath } from "next/cache";
import { api, body } from "@/server/api";
import { questionInputSchema } from "@/features/speaking/schema";
import { deleteQuestion, getQuestion, updateQuestion } from "@/features/speaking/service";
import { qid, type P } from "../../ids";

export const dynamic = "force-dynamic";
export const GET = api<P>(async ({ user, params }) => getQuestion(user.id, qid(params.id)));
export const PUT = api<P>(async ({ user, req, params }) => {
  const r = await updateQuestion(user.id, qid(params.id), questionInputSchema.parse(await body(req)));
  revalidatePath("/speaking", "layout");
  return r;
});
export const DELETE = api<P>(async ({ user, params }) => {
  const r = await deleteQuestion(user.id, qid(params.id));
  revalidatePath("/speaking", "layout");
  return r;
});
