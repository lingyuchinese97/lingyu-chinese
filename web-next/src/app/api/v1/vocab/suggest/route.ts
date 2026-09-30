/** Gợi ý pinyin / nghĩa / bộ thủ cho các từ (vd nhận ra từ ảnh) + đánh dấu từ đã có. POST { words } → [...]. */
import { api, body } from "@/server/api";
import { suggestSchema } from "@/features/vocabulary/schema";
import { suggestWords } from "@/features/vocabulary/service";

export const dynamic = "force-dynamic";
export const POST = api(async ({ user, req }) => suggestWords(user.id, suggestSchema.parse(await body(req)).words));
