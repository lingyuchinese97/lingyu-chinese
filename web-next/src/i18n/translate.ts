import * as React from "react";
import { LOCALE_TAG, type Locale } from "./config";
import { MESSAGES } from "./messages";
import type { Messages } from "./messages/vi";

/** "a.b.c" cho mọi lá (chuỗi) trong cây từ điển. */
type Paths<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Paths<T[K], `${P}${K}.`>;
}[keyof T & string];

export type MessageKey = Paths<Messages>;
export type Vars = Record<string, string | number>;
export type T = {
  (key: MessageKey, vars?: Vars): string;
  /**
   * Dịch một thông báo có sẵn (lỗi Zod / service / Better Auth...). Nhận khoá từ điển, hoặc chính câu tiếng Việt gốc
   * (khớp nguyên văn hay theo mẫu có biến như "Tối đa {max} tag"), rồi trả câu của ngôn ngữ hiện tại.
   * Không nhận ra thì trả nguyên văn.
   */
  maybe: (msg: string, vars?: Vars) => string;
  has: (key: string) => boolean;
  /** Như `t` nhưng biến có thể là phần tử React (vd tên in đậm): `t.rich("x", { who: <strong>..</strong> })`. */
  rich: (key: MessageKey, vars: Record<string, React.ReactNode>) => React.ReactNode;
};

function lookup(messages: unknown, key: string): string | undefined {
  let cur: unknown = messages;
  for (const part of key.split(".")) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

/**
 * Thay biến `{name}` và số nhiều kiểu ICU rút gọn: `{count, plural, one {# word} other {# words}}`
 * (`#` = giá trị số). Tiếng Việt không cần số nhiều nên chỉ dùng dạng `{count}`.
 */
export function format(template: string, vars?: Vars, pluralRules?: Intl.PluralRules): string {
  if (!vars) return template;
  let out = template.replace(
    /\{(\w+),\s*plural,\s*((?:[=\w]+\s*\{[^{}]*\}\s*)+)\}/g,
    (_m, name: string, body: string) => {
      const n = Number(vars[name] ?? 0);
      const forms: Record<string, string> = {};
      for (const f of body.matchAll(/([=\w]+)\s*\{([^{}]*)\}/g)) forms[f[1]!] = f[2]!;
      const cat = pluralRules?.select(n) ?? (n === 1 ? "one" : "other");
      const chosen = forms[`=${n}`] ?? forms[cat] ?? forms.other ?? "";
      return chosen.replace(/#/g, String(n));
    },
  );
  out = out.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
  return out;
}

// ---------- Tra ngược từ câu tiếng Việt gốc → khoá ----------

type Pattern = { re: RegExp; names: string[]; key: string };
let index: { exact: Map<string, string>; patterns: Pattern[] } | null = null;

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildIndex() {
  const exact = new Map<string, string>();
  const patterns: Pattern[] = [];
  const walk = (node: unknown, prefix: string) => {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (typeof v !== "string") {
        walk(v, key);
        continue;
      }
      if (!exact.has(v)) exact.set(v, key);
      const names: string[] = [];
      // Chỉ khớp theo mẫu cho thông báo lỗi/hệ thống (tránh khớp nhầm các nhãn ngắn như "{count} từ vựng").
      if (key.startsWith("errors.") && /\{\w+\}/.test(v) && !/plural,/.test(v)) {
        const src = v
          .split(/(\{\w+\})/g)
          .map((part) => {
            const m = /^\{(\w+)\}$/.exec(part);
            if (!m) return escapeRe(part);
            names.push(m[1]!);
            return "(.+?)";
          })
          .join("");
        patterns.push({ re: new RegExp(`^${src}$`), names, key });
      }
    }
  };
  walk(MESSAGES.vi, "");
  // Mẫu cụ thể (ít biến, dài) thử trước.
  patterns.sort((a, b) => a.names.length - b.names.length || b.re.source.length - a.re.source.length);
  return { exact, patterns };
}

/** Tìm khoá + biến của một câu tiếng Việt gốc (hoặc khoá). */
export function resolveMessage(msg: string): { key: string; vars?: Vars } | null {
  if (lookup(MESSAGES.vi, msg) !== undefined) return { key: msg };
  index ??= buildIndex();
  const key = index.exact.get(msg);
  if (key) return { key };
  for (const p of index.patterns) {
    const m = p.re.exec(msg);
    if (m) return { key: p.key, vars: Object.fromEntries(p.names.map((n, i) => [n, m[i + 1]!])) };
  }
  return null;
}

export function createT(locale: Locale): T {
  const messages = MESSAGES[locale];
  const rules = new Intl.PluralRules(LOCALE_TAG[locale]);
  const t = ((key: MessageKey, vars?: Vars) => {
    const s = lookup(messages, key);
    return s === undefined ? key : format(s, vars, rules);
  }) as T;
  t.has = (key) => lookup(messages, key) !== undefined;
  t.maybe = (msg, vars) => {
    if (!msg) return msg;
    const r = resolveMessage(msg);
    if (!r) return msg;
    const s = lookup(messages, r.key);
    if (s === undefined) return msg;
    const v = { ...r.vars, ...vars };
    // Biến là số trong câu gốc → giữ dạng số cho số nhiều tiếng Anh.
    for (const [k, x] of Object.entries(v)) if (typeof x === "string" && /^\d+$/.test(x)) v[k] = Number(x);
    return format(s, v, rules);
  };
  t.rich = (key, vars) => {
    const prim: Vars = {};
    for (const [k, v] of Object.entries(vars)) if (typeof v === "string" || typeof v === "number") prim[k] = v;
    const s = format(lookup(messages, key) ?? key, prim, rules);
    const parts = s.split(/(\{\w+\})/g).map((part) => {
      const m = /^\{(\w+)\}$/.exec(part);
      return m && m[1]! in vars ? vars[m[1]!] : part;
    });
    return React.createElement(React.Fragment, null, ...parts);
  };
  return t;
}
