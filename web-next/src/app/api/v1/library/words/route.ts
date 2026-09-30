/** Thư viện LingYu — từ đã public. GET ?hsk(0 = tất cả, 1–6)&topic&q&sort(order|newest|pinyin) → { items, total, levels, all }. */
import { api, query } from "@/server/api";
import { libListSchema } from "@/features/library/schema";
import { listPublicWords } from "@/features/library/service";

export const dynamic = "force-dynamic";
export const GET = api(async ({ user, req }) => listPublicWords(user.id, libListSchema.parse(query(req))));
