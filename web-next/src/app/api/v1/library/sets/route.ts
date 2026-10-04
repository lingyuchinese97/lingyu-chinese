/** Thư viện LingYu: bộ từ vựng. GET ?q&hsk(0–6)&topic&kind(all|topic|communication|essential|radical|situation|favorite)&sort(order|newest|name|size). */
import { api, query } from "@/server/api";
import { getLocale } from "@/i18n/server";
import { setListSchema } from "@/features/library/schema";
import { listSets } from "@/features/library/sets";

export const dynamic = "force-dynamic";
export const GET = api(async ({ user, req }) => listSets(user.id, setListSchema.parse(query(req)), await getLocale()));
