/** PUT { answer } → lưu câu trả lời, trả pinyin + nghĩa tự sinh ({ answer, answerPinyin, answerMeaning, changed }). */
import { api, body } from "@/server/api";
import { answerSchema } from "@/features/speaking/schema";
import { saveAnswer } from "@/features/speaking/service";
import { qid, type P } from "../../../ids";

export const dynamic = "force-dynamic";
export const PUT = api<P>(async ({ user, req, params }) =>
  saveAnswer(user.id, qid(params.id), answerSchema.parse(await body(req)).answer),
);
