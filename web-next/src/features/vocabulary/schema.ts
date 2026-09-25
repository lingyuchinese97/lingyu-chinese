import { z } from "zod";
import { VOCAB } from "@/lib/limits";

export const STATUS = ["learned", "review"] as const;
export type VocabStatus = (typeof STATUS)[number];
export const STATUS_LABEL: Record<VocabStatus, string> = { learned: "Đã thuộc", review: "Cần ôn" };

export const SORTS = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "pinyin", label: "Pinyin A → Z" },
  { value: "favorite", label: "Yêu thích trước" },
] as const;
export type VocabSort = (typeof SORTS)[number]["value"];

const HAN = /[㐀-鿿豈-﫿]/;

export const tagNameSchema = z
  .string()
  .trim()
  .min(1, "Tên tag không được để trống.")
  .max(VOCAB.MAX_TAG, `Tên tag tối đa ${VOCAB.MAX_TAG} ký tự.`);

/** Bỏ trùng không phân biệt hoa/thường, giữ thứ tự. */
export function cleanTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags) {
    const n = t.trim();
    const k = n.toLowerCase();
    if (!n || seen.has(k)) continue;
    seen.add(k);
    out.push(n);
  }
  return out;
}

/** Số bộ thủ: số nguyên 1–214, không trùng, tối đa 10 (như bản cũ). */
export function cleanRadicals(list: unknown[]): number[] {
  const out: number[] = [];
  for (const x of list) {
    const n = Number(x);
    if (Number.isInteger(n) && n >= 1 && n <= 214 && !out.includes(n)) out.push(n);
  }
  return out.slice(0, VOCAB.MAX_RADICALS);
}

export const vocabInputSchema = z.object({
  hanzi: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập chữ Hán.")
    .max(VOCAB.MAX_HANZI, `Hán tự tối đa ${VOCAB.MAX_HANZI} ký tự.`)
    .refine((v) => HAN.test(v), "Hán tự phải chứa ít nhất một chữ Hán."),
  pinyin: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập pinyin.")
    .max(VOCAB.MAX_PINYIN, `Pinyin tối đa ${VOCAB.MAX_PINYIN} ký tự.`),
  meaningVi: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập nghĩa tiếng Việt.")
    .max(VOCAB.MAX_MEANING, `Nghĩa tối đa ${VOCAB.MAX_MEANING} ký tự.`),
  note: z.string().trim().max(VOCAB.MAX_NOTE, `Ghi chú tối đa ${VOCAB.MAX_NOTE} ký tự.`).default(""),
  tags: z.array(tagNameSchema).max(20, "Tối đa 20 tag cho một từ.").default([]).transform(cleanTags),
  radicals: z.array(z.unknown()).max(50).default([]).transform(cleanRadicals),
});
export type VocabInput = z.infer<typeof vocabInputSchema>;
export type VocabFormValues = z.input<typeof vocabInputSchema>;

export const listParamsSchema = z.object({
  q: z.string().max(100).catch(""),
  tag: z.string().max(VOCAB.MAX_TAG).catch(""),
  radical: z.coerce.number().int().min(0).max(214).catch(0),
  sort: z.enum(["newest", "oldest", "pinyin", "favorite"]).catch("newest"),
  page: z.coerce.number().int().min(1).max(100000).catch(1),
});
export type ListParams = z.infer<typeof listParamsSchema>;

export const idsSchema = z.array(z.uuid()).min(1, "Chưa chọn từ vựng nào.").max(500);
