"use server";
import { z } from "zod";
import { AuthError, currentUserOrThrow } from "@/server/session";
import { log } from "@/server/log";
import { answerSchema, customConfigSchema, dueConfigSchema } from "./schema";
import * as svc from "./service";

type Fail = { ok: false; message: string };
export type Result<T> = { ok: true; data: T } | Fail;

function fail(e: unknown): Fail {
  if (e instanceof AuthError || e instanceof svc.ReviewError) return { ok: false, message: e.message };
  if (e instanceof z.ZodError) return { ok: false, message: "Dữ liệu không hợp lệ." };
  log.error({ err: e instanceof Error ? e.message : String(e) }, "review action failed");
  return { ok: false, message: "Đã có lỗi xảy ra. Vui lòng thử lại." };
}
async function run<T>(fn: (userId: string) => Promise<T>): Promise<Result<T>> {
  try {
    const u = await currentUserOrThrow();
    return { ok: true, data: await fn(u.id) };
  } catch (e) {
    return fail(e);
  }
}

export const countPoolAction = async (tags: string[]) =>
  run((uid) => svc.countPool(uid, z.array(z.string().max(24)).max(50).parse(tags)));

export const startCustomAction = async (cfg: unknown) =>
  run((uid) => svc.createCustomSession(uid, customConfigSchema.parse(cfg)));

export const startDueAction = async (cfg: unknown) =>
  run((uid) => svc.createDueSession(uid, dueConfigSchema.parse(cfg)));

export const checkAnswerAction = async (input: unknown) =>
  run((uid) => {
    const { sessionId, index, answer } = answerSchema.parse(input);
    return svc.checkAnswer(uid, sessionId, index, answer);
  });

export const rateAnswerAction = async (sessionId: string, index: number, rating: number) =>
  run((uid) =>
    svc.rateAnswer(
      uid,
      z.uuid().parse(sessionId),
      z.number().int().min(0).parse(index),
      z.union([z.literal(2), z.literal(3), z.literal(4)]).parse(rating),
    ),
  );

export const moveToAction = async (sessionId: string, index: number) =>
  run((uid) => svc.moveTo(uid, z.uuid().parse(sessionId), z.number().int().min(0).parse(index)));

export const completeAction = async (sessionId: string) =>
  run((uid) => svc.completeSession(uid, z.uuid().parse(sessionId)));

export const abandonAction = async () => run((uid) => svc.abandonSession(uid));
