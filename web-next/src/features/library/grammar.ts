/**
 * Thư viện LingYu — bài ngữ pháp biên soạn sẵn (`src/data/library/grammar.ts`).
 * Nội dung công khai; "đã học" và "yêu thích" là của riêng từng người (bảng library_learned / library_favorite),
 * mọi truy vấn lọc theo user của phiên. "Lưu" = chép bài vào Ngữ pháp của tôi (chỉ vào kho người bấm).
 */
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { grammar, libraryFavorite, libraryLearned } from "@/server/db/schema";
import { fold, foldCompact } from "@/lib/fold";
import type { Locale } from "@/i18n/config";
import { LIB_GRAMMAR, LIB_GRAMMAR_BY_ID, LIB_GRAMMAR_TOPICS, type LibGrammar } from "@/data/library/grammar";
import { LIB_VOCAB_SETS } from "@/data/library/vocab-sets";
import { createGrammar } from "@/features/grammar/service";
import { grammarInputSchema } from "@/features/grammar/schema";
import { LibraryError } from "./service";
import type { GrammarListParams } from "./schema";

const KIND = "grammar";
const NOT_FOUND = "Không tìm thấy bài ngữ pháp này.";

const tr = (x: { vi: string; en: string }, l: Locale) => (l === "en" ? x.en : x.vi);
const pointOf = (id: string) => {
  const g = LIB_GRAMMAR_BY_ID.get(id);
  if (!g) throw new LibraryError("not-found", NOT_FOUND);
  return g;
};

async function mine(userId: string, table: typeof libraryLearned | typeof libraryFavorite) {
  const rows = await db
    .select({ itemId: table.itemId })
    .from(table)
    .where(and(eq(table.userId, userId), eq(table.kind, KIND)));
  return new Set(rows.map((r) => r.itemId));
}
/** Tiêu đề khi lưu vào Ngữ pháp của tôi — cả hai ngôn ngữ để nhận ra bài đã lưu dù đổi ngôn ngữ. */
const titleOf = (g: LibGrammar, l: Locale) => `${g.zh} – ${tr(g.name, l)}`.slice(0, 120);
async function savedIds(userId: string, points: LibGrammar[]) {
  const titles = points.flatMap((g) => [titleOf(g, "vi"), titleOf(g, "en")]);
  if (!titles.length) return new Set<string>();
  const rows = await db
    .select({ title: grammar.title })
    .from(grammar)
    .where(and(eq(grammar.userId, userId), inArray(grammar.title, titles)));
  const have = new Set(rows.map((r) => r.title));
  return new Set(points.filter((g) => have.has(titleOf(g, "vi")) || have.has(titleOf(g, "en"))).map((g) => g.id));
}

function card(g: LibGrammar, l: Locale, learned: Set<string>, fav: Set<string>) {
  const ex = g.examples[0]!;
  return {
    id: g.id,
    hsk: g.hsk,
    no: g.no,
    zh: g.zh,
    py: g.py,
    emoji: g.emoji,
    tone: g.tone,
    topic: g.topic,
    name: tr(g.name, l),
    summary: tr(g.summary, l),
    structure: g.structure.map((s) => s.zh).join(" + "),
    example: { zh: ex.zh, py: ex.py, meaning: tr(ex, l) },
    added: g.added,
    learned: learned.has(g.id),
    favorite: fav.has(g.id),
  };
}
export type GrammarCard = ReturnType<typeof card>;

function matches(g: LibGrammar, q: string) {
  if (!q) return true;
  const hsk = /^hsk\s*([1-6])$/i.exec(q);
  if (hsk) return g.hsk === Number(hsk[1]);
  const f = fold(q);
  const fc = foldCompact(q);
  return (
    g.zh.replace(/\s|…/g, "").includes(q.replace(/\s|…/g, "")) ||
    foldCompact(g.py).includes(fc) ||
    fold(`${g.name.vi} ${g.name.en} ${g.summary.vi} ${g.summary.en}`).includes(f) ||
    g.examples.some((e) => e.zh.includes(q))
  );
}

/** Danh sách bài ngữ pháp (lọc HSK / chủ đề / trạng thái, tìm, sắp xếp) + lộ trình HSK và chủ đề kèm số bài. */
export async function listLibGrammar(userId: string, p: GrammarListParams, l: Locale) {
  const [learned, fav] = await Promise.all([mine(userId, libraryLearned), mine(userId, libraryFavorite)]);
  const all = LIB_GRAMMAR.map((g) => card(g, l, learned, fav));
  const by = {
    order: (a: GrammarCard, b: GrammarCard) => a.hsk - b.hsk || a.no - b.no,
    newest: (a: GrammarCard, b: GrammarCard) => b.added.localeCompare(a.added) || a.hsk - b.hsk || a.no - b.no,
    name: (a: GrammarCard, b: GrammarCard) => a.name.localeCompare(b.name, l) || a.no - b.no,
  }[p.sort];
  const items = all
    .filter((c) => {
      if (p.hsk && c.hsk !== p.hsk) return false;
      if (p.topic && c.topic !== p.topic) return false;
      if (p.status === "learned" && !c.learned) return false;
      if (p.status === "todo" && c.learned) return false;
      if (p.status === "favorite" && !c.favorite) return false;
      return matches(LIB_GRAMMAR_BY_ID.get(c.id)!, p.q);
    })
    .sort(by);
  const roadmap = [1, 2, 3, 4, 5, 6].map((hsk) => {
    const lv = all.filter((c) => c.hsk === hsk);
    return { hsk, total: lv.length, learned: lv.filter((c) => c.learned).length };
  });
  const topics = LIB_GRAMMAR_TOPICS.map((topic) => ({ topic, total: all.filter((c) => c.topic === topic).length }))
    .filter((t) => t.total > 0)
    .sort((a, b) => b.total - a.total);
  return {
    items,
    total: items.length,
    all: all.length,
    learned: all.filter((c) => c.learned).length,
    roadmap,
    topics,
  };
}
export type LibGrammarList = Awaited<ReturnType<typeof listLibGrammar>>;

/** Một bài ngữ pháp đầy đủ (theo ngôn ngữ) + đã học / yêu thích / đã lưu + các bài cùng cấp và bài liên quan. */
export async function getLibGrammar(userId: string, id: string, l: Locale) {
  const g = pointOf(id);
  const [learned, fav, saved] = await Promise.all([
    mine(userId, libraryLearned),
    mine(userId, libraryFavorite),
    savedIds(userId, [g]),
  ]);
  const level = LIB_GRAMMAR.filter((x) => x.hsk === g.hsk).sort((a, b) => a.no - b.no);
  return {
    ...card(g, l, learned, fav),
    saved: saved.has(g.id),
    intro: tr(g.intro, l),
    structure: g.structure.map((s) => ({ zh: s.zh, kind: s.kind, label: tr(s.label, l) })),
    usage: g.usage.map((x) => tr(x, l)),
    meaning: g.meaning.map((x) => tr(x, l)),
    notes: g.notes.map((x) => tr(x, l)),
    examples: g.examples.map((e) => ({ zh: e.zh, py: e.py, meaning: tr(e, l), emoji: e.emoji })),
    quiz: g.quiz.map((q) => ({
      q: q.q,
      prompt: q.prompt ? tr(q.prompt, l) : "",
      options: q.options,
      answer: q.answer,
      explain: tr(q.explain, l),
    })),
    level: level.map((x) => ({ id: x.id, no: x.no, zh: x.zh, name: tr(x.name, l), learned: learned.has(x.id) })),
    progress: { learned: level.filter((x) => learned.has(x.id)).length, total: level.length },
    related: g.related
      .map((r) => LIB_GRAMMAR_BY_ID.get(r))
      .filter((x): x is LibGrammar => !!x)
      .map((x) => ({ id: x.id, hsk: x.hsk, zh: x.zh, name: tr(x.name, l), emoji: x.emoji, tone: x.tone })),
    sets: LIB_VOCAB_SETS.filter((s) => s.hsk === g.hsk)
      .slice(0, 3)
      .map((s) => ({ id: s.id, title: l === "en" ? s.titleEn : s.titleVi, emoji: s.emoji, total: s.words.length })),
    prev: level[level.indexOf(g) - 1]?.id ?? null,
    next: level[level.indexOf(g) + 1]?.id ?? null,
  };
}
export type LibGrammarDetail = Awaited<ReturnType<typeof getLibGrammar>>;

/** Đánh dấu đã học / bỏ đánh dấu một bài; trả về tiến độ của cấp HSK đó. */
export async function setLibGrammarLearned(userId: string, id: string, on: boolean) {
  const g = pointOf(id);
  if (on) await db.insert(libraryLearned).values({ userId, kind: KIND, itemId: g.id, key: "" }).onConflictDoNothing();
  else
    await db
      .delete(libraryLearned)
      .where(and(eq(libraryLearned.userId, userId), eq(libraryLearned.kind, KIND), eq(libraryLearned.itemId, g.id)));
  const learned = await mine(userId, libraryLearned);
  const level = LIB_GRAMMAR.filter((x) => x.hsk === g.hsk);
  return { learned: on, progress: { learned: level.filter((x) => learned.has(x.id)).length, total: level.length } };
}

/** Yêu thích / bỏ yêu thích một bài. */
export async function setLibGrammarFavorite(userId: string, id: string, on: boolean) {
  const g = pointOf(id);
  if (on) await db.insert(libraryFavorite).values({ userId, kind: KIND, itemId: g.id, key: "" }).onConflictDoNothing();
  else
    await db
      .delete(libraryFavorite)
      .where(and(eq(libraryFavorite.userId, userId), eq(libraryFavorite.kind, KIND), eq(libraryFavorite.itemId, g.id)));
  return { favorite: on };
}

/** Lưu bài vào Ngữ pháp của tôi (tag "Thư viện LingYu" + HSK). Đã lưu rồi thì không tạo bản trùng. */
export async function saveLibGrammarToMine(userId: string, id: string, l: Locale) {
  const g = pointOf(id);
  if ((await savedIds(userId, [g])).has(g.id)) return { added: false };
  const input = grammarInputSchema.parse({
    title: titleOf(g, l),
    meaning: [tr(g.summary, l), ...g.meaning.map((x) => tr(x, l))].join("\n"),
    structure: g.structure.map((s) => s.zh).join(" + "),
    notes: [...g.usage, ...g.notes].map((x) => `• ${tr(x, l)}`).join("\n"),
    examples: g.examples.map((e) => ({ chinese: e.zh, pinyin: e.py, vietnamese: tr(e, l) })),
    tags: [l === "en" ? "LingYu Library" : "Thư viện LingYu", `HSK${g.hsk}`],
  });
  return { added: true, id: await createGrammar(userId, input) };
}
