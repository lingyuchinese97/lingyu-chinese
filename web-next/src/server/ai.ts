import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { log } from "@/server/log";

/**
 * Trợ lý AI (Claude) cho các chức năng cần hiểu câu tiếng Trung: dịch câu sang tiếng Việt, nhận xét câu trả lời.
 * Chỉ bật khi máy chủ có biến môi trường ANTHROPIC_API_KEY; không có (hoặc lỗi mạng / bị từ chối) → trả null để
 * nơi gọi dùng cách dự phòng không cần AI. Không gửi thông tin tài khoản — chỉ nội dung câu cần xử lý.
 */
const MODEL = "claude-opus-5-5";

let client: Anthropic | null = null;

/**
 * Hạn mức mềm mỗi người (trong bộ nhớ của một instance máy chủ): quá thì tạm dùng cách dự phòng, không báo lỗi.
 * Chặn việc vô tình gọi AI liên tục (gõ, bấm kiểm tra nhiều lần).
 */
const AI_PER_HOUR = 120;
const usage = new Map<string, { start: number; n: number }>();
export function takeAiBudget(userId: string) {
  const now = Date.now();
  const u = usage.get(userId);
  if (!u || now - u.start > 3_600_000) {
    usage.set(userId, { start: now, n: 1 });
    return true;
  }
  if (u.n >= AI_PER_HOUR) return false;
  u.n++;
  return true;
}
export const aiEnabled = () => !!process.env.ANTHROPIC_API_KEY;
function getClient() {
  if (!aiEnabled()) return null;
  client ??= new Anthropic({ timeout: 30_000, maxRetries: 1 });
  return client;
}

async function ask<T extends z.ZodType>(
  schema: T,
  system: string,
  content: string,
  effort: "low" | "medium",
): Promise<z.infer<T> | null> {
  const c = getClient();
  if (!c) return null;
  try {
    const res = await c.beta.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      // Khi Claude từ chối vì chính sách an toàn, máy chủ tự chạy lại trên mô hình dự phòng phù hợp.
      fallbacks: "default",
      system,
      messages: [{ role: "user", content }],
      output_config: { effort, format: betaZodOutputFormat(schema) },
    });
    if (res.stop_reason === "refusal") return null;
    return (res.parsed_output as z.infer<T> | null) ?? null;
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) log.warn({ err: e.message }, "[ai] rate limited");
    else if (e instanceof Anthropic.APIError) log.warn({ status: e.status, err: e.message }, "[ai] api error");
    else log.warn({ err: String(e) }, "[ai] request failed");
    return null;
  }
}

const Translations = z.object({ items: z.array(z.object({ vi: z.string() })) });

/** Dịch từng câu tiếng Trung sang tiếng Việt tự nhiên (giữ thứ tự). null nếu AI không dùng được. */
export async function translateToVietnamese(sentences: string[]): Promise<string[] | null> {
  if (!sentences.length) return [];
  const out = await ask(
    Translations,
    "You translate Mandarin Chinese sentences written by Vietnamese learners into natural, concise Vietnamese. " +
      "Return exactly one item per input sentence, in the same order. Translate only; do not explain or correct.",
    sentences.map((s, i) => `${i + 1}. ${s}`).join("\n"),
    "low",
  );
  if (!out || out.items.length !== sentences.length) return null;
  return out.items.map((x) => x.vi.trim());
}

export const AnswerFeedback = z.object({
  verdict: z.enum(["great", "good", "needs_work"]),
  summary_vi: z.string(),
  corrected_zh: z.string(),
  issues: z.array(
    z.object({ kind: z.enum(["grammar", "vocabulary", "naturalness", "relevance"]), text_vi: z.string() }),
  ),
  better_zh: z.string(),
});
export type AnswerFeedback = z.infer<typeof AnswerFeedback>;

/**
 * Nhận xét câu trả lời giao tiếp (không có đáp án mẫu): ngữ pháp, từ vựng, độ tự nhiên, có trả lời đúng câu hỏi không.
 * Lời nhận xét viết bằng tiếng Việt, ngắn gọn, khích lệ. null nếu AI không dùng được.
 */
export async function reviewAnswer(question: string, answer: string, hsk: number | null) {
  return ask(
    AnswerFeedback,
    "You are a friendly Mandarin speaking tutor for Vietnamese learners" +
      (hsk ? ` at about HSK ${hsk} level` : "") +
      ". The learner answers an open conversation question; there is no single correct answer. " +
      "Judge only grammar, word choice, naturalness, and whether the answer actually responds to the question. " +
      "Write summary_vi and every text_vi in Vietnamese, short and encouraging. corrected_zh is the learner's answer " +
      "with minimal fixes (identical if already correct). better_zh is one more natural way to say it, at a similar level. " +
      "List at most 4 issues; an empty list is fine when the answer is good.",
    `Question: ${question}\nLearner's answer: ${answer}`,
    "medium",
  );
}
