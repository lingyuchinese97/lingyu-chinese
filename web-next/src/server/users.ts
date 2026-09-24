import { randomInt } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db } from "@/server/db/client";
import { account, session, user } from "@/server/db/schema";
import { normalizeEmail } from "@/lib/auth-rules";

/** Mật khẩu tạm dễ đọc (không có 0/O, 1/l/I), 12 ký tự. */
export function generateTempPassword(length = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  return Array.from({ length }, () => chars[randomInt(chars.length)]).join("");
}

export async function findUserByEmail(email: string) {
  const [u] = await db
    .select()
    .from(user)
    .where(eq(user.email, normalizeEmail(email)))
    .limit(1);
  return u ?? null;
}

/** Đặt mật khẩu mới (hash theo Better Auth) và đăng xuất mọi phiên của user đó. */
export async function setUserPassword(userId: string, newPassword: string) {
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(newPassword);
  const updated = await db
    .update(account)
    .set({ password: hash, updatedAt: new Date() })
    .where(and(eq(account.userId, userId), eq(account.providerId, "credential")))
    .returning({ id: account.id });
  if (!updated.length) {
    await db
      .insert(account)
      .values({ userId, accountId: userId, providerId: "credential", password: hash, updatedAt: new Date() });
  }
  await db.delete(session).where(eq(session.userId, userId));
}

/** Admin đặt lại mật khẩu: sinh mật khẩu tạm, trả về để hiển thị 1 lần. */
export async function resetUserPassword(userId: string) {
  const temp = generateTempPassword();
  await setUserPassword(userId, temp);
  return temp;
}

export async function setUserRole(userId: string, role: "user" | "admin") {
  await db.update(user).set({ role }).where(eq(user.id, userId));
}

/** Khoá / mở khoá tài khoản. Khoá thì đăng xuất mọi phiên. */
export async function setUserDisabled(userId: string, disabled: boolean) {
  await db
    .update(user)
    .set({ disabledAt: disabled ? new Date() : null })
    .where(eq(user.id, userId));
  if (disabled) await db.delete(session).where(eq(session.userId, userId));
}
