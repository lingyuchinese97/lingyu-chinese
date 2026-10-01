/**
 * Tách kết quả nhận dạng chữ (OCR) của ảnh danh sách từ vựng thành từng từ: Hán tự · pinyin · nghĩa.
 * Mỗi đoạn bắt đầu bằng một cụm chữ Hán; phần chữ Latin theo sau: các âm tiết pinyin đứng đầu (đủ đúng số chữ Hán) là pinyin,
 * phần còn lại là nghĩa. Không nhận ra pinyin → để trống (server gợi ý sau). Chạy được cả ở trình duyệt lẫn server.
 *
 * Ảnh dạng bảng (sách giáo trình: "1. 买 (动) mǎi (mãi) to buy mua") — đầu vào là các ô theo dòng (`OcrCell`, có toạ độ):
 * bỏ số thứ tự, nhãn từ loại "(动)", ô trong ngoặc (âm Hán Việt, chú thích); pinyin = ô ngay sau chữ Hán; nghĩa = ô ngoài cùng
 * bên phải (cột tiếng Việt, bỏ cột tiếng Anh ở giữa); dòng tiếp theo không có chữ Hán nằm trong cột nghĩa → nối vào nghĩa.
 */
import { isPinyinSyllable, splitSyllables } from "./pinyin";

export type OcrWord = { hanzi: string; pinyin: string; meaning: string };

const HAN = /\p{Script=Han}/u;
const HAN_RUN = /[\p{Script=Han}·]+/gu;
/** Dấu ngăn cách thường gặp giữa các cột: - – — : ： = | / , ， 、 ( ) ; . và số thứ tự. */
const EDGE = /^[\s\-–—:：=|/\\,，、;；.。()（）[\]【】*•·\d]+|[\s\-–—:：=|/\\,，、;；。()（）[\]【】*•·]+$/gu;
const PINYIN_TOKEN = /^[a-zA-ZüÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙ']+$/;

/** Pinyin bỏ dấu thanh, chữ thường, bỏ khoảng trắng — để so hai bản đọc. */
const plain = (py: string) =>
  py
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s']/g, "")
    .toLowerCase();
const hanCount = (s: string) => [...s].filter((c) => HAN.test(c)).length;
const clean = (s: string) => s.replace(EDGE, "").replace(/\s+/g, " ").trim();

const bare = (t: string) => t.replace(/^[(（[【"“]+|[)）\]】"”,，.;:]+$/g, "");
/** Có dấu ngăn cách giữa cột pinyin và cột nghĩa: "nǐ hǎo - xin chào", "xièxie = cảm ơn", "shū: sách". */
const SEP = /^(.*?)\s*(?:\s[-–—]\s|[:：=|])\s*(.+)$/;
const LATIN_ONLY = /^[\p{Script=Latin}\d\s'’()（）]+$/u;

/** Đúng pinyin hợp lệ và đủ `need` âm tiết (OCR hay đọc sai dấu / ký tự → không tin, để server gợi ý). */
function validPinyin(text: string, need: number): string {
  const tokens = text.split(/\s+/).map(bare).filter(Boolean);
  if (!tokens.length || !tokens.every((t) => PINYIN_TOKEN.test(t))) return "";
  const parts = tokens.flatMap((t) => splitSyllables(t));
  return parts.length === need && parts.every(isPinyinSyllable) ? tokens.join(" ") : "";
}

/** Tách pinyin ở đầu `rest` sao cho đủ `need` âm tiết; không khớp → pinyin rỗng, giữ nguyên nghĩa. */
function splitPinyin(rest: string, need: number): { pinyin: string; meaning: string } {
  const sep = rest.match(SEP);
  if (sep && LATIN_ONLY.test(sep[1]!) && sep[1]!.trim()) {
    return { pinyin: validPinyin(sep[1]!, need), meaning: clean(sep[2]!) };
  }
  const tokens = rest.split(/\s+/).filter(Boolean);
  let syl = 0;
  let i = 0;
  for (; i < tokens.length && syl < need; i++) {
    const tok = bare(tokens[i]!);
    if (!PINYIN_TOKEN.test(tok)) break;
    const parts = splitSyllables(tok);
    if (!parts.every(isPinyinSyllable)) break;
    syl += parts.length;
  }
  if (syl !== need || i === 0) return { pinyin: "", meaning: clean(rest) };
  return {
    pinyin: tokens.slice(0, i).map(bare).join(" "),
    meaning: clean(tokens.slice(i).join(" ")),
  };
}

/** Một vùng chữ trên ảnh: `text` = bản đọc tốt nhất (giữ dấu), `alt` = bản khác (không dấu nhưng đúng chữ cái), toạ độ ngang. */
export type OcrCell = { text: string; alt?: string; x0?: number; x1?: number };

/** Nhãn từ loại / chú thích chữ Hán trong ngoặc: (动) （名） (量词); OCR mất ngoặc đóng ("（名 shuǐguǒ") vẫn nhận ra. */
const ANNOT = /[（(]\s*\p{Script=Han}[\p{Script=Han}\s]{0,5}(?:[）)]|(?=\s*\p{Script=Latin}|\s*$))/gu;
const NUMBERING = /^\s*\d{1,3}\s*[.．、)）]\s*/u;
/** Cả đoạn nằm trong ngoặc: âm Hán Việt "(mãi)", chú thích "(modal particle)". */
const WRAPPED = /^[(（][^()（）]*[)）]$/u;
const LEADING_PAREN = /^[(（][^()（）]*[)）]\s*/u;

const norm = (s: string) =>
  s
    .normalize("NFC")
    // OCR hay chèn khoảng trắng giữa các chữ Hán: "你 好" → "你好".
    .replace(/(\p{Script=Han})[ \t]+(?=\p{Script=Han})/gu, "$1")
    .replace(ANNOT, " ")
    .replace(NUMBERING, "")
    // Tách ngoặc khỏi chữ: "gongjin（cong can）" → "gongjin （cong can） ".
    .replace(/(\S)([(（])/gu, "$1 $2")
    .replace(/([)）])(\S)/gu, "$1 $2")
    .trim();

/** Bản `alt` có nhãn trong ngoặc "（动）" mà bản `text` mất ngoặc ("动 mǎi") → bỏ chữ đó khỏi `text`. */
function dropAnnots(text: string, alt?: string) {
  if (!alt) return text;
  const a = alt.normalize("NFC");
  let t = text.normalize("NFC");
  for (const m of a.matchAll(ANNOT)) {
    const mark = m[0].replace(/[^\p{Script=Han}]/gu, "");
    if (!mark) continue;
    // Chữ Hán ngay trước nhãn ("水果（名）"): bản `text` dính liền "水果名" → tách ra.
    const before = /\p{Script=Han}+\s*$/u.exec(a.slice(0, m.index))?.[0].trim();
    if (before && t.includes(before + mark)) t = t.replace(before + mark, `${before} `);
    else t = t.replace(new RegExp(`(?<!\\p{Script=Han})${mark}(?!\\p{Script=Han})`, "u"), " ");
  }
  return t;
}

type Piece = { text: string; alt: string; x0?: number; x1?: number };
type Entry = { hanzi: string; pieces: Piece[]; anchorX1?: number; meaningX0?: number };

/** Phần Latin theo sau cụm chữ Hán thứ `k` của một ô (giữa cụm này và cụm sau). */
function after(text: string, k: number): string {
  const runs = [...text.matchAll(HAN_RUN)].filter((m) => HAN.test(m[0]));
  const m = runs[k];
  if (!m) return "";
  return text.slice(m.index! + m[0].length, runs[k + 1]?.index ?? text.length);
}

/** Pinyin ở đầu đoạn: thử bản giữ dấu trước, rồi bản không dấu (server thêm dấu theo từ điển); phần còn lại lấy từ bản giữ dấu. */
function pinyinOf(p: Piece, need: number): { pinyin: string; rest: string } {
  const a = splitPinyin(clean(p.text), need);
  const b = splitPinyin(clean(p.alt), need);
  // Hai bản đều là pinyin hợp lệ nhưng khác chữ cái ("gu" / "gui"): bản không dấu đọc chữ cái chính xác hơn.
  if (a.pinyin && (!b.pinyin || plain(a.pinyin) === plain(b.pinyin))) return { pinyin: a.pinyin, rest: a.meaning };
  // Không có pinyin hợp lệ: vẫn tách nghĩa theo dấu ngăn cách ("IEoshT - giáo viên" → "giáo viên").
  if (!b.pinyin) return { pinyin: "", rest: a.meaning };
  const used = b.pinyin.split(/\s+/).length;
  return { pinyin: b.pinyin, rest: clean(clean(p.text).split(/\s+/).filter(Boolean).slice(used).join(" ")) };
}

function resolve(e: Entry): OcrWord {
  const need = hanCount(e.hanzi);
  const pieces = e.pieces.filter((p) => clean(p.text) || clean(p.alt));
  if (!pieces.length) return { hanzi: e.hanzi, pinyin: "", meaning: "" };
  const first = pieces[0]!;
  const { pinyin, rest } = pinyinOf(first, need);
  const others = (pinyin ? pieces.slice(1) : pieces).filter((p) => !WRAPPED.test(clean(p.text) || clean(p.alt)));
  let meaning = "";
  if (pinyin && others.length) {
    const last = others[others.length - 1]!;
    meaning = clean(last.text) || clean(last.alt);
    e.meaningX0 = last.x0;
  } else if (!pinyin && others.length > 1) {
    const last = others[others.length - 1]!;
    meaning = clean(last.text) || clean(last.alt);
    e.meaningX0 = last.x0;
  } else {
    // Một đoạn: "nǐ hǎo - xin chào", "(thủy quả)" (âm Hán Việt) → bỏ ngoặc đầu.
    const r = pinyin || others[0] === first ? rest : others[0] ? clean(others[0].text) || clean(others[0].alt) : "";
    meaning = clean(r.replace(LEADING_PAREN, ""));
    if (WRAPPED.test(meaning)) meaning = "";
  }
  if (pinyin) e.anchorX1 = first.x1 ?? e.anchorX1;
  return { hanzi: e.hanzi, pinyin, meaning };
}

/** Tách các dòng ô (kết quả OCR có toạ độ) thành từ vựng. `tol`: sai số khi so cột (px; mặc định 2% bề rộng). */
export function parseOcrLines(lines: OcrCell[][], max = 50, tol?: number): OcrWord[] {
  const width = Math.max(0, ...lines.flat().map((c) => c.x1 ?? 0));
  const slack = tol ?? Math.max(8, width * 0.02);
  const out: OcrWord[] = [];
  const seen = new Map<string, OcrWord>();
  let last: { entry: Entry; word: OcrWord } | null = null;
  const push = (e: Entry) => {
    const w = resolve(e);
    const prev = seen.get(w.hanzi);
    if (prev) {
      prev.pinyin ||= w.pinyin;
      prev.meaning ||= w.meaning;
      last = { entry: e, word: prev };
      return;
    }
    if (out.length >= max) return;
    seen.set(w.hanzi, w);
    out.push(w);
    last = { entry: e, word: w };
  };

  for (const line of lines) {
    const cells = line.map((c) => ({
      text: norm(dropAnnots(c.text, c.alt)),
      alt: norm(c.alt ?? c.text),
      x0: c.x0,
      x1: c.x1,
    }));
    if (!cells.some((c) => HAN.test(c.text))) {
      // Dòng nối tiếp (nghĩa dài xuống dòng): chỉ khi cả dòng nằm bên phải cột pinyin; chỉ lấy ô thuộc cột nghĩa.
      const prev = last as { entry: Entry; word: OcrWord } | null;
      const e = prev?.entry;
      const left = Math.min(...cells.map((c) => c.x0 ?? -Infinity));
      if (!prev || !e || e.meaningX0 === undefined || e.anchorX1 === undefined || !(left > e.anchorX1)) continue;
      const add = cells.filter((c) => c.x0 !== undefined && c.x0 >= e.meaningX0! - slack).map((c) => clean(c.text));
      if (add.some(Boolean)) prev.word.meaning = clean([prev.word.meaning, ...add].join(" "));
      continue;
    }
    const done: Entry[] = [];
    const cur = () => done[done.length - 1];
    for (const c of cells) {
      const runs = [...c.text.matchAll(HAN_RUN)].filter((m) => HAN.test(m[0]));
      if (!runs.length) {
        cur()?.pieces.push(c);
        continue;
      }
      const altRuns = [...c.alt.matchAll(HAN_RUN)].filter((m) => HAN.test(m[0]));
      runs.forEach((m, k) => {
        const hanzi = m[0].replace(/^·+|·+$/g, "");
        // Bản `alt` có cùng số cụm chữ Hán → lấy phần Latin tương ứng; khác → dùng bản giữ dấu.
        const alt = altRuns.length === runs.length ? after(c.alt, k) : after(c.text, k);
        done.push({ hanzi, pieces: [{ text: after(c.text, k), alt, x0: c.x0, x1: c.x1 }], anchorX1: c.x1 });
      });
    }
    for (const e of done) push(e);
  }
  return out;
}

/** Văn bản thuần (mỗi dòng một chuỗi; " | " ngăn các ô) → từ vựng. */
export function parseOcrText(text: string, max = 50): OcrWord[] {
  return parseOcrLines(
    text
      .split(/\r?\n/)
      .map((l) => l.split(" | ").map((t) => ({ text: t })))
      .filter((l) => l.some((c) => c.text.trim())),
    max,
  );
}
