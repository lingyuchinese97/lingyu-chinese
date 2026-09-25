/**
 * Schema nội dung bài học: bài → phần (section) → câu hỏi.
 * Thêm bài mới = thêm thư mục `data/lessons/<lessonId>/` (+ audio ở `public/audio/<lessonId>/`) và đăng ký trong `index.ts`.
 */
import { z } from "zod";

const id = z.string().regex(/^[a-z0-9-]+$/, "id chỉ gồm a-z, 0-9, dấu gạch ngang");
/** Đường dẫn audio tính từ `public/`, phải nằm trong `/audio/<lessonId>/`. */
const audio = z.string().regex(/^\/audio\/[a-z0-9-]+\/[a-z0-9/_-]+\.mp3$/, "audio phải là /audio/<lessonId>/....mp3");

const base = {
  id,
  /** Audio của câu; không có → nút nghe bị vô hiệu kèm ghi chú. */
  audio: audio.optional(),
  /** Đúng 4 đáp án A–D. */
  options: z.array(z.string().min(1)).length(4),
  answer: z.number().int().min(0).max(3),
  explanation: z.string().optional(),
};

export const questionSchema = z.discriminatedUnion("type", [
  /** Nghe rồi chọn âm vừa nghe. */
  z.object({ type: z.literal("choice-audio"), ...base, prompt: z.string().min(1) }),
  /** Ghép âm: thấy "b + a", nghe cách đọc, chọn âm tiết đúng. */
  z.object({ type: z.literal("blend"), ...base, parts: z.string().min(1) }),
]);

export const sectionSchema = z.object({
  id,
  /** "Phần 1" */
  label: z.string().min(1),
  title: z.string().min(1),
  instruction: z.string().min(1),
  questions: z.array(questionSchema).min(1),
});

export const lessonSchema = z
  .object({
    id,
    number: z.number().int().positive(),
    /** "ÔN TẬP • BÀI 1" */
    badge: z.string().min(1),
    title: z.string().min(1),
    subtitle: z.string().min(1),
    /** Ô thống kê "Nội dung ôn tập". */
    highlights: z
      .array(
        z.object({ value: z.string(), label: z.string(), sample: z.string(), tone: z.enum(["red", "blue", "green"]) }),
      )
      .max(4)
      .default([]),
    sections: z.array(sectionSchema).min(1),
  })
  .superRefine((l, ctx) => {
    const ids = new Set<string>();
    for (const s of l.sections) {
      if (ids.has(s.id)) ctx.addIssue({ code: "custom", message: `Trùng id section ${s.id}` });
      ids.add(s.id);
      const qids = new Set<string>();
      for (const q of s.questions) {
        if (qids.has(q.id)) ctx.addIssue({ code: "custom", message: `Trùng id câu ${s.id}/${q.id}` });
        qids.add(q.id);
        if (q.audio && !q.audio.startsWith(`/audio/${l.id}/`))
          ctx.addIssue({ code: "custom", message: `Audio ${q.audio} phải nằm trong /audio/${l.id}/` });
        if (new Set(q.options).size !== 4) ctx.addIssue({ code: "custom", message: `Đáp án trùng ở ${s.id}/${q.id}` });
      }
    }
  });

export type Lesson = z.infer<typeof lessonSchema>;
export type LessonInput = z.input<typeof lessonSchema>;
export type LessonSection = z.infer<typeof sectionSchema>;
export type LessonQuestion = z.infer<typeof questionSchema>;
