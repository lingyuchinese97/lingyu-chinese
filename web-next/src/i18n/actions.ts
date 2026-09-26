"use server";
import { cookies } from "next/headers";
import { getSession } from "@/server/session";
import { setUserLocale } from "@/features/account/service";
import { env } from "@/env";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, isLocale } from "./config";

/** Đổi ngôn ngữ giao diện: ghi cookie (cả khi chưa đăng nhập) và lưu vào tài khoản nếu đã đăng nhập. */
export async function setLocaleAction(locale: string): Promise<{ ok: boolean }> {
  if (!isLocale(locale)) return { ok: false };
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
    secure: env.BETTER_AUTH_URL.startsWith("https://"),
  });
  const s = await getSession();
  if (s) await setUserLocale(s.user.id, locale);
  return { ok: true };
}
