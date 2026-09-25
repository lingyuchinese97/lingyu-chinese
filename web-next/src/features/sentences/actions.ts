"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthError, currentUserOrThrow } from "@/server/session";
import { log } from "@/server/log";
import { sentenceConfigSchema, sentenceInputSchema } from "./schema";
import * as svc from "./service";
import * as rv from "./review-service";

type Fail = { ok: false; message: string; fieldErrors?: Record<string, string> };
export type Result<T> = { ok: true; data: T } | Fail;

function fail(e: unknown): Fail {
  if (e instanceof AuthError || e instanceof svc.SentenceError || e instanceof rv.SentenceReviewError)
    return { ok: false, message: e.message };
  if (e instanceof z.ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const i of e.issues) fieldErrors[String(i.path[0] ?? "form")] ??= i.message;
    return { ok: false, message: "Vui lòng kiểm tra lại các trường bắt buộc.", fieldErrors };
  }
  log.error({ err: e instanceof Error ? e.message : String(e) }, "sentence action failed");
  return { ok: false, message: "Đã có lỗi xảy ra. Vui lòng thử lại." };
}
async function run<T>(fn: (userId: string) => Promise<T>, revalidate = false): Promise<Result<T>> {
  try {
    const u = await currentUserOrThrow();
    const data = await fn(u.id);
    if (revalidate) revalidatePath("/sentences", "layout");
    return { ok: true, data };
  } catch (e) {
    return fail(e);
  }
}
const uuid = (v: unknown) => z.uuid().parse(v);
const ids = (v: unknown) => z.array(z.uuid()).min(1, "Chưa chọn câu nào.").max(500).parse(v);
const idx = (v: unknown) => z.number().int().min(0).max(499).parse(v);

// ---------- Kho câu ----------
export const createSentenceAction = async (input: unknown) =>
  run((uid) => svc.createSentence(uid, sentenceInputSchema.parse(input)), true);
export const updateSentenceAction = async (id: string, input: unknown) =>
  run((uid) => svc.updateSentence(uid, uuid(id), sentenceInputSchema.parse(input)), true);
export const deleteSentencesAction = async (list: string[]) => run((uid) => svc.deleteSentences(uid, ids(list)), true);
export const toggleSentenceFavoriteAction = async (id: string) =>
  run((uid) => svc.toggleSentenceFavorite(uid, uuid(id)), true);
export const setSentenceStatusAction = async (list: string[], status: string) =>
  run((uid) => svc.setSentenceStatus(uid, ids(list), z.enum(["review", "learned"]).parse(status)), true);
export const importSampleSentencesAction = async () => run((uid) => svc.importSampleSentences(uid), true);

// ---------- Ôn dịch câu ----------
export const countSentencePoolAction = async (tags: string[]) =>
  run((uid) => rv.countSentencePool(uid, z.array(z.string().max(60)).max(50).parse(tags)));
export const startSentenceReviewAction = async (cfg: unknown) =>
  run((uid) => rv.createSentenceSession(uid, sentenceConfigSchema.parse(cfg)));
export const answerSentenceAction = async (sessionId: string, index: number, answer: string) =>
  run((uid) => rv.answerSentence(uid, uuid(sessionId), idx(index), z.string().max(400).parse(answer)));
export const skipSentenceAction = async (sessionId: string, index: number) =>
  run((uid) => rv.skipSentence(uid, uuid(sessionId), idx(index)));
export const overrideSentenceAction = async (sessionId: string, index: number) =>
  run((uid) => rv.overrideSentence(uid, uuid(sessionId), idx(index)));
export const hintSentenceAction = async (sessionId: string, index: number) =>
  run((uid) => rv.hintSentence(uid, uuid(sessionId), idx(index)));
export const rememberSentenceAction = async (sessionId: string, index: number, remembered: boolean) =>
  run((uid) => rv.rememberSentence(uid, uuid(sessionId), idx(index), z.boolean().parse(remembered)));
export const moveSentenceToAction = async (sessionId: string, index: number) =>
  run((uid) => rv.moveSentenceTo(uid, uuid(sessionId), idx(index)));
export const completeSentenceAction = async (sessionId: string) =>
  run((uid) => rv.completeSentenceSession(uid, uuid(sessionId)));
export const abandonSentenceAction = async () => run((uid) => rv.abandonSentenceSession(uid));
