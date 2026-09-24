// Chấm đáp án (thuần logic, không phụ thuộc UI).

const collapse = (s) => String(s || "").normalize("NFC").trim().replace(/\s+/g, " ");

// --- Pinyin: chấp nhận dấu thanh hoặc số (ni3 hao3), bỏ khoảng trắng/nháy, v = ü ---
const TONES = { a: "āáǎà", e: "ēéěè", i: "īíǐì", o: "ōóǒò", u: "ūúǔù", "ü": "ǖǘǚǜ" };
function markSyllable(syl, tone) {
  if (tone < 1 || tone > 4) return syl;
  const s = syl.replace(/v/g, "ü");
  let idx = s.search(/[ae]/);
  if (idx < 0 && s.includes("ou")) idx = s.indexOf("o");
  if (idx < 0) {
    for (let i = s.length - 1; i >= 0; i--) if ("aeiouü".includes(s[i])) { idx = i; break; }
  }
  if (idx < 0) return s;
  return s.slice(0, idx) + TONES[s[idx]][tone - 1] + s.slice(idx + 1);
}
export function normalizePinyin(input) {
  let s = collapse(input).toLowerCase().replace(/u:/g, "ü");
  s = s.replace(/([a-zü]+)([1-5])/g, (_, syl, t) => markSyllable(syl, Number(t)));
  return s.replace(/v/g, "ü").replace(/[\s'’·\-]/g, "");
}

// --- Nghĩa tiếng Việt: nhiều đáp án tách bằng , ; / ---
export function splitMeanings(field) {
  return String(field || "").split(/[,;/]/).map((m) => collapse(m).toLowerCase().replace(/[.!?…]+$/, "")).filter(Boolean);
}
const normMeaning = (s) => collapse(s).toLowerCase().replace(/[.!?…]+$/, "");

export function expectedAnswers(promptType, word) {
  if (promptType === "hanzi") return [word.hanzi];
  if (promptType === "pinyin") return [word.pinyin];
  return [word.meaningVi, ...splitMeanings(word.meaningVi)];
}

export function grade(promptType, word, answer) {
  const a = String(answer || "");
  if (!a.trim()) return false;
  if (promptType === "hanzi") return a.replace(/\s/g, "") === String(word.hanzi).replace(/\s/g, "");
  if (promptType === "pinyin") return normalizePinyin(a) === normalizePinyin(word.pinyin);
  const n = normMeaning(a);
  return n === normMeaning(word.meaningVi) || splitMeanings(word.meaningVi).includes(n);
}

/** Tìm từ trong danh sách khớp với câu trả lời sai (để hiện thẻ "Bạn đã trả lời"). */
export function findMatchingWord(promptType, list, answer, excludeId) {
  return list.find((w) => w.id !== excludeId && grade(promptType, w, answer)) || null;
}
