/**
 * Đọc hiểu với kho bài đọc có sẵn (`src/data/reading`). Chọn bài tự động theo trình độ / từ vựng của người dùng, server chấm
 * (đáp án không gửi xuống trước khi nộp), lưu bài để đọc lại, lưu từ khoá vào kho Từ vựng. Mọi hàm lọc theo userId của phiên.
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { readingAttempt, readingSaved, vocab } from "@/server/db/schema";
import { R_PASSAGES, R_PASSAGE_BY_ID, type RPassage } from "@/data/reading/passages";
import { T_GRAMMAR_BY_ID } from "@/data/translation/grammar";
import { normalizeChinese } from "@/lib/sentence-grading";
import type { Locale } from "@/i18n/config";
import { recordActivity } from "@/features/progress/service";
import { estimateLevel } from "@/features/translation/service";
import { createVocab } from "@/features/vocabulary/service";
import { vocabInputSchema } from "@/features/vocabulary/schema";
import type { PickInput } from "./schema";

export class ReadingError extends Error {
  constructor(
    public code: "not-found" | "empty" | "invalid",
    message: string,
  ) {
    super(message);
  }
}
const NOT_FOUND = "Không tìm thấy bài đọc này.";

const tr = (x: { vi: string; en: string }, l: Locale) => x[l];

function passageOr404(id: string) {
  const p = R_PASSAGE_BY_ID.get(id);
  if (!p) throw new ReadingError("not-found", NOT_FOUND);
  return p;
}

export function summaryOf(p: RPassage, l: Locale) {
  return {
    id: p.id,
    level: p.level,
    type: p.type,
    topic: p.topic,
    title: p.title.zh,
    titleTr: tr(p.title, l),
    preview: p.lines
      .map((x) => x.zh)
      .join("")
      .slice(0, 40),
    words: p.words.length,
    questions: p.questions.length,
  };
}

function grammarOf(p: RPassage, l: Locale) {
  return p.grammar.map((g) => {
    const d = T_GRAMMAR_BY_ID.get(g.id)!;
    return { id: g.id, name: tr(d.name, l), structure: d.structure, explain: tr(d.explain, l), pattern: g.pattern };
  });
}

/** Bài đọc để hiển thị (KHÔNG có đáp án câu hỏi). */
export function localPassage(p: RPassage, l: Locale) {
  return {
    ...summaryOf(p, l),
    lines: p.lines.map((x) => ({ s: x.s ?? null, zh: x.zh, py: x.py, tr: tr(x, l) })),
    words: p.words.map((w) => ({ zh: w.zh, py: w.py, meaning: tr(w, l), vi: w.vi })),
    grammar: grammarOf(p, l),
    questions: p.questions.map((q) =>
      q.kind === "choice"
        ? { kind: q.kind, zh: q.zh, tr: tr(q, l), options: q.options }
        : { kind: q.kind, zh: q.zh, tr: tr(q, l) },
    ),
  };
}
export type LocalPassage = ReturnType<typeof localPassage>;

export function listPassages(f: { level?: number; type?: string; topic?: string }, l: Locale) {
  return R_PASSAGES.filter(
    (p) => (!f.level || p.level === f.level) && (!f.type || p.type === f.type) && (!f.topic || p.topic === f.topic),
  ).map((p) => summaryOf(p, l));
}

async function lastRead(userId: string) {
  const rows = await db
    .select({ passageId: readingAttempt.passageId, at: readingAttempt.createdAt })
    .from(readingAttempt)
    .where(eq(readingAttempt.userId, userId))
    .orderBy(desc(readingAttempt.createdAt))
    .limit(200);
  const m = new Map<string, number>();
  for (const r of rows) if (!m.has(r.passageId)) m.set(r.passageId, r.at.getTime());
  return m;
}

/**
 * Chọn bài tự động: lọc theo lựa chọn, ưu tiên bài chưa đọc (đọc hết thì bài đọc lâu nhất), gần trình độ ước lượng nhất;
 * theo từ vựng: bài có nhiều từ khoá nằm trong kho Từ vựng của mình nhất.
 */
export async function pickPassage(userId: string, f: PickInput) {
  const est = f.level || (await estimateLevel(userId));
  let pool = R_PASSAGES.filter((p) => (!f.type || p.type === f.type) && (!f.topic || p.topic === f.topic));
  if (f.level) pool = pool.filter((p) => p.level === f.level);
  if (f.source === "grammar" && f.grammar) pool = pool.filter((p) => p.grammar.some((g) => g.id === f.grammar));
  let known = new Set<string>();
  if (f.source === "vocab") {
    known = new Set(
      (await db.select({ hanzi: vocab.hanzi }).from(vocab).where(eq(vocab.userId, userId))).map((r) => r.hanzi),
    );
    const text = (p: RPassage) => p.lines.map((x) => x.zh).join("");
    pool = pool.filter((p) => [...known].some((h) => text(p).includes(h)));
  }
  if (!pool.length) throw new ReadingError("empty", "Không có bài đọc nào phù hợp. Hãy đổi lựa chọn.");
  const seen = await lastRead(userId);
  const overlap = (p: RPassage) => {
    const t = p.lines.map((x) => x.zh).join("");
    return [...known].filter((h) => t.includes(h)).length;
  };
  const ranked = pool
    .map((p) => ({ p, seen: seen.get(p.id) ?? 0, lv: Math.abs(p.level - est), ov: overlap(p), r: Math.random() }))
    .sort((a, b) => a.seen - b.seen || a.lv - b.lv || b.ov - a.ov || a.r - b.r);
  return { id: ranked[0]!.p.id, level: est };
}

export async function getPassage(userId: string, id: string, l: Locale) {
  const p = passageOr404(id);
  const [saved] = await db
    .select({ id: readingSaved.passageId })
    .from(readingSaved)
    .where(and(eq(readingSaved.userId, userId), eq(readingSaved.passageId, id)))
    .limit(1);
  return { ...localPassage(p, l), saved: !!saved };
}

// ---------- Chấm ----------

export function gradeReading(p: RPassage, answers: (number | string | null)[]) {
  return p.questions.map((q, i) => {
    const a = answers[i] ?? null;
    const correct =
      q.kind === "choice"
        ? typeof a === "number" && a === q.answer
        : typeof a === "string" && !!normalizeChinese(a) && normalizeChinese(a) === normalizeChinese(q.answer);
    return { correct, answer: q.answer, userAnswer: a };
  });
}

export async function submitReading(
  userId: string,
  id: string,
  answers: (number | string | null)[],
  durationSec: number,
  l: Locale,
) {
  const p = passageOr404(id);
  const results = gradeReading(p, answers);
  const correct = results.filter((r) => r.correct).length;
  const [row] = await db
    .insert(readingAttempt)
    .values({
      userId,
      passageId: id,
      answers: results.map((r) => r.userAnswer),
      correct,
      total: results.length,
      durationSec,
    })
    .returning({ id: readingAttempt.id, createdAt: readingAttempt.createdAt });
  await recordActivity(db, userId, {
    kind: "reading",
    title: p.title.zh,
    detail: `HSK${p.level}`,
    refId: row!.id,
    correct,
    total: results.length,
    durationSec,
  });
  return {
    attemptId: row!.id,
    correct,
    total: results.length,
    percent: Math.round((correct / Math.max(1, results.length)) * 100),
    results,
    words: localPassage(p, l).words,
    grammar: grammarOf(p, l),
  };
}

// ---------- Lưu bài, lịch sử ----------

export async function setSaved(userId: string, id: string, saved: boolean) {
  passageOr404(id);
  if (saved) await db.insert(readingSaved).values({ userId, passageId: id }).onConflictDoNothing();
  else await db.delete(readingSaved).where(and(eq(readingSaved.userId, userId), eq(readingSaved.passageId, id)));
  return { saved };
}

export async function listSaved(userId: string, l: Locale) {
  const rows = await db
    .select()
    .from(readingSaved)
    .where(eq(readingSaved.userId, userId))
    .orderBy(desc(readingSaved.createdAt));
  return rows
    .filter((r) => R_PASSAGE_BY_ID.has(r.passageId))
    .map((r) => ({ ...summaryOf(R_PASSAGE_BY_ID.get(r.passageId)!, l), savedAt: r.createdAt.toISOString() }));
}

export async function readingHistory(userId: string, l: Locale, limit = 10) {
  const rows = await db
    .select()
    .from(readingAttempt)
    .where(eq(readingAttempt.userId, userId))
    .orderBy(desc(readingAttempt.createdAt))
    .limit(Math.min(Math.max(limit, 1), 50));
  return rows
    .filter((r) => R_PASSAGE_BY_ID.has(r.passageId))
    .map((r) => ({
      id: r.id,
      passage: summaryOf(R_PASSAGE_BY_ID.get(r.passageId)!, l),
      correct: r.correct,
      total: r.total,
      durationSec: r.durationSec,
      createdAt: r.createdAt.toISOString(),
    }));
}

// ---------- Lưu từ vào Từ vựng ----------

/** Lưu từ khoá của bài vào kho Từ vựng (bỏ qua từ đã có). `words` bỏ trống = tất cả từ khoá. */
export async function saveWords(userId: string, id: string, words: string[] | undefined) {
  const p = passageOr404(id);
  const list = words?.length ? p.words.filter((w) => words.includes(w.zh)) : p.words;
  if (!list.length) throw new ReadingError("invalid", "Từ này không có trong bài đọc.");
  const have = new Set(
    (
      await db
        .select({ hanzi: vocab.hanzi })
        .from(vocab)
        .where(
          and(
            eq(vocab.userId, userId),
            inArray(
              vocab.hanzi,
              list.map((w) => w.zh.replace(/…/g, "")),
            ),
          ),
        )
    ).map((r) => r.hanzi),
  );
  const added: string[] = [];
  const skipped: string[] = [];
  for (const w of list) {
    const hanzi = w.zh.replace(/…/g, "");
    if (have.has(hanzi)) {
      skipped.push(hanzi);
      continue;
    }
    await createVocab(
      userId,
      vocabInputSchema.parse({ hanzi, pinyin: w.py, meaningVi: w.vi, tags: ["Đọc hiểu", `HSK${p.level}`] }),
    );
    have.add(hanzi);
    added.push(hanzi);
  }
  return { added, skipped };
}
