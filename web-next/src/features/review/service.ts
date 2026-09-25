/**
 * Ôn tập ở server. Phiên ôn tập lưu trong bảng review_session (làm tiếp được khi refresh / đổi thiết bị).
 * Đáp án đúng KHÔNG gửi xuống trình duyệt trước khi người dùng trả lời; việc chấm chạy ở đây (lib/grading.ts).
 *
 *  - Ôn tự chọn ("custom"): chọn tag / số câu / chế độ. Không đổi lịch FSRS.
 *  - Ôn đến hạn ("due"): các thẻ FSRS có due ≤ bây giờ. Sai → Again, đúng → Good (có thể đổi Khó/Dễ) → cập nhật lịch.
 */
import { and, asc, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { reviewSession, srsCard, srsReviewLog, vocab, vocabTag, vocabToTag } from "@/server/db/schema";
import { findMatchingWord, grade, type PromptType } from "@/lib/grading";
import { applyRating, Rating, type SrsColumns, type SrsGrade } from "@/lib/srs";
import { DUE_LIMIT, type CustomConfig, type DueConfig, type ReviewMode } from "./schema";

export class ReviewError extends Error {
  constructor(
    public code: "not-found" | "empty" | "invalid",
    message: string,
  ) {
    super(message);
  }
}

type Word = { hanzi: string; pinyin: string; meaningVi: string; note: string; imageId: string | null };
type StoredQuestion = {
  vocabId: string;
  promptType: PromptType;
  word: Word;
  userAnswer: string | null;
  isCorrect: boolean | null;
  /** Ôn đến hạn: trạng thái thẻ trước khi chấm (để đổi đánh giá Khó/Được/Dễ), id log, đánh giá đã áp. */
  prevCard?: SrsColumnsJson;
  logId?: string;
  rating?: number;
  /** Câu sai: từ khác trong kho khớp với câu trả lời. */
  matched?: { hanzi: string; pinyin: string; meaningVi: string; imageId: string | null } | null;
};
type SrsColumnsJson = Omit<SrsColumns, "due" | "lastReview"> & { due: string; lastReview: string | null };
export type SessionConfig = {
  tags: string[];
  count: number;
  mode: ReviewMode;
  showImage: boolean;
  vocabIds?: string[];
  label?: string;
};

type Row = typeof reviewSession.$inferSelect;

function shuffle<T>(a: T[]): T[] {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

function promptTypes(mode: ReviewMode, n: number): PromptType[] {
  if (mode !== "mixed") return Array.from({ length: n }, () => mode);
  const base: PromptType[] = ["meaning", "hanzi", "pinyin"];
  return shuffle(Array.from({ length: n }, (_, i) => base[i % 3]!));
}

const wordCols = {
  id: vocab.id,
  hanzi: vocab.hanzi,
  pinyin: vocab.pinyin,
  meaningVi: vocab.meaningVi,
  note: vocab.note,
  imageId: vocab.imageId,
};

const toJson = (c: SrsColumns): SrsColumnsJson => ({
  ...c,
  due: c.due.toISOString(),
  lastReview: c.lastReview ? c.lastReview.toISOString() : null,
});
const fromJson = (c: SrsColumnsJson): SrsColumns => ({
  ...c,
  due: new Date(c.due),
  lastReview: c.lastReview ? new Date(c.lastReview) : null,
});

/** Id các từ thuộc ít nhất một tag đã chọn (rỗng = tất cả). */
async function poolIds(userId: string, tags: string[], vocabIds?: string[]) {
  if (vocabIds?.length) {
    const rows = await db
      .select({ id: vocab.id })
      .from(vocab)
      .where(and(eq(vocab.userId, userId), inArray(vocab.id, vocabIds)));
    return rows.map((r) => r.id);
  }
  if (!tags.length) {
    const rows = await db.select({ id: vocab.id }).from(vocab).where(eq(vocab.userId, userId));
    return rows.map((r) => r.id);
  }
  const rows = await db
    .selectDistinct({ id: vocabToTag.vocabId })
    .from(vocabToTag)
    .innerJoin(vocabTag, eq(vocabTag.id, vocabToTag.tagId))
    .where(
      and(
        eq(vocabTag.userId, userId),
        inArray(
          sql`lower(${vocabTag.name})`,
          tags.map((t) => t.toLowerCase()),
        ),
      ),
    );
  return rows.map((r) => r.id);
}

export async function countPool(userId: string, tags: string[]) {
  return (await poolIds(userId, tags)).length;
}

async function abandonActive(userId: string) {
  await db
    .update(reviewSession)
    .set({ status: "abandoned" })
    .where(and(eq(reviewSession.userId, userId), eq(reviewSession.status, "active")));
}

async function insertSession(
  userId: string,
  kind: "custom" | "due",
  config: SessionConfig,
  questions: StoredQuestion[],
) {
  await abandonActive(userId);
  const [row] = await db
    .insert(reviewSession)
    .values({ userId, kind, config, questions })
    .returning({ id: reviewSession.id });
  return row!.id;
}

export async function createCustomSession(userId: string, cfg: CustomConfig) {
  const ids = await poolIds(userId, cfg.tags, cfg.vocabIds);
  if (!ids.length) throw new ReviewError("empty", "Không có từ vựng nào phù hợp để ôn tập.");
  const chosen = shuffle(ids).slice(0, Math.min(cfg.count, ids.length));
  const words = await db
    .select(wordCols)
    .from(vocab)
    .where(and(eq(vocab.userId, userId), inArray(vocab.id, chosen)));
  const byId = new Map(words.map((w) => [w.id, w]));
  const types = promptTypes(cfg.mode, chosen.length);
  const questions: StoredQuestion[] = chosen
    .map((id) => byId.get(id))
    .filter((w): w is NonNullable<typeof w> => !!w)
    .map((w, i) => ({
      vocabId: w.id,
      promptType: types[i]!,
      word: { hanzi: w.hanzi, pinyin: w.pinyin, meaningVi: w.meaningVi, note: w.note, imageId: w.imageId },
      userAnswer: null,
      isCorrect: null,
    }));
  const config: SessionConfig = {
    tags: cfg.tags,
    count: questions.length,
    mode: cfg.mode,
    showImage: cfg.showImage,
    ...(cfg.vocabIds ? { vocabIds: cfg.vocabIds } : {}),
    ...(cfg.label ? { label: cfg.label } : {}),
  };
  return insertSession(userId, "custom", config, questions);
}

export async function dueCount(userId: string, now = new Date()) {
  const [r] = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(srsCard)
    .where(and(eq(srsCard.userId, userId), lte(srsCard.due, now)));
  return r?.n ?? 0;
}

export async function createDueSession(userId: string, cfg: DueConfig, now = new Date()) {
  const rows = await db
    .select({ ...wordCols, due: srsCard.due })
    .from(srsCard)
    .innerJoin(vocab, eq(vocab.id, srsCard.vocabId))
    .where(and(eq(srsCard.userId, userId), lte(srsCard.due, now)))
    .orderBy(asc(srsCard.due))
    .limit(DUE_LIMIT);
  if (!rows.length) throw new ReviewError("empty", "Hôm nay không còn thẻ nào đến hạn. Quay lại sau nhé!");
  const types = promptTypes(cfg.mode, rows.length);
  const questions: StoredQuestion[] = rows.map((w, i) => ({
    vocabId: w.id,
    promptType: types[i]!,
    word: { hanzi: w.hanzi, pinyin: w.pinyin, meaningVi: w.meaningVi, note: w.note, imageId: w.imageId },
    userAnswer: null,
    isCorrect: null,
  }));
  return insertSession(
    userId,
    "due",
    { tags: [], count: questions.length, mode: cfg.mode, showImage: cfg.showImage, label: "Thẻ đến hạn hôm nay" },
    questions,
  );
}

// ---------- Đọc phiên (dạng an toàn cho client) ----------

export type ClientQuestion = {
  promptType: PromptType;
  /** Phần đề bài — KHÔNG chứa đáp án của câu chưa trả lời. */
  prompt: { hanzi?: string; pinyin?: string; meaningVi?: string; imageId: string | null };
  answered: boolean;
  userAnswer: string | null;
  isCorrect: boolean | null;
  /** Chỉ có sau khi đã trả lời. */
  reveal?: Word & { matched: StoredQuestion["matched"]; rating?: number };
};
export type ClientSession = {
  id: string;
  kind: "custom" | "due";
  config: SessionConfig;
  currentIndex: number;
  correctCount: number;
  wrongCount: number;
  status: string;
  total: number;
  questions: ClientQuestion[];
};

function toClient(row: Row): ClientSession {
  const qs = row.questions as StoredQuestion[];
  const cfg = row.config as SessionConfig;
  return {
    id: row.id,
    kind: row.kind === "due" ? "due" : "custom",
    config: cfg,
    currentIndex: row.currentIndex,
    correctCount: row.correctCount,
    wrongCount: row.wrongCount,
    status: row.status,
    total: qs.length,
    questions: qs.map((q) => {
      const w = q.word;
      const imageId = cfg.showImage ? w.imageId : null;
      const prompt =
        q.promptType === "meaning"
          ? { hanzi: w.hanzi, pinyin: w.pinyin, imageId }
          : q.promptType === "hanzi"
            ? { meaningVi: w.meaningVi, pinyin: w.pinyin, imageId }
            : { hanzi: w.hanzi, meaningVi: w.meaningVi, imageId };
      const answered = q.isCorrect !== null;
      return {
        promptType: q.promptType,
        prompt,
        answered,
        userAnswer: q.userAnswer,
        isCorrect: q.isCorrect,
        ...(answered
          ? {
              reveal: {
                ...w,
                imageId,
                matched: q.matched ? { ...q.matched, imageId: cfg.showImage ? q.matched.imageId : null } : null,
                rating: q.rating,
              },
            }
          : {}),
      };
    }),
  };
}

async function loadActive(userId: string, sessionId?: string) {
  const [row] = await db
    .select()
    .from(reviewSession)
    .where(
      and(
        eq(reviewSession.userId, userId),
        eq(reviewSession.status, "active"),
        ...(sessionId ? [eq(reviewSession.id, sessionId)] : []),
      ),
    )
    .orderBy(desc(reviewSession.startedAt))
    .limit(1);
  return row ?? null;
}

export async function getActiveSession(userId: string) {
  const row = await loadActive(userId);
  return row ? toClient(row) : null;
}

export async function getLastResult(userId: string) {
  const [row] = await db
    .select()
    .from(reviewSession)
    .where(and(eq(reviewSession.userId, userId), eq(reviewSession.status, "completed")))
    .orderBy(desc(reviewSession.completedAt))
    .limit(1);
  return row
    ? {
        ...toClient(row),
        wrongVocabIds: (row.questions as StoredQuestion[]).filter((q) => !q.isCorrect).map((q) => q.vocabId),
      }
    : null;
}

/** Thiết lập lần ôn tự chọn gần nhất (để điền sẵn ô Thiết lập). */
export async function getLastCustomConfig(userId: string): Promise<SessionConfig | null> {
  const [row] = await db
    .select({ config: reviewSession.config })
    .from(reviewSession)
    .where(
      and(
        eq(reviewSession.userId, userId),
        eq(reviewSession.kind, "custom"),
        sql`not (${reviewSession.config} ? 'vocabIds')`,
      ),
    )
    .orderBy(desc(reviewSession.startedAt))
    .limit(1);
  return (row?.config as SessionConfig) ?? null;
}

const furthest = (qs: StoredQuestion[]) => {
  const i = qs.findIndex((q) => q.isCorrect === null);
  return i < 0 ? qs.length - 1 : i;
};

// ---------- Làm bài ----------

export async function checkAnswer(userId: string, sessionId: string, index: number, answer: string, now = new Date()) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(reviewSession)
      .where(and(eq(reviewSession.id, sessionId), eq(reviewSession.userId, userId), eq(reviewSession.status, "active")))
      .for("update")
      .limit(1);
    if (!row) throw new ReviewError("not-found", "Bài ôn tập không còn tồn tại. Hãy tạo bài mới.");
    const qs = row.questions as StoredQuestion[];
    const q = qs[index];
    if (!q || index > furthest(qs)) throw new ReviewError("invalid", "Câu hỏi không tồn tại.");
    if (q.isCorrect !== null) return toClient(row); // đã chấm (bấm 2 lần) → trả nguyên trạng

    q.userAnswer = answer.trim();
    q.isCorrect = grade(q.promptType, q.word, q.userAnswer);
    let correct = row.correctCount;
    let wrong = row.wrongCount;
    if (q.isCorrect) correct++;
    else wrong++;

    if (!q.isCorrect) {
      // Sai → đánh dấu "Cần ôn" và tìm từ khác khớp câu trả lời.
      await tx
        .update(vocab)
        .set({ status: "review" })
        .where(and(eq(vocab.id, q.vocabId), eq(vocab.userId, userId)));
      if (q.userAnswer) {
        const all = await tx.select(wordCols).from(vocab).where(eq(vocab.userId, userId));
        const m = findMatchingWord(q.promptType, all, q.userAnswer, q.vocabId);
        q.matched = m ? { hanzi: m.hanzi, pinyin: m.pinyin, meaningVi: m.meaningVi, imageId: m.imageId } : null;
      }
    }

    if (row.kind === "due") {
      const [card] = await tx
        .select()
        .from(srsCard)
        .where(and(eq(srsCard.vocabId, q.vocabId), eq(srsCard.userId, userId)))
        .limit(1);
      if (card) {
        const rating = q.isCorrect ? Rating.Good : Rating.Again;
        const next = applyRating(card, rating, now);
        await tx.update(srsCard).set(next.card).where(eq(srsCard.id, card.id));
        const [log] = await tx
          .insert(srsReviewLog)
          .values({ userId, cardId: card.id, ...next.log })
          .returning({ id: srsReviewLog.id });
        q.prevCard = toJson(card);
        q.logId = log!.id;
        q.rating = rating;
      }
    }

    const [updated] = await tx
      .update(reviewSession)
      .set({ questions: qs, correctCount: correct, wrongCount: wrong, currentIndex: index })
      .where(eq(reviewSession.id, row.id))
      .returning();
    return toClient(updated!);
  });
}

/** Ôn đến hạn: sau khi trả lời ĐÚNG, người dùng chọn Khó/Được/Dễ → tính lại lịch từ trạng thái thẻ trước khi chấm. */
export async function rateAnswer(userId: string, sessionId: string, index: number, rating: SrsGrade, now = new Date()) {
  if (rating !== Rating.Hard && rating !== Rating.Good && rating !== Rating.Easy)
    throw new ReviewError("invalid", "Đánh giá không hợp lệ.");
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(reviewSession)
      .where(and(eq(reviewSession.id, sessionId), eq(reviewSession.userId, userId), eq(reviewSession.status, "active")))
      .for("update")
      .limit(1);
    if (!row || row.kind !== "due") throw new ReviewError("not-found", "Bài ôn tập không còn tồn tại.");
    const qs = row.questions as StoredQuestion[];
    const q = qs[index];
    if (!q || !q.isCorrect || !q.prevCard) throw new ReviewError("invalid", "Chỉ đánh giá được câu đã trả lời đúng.");
    if (q.rating === rating) return toClient(row);
    const [card] = await tx
      .select({ id: srsCard.id })
      .from(srsCard)
      .where(and(eq(srsCard.vocabId, q.vocabId), eq(srsCard.userId, userId)))
      .limit(1);
    if (card) {
      const next = applyRating(fromJson(q.prevCard), rating, now);
      await tx.update(srsCard).set(next.card).where(eq(srsCard.id, card.id));
      if (q.logId)
        await tx.delete(srsReviewLog).where(and(eq(srsReviewLog.id, q.logId), eq(srsReviewLog.userId, userId)));
      const [log] = await tx
        .insert(srsReviewLog)
        .values({ userId, cardId: card.id, ...next.log })
        .returning({ id: srsReviewLog.id });
      q.logId = log!.id;
      q.rating = rating;
    }
    const [updated] = await tx
      .update(reviewSession)
      .set({ questions: qs })
      .where(eq(reviewSession.id, row.id))
      .returning();
    return toClient(updated!);
  });
}

export async function moveTo(userId: string, sessionId: string, index: number) {
  const row = await loadActive(userId, sessionId);
  if (!row) throw new ReviewError("not-found", "Bài ôn tập không còn tồn tại.");
  const qs = row.questions as StoredQuestion[];
  const i = Math.max(0, Math.min(index, furthest(qs)));
  await db.update(reviewSession).set({ currentIndex: i }).where(eq(reviewSession.id, row.id));
  return i;
}

export async function completeSession(userId: string, sessionId: string) {
  const row = await loadActive(userId, sessionId);
  if (!row) throw new ReviewError("not-found", "Bài ôn tập không còn tồn tại.");
  const qs = row.questions as StoredQuestion[];
  if (qs.some((q) => q.isCorrect === null)) throw new ReviewError("invalid", "Bạn chưa làm hết các câu.");
  await db
    .update(reviewSession)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(reviewSession.id, row.id));
}

export async function abandonSession(userId: string) {
  await abandonActive(userId);
}
