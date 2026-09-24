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

/** Gmail (bản mock chỉ nhận tài khoản Google dạng @gmail.com / @googlemail.com). */
export const isGmail = (email) => isEmail(email) && /@(gmail|googlemail)\.com$/i.test(String(email).trim());

export const MIN_PASSWORD = 6;
/** Trả về lỗi mật khẩu (chuỗi) hoặc "" nếu hợp lệ. Dùng chung cho UI và API. */
export function passwordProblem(password) {
  const pw = String(password ?? "");
  if (!pw) return "Vui lòng nhập mật khẩu.";
  if (!pw.trim()) return "Mật khẩu không được chỉ gồm khoảng trắng.";
  if (pw !== pw.trim()) return "Mật khẩu không được bắt đầu hoặc kết thúc bằng khoảng trắng.";
  if (pw.length < MIN_PASSWORD) return `Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự.`;
  if (pw.length > 64) return "Mật khẩu tối đa 64 ký tự.";
  return "";
}
const hasPassword = (u) => !!(u && u.passwordHash);

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
  return { id: u.id, name: u.name, email: u.email, provider: u.provider, hasPassword: hasPassword(u), createdAt: u.createdAt };
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

/** Tìm tài khoản đã xác thực theo email (dùng khi chia sẻ). Trả về thông tin công khai hoặc null. */
export function findUserByEmail(email) {
  const u = users().find((x) => x.email === norm(email) && x.verified);
  return u ? { id: u.id, name: u.name, email: u.email } : null;
}
export function getUserById(id) {
  const u = users().find((x) => x.id === id);
  return u ? { id: u.id, name: u.name, email: u.email } : null;
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
  const pwErr = passwordProblem(password);
  if (pwErr) throw new ApiError("weak-password", pwErr, { field: "password" });

  const list = users();
  const existing = list.find((u) => u.email === cleanEmail);
  if (existing && existing.verified && !hasPassword(existing)) {
    throw new ApiError("google-account", "Email này đã đăng ký bằng Google. Hãy tiếp tục bằng Google, sau đó có thể tạo mật khẩu trong Cài đặt.", { email: cleanEmail });
  }
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
  if (!password) throw new ApiError("validation", "Vui lòng nhập mật khẩu.");
  if (!u) fail();
  if (!hasPassword(u)) {
    throw new ApiError("google-account", "Tài khoản này được tạo bằng Google nên chưa có mật khẩu. Hãy đăng nhập bằng Google, sau đó có thể tạo mật khẩu trong Cài đặt.", { email: u.email });
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
  if (!isEmail(cleanEmail)) throw new ApiError("invalid-email", "Email không đúng định dạng.");
  if (!isGmail(cleanEmail)) throw new ApiError("not-gmail", "Vui lòng dùng tài khoản Gmail (@gmail.com).");
  const list = users();
  let u = list.find((x) => x.email === cleanEmail);
  let isNew = false;
  let linked = false;
  if (!u) {
    isNew = true;
    u = {
      id: uid("u"), name: String(name || "").trim() || cleanEmail.split("@")[0], email: cleanEmail,
      provider: "google", salt: null, passwordHash: null, verified: true, createdAt: new Date().toISOString(),
    };
    list.push(u);
  } else if (!u.verified) {
    // Tài khoản email/mật khẩu chưa xác thực: chưa ai chứng minh sở hữu email này.
    // Google xác nhận chủ email → bỏ mật khẩu cũ (có thể do người khác đặt) để tránh chiếm tài khoản.
    Object.assign(u, { provider: "google", salt: null, passwordHash: null, verified: true });
    const p = local.get(K_PENDING, null);
    if (p && p.email === cleanEmail) local.remove(K_PENDING);
  } else if (u.provider !== "google" && !u.googleLinked) {
    // Tài khoản đã có mật khẩu: liên kết thêm Google, vẫn giữ mật khẩu.
    u.googleLinked = true;
    linked = true;
  }
  saveUsers(list);
  startSession(u);
  return { user: publicUser(u), isNew, linked };
}

/** Tạo mật khẩu cho tài khoản chưa có (tạo bằng Google) để đăng nhập được bằng email + mật khẩu. */
export async function setPassword({ password, confirm }) {
  await wait(API_CONFIG.LATENCY);
  const s = getCurrentUser();
  if (!s) throw new ApiError("unauthenticated", "Phiên đăng nhập đã hết hạn.");
  const pwErr = passwordProblem(password);
  if (pwErr) throw new ApiError("weak-password", pwErr, { field: "password" });
  if (confirm !== password) throw new ApiError("mismatch", "Mật khẩu xác nhận không khớp.", { field: "confirm" });
  const list = users();
  const u = list.find((x) => x.id === s.id);
  if (!u) throw new ApiError("not-found", "Không tìm thấy tài khoản.");
  if (hasPassword(u)) throw new ApiError("has-password", "Tài khoản đã có mật khẩu.");
  u.salt = newSalt();
  u.passwordHash = await hash(password, u.salt);
  saveUsers(list);
  startSession(u);
  return getCurrentUser();
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
