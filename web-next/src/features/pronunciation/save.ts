/**
 * Lưu từ ví dụ của thanh mẫu / vận mẫu (nội dung LingYu, ở Thư viện) vào Từ vựng của tôi — bản sao của riêng người bấm,
 * sửa / thêm tag thoải mái ở Từ vựng của tôi; nội dung gốc trong Thư viện không đổi.
 */
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { vocab } from "@/server/db/schema";
import { FINALS, INITIALS, type SoundItem } from "@/data/pronunciation";
import { createMany } from "@/features/vocabulary/service";
import { vocabInputSchema } from "@/features/vocabulary/schema";
import type { Locale } from "@/i18n/config";
import { PronunciationError } from "./service";

export type SoundKind = "initial" | "final";
const NOT_FOUND = "Không tìm thấy âm hoặc từ ví dụ này.";

function soundOf(kind: SoundKind, symbol: string): SoundItem {
  const s = (kind === "initial" ? INITIALS : FINALS).find((x) => x.symbol === symbol);
  if (!s) throw new PronunciationError("not-found", NOT_FOUND);
  return s;
}

/** Tag gắn cho từ đã lưu: "Phát âm" + "Thanh mẫu b" / "Vận mẫu ang" (theo ngôn ngữ đang dùng). */
export const soundTags = (kind: SoundKind, symbol: string, l: Locale) =>
  l === "en"
    ? ["Pronunciation", `${kind === "initial" ? "Initial" : "Final"} ${symbol}`]
    : ["Phát âm", `${kind === "initial" ? "Thanh mẫu" : "Vận mẫu"} ${symbol}`];

/** Lưu một từ ví dụ (hoặc mọi ví dụ của âm khi `hanzi` = null). Từ đã có trong kho thì bỏ qua. */
export async function saveSoundExamples(
  userId: string,
  kind: SoundKind,
  symbol: string,
  hanzi: string | null,
  l: Locale,
) {
  const s = soundOf(kind, symbol);
  const list = hanzi ? s.examples.filter((e) => e.hanzi === hanzi) : s.examples;
  if (!list.length) throw new PronunciationError("not-found", NOT_FOUND);
  const items = list.map((e) =>
    vocabInputSchema.parse({
      hanzi: e.hanzi,
      pinyin: e.pinyin,
      meaningVi: e.meaning.vi,
      tags: soundTags(kind, s.symbol, l),
    }),
  );
  const r = await createMany(userId, items);
  return { added: r.added.length, skipped: r.skipped.length };
}

/** Các từ ví dụ (của mọi thanh mẫu / vận mẫu) đã có trong Từ vựng của tôi. */
export async function savedSoundExamples(userId: string, kind: SoundKind): Promise<string[]> {
  const all = [...new Set((kind === "initial" ? INITIALS : FINALS).flatMap((x) => x.examples.map((e) => e.hanzi)))];
  if (!all.length) return [];
  const rows = await db
    .select({ hanzi: vocab.hanzi })
    .from(vocab)
    .where(and(eq(vocab.userId, userId), inArray(vocab.hanzi, all)));
  return rows.map((r) => r.hanzi);
}
