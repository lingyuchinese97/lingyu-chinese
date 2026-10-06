/**
 * "Phát âm của tôi" (mục Phát âm & Biến điệu trên thanh bên): từ / âm tiết người học tự nhập hoặc lưu từ Thư viện LingYu.
 * Bản lưu là bản sao của riêng người học — sửa, thêm tag tự do; nội dung gốc trong Thư viện không đổi.
 * Mọi hàm nhận userId của SESSION và lọc theo đó.
 */
import { and, count, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { pronunciationItem } from "@/server/db/schema";
import { PRONUNCIATION } from "@/lib/limits";
import { fold, foldCompact } from "@/lib/fold";
import { sentencePinyin } from "@/lib/sentence-pinyin";
import { libraryExamples, topicLabel } from "@/data/pronunciation";
import type { Locale } from "@/i18n/config";
import { PronunciationError } from "./service";
import type { ItemInput, ItemListParams } from "./schema";

const NOT_FOUND = "Không tìm thấy mục phát âm này.";
const DUPLICATE = "Bạn đã có từ này (cùng chữ Hán và pinyin) trong Phát âm của tôi.";
const TOO_MANY = `Bạn đã có tối đa ${PRONUNCIATION.MAX_ITEMS} mục phát âm.`;
const LIB_NOT_FOUND = "Không tìm thấy mục hoặc từ ví dụ này trong Thư viện.";

export type PronunciationItem = typeof pronunciationItem.$inferSelect;
const own = (userId: string, id: string) => and(eq(pronunciationItem.userId, userId), eq(pronunciationItem.id, id));

async function withPinyin(input: ItemInput) {
  if (input.pinyin || !/\p{Script=Han}/u.test(input.hanzi)) return input;
  // sentencePinyin viết hoa đầu câu — từ / âm tiết thì để chữ thường.
  const py = (await sentencePinyin(input.hanzi)).toLocaleLowerCase("vi");
  return { ...input, pinyin: py.slice(0, PRONUNCIATION.MAX_PINYIN) };
}
const isUnique = (e: unknown) =>
  typeof e === "object" && e !== null && "cause" in e && (e as { cause?: { code?: string } }).cause?.code === "23505";

/** Danh sách (tìm theo chữ Hán / pinyin không dấu / nghĩa / ghi chú, lọc tag + nguồn) kèm các tag đang dùng. */
export async function listItems(userId: string, p: ItemListParams) {
  const rows = await db.select().from(pronunciationItem).where(eq(pronunciationItem.userId, userId));
  const tagCount = new Map<string, number>();
  for (const r of rows) for (const t of r.tags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
  const f = fold(p.q);
  const fc = foldCompact(p.q);
  const items = rows
    .filter(
      (r) =>
        (!p.q ||
          r.hanzi.includes(p.q) ||
          foldCompact(r.pinyin).includes(fc) ||
          fold(`${r.meaning} ${r.note}`).includes(f)) &&
        (!p.tag || r.tags.some((t) => t.toLowerCase() === p.tag.toLowerCase())) &&
        (p.from === "all" || (p.from === "library") === !!r.source),
    )
    .sort(
      {
        updated: (a: PronunciationItem, b: PronunciationItem) => b.updatedAt.getTime() - a.updatedAt.getTime(),
        newest: (a: PronunciationItem, b: PronunciationItem) => b.createdAt.getTime() - a.createdAt.getTime(),
        az: (a: PronunciationItem, b: PronunciationItem) => foldCompact(a.pinyin).localeCompare(foldCompact(b.pinyin)),
      }[p.sort],
    );
  return {
    items: items.map(({ userId: _u, ...r }) => r),
    total: items.length,
    all: rows.length,
    fromLibrary: rows.filter((r) => r.source).length,
    tags: [...tagCount].map(([name, n]) => ({ name, count: n })).sort((a, b) => a.name.localeCompare(b.name, "vi")),
  };
}
export type ItemList = Awaited<ReturnType<typeof listItems>>;

export async function getItem(userId: string, id: string) {
  const [row] = await db.select().from(pronunciationItem).where(own(userId, id)).limit(1);
  if (!row) throw new PronunciationError("not-found", NOT_FOUND);
  const { userId: _u, ...r } = row;
  return r;
}

/** Tự nhập một mục. Trùng chữ Hán + pinyin → báo trùng (409). */
export async function createItem(userId: string, input: ItemInput) {
  const [c] = await db.select({ n: count() }).from(pronunciationItem).where(eq(pronunciationItem.userId, userId));
  if ((c?.n ?? 0) >= PRONUNCIATION.MAX_ITEMS) throw new PronunciationError("validation", TOO_MANY);
  const v = await withPinyin(input);
  try {
    const [row] = await db
      .insert(pronunciationItem)
      .values({ userId, ...v })
      .returning({ id: pronunciationItem.id });
    return getItem(userId, row!.id);
  } catch (e) {
    if (isUnique(e)) throw new PronunciationError("duplicate", DUPLICATE);
    throw e;
  }
}

/** Sửa (cả bản lưu từ Thư viện — `source` giữ nguyên để biết nguồn). */
export async function updateItem(userId: string, id: string, input: ItemInput) {
  await getItem(userId, id);
  const v = await withPinyin(input);
  try {
    await db
      .update(pronunciationItem)
      .set({ ...v })
      .where(own(userId, id));
  } catch (e) {
    if (isUnique(e)) throw new PronunciationError("duplicate", DUPLICATE);
    throw e;
  }
  return getItem(userId, id);
}

export async function deleteItem(userId: string, id: string) {
  const r = await db.delete(pronunciationItem).where(own(userId, id)).returning({ id: pronunciationItem.id });
  if (!r.length) throw new PronunciationError("not-found", NOT_FOUND);
  return { deleted: true };
}

/** Tag gắn khi lưu từ Thư viện: "Phát âm" + tên mục ("Thanh mẫu b", "Biến điệu của 不"...). */
function libraryTags(topic: string, l: Locale) {
  const label = topicLabel(topic);
  const name = label ? (l === "en" ? label.en : label.vi) : "";
  return [l === "en" ? "LingYu Library" : "Thư viện LingYu", name.slice(0, PRONUNCIATION.MAX_TAG)].filter(Boolean);
}

/**
 * Lưu từ ví dụ của một mục Thư viện vào Phát âm của tôi (một từ, hoặc mọi ví dụ khi `hanzi` = null).
 * Từ đã có (cùng chữ Hán + pinyin) thì bỏ qua. Ví dụ biến điệu ghi cách đọc thực tế vào ghi chú.
 */
export async function saveFromLibrary(userId: string, topic: string, hanzi: string | null, l: Locale) {
  const all = libraryExamples(topic);
  const list = all?.filter((e) => !hanzi || e.hanzi === hanzi) ?? [];
  if (!list.length) throw new PronunciationError("not-found", LIB_NOT_FOUND);
  const [c] = await db.select({ n: count() }).from(pronunciationItem).where(eq(pronunciationItem.userId, userId));
  if ((c?.n ?? 0) + list.length > PRONUNCIATION.MAX_ITEMS) throw new PronunciationError("validation", TOO_MANY);
  const tags = libraryTags(topic, l);
  const r = await db
    .insert(pronunciationItem)
    .values(
      list.map((e) => ({
        userId,
        hanzi: e.hanzi,
        pinyin: e.pinyin,
        meaning: l === "en" ? e.meaning.en : e.meaning.vi,
        note: e.spoken ? (l === "en" ? `Spoken: ${e.spoken}` : `Đọc: ${e.spoken}`) : "",
        tags,
        source: topic,
      })),
    )
    .onConflictDoNothing()
    .returning({ id: pronunciationItem.id });
  return { added: r.length, skipped: list.length - r.length };
}

/** Chữ Hán đã có trong Phát âm của tôi (để Thư viện hiện "Đã lưu"). */
export async function savedFromLibrary(userId: string): Promise<string[]> {
  const rows = await db
    .select({ hanzi: pronunciationItem.hanzi })
    .from(pronunciationItem)
    .where(eq(pronunciationItem.userId, userId));
  return [...new Set(rows.map((r) => r.hanzi))];
}
