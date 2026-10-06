import { z } from "zod";
import { PRONUNCIATION } from "@/lib/limits";
import { isTopic } from "@/data/pronunciation";
import { PRACTICE_COUNT, PRACTICE_MODES } from "./practice";

const content = z
  .string({ error: "Vui lòng nhập nội dung ghi chú." })
  .trim()
  .max(PRONUNCIATION.MAX_TEXT, `Ghi chú tối đa ${PRONUNCIATION.MAX_TEXT} ký tự.`);
const title = z.string().trim().max(PRONUNCIATION.MAX_TITLE, `Tiêu đề tối đa ${PRONUNCIATION.MAX_TITLE} ký tự.`);

export const topicSchema = z.string().max(64).refine(isTopic, "Mục ghi chú không hợp lệ.");

/**
 * Tạo ghi chú. Có `topic` → ghi chú của mục đó (đã có thì ghi đè; nội dung rỗng = xoá).
 * Không có `topic` → ghi chú tự do, bắt buộc tiêu đề và nội dung.
 */
export const noteInputSchema = z
  .object({ topic: topicSchema.nullish(), title: title.default(""), content })
  .superRefine((v, ctx) => {
    if (v.topic) return;
    if (!v.title) ctx.addIssue({ code: "custom", path: ["title"], message: "Vui lòng nhập tiêu đề ghi chú." });
    if (!v.content) ctx.addIssue({ code: "custom", path: ["content"], message: "Vui lòng nhập nội dung ghi chú." });
  });
export type NoteInput = z.infer<typeof noteInputSchema>;

/** Sửa ghi chú theo id: tiêu đề (chỉ ghi chú tự do) và nội dung. */
export const noteUpdateSchema = z.object({
  title: title.optional(),
  content: content.min(1, "Vui lòng nhập nội dung ghi chú."),
});
export type NoteUpdate = z.infer<typeof noteUpdateSchema>;

export const practiceQuerySchema = z.object({
  mode: z.enum(PRACTICE_MODES, { error: "Chế độ luyện tập không hợp lệ." }),
  count: z.coerce.number().int().min(PRACTICE_COUNT.MIN).max(PRACTICE_COUNT.MAX).catch(PRACTICE_COUNT.DEFAULT),
});

// ---------- Phát âm của tôi ----------

const P = PRONUNCIATION;
const tag = z
  .string()
  .transform((t) => t.trim().replace(/\s+/g, " "))
  .pipe(z.string().min(1, "Tên tag không được để trống.").max(P.MAX_TAG, `Tên tag tối đa ${P.MAX_TAG} ký tự.`));
const uniqTags = (tags: string[]) => {
  const seen = new Set<string>();
  return tags.filter((t) => !seen.has(t.toLowerCase()) && !!seen.add(t.toLowerCase()));
};

/** Một mục trong "Phát âm của tôi". Pinyin bỏ trống → tự điền theo chữ Hán (ở service). */
export const itemInputSchema = z.object({
  hanzi: z
    .string({ error: "Vui lòng nhập chữ Hán / âm tiết." })
    .trim()
    .min(1, "Vui lòng nhập chữ Hán / âm tiết.")
    .max(P.MAX_HANZI, `Tối đa ${P.MAX_HANZI} ký tự.`),
  pinyin: z.string().trim().max(P.MAX_PINYIN, `Pinyin tối đa ${P.MAX_PINYIN} ký tự.`).default(""),
  meaning: z.string().trim().max(P.MAX_MEANING, `Nghĩa tối đa ${P.MAX_MEANING} ký tự.`).default(""),
  note: z.string().trim().max(P.MAX_TEXT, `Ghi chú tối đa ${P.MAX_TEXT} ký tự.`).default(""),
  tags: z.array(tag).max(P.MAX_TAGS, `Tối đa ${P.MAX_TAGS} tag.`).default([]).transform(uniqTags),
});
export type ItemInput = z.infer<typeof itemInputSchema>;

export const itemListSchema = z.object({
  q: z.string().trim().max(60).catch(""),
  tag: z.string().trim().max(P.MAX_TAG).catch(""),
  /** all | library (lưu từ Thư viện) | mine (tự nhập). */
  from: z.enum(["all", "library", "mine"]).catch("all"),
  sort: z.enum(["updated", "newest", "az"]).catch("updated"),
});
export type ItemListParams = z.infer<typeof itemListSchema>;

/** Lưu từ ví dụ của một mục Thư viện ("initial:b", "final:ang", "tone:3", "sandhi:bu"); `hanzi` bỏ trống = mọi ví dụ. */
export const fromLibrarySchema = z.object({
  topic: z.string().regex(/^(initial|final|tone|sandhi):[a-zü0-9-]{1,12}$/, "Mục Thư viện không hợp lệ."),
  hanzi: z
    .string()
    .trim()
    .min(1)
    .max(P.MAX_HANZI)
    .nullish()
    .transform((v) => v ?? null),
});
