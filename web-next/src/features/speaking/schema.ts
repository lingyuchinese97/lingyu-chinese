/** Luyện giao tiếp — kiểm tra dữ liệu vào (dùng chung cho Server Action và REST API). */
import { z } from "zod";
import { SPEAKING as S } from "@/lib/limits";

const tag = z
  .string()
  .transform((t) => t.trim().replace(/\s+/g, " "))
  .pipe(z.string().min(1, "Tên tag không được để trống.").max(S.MAX_TAG, `Tên tag tối đa ${S.MAX_TAG} ký tự.`));
const uniqTags = (tags: string[]) => {
  const seen = new Set<string>();
  return tags.filter((t) => !seen.has(t.toLowerCase()) && !!seen.add(t.toLowerCase()));
};
const hsk = z.coerce.number().int().min(1).max(6).nullable().default(null);

/** Một câu hỏi. Pinyin / nghĩa bỏ trống → tự sinh (ở service). */
export const questionInputSchema = z.object({
  zh: z
    .string({ error: "Vui lòng nhập câu hỏi tiếng Trung." })
    .trim()
    .min(1, "Vui lòng nhập câu hỏi tiếng Trung.")
    .max(S.MAX_ZH, `Câu hỏi tối đa ${S.MAX_ZH} ký tự.`)
    .refine((s) => /\p{Script=Han}/u.test(s), "Câu hỏi cần có chữ Hán."),
  pinyin: z.string().trim().max(S.MAX_PINYIN, `Pinyin tối đa ${S.MAX_PINYIN} ký tự.`).default(""),
  meaning: z.string().trim().max(S.MAX_MEANING, `Nghĩa tối đa ${S.MAX_MEANING} ký tự.`).default(""),
  hsk,
  tags: z.array(tag).max(S.MAX_TAGS, `Tối đa ${S.MAX_TAGS} tag.`).default([]).transform(uniqTags),
});
export type QuestionInput = z.infer<typeof questionInputSchema>;

/** Tạo nhiều câu một lần. */
export const questionBatchSchema = z.object({
  questions: z
    .array(questionInputSchema)
    .min(1, "Vui lòng nhập ít nhất một câu hỏi.")
    .max(S.MAX_BATCH, `Tối đa ${S.MAX_BATCH} câu hỏi mỗi lần.`),
});

export const PAGE_SIZES = [10, 20, 50] as const;
export const questionListSchema = z.object({
  q: z.string().trim().max(60).catch(""),
  /** Tag (không phân biệt hoa thường). */
  tag: z.string().trim().max(S.MAX_TAG).catch(""),
  hsk: z.coerce.number().int().min(1).max(6).optional().catch(undefined),
  starred: z
    .enum(["1", "true"])
    .transform(() => true)
    .optional()
    .catch(undefined),
  sort: z.enum(["newest", "oldest", "az"]).catch("newest"),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
  size: z.coerce
    .number()
    .int()
    .refine((n) => (PAGE_SIZES as readonly number[]).includes(n))
    .catch(10),
});
export type QuestionListParams = z.infer<typeof questionListSchema>;

/** Câu trả lời (gõ hoặc từ ghi âm → chữ). */
export const answerSchema = z.object({
  answer: z.string().trim().max(S.MAX_ANSWER, `Câu trả lời tối đa ${S.MAX_ANSWER} ký tự.`),
});

/** Sinh pinyin + nghĩa cho một câu (xem trước khi lưu). */
export const assistSchema = z.object({
  text: z.string().trim().min(1, "Vui lòng nhập câu tiếng Trung.").max(S.MAX_ZH, `Tối đa ${S.MAX_ZH} ký tự.`),
});

export const starSchema = z.object({ starred: z.boolean() });
