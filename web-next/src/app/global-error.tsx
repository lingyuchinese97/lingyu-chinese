"use client";

import { LOCALE_COOKIE, isLocale, type Locale } from "@/i18n/config";
import { createT } from "@/i18n/translate";

/** Thay cả root layout (không có I18nProvider) → đọc ngôn ngữ từ cookie. */
function cookieLocale(): Locale {
  if (typeof document === "undefined") return "vi";
  const m = new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`).exec(document.cookie);
  return isLocale(m?.[1]) ? m[1] : "vi";
}

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const locale = cookieLocale();
  const t = createT(locale);
  return (
    <html lang={locale}>
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
          background: "#F6FBFF",
          color: "#0E1F3F",
        }}
      >
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ color: "#073B8C" }}>{t("pages.errorTitle")}</h1>
          <p>{t("pages.globalErrorDesc")}</p>
          <button
            onClick={reset}
            style={{
              marginTop: 16,
              height: 44,
              padding: "0 20px",
              borderRadius: 12,
              border: 0,
              background: "#1595F5",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            {t("pages.retry")}
          </button>
        </div>
      </body>
    </html>
  );
}
