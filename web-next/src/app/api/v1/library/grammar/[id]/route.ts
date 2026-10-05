/** Một bài ngữ pháp: cấu trúc, cách dùng, ví dụ, bài tập + đã học / yêu thích / đã lưu (theo người xem). Không có → 404. */
import { api } from "@/server/api";
import { getLocale } from "@/i18n/server";
import { setIdSchema } from "@/features/library/schema";
import { getLibGrammar } from "@/features/library/grammar";

export const dynamic = "force-dynamic";
export const GET = api<{ id: string }>(async ({ user, params }) =>
  getLibGrammar(user.id, setIdSchema.parse(params.id), await getLocale()),
);
