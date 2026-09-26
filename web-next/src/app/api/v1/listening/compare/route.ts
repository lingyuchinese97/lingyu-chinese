/**
 * So sánh bài chép với đáp án tham khảo (không lưu) — cùng hàm với màn web và lúc lưu bài:
 * `{ referenceAnswer, userAnswer }` → `{ parts, correct, wrong, missing, extra, total, percent }`.
 */
import { api, body } from "@/server/api";
import { compareInputSchema } from "@/features/listening/schema";
import { compareDictation } from "@/lib/dictation-compare";

export const dynamic = "force-dynamic";

export const POST = api(async ({ req }) => {
  const { referenceAnswer, userAnswer } = compareInputSchema.parse(await body(req));
  return compareDictation(referenceAnswer, userAnswer);
});
