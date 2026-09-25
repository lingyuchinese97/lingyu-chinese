/** Kiểm tra người nhận khi chia sẻ (dùng chung cho Ngữ pháp và Từ vựng). */
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { user } from "@/server/db/schema";
import { normalizeEmail } from "@/lib/auth-rules";

export type ShareResult = { email: string; ok: boolean; message: string };

/** Email hợp lệ, không phải chính mình, đã có tài khoản → { id }; ngược lại → thông báo lỗi. */
export async function resolveRecipient(
  me: { email: string },
  email: string,
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Email không đúng định dạng." };
  if (email === normalizeEmail(me.email)) return { ok: false, message: "Bạn không thể chia sẻ cho chính mình." };
  const [r] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (!r) return { ok: false, message: "Người dùng này chưa có tài khoản LingYu Chinese." };
  return { ok: true, id: r.id };
}

/** Chuẩn hoá + bỏ trùng danh sách email. */
export const cleanEmails = (emails: string[]) => [...new Set(emails.map(normalizeEmail).filter(Boolean))];
