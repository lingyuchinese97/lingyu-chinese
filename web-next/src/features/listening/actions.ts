"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthError, currentUserOrThrow } from "@/server/session";
import { log } from "@/server/log";
import { exerciseInputSchema } from "./schema";
import * as svc from "./service";

type Fail = { ok: false; message: string; fieldErrors?: Record<string, string> };
export type Result<T> = { ok: true; data: T } | Fail;

function fail(e: unknown): Fail {
  if (e instanceof AuthError || e instanceof svc.ListeningError) return { ok: false, message: e.message };
  if (e instanceof z.ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const i of e.issues) fieldErrors[String(i.path[0] ?? "form")] ??= i.message;
    return { ok: false, message: "Vui lòng kiểm tra lại các trường bắt buộc.", fieldErrors };
  }
  log.error({ err: e instanceof Error ? e.message : String(e) }, "listening action failed");
  return { ok: false, message: "Đã có lỗi xảy ra. Vui lòng thử lại." };
}
async function run<T>(fn: (userId: string) => Promise<T>, revalidate = false): Promise<Result<T>> {
  try {
    const u = await currentUserOrThrow();
    const data = await fn(u.id);
    if (revalidate) revalidatePath("/listening", "layout");
    return { ok: true, data };
  } catch (e) {
    return fail(e);
  }
}
const uuid = (v: unknown) => z.uuid().parse(v);

export const createExerciseAction = async (input: unknown) =>
  run((uid) => svc.createExercise(uid, exerciseInputSchema.parse(input)), true);
export const updateExerciseAction = async (id: string, input: unknown) =>
  run(async (uid) => {
    await svc.updateExercise(uid, uuid(id), exerciseInputSchema.parse(input));
    return svc.getExercise(uid, uuid(id));
  }, true);
export const deleteExerciseAction = async (id: string) => run((uid) => svc.deleteExercise(uid, uuid(id)), true);
export const getExerciseAction = async (id: string) => run((uid) => svc.getExercise(uid, uuid(id)));
export const listListeningTagsAction = async () => run((uid) => svc.listListeningTags(uid));
