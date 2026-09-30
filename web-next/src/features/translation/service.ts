/**
 * Luyện dịch với kho câu mẫu có sẵn (`src/data/translation`). Phiên lưu ở server (bảng translation_session):
 * làm tiếp được khi tải lại / đổi thiết bị; đáp án, phân tích ngữ pháp và id câu mẫu chỉ gửi xuống sau khi trả lời.
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { grammar, grammarExample, sentence, translationSession, vocab } from "@/server/db/schema";
import { T_ITEMS, T_ITEM_BY_ID, type TItem } from "@/data/translation/items";
import { T_GRAMMAR, T_GRAMMAR_BY_ID } from "@/data/translation/grammar";
import { normalizeChinese, normalizeVietnamese } from "@/lib/sentence-grading";
import { fold } from "@/lib/fold";
import type { Locale } from "@/i18n/config";
import { recordActivity, vocabByHsk } from "@/features/progress/service";
import { createSentence } from "@/features/sentences/service";
import { sentenceInputSchema } from "@/features/sentences/schema";
import { T_MAX_ELAPSED, type BankQuery, type TDirection, type TranslationConfig } from "./schema";

export class TranslationError extends Error {
  constructor(
    public code: "not-found" | "empty" | "invalid" | "duplicate",
    message: string,
  ) {
    super(message);
  }
}
const GONE = "Bài luyện dịch không còn tồn tại. Hãy tạo bài mới.";

/**
 * Câu lấy từ ví dụ trong ngữ pháp của chính người dùng (id `u:<id ví dụ>`). Lưu nguyên nội dung vào bài làm để bài cũ
 * vẫn xem lại được khi ví dụ bị sửa / xoá.
 */
export type CustomItem = Omit<TItem, "grammar"> & {
  custom: true;
  grammar: [];
  own: { name: string; structure: string; explain: string };
};
type AnyItem = TItem | CustomItem;
const isCustom = (i: AnyItem): i is CustomItem => "custom" in i;

type Stored = {
  itemId: string;
  custom?: CustomItem;
  direction: TDirection;
  userAnswer: string | null;
  result: "correct" | "wrong" | "skipped" | null;
  /** 0: chưa xem gợi ý; 1: đã xem từ khoá; 2: đã xem cả cấu trúc ngữ pháp. */
  hints: number;
  overridden?: boolean;
  similarity?: number;
};
type Row = typeof translationSession.$inferSelect;

// ---------- Nội dung (dạng theo ngôn ngữ) ----------

const loc = <T extends { vi: string; en: string }>(x: T, l: Locale) => x[l];

export function localGrammar(l: Locale) {
  return T_GRAMMAR.map((g) => ({
    id: g.id,
    level: g.level,
    name: loc(g.name, l),
    structure: g.structure,
    explain: loc(g.explain, l),
  }));
}

const rawOf = (q: Stored): AnyItem => q.custom ?? T_ITEM_BY_ID.get(q.itemId)!;

function grammarOf(item: AnyItem, l: Locale) {
  if (isCustom(item)) return [{ id: "own", ...item.own, pattern: item.zh }];
  return item.grammar.map((g) => {
    const d = T_GRAMMAR_BY_ID.get(g.id)!;
    return { id: g.id, name: loc(d.name, l), structure: d.structure, explain: loc(d.explain, l), pattern: g.pattern };
  });
}
const wordsOf = (item: AnyItem, l: Locale) =>
  item.words.map((w) => ({ zh: w.zh, py: w.py, meaning: l === "en" ? w.en : w.vi }));

/** Một câu mẫu đầy đủ (kho câu mẫu là nội dung học công khai, không phải dữ liệu riêng). */
export function localItem(item: AnyItem, l: Locale) {
  const tr = l === "en" ? item.en : item.vi;
  return {
    id: item.id,
    type: item.type,
    level: item.level,
    topic: item.topic,
    zh: item.zh,
    py: item.py,
    translation: tr[0]!,
    accepted: tr,
    alt: item.alt ?? [],
    words: wordsOf(item, l),
    grammar: grammarOf(item, l),
  };
}
export type LocalItem = ReturnType<typeof localItem>;

export function listBank(q: BankQuery, l: Locale) {
  const needle = q.q ? fold(q.q) : "";
  return T_ITEMS.filter(
    (i) =>
      (!q.type || i.type === q.type) &&
      (!q.level || i.level === q.level) &&
      (!q.topic || i.topic === q.topic) &&
      (!q.grammar || i.grammar.some((g) => g.id === q.grammar)) &&
      (!needle ||
        i.zh.includes(q.q!) ||
        fold(i.py).replace(/\s+/g, "").includes(needle.replace(/\s+/g, "")) ||
        [...i.vi, ...i.en].some((t) => fold(t).includes(needle))),
  ).map((i) => localItem(i, l));
}

export function getBankItem(id: string, l: Locale) {
  const item = T_ITEM_BY_ID.get(id);
  if (!item) throw new TranslationError("not-found", "Không tìm thấy câu mẫu này.");
  return localItem(item, l);
}

// ---------- Chấm ----------

/** Độ giống (0–100) theo dãy con chung dài nhất — để người học biết mình dịch gần đúng đến đâu. */
export function similarity(a: string, b: string) {
  const x = [...a];
  const y = [...b];
  if (!x.length || !y.length) return 0;
  let prev = new Array<number>(y.length + 1).fill(0);
  for (let i = 1; i <= x.length; i++) {
    const cur = new Array<number>(y.length + 1).fill(0);
    for (let j = 1; j <= y.length; j++)
      cur[j] = x[i - 1] === y[j - 1] ? prev[j - 1]! + 1 : Math.max(prev[j]!, cur[j - 1]!);
    prev = cur;
  }
  return Math.round((200 * prev[y.length]!) / (x.length + y.length));
}

export function gradeTranslation(item: AnyItem, direction: TDirection, lang: Locale, answer: string) {
  const refs =
    direction === "to-zh"
      ? [item.zh, ...(item.alt ?? [])].map(normalizeChinese)
      : (lang === "en" ? item.en : item.vi).map(normalizeVietnamese);
  const a = direction === "to-zh" ? normalizeChinese(answer) : normalizeVietnamese(answer);
  if (!a) return { ok: false, similarity: 0 };
  return { ok: refs.includes(a), similarity: Math.max(...refs.map((r) => similarity(a, r))) };
}

// ---------- Chọn câu ----------

function shuffle<T>(a: T[]): T[] {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

/** Trình độ ước lượng (HSK 1–4) theo số từ HSK đã có trong kho từ vựng: có ≥ 30% từ của cấp n thì lên cấp n + 1. */
export async function estimateLevel(userId: string) {
  const rows = await vocabByHsk(userId);
  let level = 1;
  for (const r of rows.filter((r) => r.level <= 3)) {
    if (r.total && r.inBank / r.total >= 0.3) level = r.level + 1;
    else break;
  }
  return Math.min(level, 4);
}

/** Lần gần nhất đã làm từng câu (id câu → thời điểm), để bài mới / làm lại ưu tiên câu chưa làm, rồi câu làm lâu nhất. */
async function lastSeen(userId: string) {
  const rows = await db
    .select({ questions: translationSession.questions, at: translationSession.startedAt })
    .from(translationSession)
    .where(eq(translationSession.userId, userId))
    .orderBy(desc(translationSession.startedAt))
    .limit(100);
  const m = new Map<string, number>();
  for (const r of rows) for (const q of r.questions as Stored[]) if (!m.has(q.itemId)) m.set(q.itemId, r.at.getTime());
  return m;
}

/** Ngữ pháp của tôi (mục Ngữ pháp) để chọn khi luyện dịch: số câu ví dụ dùng được (có nghĩa tiếng Việt). */
export async function myGrammarForTranslation(userId: string) {
  const rows = await db
    .select({ id: grammar.id, title: grammar.title, structure: grammar.structure, updatedAt: grammar.updatedAt })
    .from(grammar)
    .where(eq(grammar.userId, userId))
    .orderBy(desc(grammar.updatedAt));
  if (!rows.length) return [];
  const ex = await db
    .select({ grammarId: grammarExample.grammarId, vietnamese: grammarExample.vietnamese })
    .from(grammarExample)
    .where(
      inArray(
        grammarExample.grammarId,
        rows.map((r) => r.id),
      ),
    );
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    structure: r.structure.split("\n")[0] ?? "",
    examples: ex.filter((e) => e.grammarId === r.id && e.vietnamese.trim()).length,
  }));
}

const hanOf = (s: string) => [...new Set(s.match(/\p{Script=Han}/gu) ?? [])];

/** Câu hỏi từ ngữ pháp của tôi: câu ví dụ đã nhập; ngữ pháp chưa có ví dụ → câu mẫu hệ thống có đúng các chữ Hán của cấu trúc. */
async function ownGrammarItems(userId: string, ids: string[], type: TItem["type"]) {
  if (!ids.length) return { custom: [] as CustomItem[], matched: [] as TItem[] };
  const gs = await db
    .select()
    .from(grammar)
    .where(and(eq(grammar.userId, userId), inArray(grammar.id, ids)));
  const ex = gs.length
    ? await db
        .select()
        .from(grammarExample)
        .where(
          inArray(
            grammarExample.grammarId,
            gs.map((g) => g.id),
          ),
        )
    : [];
  const mine = await db
    .select({ hanzi: vocab.hanzi, pinyin: vocab.pinyin, meaningVi: vocab.meaningVi })
    .from(vocab)
    .where(eq(vocab.userId, userId));
  const custom: CustomItem[] = [];
  const matched: TItem[] = [];
  for (const g of gs) {
    const own = {
      name: g.title,
      structure: g.structure.split("\n").join(" · "),
      explain: [g.meaning, g.notes].filter(Boolean).join("\n"),
    };
    const usable = ex.filter((e) => e.grammarId === g.id && e.chinese.trim() && e.vietnamese.trim());
    if (type === "sentence" && usable.length) {
      for (const e of usable)
        custom.push({
          custom: true,
          id: `u:${e.id}`,
          type: "sentence",
          level: 0,
          topic: "",
          zh: e.chinese,
          py: e.pinyin,
          vi: e.vietnamese
            .split(/\s\/\s|;/)
            .map((x) => x.trim())
            .filter(Boolean),
          en: e.vietnamese
            .split(/\s\/\s|;/)
            .map((x) => x.trim())
            .filter(Boolean),
          words: mine
            .filter((v) => [...v.hanzi].length >= 2 && e.chinese.includes(v.hanzi))
            .slice(0, 8)
            .map((v) => ({ zh: v.hanzi, py: v.pinyin, vi: v.meaningVi, en: v.meaningVi })),
          grammar: [],
          own,
        });
      continue;
    }
    const keys = hanOf(g.structure).length ? hanOf(g.structure) : hanOf(g.title);
    if (keys.length) matched.push(...T_ITEMS.filter((i) => i.type === type && keys.every((k) => i.zh.includes(k))));
  }
  return { custom, matched };
}

export async function pickItems(userId: string, cfg: Omit<TranslationConfig, "lang">) {
  let pool: AnyItem[] = T_ITEMS.filter(
    (i) => i.type === cfg.type && (!cfg.level || i.level === cfg.level) && (!cfg.topic || i.topic === cfg.topic),
  );
  if (cfg.source === "grammar") {
    const sys = (pool as TItem[]).filter((i) => i.grammar.some((g) => cfg.grammarIds.includes(g.id)));
    const own = await ownGrammarItems(userId, cfg.myGrammarIds ?? [], cfg.type);
    const ids = new Set<string>();
    pool = [...own.custom, ...sys, ...own.matched].filter((i) => !ids.has(i.id) && (ids.add(i.id), true));
  }
  if (cfg.source === "vocab") {
    const mine = (await db.select({ hanzi: vocab.hanzi }).from(vocab).where(eq(vocab.userId, userId))).map(
      (r) => r.hanzi,
    );
    const set = new Set(mine);
    const long = mine.filter((h) => [...h].length >= 2);
    pool = pool.filter((i) => i.words.some((w) => set.has(w.zh)) || long.some((h) => i.zh.includes(h)));
  }
  const seen = await lastSeen(userId);
  const est = cfg.level ? cfg.level : await estimateLevel(userId);
  // Tự chọn: không quá trình độ + 1 (câu từ ngữ pháp của tôi không có cấp → luôn giữ).
  // Chọn theo ngữ pháp là người học tự chọn → không giới hạn cấp.
  if (!cfg.level && cfg.source !== "grammar") pool = pool.filter((i) => isCustom(i) || i.level <= est + 1);
  // Câu chưa làm trước; đã làm thì câu làm lâu nhất trước (làm lại → ra câu khác); rồi đúng trình độ; rồi ngẫu nhiên.
  const scored = shuffle(pool).map((i) => ({
    i,
    seen: seen.get(i.id) ?? 0,
    lv: isCustom(i) ? 0 : Math.abs(i.level - est),
  }));
  scored.sort((a, b) => a.seen - b.seen || a.lv - b.lv);
  return { items: scored.slice(0, cfg.count).map((s) => s.i), level: est };
}

// ---------- Phiên ----------

export async function createTranslationSession(userId: string, cfg: TranslationConfig) {
  const { items } = await pickItems(userId, cfg);
  if (!items.length) throw new TranslationError("empty", "Không có câu mẫu nào phù hợp. Hãy đổi lựa chọn.");
  const questions: Stored[] = items.map((i, n) => ({
    itemId: i.id,
    ...(isCustom(i) ? { custom: i } : {}),
    direction: cfg.direction === "mixed" ? (n % 2 ? "from-zh" : "to-zh") : cfg.direction,
    userAnswer: null,
    result: null,
    hints: 0,
  }));
  await db
    .update(translationSession)
    .set({ status: "abandoned" })
    .where(and(eq(translationSession.userId, userId), eq(translationSession.status, "active")));
  const [row] = await db
    .insert(translationSession)
    .values({ userId, config: { ...cfg, count: questions.length }, questions })
    .returning({ id: translationSession.id });
  return row!.id;
}

function toClient(row: Row) {
  const cfg = row.config as TranslationConfig;
  const l = cfg.lang;
  const qs = row.questions as Stored[];
  return {
    id: row.id,
    config: cfg,
    status: row.status,
    currentIndex: row.currentIndex,
    correctCount: row.correctCount,
    wrongCount: row.wrongCount,
    skippedCount: row.skippedCount,
    elapsedSec: row.elapsedSec,
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    total: qs.length,
    questions: qs.map((q) => {
      const item = rawOf(q);
      const answered = q.result !== null;
      const toZh = q.direction === "to-zh";
      return {
        type: item.type,
        level: item.level,
        direction: q.direction,
        prompt: toZh
          ? { text: (l === "en" ? item.en : item.vi)[0]! }
          : { text: item.zh, ...(cfg.showPinyin ? { py: item.py } : {}) },
        hints: q.hints,
        ...(q.hints >= 1 || answered ? { hintWords: wordsOf(item, l) } : {}),
        ...(q.hints >= 2 || answered
          ? { hintGrammar: grammarOf(item, l).map(({ name, structure }) => ({ name, structure })) }
          : {}),
        answered,
        userAnswer: q.userAnswer,
        result: q.result,
        overridden: !!q.overridden,
        ...(answered ? { similarity: q.similarity ?? 0, reveal: localItem(item, l) } : {}),
      };
    }),
  };
}
export type ClientTranslationSession = ReturnType<typeof toClient>;
export type ClientTranslationQuestion = ClientTranslationSession["questions"][number];

async function loadActive(userId: string, sessionId?: string) {
  const [row] = await db
    .select()
    .from(translationSession)
    .where(
      and(
        eq(translationSession.userId, userId),
        eq(translationSession.status, "active"),
        ...(sessionId ? [eq(translationSession.id, sessionId)] : []),
      ),
    )
    .orderBy(desc(translationSession.startedAt))
    .limit(1);
  return row ?? null;
}

export async function getActiveTranslation(userId: string) {
  const row = await loadActive(userId);
  return row ? toClient(row) : null;
}

/** Một bài của chính mình (đang làm hoặc đã xong). Bài của người khác → không tìm thấy. */
export async function getTranslationSession(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(translationSession)
    .where(and(eq(translationSession.id, id), eq(translationSession.userId, userId)))
    .limit(1);
  if (!row || row.status === "abandoned") throw new TranslationError("not-found", GONE);
  return toClient(row);
}

export async function translationHistory(userId: string, limit = 10) {
  const rows = await db
    .select()
    .from(translationSession)
    .where(and(eq(translationSession.userId, userId), eq(translationSession.status, "completed")))
    .orderBy(desc(translationSession.completedAt))
    .limit(Math.min(Math.max(limit, 1), 50));
  return rows.map((r) => {
    const cfg = r.config as TranslationConfig;
    const qs = r.questions as Stored[];
    return {
      id: r.id,
      type: cfg.type,
      direction: cfg.direction,
      source: cfg.source,
      correct: r.correctCount,
      total: qs.length,
      elapsedSec: r.elapsedSec,
      completedAt: r.completedAt!.toISOString(),
      first: rawOf(qs[0]!).zh,
    };
  });
}

const furthest = (qs: Stored[]) => {
  const i = qs.findIndex((q) => q.result === null);
  return i < 0 ? qs.length - 1 : i;
};
const clampElapsed = (prev: number, v?: number) =>
  v === undefined ? prev : Math.max(prev, Math.min(Math.round(v), T_MAX_ELAPSED));

async function mutate(
  userId: string,
  sessionId: string,
  index: number | null,
  elapsed: number | undefined,
  fn: (q: Stored | null, row: Row, c: { correct: number; wrong: number; skipped: number }) => void,
) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(translationSession)
      .where(
        and(
          eq(translationSession.id, sessionId),
          eq(translationSession.userId, userId),
          eq(translationSession.status, "active"),
        ),
      )
      .for("update")
      .limit(1);
    if (!row) throw new TranslationError("not-found", GONE);
    const qs = row.questions as Stored[];
    let q: Stored | null = null;
    if (index !== null) {
      q = qs[index] ?? null;
      if (!q || index > furthest(qs)) throw new TranslationError("invalid", "Câu hỏi không tồn tại.");
    }
    const c = { correct: row.correctCount, wrong: row.wrongCount, skipped: row.skippedCount };
    fn(q, row, c);
    const [updated] = await tx
      .update(translationSession)
      .set({
        questions: qs,
        correctCount: c.correct,
        wrongCount: c.wrong,
        skippedCount: c.skipped,
        elapsedSec: clampElapsed(row.elapsedSec, elapsed),
        ...(index !== null ? { currentIndex: index } : {}),
      })
      .where(eq(translationSession.id, row.id))
      .returning();
    return toClient(updated!);
  });
}

export async function answerTranslation(
  userId: string,
  sessionId: string,
  index: number,
  answer: string,
  elapsed?: number,
) {
  return mutate(userId, sessionId, index, elapsed, (q, row, c) => {
    if (!q || q.result !== null) return; // đã chấm → giữ nguyên
    const cfg = row.config as TranslationConfig;
    q.userAnswer = answer.trim();
    const g = gradeTranslation(rawOf(q), q.direction, cfg.lang, q.userAnswer);
    q.result = g.ok ? "correct" : "wrong";
    q.similarity = g.similarity;
    if (g.ok) c.correct++;
    else c.wrong++;
  });
}

export async function skipTranslation(userId: string, sessionId: string, index: number, elapsed?: number) {
  return mutate(userId, sessionId, index, elapsed, (q, _row, c) => {
    if (!q || q.result !== null) return;
    q.result = "skipped";
    q.similarity = 0;
    c.skipped++;
  });
}

/** Gợi ý từng bước: lần 1 → từ khoá, lần 2 → cấu trúc ngữ pháp. */
export async function hintTranslation(userId: string, sessionId: string, index: number) {
  return mutate(userId, sessionId, index, undefined, (q) => {
    if (q && q.result === null) q.hints = Math.min(2, q.hints + 1);
  });
}

/** Máy chấm sai nhưng người học dịch đúng theo cách khác → tính là đúng. */
export async function overrideTranslation(userId: string, sessionId: string, index: number) {
  return mutate(userId, sessionId, index, undefined, (q, _row, c) => {
    if (q?.result !== "wrong") throw new TranslationError("invalid", "Chỉ đổi được câu đang bị chấm sai.");
    q.result = "correct";
    q.overridden = true;
    c.wrong--;
    c.correct++;
  });
}

export async function moveTranslation(userId: string, sessionId: string, index: number) {
  const row = await loadActive(userId, sessionId);
  if (!row) throw new TranslationError("not-found", GONE);
  const i = Math.max(0, Math.min(index, furthest(row.questions as Stored[])));
  await db.update(translationSession).set({ currentIndex: i }).where(eq(translationSession.id, row.id));
  return i;
}

/** Lưu thời gian làm bài (khi tạm dừng / rời trang). */
export async function saveTranslationTime(userId: string, sessionId: string, elapsed: number) {
  const s = await mutate(userId, sessionId, null, elapsed, () => undefined);
  return { elapsedSec: s.elapsedSec };
}

export async function completeTranslation(userId: string, sessionId: string, elapsed?: number) {
  const s = await mutate(userId, sessionId, null, elapsed, (_q, row) => {
    if ((row.questions as Stored[]).some((q) => q.result === null))
      throw new TranslationError("invalid", "Bạn chưa làm hết các câu.");
  });
  await db
    .update(translationSession)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(translationSession.id, s.id));
  const cfg = s.config;
  await recordActivity(db, userId, {
    kind: "translation",
    title: s.questions[0]?.reveal?.zh ?? "",
    detail: `${cfg.type}:${cfg.direction}`,
    refId: s.id,
    correct: s.correctCount,
    total: s.total,
    durationSec: s.elapsedSec,
  });
  return getTranslationSession(userId, s.id);
}

export async function abandonTranslation(userId: string) {
  await db
    .update(translationSession)
    .set({ status: "abandoned" })
    .where(and(eq(translationSession.userId, userId), eq(translationSession.status, "active")));
}

// ---------- Lưu vào Kho câu của tôi ----------

/** Câu ví dụ trong ngữ pháp của chính mình (`u:<id>`) → dạng câu mẫu; của người khác / không có → null. */
async function ownExampleItem(userId: string, itemId: string) {
  const exId = itemId.slice(2);
  if (!/^[0-9a-f-]{36}$/i.test(exId)) return null;
  const [r] = await db
    .select({
      zh: grammarExample.chinese,
      py: grammarExample.pinyin,
      vi: grammarExample.vietnamese,
      structure: grammar.structure,
    })
    .from(grammarExample)
    .innerJoin(grammar, eq(grammar.id, grammarExample.grammarId))
    .where(and(eq(grammarExample.id, exId), eq(grammar.userId, userId)))
    .limit(1);
  return r ? { zh: r.zh, py: r.py, vi: [r.vi], en: [r.vi], note: r.structure.split("\n")[0] ?? "", level: 0 } : null;
}

export async function saveItemToBank(userId: string, itemId: string, l: Locale) {
  const sys = T_ITEM_BY_ID.get(itemId);
  const item = sys
    ? {
        ...sys,
        note: sys.grammar.map((g) => T_GRAMMAR_BY_ID.get(g.id)!.structure).join(" · "),
      }
    : itemId.startsWith("u:")
      ? await ownExampleItem(userId, itemId)
      : null;
  if (!item) throw new TranslationError("not-found", "Không tìm thấy câu mẫu này.");
  const [dup] = await db
    .select({ id: sentence.id })
    .from(sentence)
    .where(and(eq(sentence.userId, userId), inArray(sentence.chinese, [item.zh])))
    .limit(1);
  if (dup) throw new TranslationError("duplicate", "Câu này đã có trong kho câu của bạn.");
  const note = item.note.slice(0, 200);
  const id = await createSentence(
    userId,
    sentenceInputSchema.parse({
      chinese: item.zh.slice(0, 200),
      pinyin: item.py.slice(0, 400),
      vietnamese: (l === "en" ? item.en : item.vi)[0]!.slice(0, 300),
      note,
      tags: [l === "en" ? "Translation" : "Luyện dịch", ...(item.level ? [`HSK${item.level}`] : [])],
    }),
  );
  return { id };
}
