"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthError, currentUserOrThrow } from "@/server/session";
import { getLocale } from "@/i18n/server";
import { log } from "@/server/log";
import { pickSchema, saveWordsSchema, submitSchema } from "./schema";
import * as svc from "./service";

type Fail = { ok: false; message: string };
export type Result<T> = { ok: true; data: T } | Fail;

async function run<T>(fn: (userId: string) => Promise<T>): Promise<Result<T>> {
  try {
    const u = await currentUserOrThrow();
    return { ok: true, data: await fn(u.id) };
  } catch (e) {
    if (e instanceof AuthError || e instanceof svc.ReadingError) return { ok: false, message: e.message };
    if (e instanceof z.ZodError) return { ok: false, message: e.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
    log.error({ err: e instanceof Error ? e.message : String(e) }, "reading action failed");
    return { ok: false, message: "Đã có lỗi xảy ra. Vui lòng thử lại." };
  }
}
const pid = (v: unknown) => z.string().max(20).parse(v);

export const pickPassageAction = async (input: unknown) => run((uid) => svc.pickPassage(uid, pickSchema.parse(input)));
export const submitReadingAction = async (id: unknown, input: unknown) =>
  run(async (uid) => {
    const i = submitSchema.parse(input);
    const r = await svc.submitReading(uid, pid(id), i.answers, i.durationSec, await getLocale());
    revalidatePath("/reading");
    return r;
  });
export const setSavedAction = async (id: unknown, saved: unknown) =>
  run(async (uid) => {
    const r = await svc.setSaved(uid, pid(id), z.boolean().parse(saved));
    revalidatePath("/reading");
    return r;
  });
export const saveWordsAction = async (id: unknown, words?: unknown) =>
  run(async (uid) => {
    const r = await svc.saveWords(uid, pid(id), saveWordsSchema.parse({ words }).words);
    revalidatePath("/vocabulary", "layout");
    return r;
  });
