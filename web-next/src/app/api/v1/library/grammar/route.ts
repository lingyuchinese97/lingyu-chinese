/** Thư viện LingYu: bài ngữ pháp. GET ?q&hsk(0–6)&topic&status(all|learned|todo|favorite)&sort(order|newest|name). */
import { api, query } from "@/server/api";
import { getLocale } from "@/i18n/server";
import { grammarListSchema } from "@/features/library/schema";
import { listLibGrammar } from "@/features/library/grammar";

export const dynamic = "force-dynamic";
export const GET = api(async ({ user, req }) =>
  listLibGrammar(user.id, grammarListSchema.parse(query(req)), await getLocale()),
);
