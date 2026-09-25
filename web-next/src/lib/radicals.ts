// Tra cứu 214 bộ thủ + tìm bộ thủ của chữ Hán (dữ liệu tĩnh). Chép logic từ web/src/services/api/radicalApi.js.
import { RADICAL_TABLE, strokesOf } from "@/data/radicals";
import { EXAMPLE_PINYIN, RADICAL_CHARS, SIMPLIFIED_FORM } from "@/data/radicalMap";
import { fold } from "@/lib/fold";

export type Radical = {
  num: number;
  char: string;
  variants: string[];
  simplified: string;
  pinyin: string;
  name: string;
  meaning: string;
  strokes: number;
  charCount: number;
};

export const RADICALS: Radical[] = RADICAL_TABLE.map(([num, char, variants, pinyin, name, meaning]) => {
  const vs = variants.split(/\s+/).filter(Boolean);
  const simp = SIMPLIFIED_FORM[num];
  if (simp && simp !== char && !vs.includes(simp)) vs.unshift(simp);
  return {
    num,
    char,
    variants: vs,
    simplified: simp || "",
    pinyin,
    name,
    meaning,
    strokes: strokesOf(num),
    charCount: (RADICAL_CHARS[num] || "").length,
  };
});
const BY_NUM = new Map(RADICALS.map((r) => [r.num, r]));

export const isRadicalNum = (n: unknown): n is number => Number.isInteger(n) && BY_NUM.has(n as number);
export const radicalByNum = (n: number) => BY_NUM.get(n) ?? null;

/** Hiển thị ngắn: "Thủy (nước)". */
export const radicalLabel = (r: Radical) => `${r.name} (${r.meaning})`;
/** Chữ bộ + biến thể thường gặp: "水 氵". */
export const radicalGlyph = (r: Radical) => {
  const v = r.variants.find((x) => !x.includes("("));
  return v ? `${r.char} ${v}` : r.char;
};

let charIndex: Map<string, number> | null = null;
/** Chữ Hán → số bộ (dựng 1 lần khi cần). */
function index() {
  if (charIndex) return charIndex;
  charIndex = new Map();
  for (const [num, chars] of Object.entries(RADICAL_CHARS)) for (const ch of chars) charIndex.set(ch, Number(num));
  // Bản thân chữ bộ thủ và các biến thể cũng thuộc bộ đó.
  for (const r of RADICALS)
    for (const ch of [r.char, ...r.variants.map((v) => v.replace(/\(.*\)/, ""))])
      if (!charIndex.has(ch)) charIndex.set(ch, r.num);
  return charIndex;
}

const CLASSIFIER = /^(con|cái|cây|chiếc|màu|quả|tấm|sợi|hạt|mảnh|vật|loài)\s+/;
/** "cái lưới" → ["lưới"], "tốt, khỏe" → ["tốt", "khỏe"] (chữ thường, giữ dấu). */
const meaningParts = (m: string) =>
  String(m)
    .toLowerCase()
    .normalize("NFC")
    .split(/\s*[,;]\s*/)
    .map((x) =>
      x
        .replace(/\(.*?\)/g, "")
        .trim()
        .replace(CLASSIFIER, ""),
    );

/** Tìm bộ thủ theo số, chữ, tên Hán Việt, pinyin hoặc nghĩa tiếng Việt; kết quả khớp tốt đứng trước. */
export function searchRadicals(q: string): Radical[] {
  const needle = q.trim();
  if (!needle) return RADICALS;
  const f = fold(needle);
  const asNum = /^\d+$/.test(needle) ? Number(needle) : null;
  const hanOf = [...needle].length === 1 ? index().get(needle) : null; // gõ 1 chữ Hán → ra bộ của chữ đó
  const raw = needle.toLowerCase().normalize("NFC");
  const score = (r: Radical): number | null => {
    if (r.num === asNum || r.char === needle || hanOf === r.num || r.variants.some((v) => v.startsWith(needle)))
      return 0;
    const name = fold(r.name);
    const meaning = fold(r.meaning);
    if (name === f || name.split(/[\s/()]+/).includes(f) || fold(r.pinyin) === f.replace(/\s+/g, "")) return 1;
    if (meaningParts(r.meaning).includes(raw)) return 1; // đúng cả dấu: "cây" → Mộc, "cay" → Tân
    if (meaningParts(r.meaning).map(fold).includes(f)) return 2;
    if (name.startsWith(f)) return 3;
    if (meaning.split(/[\s,;()]+/).includes(f)) return 4;
    if (name.includes(f) || meaning.includes(f)) return 5;
    return null;
  };
  return RADICALS.map((r) => ({ r, s: score(r) }))
    .filter((x): x is { r: Radical; s: number } => x.s !== null)
    .sort((a, b) => a.s - b.s || a.r.num - b.r.num)
    .map((x) => x.r);
}

/** Bộ thủ của 1 chữ Hán, null nếu không có trong dữ liệu. */
export function radicalOf(ch: string): Radical | null {
  const num = index().get(ch);
  return num ? (BY_NUM.get(num) ?? null) : null;
}

/** Bộ thủ của từng chữ Hán trong chuỗi (bỏ qua ký tự không phải chữ Hán). */
export function radicalsOfText(text: string): { char: string; radical: Radical | null }[] {
  return [...String(text || "")]
    .filter((c) => /\p{Script=Han}/u.test(c))
    .map((c) => ({ char: c, radical: radicalOf(c) }));
}

/** Các chữ Hán thuộc bộ num (dùng lọc từ vựng ở server). */
export function charsOfRadical(num: number): string {
  const r = BY_NUM.get(num);
  if (!r) return "";
  return (RADICAL_CHARS[num] || "") + r.char + r.variants.map((v) => v.replace(/\(.*\)/, "")).join("");
}

export function radicalExamples(num: number) {
  return [...(RADICAL_CHARS[num] || "")].map((c) => ({ char: c, pinyin: EXAMPLE_PINYIN[c] || "" }));
}
