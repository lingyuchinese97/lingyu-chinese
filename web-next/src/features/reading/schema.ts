import { z } from "zod";
import { R_TYPES } from "@/data/reading/passages";
import { T_TOPICS } from "@/data/translation/items";

export const R_LEVELS = [1, 2, 3, 4] as const;
export const R_SOURCES = ["auto", "vocab", "grammar"] as const;
export type RSource = (typeof R_SOURCES)[number];

/** Chọn bài: cấp (0 = tự động theo trình độ), dạng, chủ đề, theo từ vựng / ngữ pháp. */
export const pickSchema = z.object({
  level: z.coerce.number().int().min(0).max(4).catch(0),
  type: z.enum([...R_TYPES, ""]).catch(""),
  topic: z.enum([...T_TOPICS, ""]).catch(""),
  source: z.enum(R_SOURCES).catch("auto"),
  grammar: z.string().max(40).catch(""),
});
export type PickInput = z.infer<typeof pickSchema>;

export const listSchema = z.object({
  level: z.coerce.number().int().min(0).max(4).catch(0),
  type: z.enum([...R_TYPES, ""]).catch(""),
  topic: z.enum([...T_TOPICS, ""]).catch(""),
});

export const submitSchema = z.object({
  answers: z.array(z.union([z.number().int().min(0).max(9), z.string().max(40), z.null()])).max(20),
  durationSec: z
    .number()
    .int()
    .min(0)
    .max(6 * 3600)
    .default(0),
});

export const saveWordsSchema = z.object({
  /** Bỏ trống = lưu tất cả từ khoá của bài. */
  words: z.array(z.string().max(40)).max(50).optional(),
});
