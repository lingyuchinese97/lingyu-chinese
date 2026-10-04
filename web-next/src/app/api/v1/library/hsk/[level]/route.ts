/** Từ vựng HSK một cấp (1–6): GET ?q&page (30 từ / trang) → pinyin, nghĩa, ví dụ, cách nhớ, đã học (của mình). */
import { api, query } from "@/server/api";
import { hskListSchema } from "@/features/library/schema";
import { listHskWords } from "@/features/library/sets";

export const dynamic = "force-dynamic";
export const GET = api<{ level: string }>(async ({ user, req, params }) =>
  listHskWords(user.id, hskListSchema.parse({ ...query(req), level: params.level })),
);
