// Pinyin: đổi số thanh điệu (1–4, 5 = thanh nhẹ) thành dấu. v / u: = ü.

const TONES = { a: "āáǎà", e: "ēéěè", i: "īíǐì", o: "ōóǒò", u: "ūúǔù", "ü": "ǖǘǚǜ" };

/** Đặt dấu thanh cho 1 âm tiết theo quy tắc: a/e trước, "ou" → o, còn lại nguyên âm cuối. */
export function markSyllable(syl, tone) {
  const s = syl.replace(/u:/g, "ü").replace(/U:/g, "Ü").replace(/v/g, "ü").replace(/V/g, "Ü");
  if (tone < 1 || tone > 4) return s;
  const lower = s.toLowerCase();
  let idx = lower.search(/[ae]/);
  if (idx < 0 && lower.includes("ou")) idx = lower.indexOf("o");
  if (idx < 0) {
    for (let i = lower.length - 1; i >= 0; i--) if ("aeiouü".includes(lower[i])) { idx = i; break; }
  }
  if (idx < 0) return s;
  const mark = TONES[lower[idx]][tone - 1];
  return s.slice(0, idx) + (s[idx] === lower[idx] ? mark : mark.toUpperCase()) + s.slice(idx + 1);
}

/** "ni3 hao3" → "nǐ hǎo", "lv4" → "lǜ", "ma5" → "ma". Chữ đã có dấu giữ nguyên. */
export function toneNumbersToMarks(text) {
  return String(text ?? "").replace(/([a-zA-ZüÜ:]+)([1-5])/g, (_, syl, t) => markSyllable(syl, Number(t)));
}

/**
 * Gắn vào ô nhập: gõ số 1–5 ngay sau âm tiết sẽ tự đổi thành dấu, giữ đúng vị trí con trỏ.
 * Bỏ qua khi đang gõ bằng bộ gõ (IME) để không phá chữ đang ghép.
 */
export function attachPinyinInput(input, onChange) {
  input.addEventListener("input", (e) => {
    if (e.isComposing) return;
    const value = input.value;
    const next = toneNumbersToMarks(value);
    if (next === value) return;
    const caret = input.selectionStart ?? value.length;
    const pos = Math.min(toneNumbersToMarks(value.slice(0, caret)).length, next.length);
    input.value = next;
    input.setSelectionRange(pos, pos);
    onChange?.(next);
  });
}
