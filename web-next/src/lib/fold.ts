/** Bỏ dấu tiếng Việt + dấu thanh pinyin, chữ thường, trim — dùng để tìm kiếm (như `fold()` bản cũ). */
export function fold(s: unknown): string {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

/** fold + bỏ khoảng trắng (pinyin gõ liền hay tách đều khớp: "nihao" ~ "nǐ hǎo"). */
export const foldCompact = (s: unknown) => fold(s).replace(/\s+/g, "");
