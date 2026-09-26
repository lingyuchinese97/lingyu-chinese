/**
 * Ôn dịch câu ở server. Phiên lưu trong bảng sentence_session (làm tiếp được khi refresh / đổi thiết bị).
 * Đáp án KHÔNG gửi xuống trình duyệt trước khi trả lời / bỏ qua; chấm bằng lib/sentence-grading.ts.
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { recordActivity } from "@/features/progress/service";
import { db } from "@/server/db/client";
import { sentence, sentenceSession, sentenceTag, sentenceToTag } from "@/server/db/schema";
import { firstHanzi, gradeSentence, type Direction } from "@/lib/sentence-grading";
import type { SentenceConfig } from "./schema";

export class SentenceReviewError extends Error {
  constructor(
    public code: "not-found" | "empty" | "invalid",
    message: string,
  ) {
    super(message);
  }
}

type Stored = {
  sentenceId: string;
  direction: Direction;
  s: { chinese: string; pinyin: string; vietnamese: string; note: string };
  userAnswer: string | null;
  result: "correct" | "wrong" | "skipped" | null;
  /** Người học tự "Tính là đúng" sau khi máy chấm sai. */
  overridden?: boolean;
  /** "Tôi nhớ" (true) / "Tôi chưa nhớ" (false). */
  remembered?: boolean | null;
  hintUsed?: boolean;
};
type Row = typeof sentenceSession.$inferSelect;
const GONE = "Bài ôn không còn tồn tại. Hãy tạo bài mới.";

function shuffle<T>(a: T[]): T[] {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

async function poolIds(userId: string, tags: string[], ids?: string[]) {
  if (ids?.length) {
    const rows = await db
      .select({ id: sentence.id })
      .from(sentence)
      .where(and(eq(sentence.userId, userId), inArray(sentence.id, ids)));
    return rows.map((r) => r.id);
  }
  if (!tags.length) {
    return (await db.select({ id: sentence.id }).from(sentence).where(eq(sentence.userId, userId))).map((r) => r.id);
  }
  const rows = await db
    .selectDistinct({ id: sentenceToTag.sentenceId })
    .from(sentenceToTag)
    .innerJoin(sentenceTag, eq(sentenceTag.id, sentenceToTag.tagId))
    .where(
      and(
        eq(sentenceTag.userId, userId),
        inArray(
          sql`lower(${sentenceTag.name})`,
          tags.map((t) => t.toLowerCase()),
        ),
      ),
    );
  return rows.map((r) => r.id);
}

export async function countSentencePool(userId: string, tags: string[]) {
  return (await poolIds(userId, tags)).length;
}

export async function createSentenceSession(userId: string, cfg: SentenceConfig) {
  const ids = await poolIds(userId, cfg.tags, cfg.sentenceIds);
  if (!ids.length) throw new SentenceReviewError("empty", "Không có câu nào phù hợp để ôn.");
  const chosen = shuffle(ids).slice(0, Math.min(cfg.count, ids.length));
  const rows = await db
    .select()
    .from(sentence)
    .where(and(eq(sentence.userId, userId), inArray(sentence.id, chosen)));
  const by = new Map(rows.map((r) => [r.id, r]));
  const questions: Stored[] = chosen
    .map((id) => by.get(id))
    .filter((r): r is NonNullable<typeof r> => !!r)
    .map((r, i) => ({
      sentenceId: r.id,
      // Trộn: xen kẽ hai chiều (thứ tự câu đã được xáo trộn).
      direction: cfg.direction === "mixed" ? (i % 2 ? "zh-vi" : "vi-zh") : (cfg.direction as Direction),
      s: { chinese: r.chinese, pinyin: r.pinyin, vietnamese: r.vietnamese, note: r.note },
      userAnswer: null,
      result: null,
    }));
  const config = { ...cfg, count: questions.length };
  await db
    .update(sentenceSession)
    .set({ status: "abandoned" })
    .where(and(eq(sentenceSession.userId, userId), eq(sentenceSession.status, "active")));
  const [row] = await db
    .insert(sentenceSession)
    .values({ userId, config, questions })
    .returning({ id: sentenceSession.id });
  return row!.id;
}

// ---------- Dạng an toàn cho client ----------

export type ClientSentenceQuestion = {
  direction: Direction;
  /** Đề bài: câu cần dịch (+ pinyin nếu bật, khi dịch Trung → Việt). */
  prompt: { text: string; pinyin?: string };
  /** Chữ Hán đầu tiên — chỉ khi bật gợi ý hoặc đã bấm "Xem gợi ý" (Việt → Trung). */
  hint?: string;
  answered: boolean;
  userAnswer: string | null;
  result: Stored["result"];
  overridden: boolean;
  remembered: boolean | null;
  reveal?: Stored["s"];
};
export type ClientSentenceSession = {
  id: string;
  config: SentenceConfig;
  currentIndex: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  status: string;
  total: number;
  questions: ClientSentenceQuestion[];
};

function toClient(row: Row): ClientSentenceSession {
  const cfg = row.config as SentenceConfig;
  const qs = row.questions as Stored[];
  return {
    id: row.id,
    config: cfg,
    currentIndex: row.currentIndex,
    correctCount: row.correctCount,
    wrongCount: row.wrongCount,
    skippedCount: row.skippedCount,
    status: row.status,
    total: qs.length,
    questions: qs.map((q) => {
      const answered = q.result !== null;
      const viZh = q.direction === "vi-zh";
      return {
        direction: q.direction,
        prompt: viZh
          ? { text: q.s.vietnamese }
          : { text: q.s.chinese, ...(cfg.showPinyin && q.s.pinyin ? { pinyin: q.s.pinyin } : {}) },
        ...(viZh && (cfg.showHint || q.hintUsed || answered) ? { hint: firstHanzi(q.s.chinese) } : {}),
        answered,
        userAnswer: q.userAnswer,
        result: q.result,
        overridden: !!q.overridden,
        remembered: q.remembered ?? null,
        ...(answered ? { reveal: q.s } : {}),
      };
    }),
  };
}

async function loadActive(userId: string, sessionId?: string) {
  const [row] = await db
    .select()
    .from(sentenceSession)
    .where(
      and(
        eq(sentenceSession.userId, userId),
        eq(sentenceSession.status, "active"),
        ...(sessionId ? [eq(sentenceSession.id, sessionId)] : []),
      ),
    )
    .orderBy(desc(sentenceSession.startedAt))
    .limit(1);
  return row ?? null;
}

export async function getActiveSentenceSession(userId: string) {
  const row = await loadActive(userId);
  return row ? toClient(row) : null;
}

export async function getLastSentenceResult(userId: string) {
  const [row] = await db
    .select()
    .from(sentenceSession)
    .where(and(eq(sentenceSession.userId, userId), eq(sentenceSession.status, "completed")))
    .orderBy(desc(sentenceSession.completedAt))
    .limit(1);
  if (!row) return null;
  return {
    ...toClient(row),
    wrongIds: (row.questions as Stored[]).filter((q) => q.result !== "correct").map((q) => q.sentenceId),
  };
}

export async function getLastSentenceConfig(userId: string): Promise<SentenceConfig | null> {
  const [row] = await db
    .select({ config: sentenceSession.config })
    .from(sentenceSession)
    .where(and(eq(sentenceSession.userId, userId), sql`not (${sentenceSession.config} ? 'sentenceIds')`))
    .orderBy(desc(sentenceSession.startedAt))
    .limit(1);
  return (row?.config as SentenceConfig) ?? null;
}

const furthest = (qs: Stored[]) => {
  const i = qs.findIndex((q) => q.result === null);
  return i < 0 ? qs.length - 1 : i;
};

/** Khoá phiên, cho hàm `fn` sửa câu `index`, lưu lại và trả về dạng client. */
async function mutate(
  userId: string,
  sessionId: string,
  index: number,
  fn: (q: Stored, row: Row, counts: { correct: number; wrong: number; skipped: number }) => Promise<void> | void,
) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(sentenceSession)
      .where(
        and(
          eq(sentenceSession.id, sessionId),
          eq(sentenceSession.userId, userId),
          eq(sentenceSession.status, "active"),
        ),
      )
      .for("update")
      .limit(1);
    if (!row) throw new SentenceReviewError("not-found", GONE);
    const qs = row.questions as Stored[];
    const q = qs[index];
    if (!q || index > furthest(qs)) throw new SentenceReviewError("invalid", "Câu hỏi không tồn tại.");
    const counts = { correct: row.correctCount, wrong: row.wrongCount, skipped: row.skippedCount };
    await fn(q, row, counts);
    const [updated] = await tx
      .update(sentenceSession)
      .set({
        questions: qs,
        correctCount: counts.correct,
        wrongCount: counts.wrong,
        skippedCount: counts.skipped,
        currentIndex: index,
      })
      .where(eq(sentenceSession.id, row.id))
      .returning();
    return toClient(updated!);
  });
}

export async function answerSentence(userId: string, sessionId: string, index: number, answer: string) {
  return mutate(userId, sessionId, index, (q, _row, c) => {
    if (q.result !== null) return; // đã chấm → giữ nguyên
    q.userAnswer = answer.trim();
    const ok = gradeSentence(q.direction, q.s, q.userAnswer);
    q.result = ok ? "correct" : "wrong";
    if (ok) c.correct++;
    else c.wrong++;
  });
}

export async function skipSentence(userId: string, sessionId: string, index: number) {
  return mutate(userId, sessionId, index, (q, _row, c) => {
    if (q.result !== null) return;
    q.result = "skipped";
    c.skipped++;
  });
}

/** Máy chấm sai nhưng người học dịch đúng (cách dịch khác) → tính là đúng. */
export async function overrideSentence(userId: string, sessionId: string, index: number) {
  return mutate(userId, sessionId, index, (q, _row, c) => {
    if (q.result !== "wrong") throw new SentenceReviewError("invalid", "Chỉ đổi được câu đang bị chấm sai.");
    q.result = "correct";
    q.overridden = true;
    c.wrong--;
    c.correct++;
  });
}

export async function hintSentence(userId: string, sessionId: string, index: number) {
  return mutate(userId, sessionId, index, (q) => {
    if (q.direction !== "vi-zh") throw new SentenceReviewError("invalid", "Câu này không có gợi ý chữ Hán.");
    q.hintUsed = true;
  });
}

/** "Tôi nhớ" → câu chuyển "Đã thuộc"; "Tôi chưa nhớ" → "Cần ôn". */
export async function rememberSentence(userId: string, sessionId: string, index: number, remembered: boolean) {
  return mutate(userId, sessionId, index, async (q) => {
    if (q.result === null) throw new SentenceReviewError("invalid", "Hãy trả lời trước.");
    q.remembered = remembered;
    await db
      .update(sentence)
      .set({ status: remembered ? "learned" : "review" })
      .where(and(eq(sentence.id, q.sentenceId), eq(sentence.userId, userId)));
  });
}

export async function moveSentenceTo(userId: string, sessionId: string, index: number) {
  const row = await loadActive(userId, sessionId);
  if (!row) throw new SentenceReviewError("not-found", GONE);
  const i = Math.max(0, Math.min(index, furthest(row.questions as Stored[])));
  await db.update(sentenceSession).set({ currentIndex: i }).where(eq(sentenceSession.id, row.id));
  return i;
}

export async function completeSentenceSession(userId: string, sessionId: string) {
  const row = await loadActive(userId, sessionId);
  if (!row) throw new SentenceReviewError("not-found", GONE);
  if ((row.questions as Stored[]).some((q) => q.result === null))
    throw new SentenceReviewError("invalid", "Bạn chưa làm hết các câu.");
  const now = new Date();
  await db.update(sentenceSession).set({ status: "completed", completedAt: now }).where(eq(sentenceSession.id, row.id));
  const qs = row.questions as Stored[];
  const cfg = row.config as SentenceConfig;
  await recordActivity(db, userId, {
    kind: "sentence_review",
    title: cfg.label ?? "",
    detail: cfg.direction,
    refId: row.id,
    correct: qs.filter((q) => q.result === "correct").length,
    total: qs.length,
    durationSec: (now.getTime() - row.startedAt.getTime()) / 1000,
  });
}

export async function abandonSentenceSession(userId: string) {
  await db
    .update(sentenceSession)
    .set({ status: "abandoned" })
    .where(and(eq(sentenceSession.userId, userId), eq(sentenceSession.status, "active")));
}
