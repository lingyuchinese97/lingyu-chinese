"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { LOCALES, LOCALE_LABEL, type Locale } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/client";
import { setLocaleAction } from "@/i18n/actions";

/** Chọn nhanh Tiếng Việt / English. Lưu cookie + tài khoản (nếu đã đăng nhập) rồi tải lại dữ liệu trang. */
export function useSwitchLocale() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const change = (l: Locale) =>
    start(async () => {
      await setLocaleAction(l);
      router.refresh();
    });
  return { change, pending };
}

export function LanguageSwitch({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useT();
  const { change, pending } = useSwitchLocale();
  return (
    <div
      role="group"
      aria-label={t("shell.languageSwitch")}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-white/90 p-1 text-sm shadow-soft",
        pending && "opacity-60",
        className,
      )}
    >
      <Languages className="ml-1.5 size-4 text-blue-600" aria-hidden="true" />
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={l === locale}
          disabled={pending}
          onClick={() => l !== locale && change(l)}
          className={cn(
            "rounded-full px-3 py-1 font-semibold outline-none focus-visible:[box-shadow:var(--focus-ring)]",
            l === locale ? "bg-blue-600 text-white" : "text-text-2 hover:bg-blue-50",
          )}
        >
          {LOCALE_LABEL[l]}
        </button>
      ))}
    </div>
  );
}
