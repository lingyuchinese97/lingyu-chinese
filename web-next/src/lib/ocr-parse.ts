/**
 * Tách kết quả nhận dạng chữ (OCR) của ảnh danh sách từ vựng thành từng từ: Hán tự · pinyin · nghĩa.
 * Mỗi đoạn bắt đầu bằng một cụm chữ Hán; phần chữ Latin theo sau: các âm tiết pinyin đứng đầu (đủ đúng số chữ Hán) là pinyin,
 * phần còn lại là nghĩa. Không nhận ra pinyin → để trống (server gợi ý sau). Chạy được cả ở trình duyệt lẫn server.
 */
import { isPinyinSyllable, splitSyllables } from "./pinyin";

export type OcrWord = { hanzi: string; pinyin: string; meaning: string };

const HAN = /\p{Script=Han}/u;
const HAN_RUN = /[\p{Script=Han}·]+/gu;
/** Dấu ngăn cách thường gặp giữa các cột: - – — : ： = | / , ， 、 ( ) ; . và số thứ tự. */
const EDGE = /^[\s\-–—:：=|/\\,，、;；.。()（）[\]【】*•·\d]+|[\s\-–—:：=|/\\,，、;；。()（）[\]【】*•·]+$/gu;
const PINYIN_TOKEN = /^[a-zA-ZüÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙ']+$/;

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

export function parseOcrText(text: string, max = 50): OcrWord[] {
  const out: OcrWord[] = [];
  const seen = new Map<string, OcrWord>();
  for (const raw of text.normalize("NFC").split(/\r?\n/)) {
    // OCR hay chèn khoảng trắng giữa các chữ Hán: "你 好" → "你好".
    const line = raw.replace(/(\p{Script=Han})[ \t]+(?=\p{Script=Han})/gu, "$1").trim();
    if (!HAN.test(line)) continue;
    const runs = [...line.matchAll(HAN_RUN)].filter((m) => HAN.test(m[0]));
    runs.forEach((m, k) => {
      const hanzi = m[0].replace(/^·+|·+$/g, "");
      const end = m.index! + m[0].length;
      const next = runs[k + 1]?.index ?? line.length;
      const rest = clean(line.slice(end, next));
      const { pinyin, meaning } = splitPinyin(rest, hanCount(hanzi));
      const prev = seen.get(hanzi);
      if (prev) {
        prev.pinyin ||= pinyin;
        prev.meaning ||= meaning;
        return;
      }
      if (out.length >= max) return;
      const w = { hanzi, pinyin, meaning };
      seen.set(hanzi, w);
      out.push(w);
    });
  }
  return out;
}
