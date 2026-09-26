"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthError, currentUserOrThrow } from "@/server/session";
import { log } from "@/server/log";
import { noteInputSchema, noteUpdateSchema } from "./schema";
import * as svc from "./service";

type Fail = { ok: false; message: string; fieldErrors?: Record<string, string> };
export type Result<T> = { ok: true; data: T } | Fail;

function fail(e: unknown): Fail {
  if (e instanceof AuthError || e instanceof svc.PronunciationError) return { ok: false, message: e.message };
  if (e instanceof z.ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const i of e.issues) fieldErrors[String(i.path[0] ?? "form")] ??= i.message;
    return { ok: false, message: e.issues[0]?.message ?? "Vui lòng kiểm tra lại các trường bắt buộc.", fieldErrors };
  }
  log.error({ err: e instanceof Error ? e.message : String(e) }, "pronunciation action failed");
  return { ok: false, message: "Đã có lỗi xảy ra. Vui lòng thử lại." };
}
async function run<T>(fn: (userId: string) => Promise<T>): Promise<Result<T>> {
  try {
    const u = await currentUserOrThrow();
    const data = await fn(u.id);
    revalidatePath("/pronunciation", "layout");
    return { ok: true, data };
  } catch (e) {
    return fail(e);
  }
}
const uuid = (v: unknown) => z.uuid().parse(v);

export const saveNoteAction = async (input: unknown) => run((uid) => svc.saveNote(uid, noteInputSchema.parse(input)));
export const updateNoteAction = async (id: string, input: unknown) =>
  run((uid) => svc.updateNote(uid, uuid(id), noteUpdateSchema.parse(input)));
export const deleteNoteAction = async (id: string) => run((uid) => svc.deleteNote(uid, uuid(id)));
