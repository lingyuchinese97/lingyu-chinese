/**
 * Chấm câu dịch (chạy ở SERVER).
 *  - Việt → Trung: so khớp chữ Hán sau khi bỏ khoảng trắng, dấu câu (cả dấu câu tiếng Trung ，。！？), đổi ký tự full-width.
 *  - Trung → Việt: không phân biệt hoa/thường, dấu thanh, dấu câu, khoảng trắng thừa. Có nhiều cách dịch đúng nên người học
 *    có thể tự "Tính là đúng" khi máy chấm sai.
 */
import { fold } from "@/lib/fold";

export type Direction = "vi-zh" | "zh-vi";

export function normalizeChinese(s: unknown): string {
  return String(s ?? "")
    .normalize("NFKC")
    .replace(/[\s\p{P}\p{S}]/gu, "");
}

export function normalizeVietnamese(s: unknown): string {
  return fold(String(s ?? "").normalize("NFC"))
    .replace(/[\p{P}\p{S}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function gradeSentence(direction: Direction, s: { chinese: string; vietnamese: string }, answer: unknown) {
  if (!String(answer ?? "").trim()) return false;
  if (direction === "vi-zh") return normalizeChinese(answer) === normalizeChinese(s.chinese);
  // Nhiều cách dịch cách nhau bằng " / " hoặc ";" trong câu tiếng Việt đều được chấp nhận.
  const a = normalizeVietnamese(answer);
  return String(s.vietnamese)
    .split(/\s\/\s|;/)
    .map(normalizeVietnamese)
    .some((v) => v === a);
}

/** Gợi ý: chữ Hán đầu tiên (bỏ qua dấu câu mở đầu). */
export function firstHanzi(chinese: string): string {
  return [...normalizeChinese(chinese)][0] ?? "";
}
