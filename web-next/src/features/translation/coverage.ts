/**
 * So câu luyện dịch với Từ vựng của tôi: câu "quen" bao nhiêu phần (chữ Hán nằm trong từ người học đã có) và đâu là từ mới.
 * Thuần (không DB) — dùng khi tạo phiên luyện dịch và trong test.
 */
import { pinyin as toPinyin } from "pinyin-pro";
import { dictLookup } from "@/lib/builtin-dict";
import type { TWord } from "@/data/translation/items";

export type NewWord = TWord;

const HAN = /\p{Script=Han}/u;

/** Vị trí (theo ký tự) đã được phủ bởi một từ người học đã có xuất hiện trong câu. */
function coveredMask(chars: string[], known: Iterable<string>) {
  const text = chars.join("");
  const mask = chars.map((c) => !HAN.test(c));
  for (const k of known) {
    if (!k) continue;
    const len = [...k].length;
    let from = 0;
    for (;;) {
      const at = text.indexOf(k, from);
      if (at < 0) break;
      // indexOf trả vị trí theo UTF-16; chữ Hán thông dụng đều 1 đơn vị nên vị trí trùng với chỉ số ký tự.
      const idx = [...text.slice(0, at)].length;
      for (let i = idx; i < idx + len; i++) mask[i] = true;
      from = at + k.length;
    }
  }
  return mask;
}

/** Tỉ lệ chữ Hán trong câu nằm trong từ người học đã có (0–1; câu không có chữ Hán = 1). */
export function coverage(zh: string, known: Iterable<string>): number {
  const chars = [...zh];
  const mask = coveredMask(chars, known);
  const han = chars.map((c, i) => [c, i] as const).filter(([c]) => HAN.test(c));
  if (!han.length) return 1;
  return han.filter(([, i]) => mask[i]).length / han.length;
}

/**
 * Từ mới của câu (chưa có trong Từ vựng của tôi), theo thứ tự xuất hiện: ưu tiên từ khoá của câu mẫu (có sẵn pinyin + nghĩa);
 * phần chữ Hán còn lại tách theo từ điển có sẵn (khớp dài nhất), không có thì từng chữ (pinyin tự sinh, nghĩa để trống).
 */
export function newWordsOf(item: { zh: string; words: TWord[] }, known: Set<string>): NewWord[] {
  const chars = [...item.zh];
  const mask = coveredMask(chars, known);
  const found: { at: number; w: NewWord }[] = [];
  const text = item.zh;
  const mark = (at: number, len: number) => {
    for (let i = at; i < at + len; i++) mask[i] = true;
  };
  for (const w of item.words) {
    if (known.has(w.zh)) continue;
    const at = text.indexOf(w.zh);
    if (at < 0) continue;
    const idx = [...text.slice(0, at)].length;
    const len = [...w.zh].length;
    if (mask.slice(idx, idx + len).every(Boolean)) continue;
    found.push({ at: idx, w });
    mark(idx, len);
  }
  for (let i = 0; i < chars.length;) {
    if (mask[i]) {
      i++;
      continue;
    }
    let len = 1;
    let hit = null as ReturnType<typeof dictLookup>;
    for (let l = 4; l >= 1; l--) {
      const seg = chars.slice(i, i + l);
      if (seg.length < l || seg.some((c, j) => mask[i + j] || !HAN.test(c))) continue;
      const e = dictLookup(seg.join(""));
      if (e || l === 1) {
        len = l;
        hit = e;
        break;
      }
    }
    const zh = chars.slice(i, i + len).join("");
    if (!known.has(zh) && !found.some((f) => f.w.zh === zh)) {
      const py = hit?.pinyin || toPinyin(zh, { toneType: "symbol", type: "array" }).join(" ");
      found.push({ at: i, w: { zh, py, vi: hit?.vi ?? "", en: hit?.vi ?? "" } });
    }
    mark(i, len);
    i += len;
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.w);
}
