import { z } from "zod";

export const G_LIMITS = {
  title: 120,
  meaning: 2000,
  structure: 300,
  notes: 2000,
  personalNote: 2000,
  tag: 24,
  examples: 30,
  example: 300,
} as const;

export const G_SORTS = [
  { value: "updated", label: "grammar.sortUpdated" },
  { value: "newest", label: "grammar.sortNewest" },
  { value: "oldest", label: "grammar.sortOldest" },
  { value: "az", label: "grammar.sortAz" },
  { value: "za", label: "grammar.sortZa" },
] as const;
export type GrammarSort = (typeof G_SORTS)[number]["value"];

export const SHARE_STATUS_LABEL = { PENDING: "Đang chờ", ACCEPTED: "Đã chấp nhận", REJECTED: "Đã từ chối" } as const;

const cleanName = (s: string) => s.trim().replace(/\s+/g, " ");
export const grammarTagName = z
  .string()
  .transform(cleanName)
  .pipe(z.string().min(1, "Tên thẻ không được để trống.").max(G_LIMITS.tag, `Tên thẻ tối đa ${G_LIMITS.tag} ký tự.`));

const ex = z.object({
  chinese: z.string().trim().max(G_LIMITS.example),
  pinyin: z.string().trim().max(G_LIMITS.example).default(""),
  vietnamese: z.string().trim().max(G_LIMITS.example).default(""),
});

export const grammarInputSchema = z
  .object({
    title: z
      .string()
      .transform(cleanName)
      .pipe(
        z
          .string()
          .min(1, "Vui lòng nhập tiêu đề ngữ pháp.")
          .max(G_LIMITS.title, `Tiêu đề tối đa ${G_LIMITS.title} ký tự.`),
      ),
    meaning: z.string().trim().max(G_LIMITS.meaning, `Tối đa ${G_LIMITS.meaning} ký tự.`).default(""),
    structure: z.string().trim().max(G_LIMITS.structure, `Tối đa ${G_LIMITS.structure} ký tự.`).default(""),
    notes: z.string().trim().max(G_LIMITS.notes, `Tối đa ${G_LIMITS.notes} ký tự.`).default(""),
    personalNote: z.string().trim().max(G_LIMITS.personalNote, `Tối đa ${G_LIMITS.personalNote} ký tự.`).default(""),
    // Ví dụ trống hoàn toàn thì bỏ; có pinyin/nghĩa mà thiếu câu tiếng Trung thì báo lỗi.
    examples: z
      .array(ex)
      .max(100)
      .default([])
      .transform((list) => list.filter((e) => e.chinese || e.pinyin || e.vietnamese)),
    tags: z.array(grammarTagName).max(20).default([]),
  })
  .superRefine((v, ctx) => {
    if (v.examples.length > G_LIMITS.examples)
      ctx.addIssue({ code: "custom", path: ["examples"], message: `Tối đa ${G_LIMITS.examples} ví dụ.` });
    const bad = v.examples.findIndex((e) => !e.chinese);
    if (bad >= 0)
      ctx.addIssue({ code: "custom", path: ["examples"], message: `Ví dụ ${bad + 1}: vui lòng nhập câu tiếng Trung.` });
  });
export type GrammarInput = z.infer<typeof grammarInputSchema>;

export const grammarListSchema = z.object({
  q: z.string().max(100).catch(""),
  tag: z.string().max(60).catch(""),
  sort: z.enum(["updated", "newest", "oldest", "az", "za"]).catch("updated"),
  view: z.enum(["all", "saved", "shared"]).catch("all"),
});
export type GrammarListParams = z.infer<typeof grammarListSchema>;

/** Tách chuỗi nhiều email (dấu phẩy, chấm phẩy, khoảng trắng, xuống dòng), bỏ trùng. */
export function parseEmails(text: string): string[] {
  return [
    ...new Set(
      String(text || "")
        .split(/[\s,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}
