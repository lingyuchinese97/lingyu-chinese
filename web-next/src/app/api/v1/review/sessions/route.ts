/**
 * Tạo bài ôn (huỷ bài đang dở nếu có): `POST /api/v1/review/sessions`
 * - `{ kind: "custom", count, mode, tags?, showImage?, vocabIds?, label? }`
 * - `{ kind: "due", mode, showImage? }`
 * Trả 201 + phiên (không chứa đáp án câu chưa làm).
 */
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { api, body } from "@/server/api";
import { customConfigSchema, dueConfigSchema } from "@/features/review/schema";
import { createCustomSession, createDueSession, getActiveSession } from "@/features/review/service";

export const dynamic = "force-dynamic";

const createSchema = z.discriminatedUnion("kind", [
  customConfigSchema.extend({ kind: z.literal("custom") }),
  dueConfigSchema.extend({ kind: z.literal("due") }),
]);

export const POST = api(
  async ({ user, req }) => {
    const { kind, ...cfg } = createSchema.parse(await body(req));
    if (kind === "custom") await createCustomSession(user.id, customConfigSchema.parse(cfg));
    else await createDueSession(user.id, dueConfigSchema.parse(cfg));
    revalidatePath("/review");
    return getActiveSession(user.id);
  },
  { status: 201 },
);
