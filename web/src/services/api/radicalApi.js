// Radical service — tra cứu 214 bộ thủ + tìm bộ thủ của chữ Hán. Dữ liệu tĩnh (không cần backend);
// riêng trạng thái “Đã thuộc” lưu theo từng user.
import { local, ApiError } from "./storage.js";
import { getCurrentUser } from "./authApi.js";
import { RADICAL_TABLE, strokesOf } from "../data/radicals.js";
import { RADICAL_CHARS, EXAMPLE_PINYIN, SIMPLIFIED_FORM } from "../data/radicalMap.js";

const kKnown = (uid) => `ly_radicals_known:${uid}`;

const RADICALS = RADICAL_TABLE.map(([num, char, variants, pinyin, name, meaning]) => {
  const vs = variants.split(/\s+/).filter(Boolean);
  const simp = SIMPLIFIED_FORM[num];
  if (simp && simp !== char && !vs.includes(simp)) vs.unshift(simp);
  return { num, char, variants: vs, simplified: simp || "", pinyin, name, meaning, strokes: strokesOf(num), charCount: (RADICAL_CHARS[num] || "").length };
});
const BY_NUM = new Map(RADICALS.map((r) => [r.num, r]));

let charIndex = null;
/** Chữ Hán → số bộ (dựng 1 lần khi cần). */
function index() {
  if (charIndex) return charIndex;
  charIndex = new Map();
  for (const [num, chars] of Object.entries(RADICAL_CHARS)) for (const ch of chars) charIndex.set(ch, Number(num));
  // Bản thân chữ bộ thủ và các biến thể cũng thuộc bộ đó.
  for (const r of RADICALS) for (const ch of [r.char, ...r.variants.map((v) => v.replace(/\(.*\)/, ""))]) if (!charIndex.has(ch)) charIndex.set(ch, r.num);
  return charIndex;
}

const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();

function knownSet() {
  const u = getCurrentUser();
  return new Set(u ? local.get(kKnown(u.id), []) || [] : []);
}

/** Số nét có trong bảng (1–17) để làm bộ lọc. */
export const STROKE_GROUPS = [...new Set(RADICALS.map((r) => r.strokes))];

/** Hiển thị ngắn: “Thủy (nước)”. */
export const label = (r) => `${r.name} (${r.meaning})`;

export function list({ q = "", strokes = 0, known = "" } = {}) {
  const ks = knownSet();
  let items = RADICALS.map((r) => ({ ...r, known: ks.has(r.num) }));
  if (strokes) items = items.filter((r) => r.strokes === Number(strokes));
  if (known === "known") items = items.filter((r) => r.known);
  if (known === "unknown") items = items.filter((r) => !r.known);
  const needle = q.trim();
  if (needle) {
    const f = fold(needle);
    const asNum = /^\d+$/.test(needle) ? Number(needle) : null;
    const hanOf = [...needle].length === 1 ? index().get(needle) : null; // gõ 1 chữ Hán → ra bộ của chữ đó
    // Điểm khớp (nhỏ = khớp tốt hơn); null = không khớp.
    const score = (r) => {
      if (r.num === asNum || r.char === needle || hanOf === r.num || r.variants.some((v) => v.startsWith(needle))) return 0;
      const name = fold(r.name), meaning = fold(r.meaning);
      if (name === f || name.split(/[\s/()]+/).includes(f) || fold(r.pinyin) === f.replace(/\s+/g, "")) return 1;
      if (name.startsWith(f)) return 2;
      if (meaning.split(/[\s,;()]+/).includes(f)) return 3;
      if (name.includes(f) || meaning.includes(f)) return 4;
      return null;
    };
    items = items.map((r) => ({ r, s: score(r) })).filter((x) => x.s !== null)
      .sort((a, b) => a.s - b.s || a.r.num - b.r.num).map((x) => x.r);
  }
  return { items, total: items.length, knownCount: ks.size };
}

export function get(num) {
  const r = BY_NUM.get(Number(num));
  if (!r) throw new ApiError("not-found", "Không tìm thấy bộ thủ này.");
  const chars = [...(RADICAL_CHARS[r.num] || "")];
  return {
    ...r,
    known: knownSet().has(r.num),
    examples: chars.slice(0, 12).map((c) => ({ char: c, pinyin: EXAMPLE_PINYIN[c] || "" })),
    moreChars: chars.slice(12, 60),
    prev: BY_NUM.get(r.num - 1) || null,
    next: BY_NUM.get(r.num + 1) || null,
  };
}

export function setKnown(num, known) {
  const u = getCurrentUser();
  if (!u) throw new ApiError("unauthenticated", "Phiên đăng nhập đã hết hạn.");
  const set = new Set(local.get(kKnown(u.id), []) || []);
  if (known) set.add(Number(num)); else set.delete(Number(num));
  local.set(kKnown(u.id), [...set]);
  return known;
}

/** Bộ thủ của 1 chữ Hán, null nếu không có trong dữ liệu. */
export function radicalOf(ch) {
  const num = index().get(ch);
  return num ? BY_NUM.get(num) : null;
}

/** Bộ thủ của từng chữ Hán trong chuỗi (bỏ qua ký tự không phải chữ Hán). */
export function radicalsOfText(text) {
  return [...String(text || "")].filter((c) => /\p{Script=Han}/u.test(c)).map((c) => ({ char: c, radical: radicalOf(c) }));
}

/** Chuỗi chữ Hán có chứa bộ num không (dùng lọc từ vựng). */
export function textHasRadical(text, num) {
  return radicalsOfText(text).some((x) => x.radical?.num === Number(num));
}
