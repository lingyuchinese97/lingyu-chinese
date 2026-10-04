/** Lưu cả bộ vào Từ vựng của tôi (tag = tên bộ + HSK; từ đã có bỏ qua). POST → { added, skipped }. */
import { api } from "@/server/api";
import { getLocale } from "@/i18n/server";
import { setIdSchema } from "@/features/library/schema";
import { saveSetToMyVocab } from "@/features/library/sets";

export const dynamic = "force-dynamic";
export const POST = api<{ id: string }>(async ({ user, params }) =>
  saveSetToMyVocab(user.id, setIdSchema.parse(params.id), null, await getLocale()),
);
