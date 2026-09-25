"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthError, currentUserOrThrow } from "@/server/session";
import { log } from "@/server/log";
import { IMAGE } from "@/lib/limits";
import { imageSize, sniffImage } from "@/lib/image-sniff";
import { idsSchema, STATUS, tagNameSchema, vocabInputSchema } from "./schema";
import * as svc from "./service";
import * as share from "./share-service";

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function fail(e: unknown): { ok: false; message: string; fieldErrors?: Record<string, string> } {
  if (e instanceof AuthError) return { ok: false, message: e.message };
  if (e instanceof svc.VocabError) return { ok: false, message: e.message };
  if (e instanceof z.ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const i of e.issues) {
      const k = String(i.path[0] ?? "form");
      fieldErrors[k] ??= i.message;
    }
    return { ok: false, message: "Vui lòng kiểm tra lại các trường bắt buộc.", fieldErrors };
  }
  log.error({ err: e instanceof Error ? e.message : String(e) }, "vocab action failed");
  return { ok: false, message: "Đã có lỗi xảy ra. Vui lòng thử lại." };
}

/** Đọc ảnh từ FormData, kiểm tra magic bytes + kích thước. Không có file → undefined. */
async function readImage(form: FormData): Promise<svc.NewImage | null | undefined> {
  if (form.get("removeImage") === "1") return null;
  const f = form.get("image");
  if (!(f instanceof File) || f.size === 0) return undefined;
  if (f.size > IMAGE.MAX_BYTES)
    throw new svc.VocabError("validation", "Ảnh vượt quá 1MB sau khi nén. Hãy chọn ảnh khác.");
  const bytes = Buffer.from(await f.arrayBuffer());
  const mime = sniffImage(bytes);
  if (!mime) throw new svc.VocabError("validation", "Chỉ hỗ trợ ảnh WebP, JPG hoặc PNG.");
  const size = imageSize(bytes, mime);
  if (!size || size.width > 4096 || size.height > 4096)
    throw new svc.VocabError("validation", "Không đọc được kích thước ảnh. Hãy chọn ảnh khác.");
  return { bytes, mime, ...size };
}

function parseInput(form: FormData) {
  const raw = form.get("data");
  let json: unknown = {};
  try {
    json = JSON.parse(typeof raw === "string" ? raw : "{}");
  } catch {
    /* để Zod báo lỗi */
  }
  return vocabInputSchema.parse(json);
}

export async function createVocabAction(form: FormData): Promise<ActionResult<{ id: string; hanzi: string }>> {
  try {
    const u = await currentUserOrThrow();
    const input = parseInput(form);
    const img = await readImage(form);
    const id = await svc.createVocab(u.id, input, img ?? null);
    revalidatePath("/vocabulary");
    return { ok: true, data: { id, hanzi: input.hanzi } };
  } catch (e) {
    return fail(e);
  }
}

export async function updateVocabAction(id: string, form: FormData): Promise<ActionResult<{ hanzi: string }>> {
  try {
    const u = await currentUserOrThrow();
    const vid = z.uuid().parse(id);
    const input = parseInput(form);
    const img = await readImage(form);
    await svc.updateVocab(u.id, vid, input, img);
    revalidatePath("/vocabulary");
    return { ok: true, data: { hanzi: input.hanzi } };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteVocabAction(ids: string[]): Promise<ActionResult<{ removed: number }>> {
  try {
    const u = await currentUserOrThrow();
    const removed = await svc.deleteVocab(u.id, idsSchema.parse(ids));
    revalidatePath("/vocabulary");
    return { ok: true, data: { removed } };
  } catch (e) {
    return fail(e);
  }
}

export async function toggleFavoriteAction(id: string): Promise<ActionResult<{ isFavorite: boolean }>> {
  try {
    const u = await currentUserOrThrow();
    const r = await svc.toggleFavorite(u.id, z.uuid().parse(id));
    return { ok: true, data: { isFavorite: r.isFavorite } };
  } catch (e) {
    return fail(e);
  }
}

export async function setStatusAction(ids: string[], status: string): Promise<ActionResult<{ updated: number }>> {
  try {
    const u = await currentUserOrThrow();
    const updated = await svc.setStatus(u.id, idsSchema.parse(ids), z.enum(STATUS).parse(status));
    revalidatePath("/vocabulary");
    return { ok: true, data: { updated } };
  } catch (e) {
    return fail(e);
  }
}

export async function addTagsAction(ids: string[], tags: string[]): Promise<ActionResult<{ updated: number }>> {
  try {
    const u = await currentUserOrThrow();
    const updated = await svc.addTags(u.id, idsSchema.parse(ids), z.array(tagNameSchema).max(20).parse(tags));
    revalidatePath("/vocabulary");
    return { ok: true, data: { updated } };
  } catch (e) {
    return fail(e);
  }
}

export async function importSampleAction(): Promise<ActionResult<{ added: number }>> {
  try {
    const u = await currentUserOrThrow();
    const added = await svc.importSample(u.id);
    revalidatePath("/vocabulary");
    return { ok: true, data: { added } };
  } catch (e) {
    return fail(e);
  }
}

// ---------- Chia sẻ ----------

const emailsSchema = z.array(z.string().max(254)).max(50);

export async function shareVocabAction(
  ids: string[],
  emails: string[],
): Promise<
  ActionResult<{ results: share.ShareResultRow[]; sent: number; count: number; sentList: share.SentVocabShare[] }>
> {
  try {
    const u = await currentUserOrThrow();
    const r = await share.shareVocab(u, idsSchema.parse(ids), emailsSchema.parse(emails));
    return { ok: true, data: { ...r, sentList: await share.listSentVocab(u.id) } };
  } catch (e) {
    return fail(e);
  }
}

export async function listSentVocabAction(): Promise<ActionResult<share.SentVocabShare[]>> {
  try {
    const u = await currentUserOrThrow();
    return { ok: true, data: await share.listSentVocab(u.id) };
  } catch (e) {
    return fail(e);
  }
}

export async function receivedVocabAction(): Promise<ActionResult<share.ReceivedVocabShare[]>> {
  try {
    const u = await currentUserOrThrow();
    return { ok: true, data: await share.listReceivedVocab(u.id) };
  } catch (e) {
    return fail(e);
  }
}

export async function acceptVocabShareAction(
  shareId: string,
  opts: { keepTags: boolean; extraTags: string[] },
): Promise<ActionResult<{ added: number; skipped: string[]; total: number }>> {
  try {
    const u = await currentUserOrThrow();
    const r = await share.acceptVocabShare(u, z.uuid().parse(shareId), {
      keepTags: !!opts.keepTags,
      extraTags: z
        .array(tagNameSchema)
        .max(20)
        .parse(opts.extraTags ?? []),
    });
    revalidatePath("/vocabulary");
    return { ok: true, data: r };
  } catch (e) {
    return fail(e);
  }
}

export async function rejectVocabShareAction(shareId: string): Promise<ActionResult> {
  try {
    const u = await currentUserOrThrow();
    await share.rejectVocabShare(u, z.uuid().parse(shareId));
    revalidatePath("/vocabulary");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
