/** Số liệu cho Trang chủ (lọc theo userId của session). */
import { and, count, eq, gte, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { grammar, reviewSession, sentence, sentenceSession, vocab } from "@/server/db/schema";

/** 0 giờ hôm nay theo giờ Việt Nam (UTC+7). */
export function startOfTodayVN(now = new Date()) {
  const vn = new Date(now.getTime() + 7 * 3600_000);
  return new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()) - 7 * 3600_000);
}

export async function homeStats(userId: string, now = new Date()) {
  const today = startOfTodayVN(now);
  const learned = (col: typeof vocab.status | typeof sentence.status) =>
    sql<number>`count(*) filter (where ${col} = 'learned')`.mapWith(Number);
  const [[v], [s], [g], [newToday], [vr], [sr]] = await Promise.all([
    db
      .select({ total: count(), learned: learned(vocab.status) })
      .from(vocab)
      .where(eq(vocab.userId, userId)),
    db
      .select({ total: count(), learned: learned(sentence.status) })
      .from(sentence)
      .where(eq(sentence.userId, userId)),
    db.select({ total: count() }).from(grammar).where(eq(grammar.userId, userId)),
    db
      .select({ n: count() })
      .from(vocab)
      .where(and(eq(vocab.userId, userId), gte(vocab.createdAt, today))),
    db
      .select({ n: count() })
      .from(reviewSession)
      .where(
        and(
          eq(reviewSession.userId, userId),
          eq(reviewSession.status, "completed"),
          gte(reviewSession.completedAt, today),
        ),
      ),
    db
      .select({ n: count() })
      .from(sentenceSession)
      .where(
        and(
          eq(sentenceSession.userId, userId),
          eq(sentenceSession.status, "completed"),
          gte(sentenceSession.completedAt, today),
        ),
      ),
  ]);
  return {
    vocab: { total: v?.total ?? 0, learned: v?.learned ?? 0 },
    sentences: { total: s?.total ?? 0, learned: s?.learned ?? 0 },
    grammar: g?.total ?? 0,
    newToday: newToday?.n ?? 0,
    reviewsToday: (vr?.n ?? 0) + (sr?.n ?? 0),
  };
}
