import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { getSession } from "@/server/session";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_TAG, isLocale, type Locale } from "./config";
import { createT } from "./translate";

/**
 * Ngôn ngữ của request hiện tại: ngôn ngữ đã lưu trong tài khoản (đổi máy vẫn giữ) → cookie (chưa đăng nhập)
 * → tiếng Việt. Cache trong 1 request.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const s = await getSession().catch(() => null);
  if (s?.user.locale) return s.user.locale;
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(c) ? c : DEFAULT_LOCALE;
});

export const getT = cache(async () => {
  const locale = await getLocale();
  return createT(locale);
});

export async function getIntlTag(): Promise<string> {
  return LOCALE_TAG[await getLocale()];
}
