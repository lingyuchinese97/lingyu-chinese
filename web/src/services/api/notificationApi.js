// Notification service — bản MOCK, lưu chung trong localStorage (đóng vai server).
import { local, uid, ApiError } from "./storage.js";
import { getCurrentUser } from "./authApi.js";

const K_NOTI = "ly_notifications";
const listeners = new Set();

/** Đăng ký nghe thay đổi thông báo (cùng tab + tab khác qua sự kiện storage). */
export function onNotificationsChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
const emit = () => listeners.forEach((fn) => { try { fn(); } catch { /* ignore */ } });
window.addEventListener("storage", (e) => { if (e.key === K_NOTI || e.key === "ly_grammar_shares") emit(); });

const read = () => local.get(K_NOTI, []) || [];
const write = (v) => { local.set(K_NOTI, v); emit(); };

/** Tạo thông báo cho 1 user (gọi từ phía "server", vd. khi chia sẻ ngữ pháp). */
export function notify(userId, data) {
  write([{ id: uid("n"), userId, ...data, createdAt: new Date().toISOString(), readAt: null }, ...read()]);
}

function me() {
  const u = getCurrentUser();
  if (!u) throw new ApiError("unauthenticated", "Phiên đăng nhập đã hết hạn.");
  return u;
}

export function list({ limit = 20 } = {}) {
  const u = me();
  return read().filter((n) => n.userId === u.id).slice(0, limit);
}

export function unreadCount() {
  const u = getCurrentUser();
  if (!u) return 0;
  return read().filter((n) => n.userId === u.id && !n.readAt).length;
}

export function markRead(ids) {
  const u = me();
  const set = ids ? new Set([].concat(ids)) : null;
  const t = new Date().toISOString();
  const all = read();
  let changed = false;
  all.forEach((n) => {
    if (n.userId === u.id && !n.readAt && (!set || set.has(n.id))) { n.readAt = t; changed = true; }
  });
  if (changed) write(all);
}

/** Làm mới UI khi dữ liệu liên quan thay đổi (vd. vừa chấp nhận/từ chối lời mời). */
export const refreshNotifications = emit;
