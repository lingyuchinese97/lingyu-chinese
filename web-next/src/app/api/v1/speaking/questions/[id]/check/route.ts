/**
 * POST { answer } → lưu và nhận xét câu trả lời (ngữ pháp, từ vựng, độ tự nhiên, đúng trọng tâm; không chấm theo đáp án
 * cố định). `feedback.ai` = false khi máy chủ chưa bật trợ lý AI (chỉ kiểm tra cơ bản).
 */
import { api, body } from "@/server/api";
import { answerSchema } from "@/features/speaking/schema";
import { checkAnswer } from "@/features/speaking/service";
import { qid, type P } from "../../../ids";

export const dynamic = "force-dynamic";
export const POST = api<P>(async ({ user, req, params }) =>
  checkAnswer(user.id, qid(params.id), answerSchema.parse(await body(req)).answer),
);
