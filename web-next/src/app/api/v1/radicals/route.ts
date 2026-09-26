/** 214 bộ thủ (tìm theo số, chữ, tên Hán Việt, pinyin, nghĩa: `?q=`), kèm `known` = mình đã đánh dấu thuộc. */
import { api, query } from "@/server/api";
import { searchRadicals } from "@/lib/radicals";
import { knownRadicals } from "@/features/radicals/service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user, req }) => {
  const known = new Set(await knownRadicals(user.id));
  const items = searchRadicals(String(query(req).q ?? "").slice(0, 60)).map((r) => ({ ...r, known: known.has(r.num) }));
  return { items, total: items.length, knownCount: known.size };
});
