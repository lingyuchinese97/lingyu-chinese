/** Tài khoản của chính người dùng: đổi tên, đổi mật khẩu, xoá tài khoản. userId luôn lấy từ session. */
import { and, eq, ne } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db } from "@/server/db/client";
import { account, session, user } from "@/server/db/schema";
import type { Locale } from "@/i18n/config";

export class AccountError extends Error {
  constructor(
    message: string,
    public field?: "name" | "current" | "password" | "confirm",
  ) {
    super(message);
  }
}

export async function updateName(userId: string, name: string) {
  await db.update(user).set({ name }).where(eq(user.id, userId));
}

async function credential(userId: string) {
  const [a] = await db
    .select({ id: account.id, password: account.password })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "credential")))
    .limit(1);
  return a ?? null;
}

export async function verifyPassword(userId: string, password: string) {
  const a = await credential(userId);
  if (!a?.password) return false;
  const ctx = await auth.$context;
  return ctx.password.verify({ hash: a.password, password });
}

/** Đổi mật khẩu: kiểm tra mật khẩu hiện tại; các thiết bị khác bị đăng xuất, thiết bị đang dùng giữ phiên. */
export async function changePassword(userId: string, keepSessionId: string, current: string, next: string) {
  if (!(await verifyPassword(userId, current))) throw new AccountError("Mật khẩu hiện tại không đúng.", "current");
  if (current === next) throw new AccountError("Mật khẩu mới phải khác mật khẩu hiện tại.", "password");
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(next);
  await db.transaction(async (tx) => {
    await tx
      .update(account)
      .set({ password: hash, updatedAt: new Date() })
      .where(and(eq(account.userId, userId), eq(account.providerId, "credential")));
    await tx.delete(session).where(and(eq(session.userId, userId), ne(session.id, keepSessionId)));
  });
}

/** Xoá tài khoản (gọi SAU khi đã kiểm tra mật khẩu). Mọi dữ liệu (từ vựng, ảnh, ngữ pháp, tiến độ, phiên...) xoá theo cascade. */
export async function removeUser(userId: string) {
  await db.delete(user).where(eq(user.id, userId));
}

/** Lưu ngôn ngữ giao diện của người dùng (đổi máy vẫn giữ). */
export async function setUserLocale(userId: string, locale: Locale) {
  await db.update(user).set({ locale }).where(eq(user.id, userId));
}
