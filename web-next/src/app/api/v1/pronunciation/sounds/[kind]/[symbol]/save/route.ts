/**
 * Lưu từ ví dụ của một thanh mẫu / vận mẫu vào Từ vựng của tôi (tag "Phát âm" + tên âm; từ đã có bỏ qua).
 * POST /api/v1/pronunciation/sounds/{initials|finals}/{symbol}/save, body `{ hanzi? }` (bỏ trống = mọi ví dụ) → { added, skipped }.
 */
import { api, body } from "@/server/api";
import { getLocale } from "@/i18n/server";
import { soundKindSchema, soundSaveSchema, soundSymbolSchema } from "@/features/pronunciation/schema";
import { saveSoundExamples } from "@/features/pronunciation/save";

export const dynamic = "force-dynamic";
export const POST = api<{ kind: string; symbol: string }>(async ({ user, params, req }) =>
  saveSoundExamples(
    user.id,
    soundKindSchema.parse(params.kind),
    soundSymbolSchema.parse(decodeURIComponent(params.symbol)),
    soundSaveSchema.parse(await body(req)).hanzi,
    await getLocale(),
  ),
);
