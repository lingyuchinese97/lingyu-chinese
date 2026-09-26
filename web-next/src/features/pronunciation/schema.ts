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
