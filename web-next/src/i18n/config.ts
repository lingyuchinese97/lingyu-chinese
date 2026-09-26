/** Ngôn ngữ giao diện. Tiếng Việt là mặc định; người dùng đổi tuỳ ý (lưu cookie + tài khoản). */
export const LOCALES = ["vi", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "vi";
export const LOCALE_COOKIE = "lingyu-locale";
/** Thẻ BCP 47 dùng cho `Intl` (định dạng ngày giờ, số, so sánh chuỗi). */
export const LOCALE_TAG: Record<Locale, string> = { vi: "vi-VN", en: "en-US" };
/** Tên ngôn ngữ viết bằng chính ngôn ngữ đó (để người dùng luôn nhận ra). */
export const LOCALE_LABEL: Record<Locale, string> = { vi: "Tiếng Việt", en: "English" };

export function isLocale(x: unknown): x is Locale {
  return typeof x === "string" && (LOCALES as readonly string[]).includes(x);
}

/** Cookie ngôn ngữ: 1 năm, đọc được cả khi chưa đăng nhập. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
