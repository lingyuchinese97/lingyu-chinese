/** Admin: phân tích từ (chữ Hán → gợi ý đầy đủ; pinyin / tiếng Việt → danh sách từ để chọn). POST { input }. */
import { api, body } from "@/server/api";
import { analyzeSchema } from "@/features/library/schema";
import { analyzeWord, findCandidates } from "@/features/library/analyze";
import { assertAdmin } from "../../_guard";

export const dynamic = "force-dynamic";
export const POST = api(async ({ user, req }) => {
  assertAdmin(user);
  const { input } = analyzeSchema.parse(await body(req));
  return /\p{Script=Han}/u.test(input)
    ? { analysis: analyzeWord(input), candidates: [] }
    : { analysis: null, candidates: findCandidates(input) };
});
