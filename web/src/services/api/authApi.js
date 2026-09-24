// Auth service — TÁCH KHỎI UI. Bản MOCK chạy bằng localStorage.
// Mọi hàm async, lỗi ném ApiError { code, message } để UI hiển thị.
// Khi nối backend thật (REST / Firebase / Supabase), chỉ thay phần thân hàm.
import { API_CONFIG } from "./config.js";
import { local, wait, uid, ApiError } from "./storage.js";

const K_USERS = "ly_users";
const K_SESSION = "ly_session";
const K_PENDING = "ly_pending_verify";
const K_LOCK = "ly_login_lock";
const K_RESET = "ly_reset_cooldown";

const OTP_TTL = 5 * 60 * 1000;
const RESEND_COOLDOWN = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const MAX_LOGIN_FAILS = 5;
const LOGIN_LOCK_MS = 60 * 1000;

const listeners = new Set();
export function onAuthChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit() { const u = getCurrentUser(); listeners.forEach((fn) => fn(u)); }

const users = () => local.get(K_USERS, []);
const saveUsers = (list) => local.set(K_USERS, list);
const norm = (email) => String(email || "").trim().toLowerCase();
// Phần trước @: chữ/số và . _ % + - (không bắt đầu/kết thúc bằng dấu chấm, không có ".." liên tiếp).
// Tên miền: các nhãn chữ/số/gạch nối (không bắt đầu/kết thúc bằng "-"), đuôi cuối ít nhất 2 chữ cái.
const EMAIL_RE = /^[a-z0-9_%+-]+(\.[a-z0-9_%+-]+)*@([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;
export const isEmail = (email) => {
  const s = String(email || "").trim();
  return s.length <= 254 && s.indexOf("@") <= 64 && EMAIL_RE.test(s);
};

async function hash(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  try {
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    // Môi trường không có SubtleCrypto (http thuần) — fallback hash đơn giản cho mock.
    let h = 2166136261;
    for (const b of data) { h ^= b; h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16);
  }
}
const newSalt = () => Array.from(crypto.getRandomValues(new Uint8Array(12))).map((b) => b.toString(16).padStart(2, "0")).join("");
const newOtp = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, "0");

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, provider: u.provider, createdAt: u.createdAt };
}
function startSession(u) {
  local.set(K_SESSION, publicUser(u));
  emit();
}
function issueOtp(email) {
  const now = Date.now();
  const pending = { email, code: newOtp(), expiresAt: now + OTP_TTL, resendAt: now + RESEND_COOLDOWN, attempts: 0 };
  local.set(K_PENDING, pending);
  return pending;
}
function pendingView(p) {
  if (!p) return null;
  return {
    email: p.email,
    expiresAt: p.expiresAt,
    resendAt: p.resendAt,
    demoCode: API_CONFIG.SHOW_DEMO_OTP ? p.code : undefined,
  };
}

export function getCurrentUser() {
  return local.get(K_SESSION, null);
}

export async function logout() {
  local.remove(K_SESSION);
  emit();
}

export async function register({ name, email, password }) {
  await wait(API_CONFIG.LATENCY);
  const cleanEmail = norm(email);
  if (!String(name || "").trim()) throw new ApiError("invalid-name", "Vui lòng nhập họ và tên.");
  if (!isEmail(cleanEmail)) throw new ApiError("invalid-email", "Email không đúng định dạng.");
  if (!password || password.length < 6) throw new ApiError("weak-password", "Mật khẩu cần ít nhất 6 ký tự.");

  const list = users();
  const existing = list.find((u) => u.email === cleanEmail);
  if (existing && existing.verified) {
    throw new ApiError("email-exists", "Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác.", { field: "email" });
  }
  const salt = newSalt();
  const record = {
    id: existing?.id || uid("u"),
    name: String(name).trim(),
    email: cleanEmail,
    provider: "password",
    salt,
    passwordHash: await hash(password, salt),
    verified: false,
    createdAt: existing?.createdAt || new Date().toISOString(),
  };
  saveUsers(existing ? list.map((u) => (u.id === existing.id ? record : u)) : [...list, record]);
  return pendingView(issueOtp(cleanEmail));
}

export function getPendingVerification() {
  return pendingView(local.get(K_PENDING, null));
}

export async function verifyEmail(email, code) {
  await wait(API_CONFIG.LATENCY);
  const p = local.get(K_PENDING, null);
  if (!p || p.email !== norm(email)) throw new ApiError("no-pending", "Phiên xác thực không còn hiệu lực. Vui lòng đăng ký lại.");
  if (p.attempts >= MAX_OTP_ATTEMPTS) throw new ApiError("too-many-attempts", "Bạn đã nhập sai quá nhiều lần. Hãy gửi lại mã mới.");
  if (Date.now() > p.expiresAt) throw new ApiError("otp-expired", "Mã xác thực đã hết hạn. Hãy gửi lại mã mới.");
  if (String(code) !== p.code) {
    p.attempts += 1;
    local.set(K_PENDING, p);
    const left = MAX_OTP_ATTEMPTS - p.attempts;
    if (left <= 0) throw new ApiError("too-many-attempts", "Bạn đã nhập sai quá nhiều lần. Hãy gửi lại mã mới.");
    throw new ApiError("otp-invalid", `Mã xác thực không đúng. Bạn còn ${left} lần thử.`);
  }
  const list = users();
  const u = list.find((x) => x.email === p.email);
  if (!u) throw new ApiError("no-pending", "Không tìm thấy tài khoản. Vui lòng đăng ký lại.");
  u.verified = true;
  saveUsers(list);
  local.remove(K_PENDING);
  startSession(u);
  return { user: publicUser(u) };
}

export async function resendOtp(email) {
  await wait(API_CONFIG.LATENCY);
  const p = local.get(K_PENDING, null);
  if (!p || p.email !== norm(email)) throw new ApiError("no-pending", "Phiên xác thực không còn hiệu lực. Vui lòng đăng ký lại.");
  const wait_ = p.resendAt - Date.now();
  if (wait_ > 0) throw new ApiError("rate-limited", `Vui lòng đợi ${Math.ceil(wait_ / 1000)} giây trước khi gửi lại mã.`);
  return pendingView(issueOtp(p.email));
}

export async function login({ email, password }) {
  await wait(API_CONFIG.LATENCY);
  const cleanEmail = norm(email);
  const lock = local.get(K_LOCK, {});
  const entry = lock[cleanEmail] || { fails: 0, until: 0 };
  if (entry.until > Date.now()) {
    throw new ApiError("rate-limited", `Bạn đã đăng nhập sai nhiều lần. Thử lại sau ${Math.ceil((entry.until - Date.now()) / 1000)} giây.`);
  }
  const u = users().find((x) => x.email === cleanEmail);
  const fail = () => {
    entry.fails += 1;
    if (entry.fails >= MAX_LOGIN_FAILS) { entry.until = Date.now() + LOGIN_LOCK_MS; entry.fails = 0; }
    local.set(K_LOCK, { ...lock, [cleanEmail]: entry });
    throw new ApiError("invalid-credentials", "Email hoặc mật khẩu không đúng.");
  };
  if (!u) fail();
  if (u.provider === "google" && !u.passwordHash) {
    throw new ApiError("google-account", "Tài khoản này đăng ký bằng Google. Hãy chọn “Đăng nhập với Google”.");
  }
  if ((await hash(password, u.salt)) !== u.passwordHash) fail();
  local.set(K_LOCK, { ...lock, [cleanEmail]: { fails: 0, until: 0 } });
  if (!u.verified) {
    issueOtp(u.email);
    throw new ApiError("email-not-verified", "Email chưa được xác thực. Chúng tôi vừa gửi mã mới.", { email: u.email });
  }
  startSession(u);
  return { user: publicUser(u) };
}

/**
 * Google OAuth — bản mock nhận email/tên từ hộp thoại giả lập.
 * Bản thật: mở popup OAuth, nhận email đã xác thực từ Google.
 */
export async function loginWithGoogle({ email, name }) {
  await wait(API_CONFIG.LATENCY + 200);
  const cleanEmail = norm(email);
  if (!isEmail(cleanEmail)) throw new ApiError("invalid-email", "Email Google không hợp lệ.");
  const list = users();
  let u = list.find((x) => x.email === cleanEmail);
  let isNew = false;
  if (!u) {
    isNew = true;
    u = {
      id: uid("u"), name: String(name || "").trim() || cleanEmail.split("@")[0], email: cleanEmail,
      provider: "google", salt: null, passwordHash: null, verified: true, createdAt: new Date().toISOString(),
    };
    saveUsers([...list, u]);
  } else if (!u.verified) {
    u.verified = true; // Google đã xác thực email
    saveUsers(list);
  }
  startSession(u);
  return { user: publicUser(u), isNew };
}

/** Không tiết lộ email có tồn tại hay không. */
export async function requestPasswordReset(email) {
  await wait(API_CONFIG.LATENCY);
  const cleanEmail = norm(email);
  if (!isEmail(cleanEmail)) throw new ApiError("invalid-email", "Email không đúng định dạng.");
  const cd = local.get(K_RESET, {});
  const until = cd[cleanEmail] || 0;
  if (until > Date.now()) throw new ApiError("rate-limited", `Vui lòng đợi ${Math.ceil((until - Date.now()) / 1000)} giây trước khi gửi lại.`);
  local.set(K_RESET, { ...cd, [cleanEmail]: Date.now() + 30 * 1000 });
  return { ok: true };
}

export async function updateProfile({ name }) {
  await wait(API_CONFIG.LATENCY);
  const s = getCurrentUser();
  if (!s) throw new ApiError("unauthenticated", "Phiên đăng nhập đã hết hạn.");
  if (!String(name || "").trim()) throw new ApiError("invalid-name", "Vui lòng nhập họ và tên.");
  const list = users();
  const u = list.find((x) => x.id === s.id);
  if (u) { u.name = name.trim(); saveUsers(list); startSession(u); }
  return getCurrentUser();
}
