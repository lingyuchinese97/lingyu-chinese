/** Nội dung module Phát âm & Biến điệu (tĩnh, giống nhau cho mọi người) + kiểm tra mã mục gắn ghi chú. */
import { FINAL_GROUPS, FINALS } from "./finals";
import { INITIAL_GROUPS, INITIALS } from "./initials";
import { SANDHI_RULES, SANDHI_TIPS, TONE_SETS, TONE_TIPS, TONES } from "./tones";
import type { L } from "./types";

export * from "./types";
export { FINAL_GROUPS, FINALS, INITIAL_GROUPS, INITIALS, SANDHI_RULES, SANDHI_TIPS, TONE_SETS, TONE_TIPS, TONES };

export const PRONUNCIATION_CONTENT = {
  initials: { groups: INITIAL_GROUPS, items: INITIALS },
  finals: { groups: FINAL_GROUPS, items: FINALS },
  tones: { items: TONES, sets: TONE_SETS, tips: TONE_TIPS },
  sandhi: { rules: SANDHI_RULES, tips: SANDHI_TIPS },
};

/**
 * Mục có thể gắn ghi chú: "initial:<ký hiệu>", "final:<ký hiệu>", "tone:<1–5>", "sandhi:<quy tắc>",
 * "sandhi:<quy tắc>:<chỉ số ví dụ>", "sandhi:general". Trả về tên hiển thị của mục, hoặc null nếu mã không hợp lệ.
 */
export function topicLabel(topic: string): L | null {
  const [kind, a, b, ...rest] = topic.split(":");
  if (rest.length) return null;
  if (kind === "initial" && b === undefined) {
    const x = INITIALS.find((i) => i.symbol === a);
    return x ? { vi: `Thanh mẫu ${x.symbol}`, en: `Initial ${x.symbol}` } : null;
  }
  if (kind === "final" && b === undefined) {
    const x = FINALS.find((i) => i.symbol === a);
    return x ? { vi: `Vận mẫu ${x.symbol}`, en: `Final ${x.symbol}` } : null;
  }
  if (kind === "tone" && b === undefined) {
    const x = TONES.find((t) => String(t.tone) === a);
    return x ? x.name : null;
  }
  if (kind === "sandhi") {
    if (a === "general" && b === undefined) return { vi: "Ghi chú chung về biến điệu", en: "General tone sandhi note" };
    const r = SANDHI_RULES.find((x) => x.id === a);
    if (!r) return null;
    if (b === undefined) return r.title;
    if (!/^\d+$/.test(b)) return null;
    const e = r.examples[Number(b)];
    return e ? { vi: `${r.title.vi} · ${e.hanzi}`, en: `${r.title.en} · ${e.hanzi}` } : null;
  }
  return null;
}
export const isTopic = (topic: string) => topicLabel(topic) !== null;

/** Trang chứa mục (để mở lại từ "Ghi chú của tôi"). */
export function topicHref(topic: string) {
  const [kind, a] = topic.split(":");
  if (kind === "initial") return `/pronunciation/initials?s=${encodeURIComponent(a ?? "")}`;
  if (kind === "final") return `/pronunciation/finals?s=${encodeURIComponent(a ?? "")}`;
  if (kind === "tone") return "/pronunciation/tones";
  if (kind === "sandhi" && a && a !== "general") return `/pronunciation/sandhi?rule=${a}`;
  return "/pronunciation/sandhi";
}
