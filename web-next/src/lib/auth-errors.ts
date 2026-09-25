/** Đổi lỗi của Better Auth thành câu tiếng Việt. Đăng nhập sai luôn dùng một câu chung (không lộ email có tồn tại hay không). */
export type AuthErrorLike = { status?: number; code?: string; message?: string } | null | undefined;

export const LOGIN_FAILED = "Email hoặc mật khẩu không đúng";
export const RATE_LIMITED = "Bạn thử quá nhiều lần. Vui lòng đợi một phút rồi thử lại.";
export const ACCOUNT_DISABLED = "Tài khoản đã bị khoá. Liên hệ quản trị viên.";
export const EMAIL_TAKEN = "Email này đã được đăng ký. Hãy đăng nhập.";
export const GENERIC = "Có lỗi xảy ra. Vui lòng thử lại.";
export const BAD_ORIGIN =
  "Trang đang mở không đúng địa chỉ của app (ví dụ thiếu https://). Hãy mở lại đúng địa chỉ rồi thử lại.";
const ORIGIN_CODES = new Set(["INVALID_ORIGIN", "MISSING_OR_NULL_ORIGIN", "CROSS_SITE_NAVIGATION_LOGIN_BLOCKED"]);

export function loginErrorMessage(err: AuthErrorLike): string {
  if (!err) return GENERIC;
  if (err.status === 429) return RATE_LIMITED;
  if (err.code && ORIGIN_CODES.has(err.code)) return BAD_ORIGIN;
  if (err.status === 403) return ACCOUNT_DISABLED;
  if (err.status === 400 || err.status === 401) return LOGIN_FAILED;
  return GENERIC;
}

export function registerErrorMessage(err: AuthErrorLike): string {
  if (!err) return GENERIC;
  if (err.status === 429) return RATE_LIMITED;
  if (err.code && ORIGIN_CODES.has(err.code)) return BAD_ORIGIN;
  if (err.code === "USER_ALREADY_EXISTS" || err.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") return EMAIL_TAKEN;
  // Lỗi kiểm tra đầu vào của hook sign-up đã là tiếng Việt.
  if (err.status === 400 && err.message) return err.message;
  if (err.status === 422 && err.code?.startsWith("USER_ALREADY")) return EMAIL_TAKEN;
  return GENERIC;
}
