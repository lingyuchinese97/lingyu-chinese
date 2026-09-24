// Dùng chung cho chia sẻ Ngữ pháp / Từ vựng: tách danh sách email, kiểm tra người nhận.
import { findUserByEmail, isEmail } from "./authApi.js";

/** Tách chuỗi nhiều email (dấu phẩy, chấm phẩy, khoảng trắng, xuống dòng), bỏ trùng. */
export function parseEmails(text) {
  return [...new Set(String(text || "").split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))];
}

/**
 * Kiểm tra 1 email người nhận: đúng định dạng · có tài khoản LingYu · không phải chính mình.
 * Trả về { ok: true, user } hoặc { ok: false, message }.
 */
export function checkRecipient(email, me) {
  const e = String(email || "").trim().toLowerCase();
  if (!isEmail(e)) return { ok: false, message: "Email không đúng định dạng." };
  if (e === String(me.email).toLowerCase()) return { ok: false, message: "Bạn không thể chia sẻ cho chính mình." };
  const user = findUserByEmail(e);
  if (!user) return { ok: false, message: "Người dùng này chưa có tài khoản LingYu Chinese." };
  return { ok: true, user };
}
