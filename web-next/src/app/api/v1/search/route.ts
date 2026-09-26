/** Tìm kiếm chung: `?q=` → từ vựng, ngữ pháp, câu của tôi + bài học, bộ thủ (mỗi loại tối đa 5 kết quả). */
import { z } from "zod";
import { api, query } from "@/server/api";
import { search } from "@/features/search/service";
import { getLocale } from "@/i18n/server";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user, req }) => {
  const q = z
    .string()
    .max(100)
    .catch("")
    .parse(query(req).q ?? "");
  return search(user.id, q, await getLocale());
});
