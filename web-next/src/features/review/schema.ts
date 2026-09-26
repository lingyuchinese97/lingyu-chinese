import { z } from "zod";

export const MODES = [
  { value: "meaning", label: "review.modes.meaning" },
  { value: "hanzi", label: "review.modes.hanzi" },
  { value: "pinyin", label: "review.modes.pinyin" },
  { value: "mixed", label: "review.modes.mixed" },
] as const;
export type ReviewMode = (typeof MODES)[number]["value"];
/** Khoá từ điển của nhãn từng hình thức (dịch bằng `t(...)`). */
export const MODE_LABEL = Object.fromEntries(MODES.map((m) => [m.value, m.label])) as Record<
  ReviewMode,
  (typeof MODES)[number]["label"]
>;
export const COUNTS = [5, 10, 20, 30, 50] as const;
/** Ôn đến hạn: tối đa số thẻ mỗi lượt. */
export const DUE_LIMIT = 50;

const mode = z.enum(["meaning", "hanzi", "pinyin", "mixed"]);

export const customConfigSchema = z.object({
  tags: z.array(z.string().trim().min(1).max(24)).max(50).default([]),
  count: z.number().int().min(1).max(200),
  mode,
  showImage: z.boolean().default(true),
  vocabIds: z.array(z.uuid()).min(1).max(500).optional(),
  label: z.string().max(60).optional(),
});
export type CustomConfig = z.infer<typeof customConfigSchema>;

export const dueConfigSchema = z.object({ mode, showImage: z.boolean().default(true) });
export type DueConfig = z.infer<typeof dueConfigSchema>;

export const answerSchema = z.object({
  sessionId: z.uuid(),
  index: z.number().int().min(0).max(499),
  answer: z.string().max(200),
});
