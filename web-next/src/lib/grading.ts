/**
 * Luật chấm đáp án ôn tập (thuần logic, chạy ở SERVER). Chép từ web/src/features/review/grading.js:
 *  - Nghĩa Việt: không phân biệt hoa/thường, chấp nhận từng nghĩa tách bằng , ; /
 *  - Chữ Hán: khớp chính xác (bỏ khoảng trắng)
 *  - Pinyin: dấu thanh hoặc số (ni3 hao3 = nǐ hǎo), v = ü, bỏ khoảng trắng / nháy / gạch nối
 */
import { toneNumbersToMarks } from "@/lib/pinyin";

export type PromptType = "meaning" | "hanzi" | "pinyin";
export type GradedWord = { hanzi: string; pinyin: string; meaningVi: string };

const collapse = (s: unknown) =>
  String(s ?? "")
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ");

export function normalizePinyin(input: unknown): string {
  let s = collapse(input).toLowerCase().replace(/u:/g, "ü");
  s = toneNumbersToMarks(s);
  return s.replace(/v/g, "ü").replace(/[\s'’·-]/g, "");
}

const normMeaning = (s: unknown) =>
  collapse(s)
    .toLowerCase()
    .replace(/[.!?…]+$/, "");

export function splitMeanings(field: unknown): string[] {
  return String(field ?? "")
    .split(/[,;/]/)
    .map(normMeaning)
    .filter(Boolean);
}

export function grade(promptType: PromptType, word: GradedWord, answer: unknown): boolean {
  const a = String(answer ?? "");
  if (!a.trim()) return false;
  if (promptType === "hanzi") return a.replace(/\s/g, "") === String(word.hanzi).replace(/\s/g, "");
  if (promptType === "pinyin") return normalizePinyin(a) === normalizePinyin(word.pinyin);
  const n = normMeaning(a);
  return n === normMeaning(word.meaningVi) || splitMeanings(word.meaningVi).includes(n);
}

/** Tìm từ khác trong kho khớp với câu trả lời sai (để hiện thẻ "Bạn đã trả lời"). */
export function findMatchingWord<T extends GradedWord & { id: string }>(
  promptType: PromptType,
  list: T[],
  answer: string,
  excludeId: string,
): T | null {
  return list.find((w) => w.id !== excludeId && grade(promptType, w, answer)) ?? null;
}
