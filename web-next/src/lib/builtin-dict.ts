/**
 * Từ điển nhỏ có sẵn (chỉ dùng ở server): gom từ các kho dữ liệu của app — từ mẫu, từ khoá bài đọc, từ trong kho luyện dịch.
 * Dùng để gợi ý pinyin + nghĩa tiếng Việt khi thêm từ từ ảnh. Không gọi dịch vụ ngoài.
 */
import { SAMPLE_VOCABULARY } from "@/data/sample-vocab";
import { R_PASSAGES } from "@/data/reading/passages";
import { T_ITEMS } from "@/data/translation/items";

export type DictEntry = { pinyin: string; vi: string };

let cache: Map<string, DictEntry> | null = null;
function dict() {
  if (cache) return cache;
  const m = new Map<string, DictEntry>();
  const add = (zh: string, pinyin: string, vi: string) => {
    const k = zh.trim();
    if (k && !k.includes("…") && !m.has(k)) m.set(k, { pinyin, vi });
  };
  for (const w of SAMPLE_VOCABULARY) add(w.hanzi, w.pinyin, w.meaningVi);
  for (const p of R_PASSAGES) for (const w of p.words) add(w.zh, w.py, w.vi);
  for (const it of T_ITEMS) for (const w of it.words) add(w.zh, w.py, w.vi);
  cache = m;
  return m;
}

export const dictLookup = (zh: string): DictEntry | null => dict().get(zh.trim()) ?? null;
