"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthError, currentUserOrThrow, type SessionUser } from "@/server/session";
import { log } from "@/server/log";
import { G_LIMITS, grammarInputSchema, grammarTagName } from "./schema";
import * as svc from "./service";

type Fail = { ok: false; message: string; fieldErrors?: Record<string, string> };
export type Result<T> = { ok: true; data: T } | Fail;

function fail(e: unknown): Fail {
  if (e instanceof AuthError || e instanceof svc.GrammarError) return { ok: false, message: e.message };
  if (e instanceof z.ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const i of e.issues) fieldErrors[String(i.path[0] ?? "form")] ??= i.message;
    return { ok: false, message: e.issues[0]?.message ?? "Dữ liệu không hợp lệ.", fieldErrors };
  }
  log.error({ err: e instanceof Error ? e.message : String(e) }, "grammar action failed");
  return { ok: false, message: "Đã có lỗi xảy ra. Vui lòng thử lại." };
}
async function run<T>(fn: (u: SessionUser) => Promise<T>): Promise<Result<T>> {
  try {
    const u = await currentUserOrThrow();
    const data = await fn(u);
    revalidatePath("/grammar", "layout");
    return { ok: true, data };
  } catch (e) {
    return fail(e);
  }
}
const uuid = (v: unknown) => z.uuid().parse(v);

export const createGrammarAction = async (input: unknown) =>
  run((u) => svc.createGrammar(u.id, grammarInputSchema.parse(input)));
export const updateGrammarAction = async (id: string, input: unknown) =>
  run((u) => svc.updateGrammar(u.id, uuid(id), grammarInputSchema.parse(input)));
export const savePersonalNoteAction = async (id: string, text: string) =>
  run((u) =>
    svc.savePersonalNote(
      u.id,
      uuid(id),
      z.string().max(G_LIMITS.personalNote, `Tối đa ${G_LIMITS.personalNote} ký tự.`).parse(text),
    ),
  );
export const deleteGrammarAction = async (id: string) => run((u) => svc.deleteGrammar(u.id, uuid(id)));
export const setBookmarkAction = async (id: string, saved: boolean) =>
  run((u) => svc.setBookmark(u.id, uuid(id), !!saved));

export const createTagAction = async (name: string) =>
  run((u) => svc.createGrammarTag(u.id, grammarTagName.parse(name)));
export const renameTagAction = async (id: string, name: string) =>
  run((u) => svc.renameGrammarTag(u.id, uuid(id), grammarTagName.parse(name)));
export const deleteTagAction = async (id: string) => run((u) => svc.deleteGrammarTag(u.id, uuid(id)));

export const shareGrammarAction = async (id: string, emails: string[]) =>
  run(async (u) => {
    const r = await svc.shareGrammar(u, uuid(id), z.array(z.string().max(254)).max(50).parse(emails));
    return { ...r, sentList: await svc.listSent(u.id, uuid(id)) };
  });
export const sourceTagsAction = async (shareId: string) => run((u) => svc.shareSourceTags(u.id, uuid(shareId)));
export const acceptShareAction = async (shareId: string, opts: { keepTags: boolean; extraTags: string[] }) =>
  run((u) =>
    svc.acceptShare(u, uuid(shareId), {
      keepTags: !!opts.keepTags,
      extraTags: z
        .array(grammarTagName)
        .max(20)
        .parse(opts.extraTags ?? []),
    }),
  );
export const rejectShareAction = async (shareId: string) => run((u) => svc.rejectShare(u, uuid(shareId)));
export const importSampleGrammarAction = async () => run((u) => svc.importSampleGrammar(u.id));
export const listSentAction = async (id: string) => run((u) => svc.listSent(u.id, uuid(id)));
