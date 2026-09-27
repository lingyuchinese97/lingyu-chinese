/** Tạo bài luyện dịch (bỏ bài đang dở nếu có) → 201 bài. Không có câu mẫu phù hợp → 409. */
import { api, body } from "@/server/api";
import { getLocale } from "@/i18n/server";
import { translationConfigSchema } from "@/features/translation/schema";
import { createTranslationSession, getTranslationSession } from "@/features/translation/service";

export const dynamic = "force-dynamic";

export const POST = api(
  async ({ user, req }) => {
    const cfg = translationConfigSchema.parse(await body(req));
    const id = await createTranslationSession(user.id, { ...cfg, lang: await getLocale() });
    return getTranslationSession(user.id, id);
  },
  { status: 201 },
);
