/**
 * Tạo bài ôn dịch câu (bỏ bài đang dở nếu có). POST { direction, count, tags?, showPinyin?, showHint?, sentenceIds?, label? }
 * → 201 + phiên (không chứa đáp án câu chưa làm). Không có câu phù hợp → 409.
 */
import { api, body } from "@/server/api";
import { sentenceConfigSchema } from "@/features/sentences/schema";
import { createSentenceSession, getActiveSentenceSession } from "@/features/sentences/review-service";

export const dynamic = "force-dynamic";

export const POST = api(
  async ({ user, req }) => {
    await createSentenceSession(user.id, sentenceConfigSchema.parse(await body(req)));
    return getActiveSentenceSession(user.id);
  },
  { status: 201 },
);
