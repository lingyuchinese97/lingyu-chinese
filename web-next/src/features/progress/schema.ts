import { z } from "zod";
import { ACTIVITY_KINDS, CLIENT_KINDS, GOAL_KINDS, GOAL_LIMITS } from "./constants";

export const dailyQuerySchema = z.object({
  days: z.coerce
    .number()
    .int()
    .pipe(z.union([z.literal(7), z.literal(30), z.literal(90)]))
    .catch(7),
});

export const historyQuerySchema = z.object({
  kind: z.enum(ACTIVITY_KINDS).optional().catch(undefined),
  days: z.coerce.number().int().min(1).max(365).catch(7),
  limit: z.coerce.number().int().min(1).max(500).catch(100),
});

export const goalsSchema = z
  .object(
    Object.fromEntries(
      GOAL_KINDS.map((k) => [
        k,
        z
          .number({ error: "Mục tiêu phải là số." })
          .int("Mục tiêu phải là số nguyên.")
          .min(GOAL_LIMITS[k][0], `Mục tiêu tối thiểu ${GOAL_LIMITS[k][0]}.`)
          .max(GOAL_LIMITS[k][1], `Mục tiêu tối đa ${GOAL_LIMITS[k][1]}.`)
          .optional(),
      ]),
    ) as Record<(typeof GOAL_KINDS)[number], z.ZodOptional<z.ZodNumber>>,
  )
  .strict();

/** Hoạt động app tự báo cáo (bài tự luyện phát âm). */
export const clientActivitySchema = z
  .object({
    kind: z.enum(CLIENT_KINDS),
    title: z.string().trim().max(200).default(""),
    correct: z.number().int().min(0).max(1000),
    total: z.number().int().min(1).max(1000),
    durationSec: z
      .number()
      .min(0)
      .max(4 * 3600)
      .default(0),
  })
  .refine((v) => v.correct <= v.total, { path: ["correct"], message: "Số câu đúng không được lớn hơn tổng số câu." });
