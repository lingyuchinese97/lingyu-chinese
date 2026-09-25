import { z } from "zod";
import { SENTENCE } from "@/lib/limits";

const clean = (s: string) => s.trim().replace(/\s+/g, " ");

export const sentenceTagName = z
  .string()
  .transform(clean)
  .pipe(
    z
      .string()
      .min(1, "Tên tag không được để trống.")
      .max(SENTENCE.MAX_TAG, `Tên tag tối đa ${SENTENCE.MAX_TAG} ký tự.`),
  );

/** Bỏ trùng tag (không phân biệt hoa/thường). */
export function cleanSentenceTags(tags: string[]) {
  const seen = new Map<string, string>();
  for (const t of tags.map(clean)) if (t && !seen.has(t.toLowerCase())) seen.set(t.toLowerCase(), t);
  return [...seen.values()];
}

export const sentenceInputSchema = z.object({
  chinese: z
    .string({ error: "Vui lòng nhập câu tiếng Trung." })
    .transform(clean)
    .pipe(
      z
        .string()
        .min(1, "Vui lòng nhập câu tiếng Trung.")
        .max(SENTENCE.MAX_CHINESE, `Câu tiếng Trung tối đa ${SENTENCE.MAX_CHINESE} ký tự.`)
        .refine((s) => /\p{Script=Han}/u.test(s), "Câu tiếng Trung cần có ít nhất một chữ Hán."),
    ),
  pinyin: z
    .string()
    .transform(clean)
    .pipe(z.string().max(SENTENCE.MAX_PINYIN, `Pinyin tối đa ${SENTENCE.MAX_PINYIN} ký tự.`))
    .default(""),
  vietnamese: z
    .string({ error: "Vui lòng nhập câu tiếng Việt." })
    .transform(clean)
    .pipe(
      z
        .string()
        .min(1, "Vui lòng nhập câu tiếng Việt.")
        .max(SENTENCE.MAX_VIETNAMESE, `Câu tiếng Việt tối đa ${SENTENCE.MAX_VIETNAMESE} ký tự.`),
    ),
  note: z.string().trim().max(SENTENCE.MAX_NOTE, `Ghi chú tối đa ${SENTENCE.MAX_NOTE} ký tự.`).default(""),
  tags: z
    .array(sentenceTagName)
    .default([])
    .transform(cleanSentenceTags)
    .pipe(z.array(z.string()).max(SENTENCE.MAX_TAGS, `Tối đa ${SENTENCE.MAX_TAGS} tag cho một câu.`)),
});
export type SentenceInput = z.infer<typeof sentenceInputSchema>;
export type SentenceFormValues = z.input<typeof sentenceInputSchema>;

export const sentenceListSchema = z.object({
  q: z.string().max(100).catch(""),
  /** tên tag, hoặc "__fav" = Yêu thích */
  tag: z.string().max(60).catch(""),
  page: z.coerce.number().int().min(1).max(100000).catch(1),
});
export type SentenceListParams = z.infer<typeof sentenceListSchema>;
export const FAV_TAG = "__fav";

export const DIRECTIONS = [
  { value: "vi-zh", label: "Việt → Trung", short: "VI → 中" },
  { value: "zh-vi", label: "Trung → Việt", short: "中 → VI" },
  { value: "mixed", label: "Trộn ngẫu nhiên", short: "Trộn" },
] as const;
export type DirectionMode = (typeof DIRECTIONS)[number]["value"];
export const SENTENCE_COUNTS = [5, 10, 20, 50] as const;

export const sentenceConfigSchema = z.object({
  direction: z.enum(["vi-zh", "zh-vi", "mixed"]),
  count: z.number().int().min(1).max(200),
  tags: z.array(z.string().trim().min(1).max(60)).max(50).default([]),
  showPinyin: z.boolean().default(false),
  showHint: z.boolean().default(false),
  sentenceIds: z.array(z.uuid()).min(1).max(500).optional(),
  label: z.string().max(60).optional(),
});
export type SentenceConfig = z.infer<typeof sentenceConfigSchema>;
