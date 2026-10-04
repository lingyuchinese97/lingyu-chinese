/** Một từ trong bộ: phát âm (âm tiết + thanh), ví dụ, bộ thủ, từ liên quan, cách nhớ, từ trước / sau. Không có → 404. */
import { api } from "@/server/api";
import { getLocale } from "@/i18n/server";
import { setIdSchema, setWordSchema } from "@/features/library/schema";
import { getSetWord } from "@/features/library/sets";

export const dynamic = "force-dynamic";
export const GET = api<{ id: string; word: string }>(async ({ user, params }) =>
  getSetWord(
    user.id,
    setIdSchema.parse(params.id),
    setWordSchema.parse(decodeURIComponent(params.word)),
    await getLocale(),
  ),
);
