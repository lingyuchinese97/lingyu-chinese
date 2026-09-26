"use client";
import * as React from "react";
import { LOCALE_COOKIE, isLocale, type Locale } from "@/i18n/config";
import { createT } from "@/i18n/translate";

/** Trang offline được dựng sẵn lúc build (không biết ngôn ngữ) → chọn ngôn ngữ theo cookie ngay trên máy. */
export function OfflineText() {
  const [locale, setLocale] = React.useState<Locale>("vi");
  React.useEffect(() => {
    const m = new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`).exec(document.cookie);
    if (isLocale(m?.[1]) && m[1] !== "vi") {
      const l = m[1];
      document.documentElement.lang = l;
      queueMicrotask(() => setLocale(l));
    }
  }, []);
  const t = createT(locale);
  return (
    <>
      <h1 className="text-2xl font-extrabold text-navy">{t("pages.offlineTitle")}</h1>
      <p className="max-w-sm text-text-2">{t("pages.offlineDesc")}</p>
      <a
        href="/home"
        className="inline-flex h-12 items-center rounded-md bg-blue-600 px-5 font-semibold text-white shadow-cta hover:bg-blue-700"
      >
        {t("pages.retry")}
      </a>
    </>
  );
}
