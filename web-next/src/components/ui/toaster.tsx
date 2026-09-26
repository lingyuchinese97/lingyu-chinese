"use client";

import { Toaster as Sonner, toast as sonner } from "sonner";
import { isLocale } from "@/i18n/config";
import { createT, type T } from "@/i18n/translate";

/** Toast (sonner, theo shadcn/ui). Trên điện thoại đặt phía trên thanh tab. */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      richColors
      closeButton={false}
      offset={{ bottom: 24 }}
      mobileOffset={{ bottom: "calc(var(--tabbar-h) + var(--safe-b) + 12px)" }}
      toastOptions={{ classNames: { toast: "font-sans text-[14.5px]" } }}
    />
  );
}

// Thông báo từ server (tiếng Việt gốc) được dịch theo ngôn ngữ đang hiển thị (thuộc tính lang của <html>).
const cache = new Map<string, T>();
function tr<M>(m: M): M {
  if (typeof m !== "string" || typeof document === "undefined") return m;
  const lang = document.documentElement.lang;
  if (!isLocale(lang) || lang === "vi") return m;
  let t = cache.get(lang);
  if (!t) cache.set(lang, (t = createT(lang)));
  return t.maybe(m) as M;
}
type Msg = Parameters<typeof sonner>[0];
type Opts = Parameters<typeof sonner>[1];

export const toast = Object.assign((m: Msg, o?: Opts) => sonner(tr(m), o), {
  ...sonner,
  success: (m: Msg, o?: Opts) => sonner.success(tr(m), o),
  error: (m: Msg, o?: Opts) => sonner.error(tr(m), o),
  info: (m: Msg, o?: Opts) => sonner.info(tr(m), o),
  warning: (m: Msg, o?: Opts) => sonner.warning(tr(m), o),
  message: (m: Msg, o?: Opts) => sonner.message(tr(m), o),
});
