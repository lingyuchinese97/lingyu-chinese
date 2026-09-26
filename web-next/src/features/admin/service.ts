/** Quản trị: danh sách người dùng. Chỉ gọi sau khi đã kiểm tra role admin (requireAdmin / adminOrThrow). */
import { and, count, desc, eq, gte, ilike, isNotNull, or, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { grammar, listeningExercise, sentence, user, vocab } from "@/server/db/schema";

export const ADMIN_PAGE_SIZE = 20;
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => "\\" + c);

export async function listUsers({ q = "", page = 1 }: { q?: string; page?: number }) {
  const needle = q.trim().toLowerCase();
  const where = needle
    ? or(ilike(user.email, `%${likeEscape(needle)}%`), ilike(user.name, `%${likeEscape(needle)}%`))
    : undefined;
  const [{ total } = { total: 0 }] = await db.select({ total: count() }).from(user).where(where);
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const p = Math.min(Math.max(1, page), pageCount);
  const vocabCount = db
    .select({ userId: vocab.userId, n: count().as("n") })
    .from(vocab)
    .groupBy(vocab.userId)
    .as("vc");
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      disabledAt: user.disabledAt,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      vocabCount: sql<number>`coalesce(${vocabCount.n}, 0)`.mapWith(Number),
    })
    .from(user)
    .leftJoin(vocabCount, eq(vocabCount.userId, user.id))
    .where(where)
    .orderBy(desc(user.createdAt))
    .limit(ADMIN_PAGE_SIZE)
    .offset((p - 1) * ADMIN_PAGE_SIZE);
  return { items: rows, total, page: p, pageCount };
}
export type AdminUser = Awaited<ReturnType<typeof listUsers>>["items"][number];

export async function getUser(id: string) {
  const [u] = await db
    .select({ id: user.id, email: user.email, role: user.role })
    .from(user)
    .where(eq(user.id, id))
    .limit(1);
  return u ?? null;
}

/** Số liệu tổng (không chứa dữ liệu cá nhân): số người dùng, admin, bị khoá, mới / hoạt động 7 ngày, tổng nội dung. */
export async function adminStats(now = new Date()) {
  const week = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const n = async (q: Promise<{ n: number }[]>) => (await q)[0]?.n ?? 0;
  const c = () => ({ n: count() });
  const [
    totalUsers,
    admins,
    disabled,
    newUsers7d,
    activeUsers7d,
    vocabTotal,
    sentenceTotal,
    grammarTotal,
    listeningTotal,
  ] = await Promise.all([
    n(db.select(c()).from(user)),
    n(db.select(c()).from(user).where(eq(user.role, "admin"))),
    n(db.select(c()).from(user).where(isNotNull(user.disabledAt))),
    n(db.select(c()).from(user).where(gte(user.createdAt, week))),
    n(
      db
        .select(c())
        .from(user)
        .where(and(isNotNull(user.lastLoginAt), gte(user.lastLoginAt, week))),
    ),
    n(db.select(c()).from(vocab)),
    n(db.select(c()).from(sentence)),
    n(db.select(c()).from(grammar)),
    n(db.select(c()).from(listeningExercise)),
  ]);
  return {
    totalUsers,
    admins,
    disabled,
    newUsers7d,
    activeUsers7d,
    content: { vocab: vocabTotal, sentences: sentenceTotal, grammar: grammarTotal, listening: listeningTotal },
  };
}

/**
 * Thông tin một người dùng cho admin: hồ sơ + SỐ LƯỢNG nội dung. Không trả nội dung học (ghi chú, từ, câu...) để
 * dữ liệu cá nhân không lộ ra ngoài chính chủ.
 */
export async function adminUserDetail(id: string) {
  const [u] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      locale: user.locale,
      disabledAt: user.disabledAt,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    })
    .from(user)
    .where(eq(user.id, id))
    .limit(1);
  if (!u) return null;
  const n = async (q: Promise<{ n: number }[]>) => (await q)[0]?.n ?? 0;
  const [v, s, g, l] = await Promise.all([
    n(db.select({ n: count() }).from(vocab).where(eq(vocab.userId, id))),
    n(db.select({ n: count() }).from(sentence).where(eq(sentence.userId, id))),
    n(db.select({ n: count() }).from(grammar).where(eq(grammar.userId, id))),
    n(db.select({ n: count() }).from(listeningExercise).where(eq(listeningExercise.userId, id))),
  ]);
  return { ...u, counts: { vocab: v, sentences: s, grammar: g, listening: l } };
}
