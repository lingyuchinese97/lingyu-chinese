/** Admin: gợi ý từ khi đang gõ. GET ?q (chữ Hán: từ bắt đầu bằng phần đã gõ; pinyin / tiếng Việt: từ khớp) → { candidates }. */
import { api, query } from "@/server/api";
import { suggestSchema } from "@/features/library/schema";
import { findCandidates } from "@/features/library/analyze";
import { assertAdmin } from "../../_guard";

export const dynamic = "force-dynamic";
export const GET = api(async ({ user, req }) => {
  assertAdmin(user);
  return { candidates: findCandidates(suggestSchema.parse(query(req)).q, 8) };
});
