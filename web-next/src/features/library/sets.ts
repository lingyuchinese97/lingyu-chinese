/**
 * Thư viện LingYu — bộ từ vựng biên soạn sẵn (`src/data/library/vocab-sets.ts`).
 * Nội dung công khai; trạng thái "đã học" và "yêu thích" là của riêng từng người (bảng library_learned / library_favorite),
 * mọi truy vấn đều lọc theo user của phiên. "Lưu" = chép từ vào Từ vựng của tôi.
 */
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { libraryFavorite, libraryLearned, vocab } from "@/server/db/schema";
import { fold, foldCompact } from "@/lib/fold";
import { splitSyllables, splitTone } from "@/lib/pinyin";
import { hskLevelOf, hskPinyinOf, hskPosOf, hskWords } from "@/lib/hsk";
import type { LibPos } from "./schema";
import { dictLookup } from "@/lib/builtin-dict";
import { createMany } from "@/features/vocabulary/service";
import { vocabInputSchema } from "@/features/vocabulary/schema";
import type { Locale } from "@/i18n/config";
import { LIB_SET_BY_ID, LIB_VOCAB_SETS, type LibSetWord, type LibVocabSet } from "@/data/library/vocab-sets";
import { analyzeWord } from "./analyze";
import { LibraryError } from "./service";
import type { SetListParams } from "./schema";

const SET = "vocab-set";
const WORD = "vocab-word";
const NOT_FOUND = "Không tìm thấy bộ từ vựng này.";
const WORD_NOT_FOUND = "Không tìm thấy từ này trong bộ.";

const setOf = (id: string) => {
  const s = LIB_SET_BY_ID.get(id);
  if (!s) throw new LibraryError("not-found", NOT_FOUND);
  return s;
};
const wordOf = (s: LibVocabSet, zh: string) => {
  const w = s.words.find((x) => x.zh === zh);
  if (!w) throw new LibraryError("not-found", WORD_NOT_FOUND);
  return w;
};

async function learnedMap(userId: string, setIds?: string[]) {
  const rows = await db
    .select({ itemId: libraryLearned.itemId, key: libraryLearned.key })
    .from(libraryLearned)
    .where(
      and(
        eq(libraryLearned.userId, userId),
        eq(libraryLearned.kind, WORD),
        ...(setIds ? [inArray(libraryLearned.itemId, setIds.length ? setIds : [""])] : []),
      ),
    );
  const m = new Map<string, Set<string>>();
  for (const r of rows) (m.get(r.itemId) ?? m.set(r.itemId, new Set()).get(r.itemId)!).add(r.key);
  return m;
}
async function favorites(userId: string, kind: string, itemId?: string) {
  const rows = await db
    .select({ itemId: libraryFavorite.itemId, key: libraryFavorite.key })
    .from(libraryFavorite)
    .where(
      and(
        eq(libraryFavorite.userId, userId),
        eq(libraryFavorite.kind, kind),
        ...(itemId ? [eq(libraryFavorite.itemId, itemId)] : []),
      ),
    );
  return rows;
}
async function mySaved(userId: string, hanzi: string[]) {
  if (!hanzi.length) return new Set<string>();
  const rows = await db
    .select({ hanzi: vocab.hanzi })
    .from(vocab)
    .where(and(eq(vocab.userId, userId), inArray(vocab.hanzi, hanzi)));
  return new Set(rows.map((r) => r.hanzi));
}

const tr = <T extends { vi: string; en: string }>(x: T, l: Locale) => (l === "en" ? x.en : x.vi);

function setCard(s: LibVocabSet, l: Locale, learned: number, favorite: boolean) {
  return {
    id: s.id,
    no: s.no,
    title: l === "en" ? s.titleEn : s.titleVi,
    titleZh: s.titleZh,
    emoji: s.emoji,
    tone: s.tone,
    hsk: s.hsk,
    topic: s.topic,
    kinds: s.kinds,
    desc: l === "en" ? s.descEn : s.descVi,
    featured: !!s.featured,
    added: s.added,
    total: s.words.length,
    learned,
    favorite,
    preview: s.words.slice(0, 4).map((w) => w.zh),
  };
}
export type SetCard = ReturnType<typeof setCard>;

function matches(s: LibVocabSet, q: string) {
  if (!q) return true;
  const f = fold(q);
  const fc = foldCompact(q);
  const hsk = /^hsk\s*([1-6])$/i.exec(q.trim());
  if (hsk) return s.hsk === Number(hsk[1]);
  return (
    fold(`${s.titleVi} ${s.titleEn} ${s.descVi}`).includes(f) ||
    s.titleZh.includes(q) ||
    s.words.some((w) => w.zh.includes(q) || foldCompact(w.py).includes(fc) || fold(w.vi).includes(f))
  );
}

/** Danh sách bộ từ vựng (lọc HSK / chủ đề / nhóm / yêu thích, tìm, sắp xếp) kèm tiến độ + yêu thích của người xem. */
export async function listSets(userId: string, p: SetListParams, l: Locale) {
  const [learned, fav] = await Promise.all([learnedMap(userId), favorites(userId, SET)]);
  const favSet = new Set(fav.map((f) => f.itemId));
  const all = LIB_VOCAB_SETS.map((s) => setCard(s, l, learned.get(s.id)?.size ?? 0, favSet.has(s.id)));
  let items = all.filter((c) => {
    const s = LIB_SET_BY_ID.get(c.id)!;
    if (p.hsk && s.hsk !== p.hsk) return false;
    if (p.topic && s.topic !== p.topic) return false;
    if (p.kind === "favorite" && !c.favorite) return false;
    if (p.kind !== "all" && p.kind !== "favorite" && !s.kinds.includes(p.kind)) return false;
    return matches(s, p.q);
  });
  const by = {
    order: (a: SetCard, b: SetCard) => a.no - b.no,
    newest: (a: SetCard, b: SetCard) => b.added.localeCompare(a.added) || a.no - b.no,
    name: (a: SetCard, b: SetCard) => a.title.localeCompare(b.title, l) || a.no - b.no,
    size: (a: SetCard, b: SetCard) => b.total - a.total || a.no - b.no,
  }[p.sort];
  items = [...items].sort(by);
  return {
    items,
    total: items.length,
    all: all.length,
    featured: all.filter((c) => c.featured).sort((a, b) => a.no - b.no),
    totalWords: LIB_VOCAB_SETS.reduce((n, s) => n + s.words.length, 0),
  };
}

const wordRow = (w: LibSetWord, l: Locale) => ({
  zh: w.zh,
  py: w.py,
  meaning: tr(w, l),
  pos: w.pos,
  emoji: w.emoji,
  hsk: (() => {
    const lv = hskLevelOf(w.zh);
    return lv && lv <= 6 ? lv : null;
  })(),
  example: { zh: w.ex.zh, py: w.ex.py, meaning: tr(w.ex, l) },
});

/** Một bộ từ vựng đầy đủ: danh sách từ + đã học / yêu thích / đã có trong Từ vựng của tôi (theo người xem). */
export async function getSet(userId: string, id: string, l: Locale) {
  const s = setOf(id);
  const [learned, favSet, favWords, saved] = await Promise.all([
    learnedMap(userId, [s.id]),
    favorites(userId, SET, s.id),
    favorites(userId, WORD, s.id),
    mySaved(
      userId,
      s.words.map((w) => w.zh),
    ),
  ]);
  const done = learned.get(s.id) ?? new Set<string>();
  const favW = new Set(favWords.map((f) => f.key));
  const related = LIB_VOCAB_SETS.filter((x) => x.id !== s.id && (x.topic === s.topic || x.hsk === s.hsk))
    .slice(0, 6)
    .map((x) => ({ id: x.id, title: l === "en" ? x.titleEn : x.titleVi, hsk: x.hsk }));
  return {
    ...setCard(s, l, done.size, favSet.length > 0),
    words: s.words.map((w) => ({
      ...wordRow(w, l),
      learned: done.has(w.zh),
      favorite: favW.has(w.zh),
      saved: saved.has(w.zh),
    })),
    related,
  };
}
export type SetDetail = Awaited<ReturnType<typeof getSet>>;

const TONE_KEYS = ["", "t1", "t2", "t3", "t4", "t5"] as const;

/** Chi tiết một từ trong bộ: cách phát âm (âm tiết + thanh), bộ thủ, từ liên quan, cách nhớ, thêm ví dụ (dữ liệu có sẵn). */
export async function getSetWord(userId: string, id: string, zh: string, l: Locale) {
  const s = setOf(id);
  const w = wordOf(s, zh);
  const detail = await getSet(userId, id, l);
  const a = analyzeWord(w.zh);
  const idx = s.words.indexOf(w);
  const syllables = w.py
    .split(/\s+/)
    .flatMap((t) => splitSyllables(t.replace(/'/g, "")))
    .map((syl) => ({ syl, tone: TONE_KEYS[splitTone(syl).tone] }));
  const extra = a.examples.filter((e) => e.zh !== w.ex.zh).slice(0, 2);
  const row = detail.words[idx]!;
  return {
    set: { id: s.id, title: detail.title, total: detail.total, learned: detail.learned },
    word: row,
    prev: s.words[idx - 1]?.zh ?? null,
    next: s.words[idx + 1]?.zh ?? null,
    syllables,
    examples: [row.example, ...extra.map((e) => ({ zh: e.zh, py: e.py, meaning: e.vi }))],
    components: a.components,
    mnemonic: a.mnemonic,
    // Từ có nghĩa lên trước (một số từ trong dữ liệu chỉ có pinyin).
    related: [...a.related.filter((r) => r.vi), ...a.related.filter((r) => !r.vi)].slice(0, 6),
    words: detail.words.map((x) => ({ zh: x.zh, py: x.py, meaning: x.meaning, emoji: x.emoji, learned: x.learned })),
  };
}
export type SetWordDetail = Awaited<ReturnType<typeof getSetWord>>;

/** Đánh dấu đã học / bỏ đánh dấu một từ trong bộ. */
export async function setWordLearned(userId: string, id: string, zh: string, on: boolean) {
  const s = setOf(id);
  wordOf(s, zh);
  if (on) await db.insert(libraryLearned).values({ userId, kind: WORD, itemId: s.id, key: zh }).onConflictDoNothing();
  else
    await db
      .delete(libraryLearned)
      .where(
        and(
          eq(libraryLearned.userId, userId),
          eq(libraryLearned.kind, WORD),
          eq(libraryLearned.itemId, s.id),
          eq(libraryLearned.key, zh),
        ),
      );
  const learned = (await learnedMap(userId, [s.id])).get(s.id)?.size ?? 0;
  return { learned: on, progress: { learned, total: s.words.length } };
}

/** Yêu thích / bỏ yêu thích một bộ (`zh` rỗng) hoặc một từ trong bộ. */
export async function setFavorite(userId: string, id: string, zh: string | null, on: boolean) {
  const s = setOf(id);
  if (zh) wordOf(s, zh);
  const kind = zh ? WORD : SET;
  const key = zh ?? "";
  if (on) await db.insert(libraryFavorite).values({ userId, kind, itemId: s.id, key }).onConflictDoNothing();
  else
    await db
      .delete(libraryFavorite)
      .where(
        and(
          eq(libraryFavorite.userId, userId),
          eq(libraryFavorite.kind, kind),
          eq(libraryFavorite.itemId, s.id),
          eq(libraryFavorite.key, key),
        ),
      );
  return { favorite: on };
}

/** Lưu cả bộ (hoặc một từ) vào Từ vựng của tôi — tag = tên bộ + HSK; từ đã có thì bỏ qua. */
export async function saveSetToMyVocab(userId: string, id: string, zh: string | null, l: Locale) {
  const s = setOf(id);
  const words = zh ? [wordOf(s, zh)] : s.words;
  const items = words.map((w) =>
    vocabInputSchema.parse({
      hanzi: w.zh,
      pinyin: w.py,
      meaningVi: w.vi,
      note: `${w.ex.zh} — ${w.ex.vi}`.slice(0, 200),
      tags: [`${l === "en" ? s.titleEn : s.titleVi}`.slice(0, 30), `HSK${s.hsk}`],
    }),
  );
  const r = await createMany(userId, items);
  return { added: r.added.length, skipped: r.skipped.length };
}

/** Trang chủ Thư viện: số bộ / từ, bộ nổi bật, mới nhất, chủ đề. */
export async function libraryHome(userId: string, l: Locale) {
  const list = await listSets(userId, { q: "", hsk: 0, topic: "", kind: "all", sort: "newest", view: "grid" }, l);
  return {
    sets: list.all,
    words: list.totalWords,
    featured: list.featured.slice(0, 6),
    newest: list.items.slice(0, 4),
    topics: [...new Set(LIB_VOCAB_SETS.map((s) => s.topic))],
  };
}

// ---------- Từ vựng theo HSK (danh sách chuẩn có sẵn) ----------

const HSK = "hsk-word";
const HSK_PAGE = 30;
const HSK_POS: Record<string, LibPos> = {
  名: "noun",
  动: "verb",
  形: "adjective",
  副: "adverb",
  代: "pronoun",
  量: "measure",
  数: "number",
  助: "particle",
  介: "preposition",
  连: "conjunction",
  叹: "interjection",
};
const hskItem = (lv: number) => `hsk${lv}`;

/** Từ vựng một cấp HSK (30 từ / trang): pinyin, nghĩa (từ điển có sẵn), ví dụ + cách nhớ (phân tích tự động), đã học. */
export async function listHskWords(userId: string, p: { level: number; q: string; page: number }) {
  const level = Math.min(6, Math.max(1, p.level)) as 1 | 2 | 3 | 4 | 5 | 6;
  const all = hskWords(level);
  const f = fold(p.q);
  const fc = foldCompact(p.q);
  const rows = all
    .map((zh) => ({ zh, py: hskPinyinOf(zh) ?? "", vi: dictLookup(zh)?.vi ?? "" }))
    .filter((r) => !p.q || r.zh.includes(p.q) || foldCompact(r.py).includes(fc) || (!!r.vi && fold(r.vi).includes(f)));
  const learnedRows = await db
    .select({ key: libraryLearned.key })
    .from(libraryLearned)
    .where(
      and(eq(libraryLearned.userId, userId), eq(libraryLearned.kind, HSK), eq(libraryLearned.itemId, hskItem(level))),
    );
  const done = new Set(learnedRows.map((r) => r.key));
  const pageCount = Math.max(1, Math.ceil(rows.length / HSK_PAGE));
  const page = Math.min(Math.max(1, p.page), pageCount);
  const start = (page - 1) * HSK_PAGE;
  const items = rows.slice(start, start + HSK_PAGE).map((r, i) => {
    const a = analyzeWord(r.zh);
    // Câu ví dụ ngắn nhất (dữ liệu bài đọc có câu rất dài).
    const ex = [...a.examples].sort((x, y) => [...x.zh].length - [...y.zh].length)[0];
    return {
      n: start + i + 1,
      zh: r.zh,
      py: r.py || a.pinyin,
      meaning: r.vi,
      pos: hskPosOf(r.zh)
        .map((p) => HSK_POS[p])
        .filter((p): p is LibPos => !!p)
        .slice(0, 2),
      example: ex ? { zh: ex.zh, py: ex.py, meaning: ex.vi } : null,
      mnemonic: a.mnemonic,
      learned: done.has(r.zh),
    };
  });
  return {
    level,
    items,
    total: rows.length,
    levelTotal: all.length,
    learned: [...done].filter((zh) => all.includes(zh)).length,
    page,
    pageCount,
  };
}
export type HskList = Awaited<ReturnType<typeof listHskWords>>;

/** Đánh dấu đã học một từ HSK (chỉ nhận từ đúng cấp). */
export async function setHskLearned(userId: string, level: number, zh: string, on: boolean) {
  if (!Number.isInteger(level) || level < 1 || level > 6 || !hskWords(level as 1).includes(zh))
    throw new LibraryError("not-found", WORD_NOT_FOUND);
  const where = and(
    eq(libraryLearned.userId, userId),
    eq(libraryLearned.kind, HSK),
    eq(libraryLearned.itemId, hskItem(level)),
    eq(libraryLearned.key, zh),
  );
  if (on)
    await db
      .insert(libraryLearned)
      .values({ userId, kind: HSK, itemId: hskItem(level), key: zh })
      .onConflictDoNothing();
  else await db.delete(libraryLearned).where(where);
  return { learned: on };
}
