/** Quản trị: danh sách người dùng. Chỉ gọi sau khi đã kiểm tra role admin (requireAdmin / adminOrThrow). */
import { count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { user, vocab } from "@/server/db/schema";

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
