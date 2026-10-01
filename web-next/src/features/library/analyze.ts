/**
 * "Phân tích" từ cho màn admin: tự điền pinyin, nghĩa, HSK, bộ thủ, cách nhớ gợi ý, từ liên quan, ví dụ và ngữ pháp liên quan
 * — CHỈ từ dữ liệu có sẵn trong app (từ mẫu, từ khoá bài đọc, kho luyện dịch, HSK 3.1, bảng bộ thủ, pinyin-pro).
 * Không gọi dịch vụ ngoài; phần nào không có dữ liệu thì để trống cho admin nhập.
 */
import { customPinyin, pinyin as toPinyin } from "pinyin-pro";
import { dictEntries, dictLookup, dictPinyinMap } from "@/lib/builtin-dict";
import { HSK_LEVELS, hskLevelOf, hskPinyinOf, hskWords } from "@/lib/hsk";
import { radicalGlyph, radicalOf } from "@/lib/radicals";
import { fold, foldCompact } from "@/lib/fold";
import { R_PASSAGES } from "@/data/reading/passages";
import { T_ITEMS } from "@/data/translation/items";
import { T_GRAMMAR } from "@/data/translation/grammar";
import type { LibComponent, LibExample, LibGrammar, LibRelated } from "@/server/db/schema";
import type { LibWordInput } from "./schema";

const isHan = (c: string) => /\p{Script=Han}/u.test(c);
const hanOf = (s: string) => [...s].filter(isHan);

let ready = false;
function wordPinyin(zh: string) {
  const d = dictLookup(zh)?.pinyin || hskPinyinOf(zh);
  if (d) return d;
  if (!ready) {
    customPinyin(dictPinyinMap());
    ready = true;
  }
  return toPinyin(zh, { toneType: "symbol", nonZh: "consecutive" }).replace(/\s+/g, " ").trim();
}

/** Bộ thủ của từng chữ (bỏ chữ tự là bộ thủ của chính nó, bỏ trùng). */
function componentsOf(hanzi: string): LibComponent[] {
  const out: LibComponent[] = [];
  for (const ch of hanOf(hanzi)) {
    const r = radicalOf(ch);
    if (!r) continue;
    const glyph = radicalGlyph(r);
    if (glyph === ch || r.char === ch || out.some((c) => c.char === glyph)) continue;
    out.push({ char: glyph, pinyin: r.pinyin, meaning: `${r.name} · ${r.meaning}` });
  }
  return out;
}

function relatedOf(hanzi: string, limit = 6): LibRelated[] {
  const chars = new Set(hanOf(hanzi));
  const seen = new Set([hanzi]);
  const out: (LibRelated & { score: number })[] = [];
  const push = (zh: string, py: string, vi: string, score: number) => {
    if (seen.has(zh) || ![...zh].some((c) => chars.has(c))) return;
    seen.add(zh);
    out.push({ zh, py, vi, score });
  };
  // Có nghĩa tiếng Việt trước (từ điển có sẵn), rồi từ HSK cùng chữ (cấp thấp trước).
  for (const [zh, e] of dictEntries()) push(zh, e.pinyin, e.vi, [...zh].length);
  for (const lv of HSK_LEVELS)
    for (const w of hskWords(lv)) push(w, hskPinyinOf(w) ?? "", dictLookup(w)?.vi ?? "", 100 + lv * 10 + w.length);
  return out
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(({ score: _s, ...r }) => r);
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const PUNCT: Record<string, string> = { "，": ",", "。": ".", "？": "?", "！": "!", "、": ",", "：": ":", "；": ";" };
/** Pinyin từng chữ của dòng bài đọc → câu có dấu câu: "wǒ jiào … xué sheng" + "，。" → "Wǒ jiào …, … xué sheng." */
function linePinyin(zh: string, py: string) {
  const syl = py.split(/\s+/).filter(Boolean);
  let k = 0;
  let out = "";
  for (const ch of zh) {
    if (isHan(ch)) out += (out && !out.endsWith(" ") ? " " : "") + (syl[k++] ?? "");
    else if (PUNCT[ch]) out += PUNCT[ch] + " ";
  }
  return cap(out.replace(/\s+/g, " ").trim());
}

function examplesOf(hanzi: string, limit = 3): LibExample[] {
  const found: LibExample[] = [];
  for (const p of R_PASSAGES)
    for (const l of p.lines) if (l.zh.includes(hanzi)) found.push({ zh: l.zh, py: linePinyin(l.zh, l.py), vi: l.vi });
  for (const it of T_ITEMS)
    if (it.type === "sentence" && it.zh.includes(hanzi)) found.push({ zh: it.zh, py: cap(it.py), vi: it.vi[0] ?? "" });
  const seen = new Set<string>();
  return found
    .filter((e) => !seen.has(e.zh) && seen.add(e.zh))
    .sort((a, b) => a.zh.length - b.zh.length)
    .slice(0, limit);
}

function grammarOf(hanzi: string, limit = 2): LibGrammar[] {
  return T_GRAMMAR.filter((g) => g.structure.includes(hanzi))
    .slice(0, limit)
    .map((g) => {
      const ex = T_ITEMS.find((it) => it.grammar.some((x) => x.id === g.id) && it.type === "sentence");
      return { structure: g.structure, explain: g.explain.vi, example: ex?.zh ?? "" };
    });
}

export type Analysis = LibWordInput;

/** Phân tích một từ (chữ Hán). */
export function analyzeWord(hanzi: string): Analysis {
  const w = hanzi.trim();
  const d = dictLookup(w);
  const lv = hskLevelOf(w);
  const components = componentsOf(w);
  const meaningVi = d?.vi ?? "";
  const mnemonic =
    components.length && meaningVi
      ? `${components.map((c) => `${c.char} (${c.meaning.split(" · ").pop()})`).join(" + ")} → ${w} (${meaningVi})`
      : "";
  return {
    hanzi: w,
    pinyin: wordPinyin(w),
    pos: "",
    meaningVi,
    note: "",
    hskLevel: lv && lv <= 6 ? lv : null,
    topic: "",
    components,
    mnemonic,
    association: "",
    related: relatedOf(w),
    examples: examplesOf(w),
    grammar: grammarOf(w),
  };
}

export type Candidate = { hanzi: string; pinyin: string; meaning: string; hsk: number | null };

/** Nhập pinyin hoặc tiếng Việt → danh sách từ gợi ý để chọn (từ điển có sẵn + HSK). */
export function findCandidates(input: string, limit = 12): Candidate[] {
  if (/\p{Script=Han}/u.test(input)) return hanziCandidates(input.replace(/[^\p{Script=Han}]/gu, ""), limit);
  const f = fold(input);
  const fc = foldCompact(input);
  if (!f) return [];
  const out: (Candidate & { score: number })[] = [];
  const seen = new Set<string>();
  const add = (hanzi: string, pinyin: string, meaning: string, score: number) => {
    if (seen.has(hanzi)) return;
    seen.add(hanzi);
    const lv = hskLevelOf(hanzi);
    out.push({ hanzi, pinyin, meaning, hsk: lv && lv <= 6 ? lv : null, score });
  };
  for (const [zh, e] of dictEntries()) {
    const py = foldCompact(e.pinyin);
    const vi = fold(e.vi);
    if (py === fc) add(zh, e.pinyin, e.vi, 0);
    else if (vi.split(/[,;]\s*/).includes(f)) add(zh, e.pinyin, e.vi, 1);
    else if (vi.includes(f) || py.startsWith(fc)) add(zh, e.pinyin, e.vi, 2 + zh.length);
  }
  for (const lv of HSK_LEVELS)
    for (const w of hskWords(lv)) {
      const py = hskPinyinOf(w) ?? "";
      if (foldCompact(py) === fc) add(w, py, dictLookup(w)?.vi ?? "", 10 + lv);
    }
  return out
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(({ score: _s, ...c }) => c);
}

/** Gõ chữ Hán: từ bắt đầu bằng phần đã gõ (từ điển có sẵn + HSK), từ ngắn / khớp đúng lên trước. */
function hanziCandidates(prefix: string, limit: number): Candidate[] {
  if (!prefix) return [];
  const out = new Map<string, Candidate & { score: number }>();
  const add = (hanzi: string, pinyin: string, meaning: string) => {
    if (out.has(hanzi)) return;
    const lv = hskLevelOf(hanzi);
    out.set(hanzi, { hanzi, pinyin, meaning, hsk: lv && lv <= 6 ? lv : null, score: hanzi.length * 10 + (lv ?? 9) });
  };
  for (const [zh, e] of dictEntries()) if (zh.startsWith(prefix)) add(zh, e.pinyin, e.vi);
  for (const lv of HSK_LEVELS)
    for (const w of hskWords(lv)) if (w.startsWith(prefix)) add(w, hskPinyinOf(w) ?? "", dictLookup(w)?.vi ?? "");
  return [...out.values()]
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(({ score: _s, ...c }) => c);
}
