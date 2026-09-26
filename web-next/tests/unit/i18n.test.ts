import { describe, expect, it } from "vitest";
import { createT, format } from "@/i18n/translate";
import { MESSAGES } from "@/i18n/messages";

type Tree = { [k: string]: string | Tree };
function keys(node: Tree, prefix = ""): string[] {
  return Object.entries(node).flatMap(([k, v]) =>
    typeof v === "string" ? [`${prefix}${k}`] : keys(v, `${prefix}${k}.`),
  );
}
const vars = (s: string) => [...s.matchAll(/\{(\w+)[},]/g)].map((m) => m[1]).sort();

describe("i18n", () => {
  it("English has exactly the same keys as Vietnamese, with the same variables", () => {
    const vi = MESSAGES.vi as unknown as Tree;
    const en = MESSAGES.en as unknown as Tree;
    expect(keys(en).sort()).toEqual(keys(vi).sort());
    const get = (t: Tree, k: string) => k.split(".").reduce<string | Tree>((n, p) => (n as Tree)[p]!, t) as string;
    for (const k of keys(vi)) expect([k, [...new Set(vars(get(en, k)))]]).toEqual([k, [...new Set(vars(get(vi, k)))]]);
  });

  it("formats variables and English plurals", () => {
    const rules = new Intl.PluralRules("en-US");
    const tpl = "{who} shared {count, plural, one {# word} other {# words}}";
    expect(format(tpl, { who: "A", count: 1 }, rules)).toBe("A shared 1 word");
    expect(format(tpl, { who: "A", count: 3 }, rules)).toBe("A shared 3 words");
  });

  it("translates existing Vietnamese messages by exact text or template", () => {
    const en = createT("en");
    expect(en.maybe("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")).toBe(
      "Your session has expired. Please sign in again.",
    );
    expect(en.maybe("common.forbidden")).toBe("You don't have permission to do this.");
    expect(en.maybe("Một câu chưa có trong từ điển")).toBe("Một câu chưa có trong từ điển");
    const vi = createT("vi");
    expect(vi.maybe("common.back")).toBe("Quay lại");
    expect(vi("shell.account", { name: "Linh" })).toBe("Tài khoản: Linh");
  });
});
