/**
 * Pinyin cho cả câu (nút "Tạo Pinyin"): từng âm tiết cách nhau bằng khoảng trắng, dấu câu tiếng Trung đổi sang dấu Latin
 * gắn vào âm tiết trước, viết hoa chữ đầu câu. Nạp pinyin-pro khi cần (gói khá nặng).
 */
const PUNCT: Record<string, string> = {
  "，": ",",
  "。": ".",
  "！": "!",
  "？": "?",
  "；": ";",
  "：": ":",
  "、": ",",
  "“": '"',
  "”": '"',
  "‘": "'",
  "’": "'",
  "（": "(",
  "）": ")",
  "《": '"',
  "》": '"',
  "…": "…",
  "—": "—",
};

const OPENING = new Set(["“", "‘", "（", "《", "(", '"']);

export function joinPinyin(tokens: { origin: string; result: string }[]): string {
  let out = "";
  let capNext = true;
  let glue = true; // true → token tiếp theo không cần khoảng trắng phía trước
  for (const t of tokens) {
    for (const ch of /\p{Script=Han}/u.test(t.origin) ? [t.origin] : [...t.origin]) {
      if (/\p{Script=Han}/u.test(ch)) {
        let syl = t.result;
        if (capNext) syl = syl.charAt(0).toUpperCase() + syl.slice(1);
        capNext = false;
        out += (glue ? "" : " ") + syl;
        glue = false;
      } else if (!ch.trim()) {
        continue;
      } else if (OPENING.has(ch)) {
        out += (out ? " " : "") + (PUNCT[ch] ?? ch);
        glue = true;
      } else {
        out += PUNCT[ch] ?? ch; // dấu đóng / dấu câu gắn vào âm tiết trước
        if (/[.!?。！？]/.test(ch)) capNext = true;
        glue = false;
      }
    }
  }
  return out.trim();
}

export async function sentencePinyin(text: string): Promise<string> {
  const { segment, OutputFormat } = await import("pinyin-pro");
  const tokens = segment(text, { format: OutputFormat.AllSegment }) as { origin: string; result: string }[];
  return joinPinyin(tokens);
}
