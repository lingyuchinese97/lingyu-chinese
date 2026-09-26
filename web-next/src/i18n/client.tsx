"use client";
import * as React from "react";
import { LOCALE_TAG, type Locale } from "./config";
import { createT, type T } from "./translate";

type Ctx = { locale: Locale; tag: string; t: T };
const I18nContext = React.createContext<Ctx | null>(null);

/** Cấp ngôn ngữ hiện tại cho client component (bọc ở root layout). Từ điển được đóng gói sẵn trong JS. */
export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = React.useMemo(() => ({ locale, tag: LOCALE_TAG[locale], t: createT(locale) }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function useI18n(): Ctx {
  const c = React.useContext(I18nContext);
  if (!c) throw new Error("I18nProvider missing");
  return c;
}
export const useT = () => useI18n().t;
export const useLocale = () => useI18n().locale;
/** Thẻ BCP 47 cho `toLocaleString` / `Intl`. */
export const useIntlTag = () => useI18n().tag;
