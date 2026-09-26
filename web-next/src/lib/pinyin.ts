// Pinyin: đổi số thanh điệu (1–4, 5 = thanh nhẹ) thành dấu. v / u: = ü.
// Hỗ trợ viết liền không cách: "nihao3" → "nihǎo", "shouji1" → "shoujī", "ni3hao3" → "nǐhǎo".
// Chép từ web/src/lib/pinyin.js (bản cũ).

const TONES: Record<string, string> = { a: "āáǎà", e: "ēéěè", i: "īíǐì", o: "ōóǒò", u: "ūúǔù", ü: "ǖǘǚǜ" };
const MARKED: Record<string, string> = {
  ā: "a",
  á: "a",
  ǎ: "a",
  à: "a",
  ē: "e",
  é: "e",
  ě: "e",
  è: "e",
  ī: "i",
  í: "i",
  ǐ: "i",
  ì: "i",
  ō: "o",
  ó: "o",
  ǒ: "o",
  ò: "o",
  ū: "u",
  ú: "u",
  ǔ: "u",
  ù: "u",
  ǖ: "ü",
  ǘ: "ü",
  ǚ: "ü",
  ǜ: "ü",
};

// Vần ghép được với từng nhóm phụ âm đầu (bảng âm tiết pinyin chuẩn).
const FINALS: Record<string, string> = {
  "": "a o e ai ei ao ou an en ang eng er",
  b: "a o ai ei ao an en ang eng i iao ie ian in ing u",
  p: "a o ai ei ao ou an en ang eng i iao ie ian in ing u",
  m: "a o e ai ei ao ou an en ang eng i iao ie iu ian in ing u",
  f: "a o ei ou an en ang eng u",
  d: "a e ai ei ao ou an en ang eng ong i iao ie iu ian ing u uo ui uan un",
  t: "a e ai ei ao ou an ang eng ong i iao ie ian ing u uo ui uan un",
  n: "a e ai ei ao ou an en ang eng ong i iao ie iu ian in iang ing u uo uan ü üe",
  l: "a o e ai ei ao ou an ang eng ong i ia iao ie iu ian in iang ing u uo uan un ü üe",
  g: "a e ai ei ao ou an en ang eng ong u ua uo uai ui uan un uang",
  k: "a e ai ei ao ou an en ang eng ong u ua uo uai ui uan un uang",
  h: "a e ai ei ao ou an en ang eng ong u ua uo uai ui uan un uang",
  j: "i ia iao ie iu ian in iang ing iong u ue uan un",
  q: "i ia iao ie iu ian in iang ing iong u ue uan un",
  x: "i ia iao ie iu ian in iang ing iong u ue uan un",
  zh: "a e i ai ei ao ou an en ang eng ong u ua uo uai ui uan un uang",
  ch: "a e i ai ao ou an en ang eng ong u ua uo uai ui uan un uang",
  sh: "a e i ai ei ao ou an en ang eng u ua uo uai ui uan un uang",
  r: "e i ao ou an en ang eng ong u ua uo ui uan un",
  z: "a e i ai ei ao ou an en ang eng ong u uo ui uan un",
  c: "a e i ai ao ou an en ang eng ong u uo ui uan un",
  s: "a e i ai ao ou an en ang eng ong u uo ui uan un",
  y: "a o e ao ou an ang i in ing ong u ue uan un",
  w: "a o ai ei an en ang eng u",
};
const SYLLABLES = new Set<string>();
for (const [ini, list] of Object.entries(FINALS)) for (const f of list.split(" ")) SYLLABLES.add(ini + f);
const MAX_LEN = 6; // "zhuang", "chuang", "shuang"

/** Bỏ dấu để so với bảng âm tiết (giữ ü). */
const plain = (s: string) => [...s.toLowerCase()].map((c) => MARKED[c] ?? c).join("");

/** Tách chuỗi viết liền thành các âm tiết (ưu tiên âm tiết dài). Không tách được → null. */
function segment(word: string): number[] | null {
  const s = plain(word);
  const memo = new Map<number, number[] | null>();
  const go = (i: number): number[] | null => {
    if (i === s.length) return [];
    if (memo.has(i)) return memo.get(i)!;
    let res: number[] | null = null;
    for (let len = Math.min(MAX_LEN, s.length - i); len >= 1 && !res; len--) {
      if (!SYLLABLES.has(s.slice(i, i + len))) continue;
      const rest = go(i + len);
      if (rest) res = [len, ...rest];
    }
    memo.set(i, res);
    return res;
  };
  return go(0);
}

const toUmlaut = (s: string) => s.replace(/u:/g, "ü").replace(/U:/g, "Ü").replace(/v/g, "ü").replace(/V/g, "Ü");

/** Đặt dấu thanh cho 1 âm tiết theo quy tắc: a/e trước, "ou" → o, còn lại nguyên âm cuối. */
export function markSyllable(syl: string, tone: number): string {
  const s = toUmlaut(syl);
  if (tone < 1 || tone > 4) return s;
  const lower = s.toLowerCase();
  let idx = lower.search(/[ae]/);
  if (idx < 0 && lower.includes("ou")) idx = lower.indexOf("o");
  if (idx < 0) {
    for (let i = lower.length - 1; i >= 0; i--)
      if ("aeiouü".includes(lower[i]!)) {
        idx = i;
        break;
      }
  }
  if (idx < 0) return s;
  const mark = TONES[lower[idx]!]![tone - 1]!;
  return s.slice(0, idx) + (s[idx] === lower[idx] ? mark : mark.toUpperCase()) + s.slice(idx + 1);
}

/** Bỏ dấu thanh nhưng giữ chữ hoa/thường: "Hǎo" → "Hao". */
const stripMarks = (s: string) =>
  [...s]
    .map((c) => {
      const base = MARKED[c.toLowerCase()];
      return base ? (c === c.toLowerCase() ? base : base.toUpperCase()) : c;
    })
    .join("");
const hasMark = (s: string) => [...s].some((c) => MARKED[c.toLowerCase()]);

/**
 * Đặt dấu cho âm tiết CUỐI của một cụm chữ viết liền (số thanh đứng sau cụm).
 * strict: chỉ đổi khi cả cụm tách được thành các âm tiết pinyin hợp lệ và âm tiết cuối chưa có dấu
 *         (dùng cho ô ghi chú có lẫn tiếng Việt, "HSK1", "Bài2"...). Không đổi → null.
 */
function markRun(run: string, tone: number, strict: boolean): string | null {
  const word = toUmlaut(run);
  const parts = segment(word);
  if (strict && !parts) return null;
  const lastLen = parts ? parts[parts.length - 1]! : word.length;
  const cut = word.length - lastLen;
  const last = word.slice(cut);
  if (hasMark(last) && strict) return null;
  const base = stripMarks(last); // gõ số mới lên âm tiết đã có dấu → thay dấu cũ
  const marked = markSyllable(base, tone);
  // Không có nguyên âm để đặt dấu (vd "HSK1"), hoặc thanh nhẹ trên cụm không phải pinyin → giữ nguyên.
  if (tone >= 1 && tone <= 4 && marked === toUmlaut(base)) return null;
  if (tone === 5 && !parts) return null;
  return word.slice(0, cut) + marked;
}

/**
 * "ni3 hao3" → "nǐ hǎo", "nihao3" → "nihǎo", "lv4" → "lǜ", "ma5" → "ma". Chữ đã có dấu giữ nguyên.
 * { strict: true }: bỏ qua những cụm không phải pinyin (vd "HSK1" giữ nguyên).
 */
export function toneNumbersToMarks(text: unknown, { strict = false } = {}): string {
  return String(text ?? "").replace(
    /([a-zA-ZüÜ:āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+)([1-5])/g,
    (m, run: string, t: string) => markRun(run, Number(t), strict) ?? m,
  );
}

/**
 * Xử lý sự kiện input của ô pinyin/ghi chú: gõ số 1–5 ngay sau chữ sẽ đổi thành dấu, giữ đúng vị trí con trỏ.
 * Bỏ qua khi đang gõ bằng bộ gõ (IME). Trả về giá trị mới (hoặc giá trị cũ nếu không đổi).
 */
export function applyToneInput(
  input: HTMLInputElement | HTMLTextAreaElement,
  isComposing: boolean,
  strict = false,
): string {
  const value = input.value;
  if (isComposing) return value;
  const conv = (t: string) => toneNumbersToMarks(t, { strict });
  const next = conv(value);
  if (next === value) return value;
  const caret = input.selectionStart ?? value.length;
  const pos = Math.min(conv(value.slice(0, caret)).length, next.length);
  input.value = next;
  input.setSelectionRange(pos, pos);
  return next;
}

/** Âm tiết (không dấu, ü viết là ü) có trong bảng âm tiết pinyin chuẩn không: "zhong" → true, "zha" → true, "bu" → true. */
export const isPinyinSyllable = (s: string) => SYLLABLES.has(plain(toUmlaut(s)));

/** Tách dấu thanh của 1 âm tiết: "hǎo" → { plain: "hao", tone: 3 }, "ma" → { plain: "ma", tone: 5 } (thanh nhẹ). */
export function splitTone(syl: string): { plain: string; tone: 1 | 2 | 3 | 4 | 5 } {
  let tone = 5;
  for (const c of syl.toLowerCase()) {
    const base = MARKED[c];
    if (base) tone = TONES[base]!.indexOf(c) + 1;
  }
  return { plain: plain(toUmlaut(syl)), tone: tone as 1 | 2 | 3 | 4 | 5 };
}

/** Chuẩn hoá để so pinyin người dùng gõ: số → dấu, v / u: → ü, bỏ khoảng trắng, dấu ' và -, không phân biệt hoa thường. */
export const normalizePinyin = (s: string) =>
  toneNumbersToMarks(toUmlaut(s.normalize("NFC").trim()))
    .toLowerCase()
    .replace(/[\s'’\-·.,，。!?！？]+/g, "");

/** "ba1" ≡ "bā", "ni3 hao3" ≡ "nǐhǎo", "lv4" ≡ "lǜ". */
export const samePinyin = (a: string, b: string) => {
  const x = normalizePinyin(a);
  return x.length > 0 && x === normalizePinyin(b);
};

/** Tách pinyin (có dấu) thành từng âm tiết: "shuíguǒ" → ["shuí", "guǒ"], "nǐ hǎo" → ["nǐ", "hǎo"]. Cụm không tách được giữ nguyên. */
export function splitSyllables(text: string): string[] {
  const out: string[] = [];
  for (const run of text
    .trim()
    .split(/[\s']+/)
    .filter(Boolean)) {
    const parts = segment(run);
    if (!parts) {
      out.push(run);
      continue;
    }
    let at = 0;
    for (const len of parts) {
      out.push(run.slice(at, at + len));
      at += len;
    }
  }
  return out;
}
