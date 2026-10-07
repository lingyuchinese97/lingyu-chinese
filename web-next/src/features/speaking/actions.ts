"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthError, currentUserOrThrow } from "@/server/session";
import { log } from "@/server/log";
import { answerSchema, assistSchema, questionBatchSchema, questionInputSchema } from "./schema";
import * as svc from "./service";

type Fail = { ok: false; message: string; fieldErrors?: Record<string, string> };
export type Result<T> = { ok: true; data: T } | Fail;

function fail(e: unknown): Fail {
  if (e instanceof AuthError || e instanceof svc.SpeakingError) return { ok: false, message: e.message };
  if (e instanceof z.ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const i of e.issues) fieldErrors[i.path.join(".") || "form"] ??= i.message;
    return { ok: false, message: e.issues[0]?.message ?? "Vui lòng kiểm tra lại các trường bắt buộc.", fieldErrors };
  }
  log.error({ err: e instanceof Error ? e.message : String(e) }, "speaking action failed");
  return { ok: false, message: "Đã có lỗi xảy ra. Vui lòng thử lại." };
}
async function run<T>(fn: (userId: string) => Promise<T>, refresh = true): Promise<Result<T>> {
  try {
    const u = await currentUserOrThrow();
    const data = await fn(u.id);
    if (refresh) revalidatePath("/speaking", "layout");
    return { ok: true, data };
  } catch (e) {
    return fail(e);
  }
}
const uuid = (v: unknown) => z.uuid().parse(v);

export const createQuestionsAction = async (input: unknown) =>
  run((uid) => svc.createQuestions(uid, questionBatchSchema.parse(input).questions));
export const updateQuestionAction = async (id: string, input: unknown) =>
  run((uid) => svc.updateQuestion(uid, uuid(id), questionInputSchema.parse(input)));
export const deleteQuestionAction = async (id: string) => run((uid) => svc.deleteQuestion(uid, uuid(id)));
export const deleteQuestionsAction = async (ids: unknown) =>
  run((uid) => svc.deleteQuestions(uid, z.array(z.uuid()).max(200).parse(ids)));
export const setStarredAction = async (id: string, starred: boolean) =>
  run((uid) => svc.setStarred(uid, uuid(id), z.boolean().parse(starred)));
export const saveAnswerAction = async (id: string, answer: unknown) =>
  run((uid) => svc.saveAnswer(uid, uuid(id), answerSchema.parse({ answer }).answer), false);
export const checkAnswerAction = async (id: string, answer: unknown) =>
  run((uid) => svc.checkAnswer(uid, uuid(id), answerSchema.parse({ answer }).answer), false);
export const assistAction = async (text: unknown) =>
  run((uid) => svc.assist(uid, assistSchema.parse({ text }).text), false);
