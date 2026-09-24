// Chia sẻ từ vựng cho người dùng LingYu khác — bản MOCK, lưu chung trong localStorage (đóng vai server).
// Lời mời chứa BẢN CHỤP các từ tại lúc gửi → người gửi sửa/xóa từ gốc không ảnh hưởng lời mời,
// người nhận chấp nhận thì các từ được CHÉP vào kho riêng của họ (độc lập với người gửi).
import { local, wait, uid, ApiError } from "./storage.js";
import { API_CONFIG } from "./config.js";
import { getCurrentUser, getUserById } from "./authApi.js";
import { checkRecipient } from "./shareUtils.js";
import { notify } from "./notificationApi.js";
import * as vocabApi from "./vocabApi.js";

const K = "ly_vocab_shares";
export const STATUS = { PENDING: "PENDING", ACCEPTED: "ACCEPTED", REJECTED: "REJECTED" };
export const STATUS_LABEL = { PENDING: "Đang chờ", ACCEPTED: "Đã chấp nhận", REJECTED: "Đã từ chối" };
export const MAX_WORDS = 200;

const read = () => local.get(K, []) || [];
const write = (v) => local.set(K, v);
const now = () => new Date().toISOString();
function me() {
  const u = getCurrentUser();
  if (!u) throw new ApiError("unauthenticated", "Phiên đăng nhập đã hết hạn.");
  return u;
}

/** Bản chụp gọn của 1 từ để gửi đi (không gửi ảnh để tiết kiệm dung lượng; không gửi trạng thái/yêu thích). */
const snapshot = (v) => ({ hanzi: v.hanzi, pinyin: v.pinyin, meaningVi: v.meaningVi, note: v.note || "", tags: [...(v.tags || [])], radicals: [...(v.radicals || [])] });
const keyOf = (words) => words.map((w) => w.hanzi).sort().join("|");

function view(s) {
  const sender = getUserById(s.senderId);
  const recipient = getUserById(s.recipientId);
  return {
    id: s.id, status: s.status, createdAt: s.createdAt, respondedAt: s.respondedAt || null,
    senderId: s.senderId, senderName: sender?.name || "", senderEmail: sender?.email || "",
    recipientId: s.recipientId, recipientEmail: recipient?.email || s.recipientEmail || "",
    words: s.words, count: s.words.length,
    title: s.words.slice(0, 3).map((w) => w.hanzi).join(", ") + (s.words.length > 3 ? ` +${s.words.length - 3}` : ""),
    added: s.added ?? null,
  };
}

/**
 * Gửi các từ (theo id, của chính mình) cho nhiều email.
 * Kiểm tra từng email: đúng định dạng · có tài khoản · không phải chính mình ·
 * không gửi trùng (cùng người nhận + cùng bộ từ) khi lời mời trước còn đang chờ.
 */
export async function share(ids, emails) {
  await wait(API_CONFIG.LATENCY);
  const u = me();
  const words = (await vocabApi.getMany(ids)).map(snapshot);
  if (!words.length) throw new ApiError("validation", "Các từ đã chọn không còn tồn tại.");
  if (words.length > MAX_WORDS) throw new ApiError("validation", `Mỗi lần chỉ chia sẻ tối đa ${MAX_WORDS} từ.`);
  const list = [...new Set([].concat(emails).map((e) => String(e).trim().toLowerCase()).filter(Boolean))];
  if (!list.length) throw new ApiError("validation", "Vui lòng nhập ít nhất 1 email người nhận.");
  const all = read();
  const key = keyOf(words);
  const results = [];
  for (const email of list) {
    const check = checkRecipient(email, u);
    if (!check.ok) { results.push({ email, ok: false, message: check.message }); continue; }
    const r = check.user;
    if (all.some((s) => s.senderId === u.id && s.recipientId === r.id && s.status === STATUS.PENDING && keyOf(s.words) === key)) {
      results.push({ email, ok: false, message: "Đã gửi các từ này trước đó, đang chờ người nhận phản hồi." }); continue;
    }
    const s = { id: uid("vs"), senderId: u.id, recipientId: r.id, recipientEmail: r.email, words, status: STATUS.PENDING, createdAt: now() };
    all.push(s);
    notify(r.id, { type: "vocab_share", shareId: s.id, actorName: u.name, title: view(s).title, count: words.length });
    results.push({ email, ok: true, message: `Đã gửi ${words.length} từ.` });
  }
  write(all);
  return { results, sent: results.filter((x) => x.ok).length };
}

/** Lời mời mình nhận (mặc định: đang chờ). */
export function listReceived({ status = STATUS.PENDING } = {}) {
  const u = me();
  return read().filter((s) => s.recipientId === u.id && (!status || s.status === status))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).map(view);
}

/** Lời mời mình đã gửi (mới nhất trước). */
export function listSent({ limit = 10 } = {}) {
  const u = me();
  return read().filter((s) => s.senderId === u.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, limit).map(view);
}

export function get(id) {
  const u = me();
  const s = read().find((x) => x.id === id && (x.recipientId === u.id || x.senderId === u.id));
  if (!s) throw new ApiError("not-found", "Lời mời chia sẻ không còn tồn tại.");
  return view(s);
}

function pendingForMe(id) {
  const u = me();
  const all = read();
  const s = all.find((x) => x.id === id && x.recipientId === u.id);
  if (!s) throw new ApiError("not-found", "Lời mời chia sẻ không còn tồn tại.");
  if (s.status !== STATUS.PENDING) throw new ApiError("already-responded", `Bạn đã ${s.status === STATUS.ACCEPTED ? "chấp nhận" : "từ chối"} lời mời này.`);
  return { u, all, s };
}

/**
 * Chấp nhận: chép các từ vào kho của người nhận (bỏ qua từ đã có — trùng Hán tự).
 * keepTags: giữ tag của người gửi; extraTags: thêm tag riêng của người nhận.
 */
export async function accept(id, { keepTags = true, extraTags = [] } = {}) {
  const { u, all, s } = pendingForMe(id);
  const extra = extraTags.map((t) => String(t).trim()).filter(Boolean);
  const records = s.words.map((w) => ({ ...w, tags: [...(keepTags ? w.tags : []), ...extra] }));
  const res = await vocabApi.importMany(records);
  Object.assign(s, { status: STATUS.ACCEPTED, respondedAt: now(), added: res.added });
  write(all);
  notify(s.senderId, { type: "vocab_share_accepted", shareId: s.id, actorName: u.name, title: view(s).title, count: s.words.length });
  return { ...res, total: s.words.length };
}

/** Từ chối: không thêm từ nào. */
export async function reject(id) {
  await wait(API_CONFIG.LATENCY);
  const { all, s } = pendingForMe(id);
  Object.assign(s, { status: STATUS.REJECTED, respondedAt: now() });
  write(all);
  return view(s);
}

/** Tag của người gửi có trong lời mời (để màn Chấp nhận hiển thị lựa chọn). */
export function senderTags(share) {
  return [...new Set(share.words.flatMap((w) => w.tags))];
}
