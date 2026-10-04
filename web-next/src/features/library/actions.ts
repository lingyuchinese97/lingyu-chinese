"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminOrThrow, AuthError, currentUserOrThrow } from "@/server/session";
import { log } from "@/server/log";
import {
  analyzeSchema,
  libWordInputSchema,
  setIdSchema,
  setWordSchema,
  suggestSchema,
  suggestedImageSchema,
} from "./schema";
import * as sets from "./sets";
import { getLocale } from "@/i18n/server";
import { suggestImages, type ImageSuggestion } from "./image-suggest";
import { analyzeWord, findCandidates, type Analysis, type Candidate } from "./analyze";
import * as svc from "./service";

type Fail = { ok: false; message: string; fieldErrors?: Record<string, string> };
export type ActionResult<T = undefined> = ({ ok: true } & (T extends undefined ? object : { data: T })) | Fail;

function fail(e: unknown): Fail {
  if (e instanceof AuthError || e instanceof svc.LibraryError) return { ok: false, message: e.message };
  if (e instanceof z.ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const i of e.issues) fieldErrors[String(i.path[0] ?? "form")] ??= i.message;
    return { ok: false, message: e.issues[0]?.message ?? "Vui lòng kiểm tra lại các trường bắt buộc.", fieldErrors };
  }
  log.error({ err: e instanceof Error ? e.message : String(e) }, "library action failed");
  return { ok: false, message: "Đã có lỗi xảy ra. Vui lòng thử lại." };
}
const refresh = () => {
  revalidatePath("/admin/library");
  revalidatePath("/library/words");
};

export async function analyzeAction(
  input: string,
): Promise<ActionResult<{ analysis: Analysis | null; candidates: Candidate[] }>> {
  try {
    await adminOrThrow();
    const v = analyzeSchema.parse({ input }).input;
    const hasHan = /\p{Script=Han}/u.test(v);
    return {
      ok: true,
      data: hasHan ? { analysis: analyzeWord(v), candidates: [] } : { analysis: null, candidates: findCandidates(v) },
    };
  } catch (e) {
    return fail(e);
  }
}

export async function saveWordAction(
  id: string | null,
  word: unknown,
  publish: boolean,
): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await adminOrThrow();
    const input = libWordInputSchema.parse(word);
    let wid: string;
    if (id) {
      wid = z.uuid().parse(id);
      await svc.updateWord(wid, input, publish);
    } else wid = await svc.createWord(admin.id, input, publish);
    refresh();
    return { ok: true, data: { id: wid } };
  } catch (e) {
    return fail(e);
  }
}

export async function setWordStatusAction(id: string, isPublic: boolean): Promise<ActionResult<{ status: string }>> {
  try {
    await adminOrThrow();
    const r = await svc.setWordStatus(z.uuid().parse(id), isPublic);
    refresh();
    return { ok: true, data: r };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteWordAction(id: string): Promise<ActionResult> {
  try {
    await adminOrThrow();
    await svc.deleteWord(z.uuid().parse(id));
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** FormData: "image" (đã nén ở trình duyệt) hoặc "remove"="1". */
export async function setWordImageAction(id: string, form: FormData): Promise<ActionResult<{ hasImage: boolean }>> {
  try {
    await adminOrThrow();
    const wid = z.uuid().parse(id);
    const f = form.get("image");
    const img =
      form.get("remove") === "1" || !(f instanceof Blob) ? null : svc.parseLibImage(Buffer.from(await f.arrayBuffer()));
    const r = await svc.setWordImage(wid, img);
    refresh();
    return { ok: true, data: r };
  } catch (e) {
    return fail(e);
  }
}

export async function saveLibraryWordToMineAction(id: string): Promise<ActionResult<{ added: boolean }>> {
  try {
    const u = await currentUserOrThrow();
    const r = await svc.saveToMyVocab(u.id, z.uuid().parse(id));
    revalidatePath("/vocabulary");
    revalidatePath("/library/words");
    return { ok: true, data: { added: r.added } };
  } catch (e) {
    return fail(e);
  }
}

/** Gợi ý từ khi admin đang gõ (chữ Hán: từ bắt đầu bằng phần đã gõ; pinyin / tiếng Việt: từ khớp). */
export async function suggestWordsAction(q: string): Promise<ActionResult<{ candidates: Candidate[] }>> {
  try {
    await adminOrThrow();
    return { ok: true, data: { candidates: findCandidates(suggestSchema.parse({ q }).q, 8) } };
  } catch (e) {
    return fail(e);
  }
}

export async function suggestImagesAction(q: string): Promise<ActionResult<{ items: ImageSuggestion[] }>> {
  try {
    await adminOrThrow();
    return { ok: true, data: { items: await suggestImages(suggestSchema.parse({ q }).q) } };
  } catch (e) {
    return fail(e);
  }
}

/** Đặt ảnh minh hoạ từ ảnh gợi ý (máy chủ tự tải từ Wikimedia, kiểm tra như ảnh tải lên, lưu ghi công). */
export async function setSuggestedImageAction(
  id: string,
  title: string,
): Promise<ActionResult<{ hasImage: boolean; credit: string }>> {
  try {
    await adminOrThrow();
    const wid = z.uuid().parse(id);
    const r = await svc.setSuggestedImage(wid, suggestedImageSchema.parse({ title }).title);
    refresh();
    return { ok: true, data: r };
  } catch (e) {
    return fail(e);
  }
}

// ---------- Bộ từ vựng ----------

const setArgs = (id: string, zh?: string | null) => ({
  id: setIdSchema.parse(id),
  zh: zh == null ? null : setWordSchema.parse(zh),
});
const refreshSets = (id: string) => {
  revalidatePath("/library");
  revalidatePath(`/library/vocabulary/${id}`, "layout");
};

export async function setWordLearnedAction(
  id: string,
  zh: string,
  on: boolean,
): Promise<ActionResult<{ learned: boolean; progress: { learned: number; total: number } }>> {
  try {
    const u = await currentUserOrThrow();
    const a = setArgs(id, zh);
    const r = await sets.setWordLearned(u.id, a.id, a.zh!, on);
    refreshSets(a.id);
    return { ok: true, data: r };
  } catch (e) {
    return fail(e);
  }
}

export async function setFavoriteAction(
  id: string,
  zh: string | null,
  on: boolean,
): Promise<ActionResult<{ favorite: boolean }>> {
  try {
    const u = await currentUserOrThrow();
    const a = setArgs(id, zh);
    const r = await sets.setFavorite(u.id, a.id, a.zh, on);
    refreshSets(a.id);
    return { ok: true, data: r };
  } catch (e) {
    return fail(e);
  }
}

export async function saveSetAction(
  id: string,
  zh: string | null,
): Promise<ActionResult<{ added: number; skipped: number }>> {
  try {
    const u = await currentUserOrThrow();
    const a = setArgs(id, zh);
    const r = await sets.saveSetToMyVocab(u.id, a.id, a.zh, await getLocale());
    revalidatePath("/vocabulary");
    refreshSets(a.id);
    return { ok: true, data: r };
  } catch (e) {
    return fail(e);
  }
}

export async function setHskLearnedAction(
  level: number,
  zh: string,
  on: boolean,
): Promise<ActionResult<{ learned: boolean }>> {
  try {
    const u = await currentUserOrThrow();
    const r = await sets.setHskLearned(u.id, z.number().int().parse(level), setWordSchema.parse(zh), on);
    revalidatePath("/library/vocabulary/hsk");
    return { ok: true, data: r };
  } catch (e) {
    return fail(e);
  }
}
