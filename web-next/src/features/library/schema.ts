import { z } from "zod";
import { T_TOPICS } from "@/data/translation/items";

/** Từ loại cho từ trong thư viện (nhãn: `library.pos.<khoá>`). */
export const LIB_POS = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "pronoun",
  "measure",
  "number",
  "particle",
  "preposition",
  "conjunction",
  "interjection",
  "phrase",
] as const;
export type LibPos = (typeof LIB_POS)[number];
export const LIB_LEVELS = [1, 2, 3, 4, 5, 6] as const;

export const LIB_LIMITS = {
  hanzi: 20,
  pinyin: 80,
  meaning: 200,
  note: 500,
  text: 500,
  short: 120,
  components: 8,
  related: 12,
  examples: 8,
  grammar: 4,
} as const;

const HAN = /\p{Script=Han}/u;
const s = (max: number) => z.string().trim().max(max).default("");

export const libWordInputSchema = z.object({
  hanzi: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập chữ Hán.")
    .max(LIB_LIMITS.hanzi, `Hán tự tối đa ${LIB_LIMITS.hanzi} ký tự.`)
    .refine((v) => HAN.test(v), "Hán tự phải chứa ít nhất một chữ Hán."),
  pinyin: s(LIB_LIMITS.pinyin),
  pos: z.enum(["", ...LIB_POS]).default(""),
  meaningVi: s(LIB_LIMITS.meaning),
  note: s(LIB_LIMITS.note),
  hskLevel: z.number().int().min(1).max(6).nullable().default(null),
  topic: z.enum(["", ...T_TOPICS]).default(""),
  components: z
    .array(z.object({ char: s(4).pipe(z.string().min(1)), pinyin: s(40), meaning: s(LIB_LIMITS.short) }))
    .max(LIB_LIMITS.components)
    .default([]),
  mnemonic: s(LIB_LIMITS.text),
  association: s(LIB_LIMITS.text),
  related: z
    .array(z.object({ zh: s(LIB_LIMITS.hanzi).pipe(z.string().min(1)), py: s(80), vi: s(LIB_LIMITS.short) }))
    .max(LIB_LIMITS.related)
    .default([]),
  examples: z
    .array(z.object({ zh: s(200).pipe(z.string().min(1)), py: s(400), vi: s(300) }))
    .max(LIB_LIMITS.examples)
    .default([]),
  grammar: z
    .array(z.object({ structure: s(LIB_LIMITS.short).pipe(z.string().min(1)), explain: s(300), example: s(200) }))
    .max(LIB_LIMITS.grammar)
    .default([]),
});
export type LibWordInput = z.infer<typeof libWordInputSchema>;

/** Khi public: phải đủ pinyin + nghĩa (người học không thấy từ trống). */
export const PUBLISH_MISSING = "Cần nhập pinyin và nghĩa tiếng Việt trước khi public.";

export const libListSchema = z.object({
  q: z.string().max(100).catch(""),
  hsk: z.coerce.number().int().min(0).max(6).catch(1),
  topic: z.enum(["", ...T_TOPICS]).catch(""),
  sort: z.enum(["order", "newest", "pinyin"]).catch("order"),
});
export type LibListParams = z.infer<typeof libListSchema>;

export const adminLibListSchema = z.object({
  q: z.string().max(100).catch(""),
  status: z.enum(["all", "draft", "public"]).catch("all"),
  page: z.coerce.number().int().min(1).max(10000).catch(1),
});
export type AdminLibListParams = z.infer<typeof adminLibListSchema>;

export const analyzeSchema = z.object({ input: z.string().trim().min(1, "Vui lòng nhập từ cần phân tích.").max(40) });
