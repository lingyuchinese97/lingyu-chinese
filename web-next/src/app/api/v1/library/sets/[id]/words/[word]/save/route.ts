/** Lưu một từ của bộ vào Từ vựng của tôi. POST → { added, skipped }. */
import { api } from "@/server/api";
import { getLocale } from "@/i18n/server";
import { setIdSchema, setWordSchema } from "@/features/library/schema";
import { saveSetToMyVocab } from "@/features/library/sets";

export const dynamic = "force-dynamic";
export const POST = api<{ id: string; word: string }>(async ({ user, params }) =>
  saveSetToMyVocab(
    user.id,
    setIdSchema.parse(params.id),
    setWordSchema.parse(decodeURIComponent(params.word)),
    await getLocale(),
  ),
);
