"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthError, currentUserOrThrow } from "@/server/session";
import { getLocale } from "@/i18n/server";
import { log } from "@/server/log";
import { elapsedSchema, translationConfigSchema } from "./schema";
import * as svc from "./service";

type Fail = { ok: false; message: string; fieldErrors?: Record<string, string> };
export type Result<T> = { ok: true; data: T } | Fail;

function fail(e: unknown): Fail {
  if (e instanceof AuthError || e instanceof svc.TranslationError) return { ok: false, message: e.message };
  if (e instanceof z.ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const i of e.issues) fieldErrors[String(i.path[0] ?? "form")] ??= i.message;
    return { ok: false, message: e.issues[0]?.message ?? "Vui lòng kiểm tra lại các trường bắt buộc.", fieldErrors };
  }
  log.error({ err: e instanceof Error ? e.message : String(e) }, "translation action failed");
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
const uuid = (v: unknown) => z.uuid().parse(v);
const idx = (v: unknown) => z.number().int().min(0).max(49).parse(v);
const el = (v: unknown) => (v === undefined ? undefined : elapsedSchema.parse(v));

export const startTranslationAction = async (input: unknown) =>
  run(async (uid) =>
    svc.createTranslationSession(uid, { ...translationConfigSchema.parse(input), lang: await getLocale() }),
  );
export const answerTranslationAction = async (id: unknown, index: unknown, answer: unknown, elapsed?: unknown) =>
  run((uid) => svc.answerTranslation(uid, uuid(id), idx(index), z.string().max(1000).parse(answer), el(elapsed)));
export const skipTranslationAction = async (id: unknown, index: unknown, elapsed?: unknown) =>
  run((uid) => svc.skipTranslation(uid, uuid(id), idx(index), el(elapsed)));
export const hintTranslationAction = async (id: unknown, index: unknown) =>
  run((uid) => svc.hintTranslation(uid, uuid(id), idx(index)));
export const overrideTranslationAction = async (id: unknown, index: unknown) =>
  run((uid) => svc.overrideTranslation(uid, uuid(id), idx(index)));
export const moveTranslationAction = async (id: unknown, index: unknown) =>
  run((uid) => svc.moveTranslation(uid, uuid(id), idx(index)));
export const saveTranslationTimeAction = async (id: unknown, elapsed: unknown) =>
  run((uid) => svc.saveTranslationTime(uid, uuid(id), elapsedSchema.parse(elapsed)));
export const completeTranslationAction = async (id: unknown, elapsed?: unknown) =>
  run(async (uid) => {
    const s = await svc.completeTranslation(uid, uuid(id), el(elapsed));
    revalidatePath("/translate");
    return s.id;
  });
export const saveItemToBankAction = async (itemId: unknown) =>
  run(async (uid) => {
    const r = await svc.saveItemToBank(uid, z.string().max(40).parse(itemId), await getLocale());
    revalidatePath("/sentences", "layout");
    return r;
  });
