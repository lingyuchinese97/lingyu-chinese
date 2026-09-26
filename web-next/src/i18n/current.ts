import { DEFAULT_LOCALE, isLocale } from "./config";
import { createT, type T } from "./translate";

const cache = new Map<string, T>();

/**
 * `t` theo ngôn ngữ đang hiển thị (thuộc tính lang của <html>) — cho hàm thường chạy ở trình duyệt, không dùng được hook
 * (vd hàm hỏi xác nhận, wrapper toast). Ở server trả tiếng Việt.
 */
export function currentT(): T {
  const lang = typeof document === "undefined" ? DEFAULT_LOCALE : document.documentElement.lang;
  const l = isLocale(lang) ? lang : DEFAULT_LOCALE;
  let t = cache.get(l);
  if (!t) cache.set(l, (t = createT(l)));
  return t;
}
