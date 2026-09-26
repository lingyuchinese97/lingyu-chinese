import { z } from "zod";
import { LISTENING } from "@/lib/limits";
import { parseMediaUrl } from "@/lib/media-url";

const clean = (s: string) => s.trim().replace(/\s+/g, " ");

export const listeningTagName = z
  .string()
  .transform(clean)
  .pipe(
    z
      .string()
      .min(1, "Tên tag không được để trống.")
      .max(LISTENING.MAX_TAG, `Tên tag tối đa ${LISTENING.MAX_TAG} ký tự.`),
  );

/** Bỏ trùng tag (không phân biệt hoa/thường), giữ thứ tự. */
export function cleanListeningTags(tags: string[]) {
  const seen = new Map<string, string>();
  for (const t of tags.map(clean)) if (t && !seen.has(t.toLowerCase())) seen.set(t.toLowerCase(), t);
  return [...seen.values()];
}

const text = (max: number, message: string) => z.string().max(max, message);

export const formattedSpanSchema = z.object({
  text: z.string().max(LISTENING.MAX_TEXT),
  color: z.enum(["black", "red"]).optional(),
  highlight: z.boolean().optional(),
});

export const referenceSchema = z.object({
  referenceAnswer: z
    .string({ error: "Vui lòng nhập đáp án tham khảo." })
    .trim()
    .min(1, "Vui lòng nhập đáp án tham khảo.")
    .max(LISTENING.MAX_TEXT, `Đáp án tối đa ${LISTENING.MAX_TEXT} ký tự.`),
  referencePinyin: z.string().trim().max(LISTENING.MAX_TEXT, `Pinyin tối đa ${LISTENING.MAX_TEXT} ký tự.`).default(""),
});

export const exerciseInputSchema = referenceSchema
  .extend({
    title: z
      .string({ error: "Vui lòng nhập tiêu đề bài làm." })
      .transform(clean)
      .pipe(
        z
          .string()
          .min(1, "Vui lòng nhập tiêu đề bài làm.")
          .max(LISTENING.MAX_TITLE, `Tiêu đề tối đa ${LISTENING.MAX_TITLE} ký tự.`),
      ),
    tags: z
      .array(listeningTagName)
      .default([])
      .transform(cleanListeningTags)
      .pipe(z.array(z.string()).max(LISTENING.MAX_TAGS, `Tối đa ${LISTENING.MAX_TAGS} thẻ cho một bài.`)),
    contentUrl: z
      .string()
      .trim()
      .max(LISTENING.MAX_URL, "Link quá dài.")
      .default("")
      .refine(
        (u) => !u || parseMediaUrl(u) !== null,
        "Link này chưa được hỗ trợ. Hãy dán link YouTube hoặc link file âm thanh / video.",
      ),
    segmentStart: z.number().min(0).max(86400).nullable().default(null),
    segmentEnd: z.number().min(0).max(86400).nullable().default(null),
    playbackSpeed: z
      .number()
      .refine((v) => (LISTENING.SPEEDS as readonly number[]).includes(v), "Tốc độ nghe không hợp lệ.")
      .default(1),
    userAnswer: text(LISTENING.MAX_TEXT, `Bài chép tối đa ${LISTENING.MAX_TEXT} ký tự.`).default(""),
    formattedUserAnswer: z.array(formattedSpanSchema).max(LISTENING.MAX_SPANS).default([]),
    notes: z.string().trim().max(LISTENING.MAX_TEXT, `Ghi chú tối đa ${LISTENING.MAX_TEXT} ký tự.`).default(""),
  })
  .refine((v) => v.segmentStart === null || v.segmentEnd === null || v.segmentEnd > v.segmentStart, {
    message: "Thời điểm kết thúc phải sau thời điểm bắt đầu.",
    path: ["segmentEnd"],
  });
export type ExerciseInput = z.infer<typeof exerciseInputSchema>;
export type ExerciseFormValues = z.input<typeof exerciseInputSchema>;

export const exerciseListSchema = z.object({
  q: z.string().max(100).catch(""),
  tag: z.string().max(60).catch(""),
  sort: z.enum(["newest", "oldest"]).catch("newest"),
  page: z.coerce.number().int().min(1).max(100000).catch(1),
});
export type ExerciseListParams = z.infer<typeof exerciseListSchema>;

/** So sánh không cần lưu (API cho app khác; màn web tự so sánh ngay trên trình duyệt bằng cùng một hàm). */
export const compareInputSchema = z.object({
  referenceAnswer: z.string().max(LISTENING.MAX_TEXT, `Đáp án tối đa ${LISTENING.MAX_TEXT} ký tự.`),
  userAnswer: z.string().max(LISTENING.MAX_TEXT, `Bài chép tối đa ${LISTENING.MAX_TEXT} ký tự.`),
});
