import { z } from "zod";
import { T_TOPICS } from "@/data/translation/items";
import { T_GRAMMAR_BY_ID } from "@/data/translation/grammar";

export const T_TYPES = ["sentence", "paragraph"] as const;
export type TType = (typeof T_TYPES)[number];
export const T_DIRECTIONS = ["to-zh", "from-zh", "mixed"] as const;
export type TDirectionMode = (typeof T_DIRECTIONS)[number];
export type TDirection = "to-zh" | "from-zh";
export const T_SOURCES = ["auto", "grammar", "vocab"] as const;
export type TSource = (typeof T_SOURCES)[number];
/** Số câu / đoạn mỗi bài. */
export const T_COUNTS: Record<TType, readonly number[]> = { sentence: [5, 10, 15, 20], paragraph: [3, 4, 5] };
export const T_LEVELS = [1, 2, 3, 4] as const;
/** Thời gian làm bài tối đa được ghi nhận (giây). */
export const T_MAX_ELAPSED = 6 * 3600;

export const translationConfigSchema = z
  .object({
    type: z.enum(T_TYPES).default("sentence"),
    direction: z.enum(T_DIRECTIONS).default("to-zh"),
    source: z.enum(T_SOURCES).default("auto"),
    grammarIds: z.array(z.string().max(40)).max(30).default([]),
    /** Ngữ pháp của chính người dùng (mục Ngữ pháp): câu hỏi lấy từ câu ví dụ họ đã nhập. */
    myGrammarIds: z.array(z.uuid()).max(30).default([]),
    /** 0 = LingYu tự chọn theo trình độ. */
    level: z.number().int().min(0).max(4).default(0),
    topic: z.enum([...T_TOPICS, ""]).default(""),
    count: z.number().int().min(1).max(20).default(10),
    showPinyin: z.boolean().default(false),
  })
  .superRefine((c, ctx) => {
    if (c.source === "grammar" && !c.grammarIds.length && !c.myGrammarIds.length)
      ctx.addIssue({ code: "custom", path: ["grammarIds"], message: "Hãy chọn ít nhất một điểm ngữ pháp." });
    if (c.grammarIds.some((id) => !T_GRAMMAR_BY_ID.has(id)))
      ctx.addIssue({ code: "custom", path: ["grammarIds"], message: "Điểm ngữ pháp không tồn tại." });
  });
export type TranslationConfigInput = z.input<typeof translationConfigSchema>;
export type TranslationConfig = z.infer<typeof translationConfigSchema> & { lang: "vi" | "en" };

export const bankQuerySchema = z.object({
  type: z.enum(T_TYPES).optional().catch(undefined),
  level: z.coerce.number().int().min(1).max(4).optional().catch(undefined),
  grammar: z.string().max(40).optional().catch(undefined),
  topic: z.enum(T_TOPICS).optional().catch(undefined),
  q: z.string().trim().max(100).optional().catch(undefined),
});
export type BankQuery = z.infer<typeof bankQuerySchema>;

export const elapsedSchema = z.number().int().min(0).max(T_MAX_ELAPSED);
