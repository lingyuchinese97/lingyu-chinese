/**
 * PUT { answer, answerPinyin?, answerMeaning? } → lưu câu trả lời; pinyin + nghĩa tự sinh khi câu trả lời đổi,
 * gửi kèm thì lưu đúng bản người học sửa. Trả { answer, answerPinyin, answerMeaning, changed }.
 */
import { api, body } from "@/server/api";
import { answerSchema } from "@/features/speaking/schema";
import { saveAnswer } from "@/features/speaking/service";
import { qid, type P } from "../../../ids";

export const dynamic = "force-dynamic";
export const PUT = api<P>(async ({ user, req, params }) => {
  const { answer, ...edit } = answerSchema.parse(await body(req));
  return saveAnswer(user.id, qid(params.id), answer, edit);
});
