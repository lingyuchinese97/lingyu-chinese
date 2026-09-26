/**
 * Tạo bài luyện tập phát âm — hàm thuần, dùng chung cho giao diện và REST API.
 * Đây là bài tự luyện (không lưu điểm lên server) nên câu hỏi trả kèm đáp án để chấm ngay trên máy.
 */
import { markSyllable, samePinyin, splitSyllables, splitTone, isPinyinSyllable } from "@/lib/pinyin";
import { PAIRS, SYLLABLES, WORDS, type BankItem } from "@/data/pronunciation/practice-bank";
import { SANDHI_RULES } from "@/data/pronunciation/tones";
import type { L, SandhiRule } from "@/data/pronunciation/types";

export const PRACTICE_MODES = [
  "listen-choose",
  "listen-type",
  "speak-compare",
  "pairs",
  "read-words",
  "sandhi",
] as const;
export type PracticeMode = (typeof PRACTICE_MODES)[number];
export const PRACTICE_COUNT = { MIN: 1, MAX: 20, DEFAULT: 10 } as const;

export type PracticeQuestion = {
  id: string;
  mode: PracticeMode;
  /** Chữ để máy đọc (giọng đọc tiếng Trung của thiết bị). */
  speak: string;
  hanzi: string;
  meaning: L;
  /** Đáp án đúng (pinyin có dấu). */
  answer: string;
  /** Các lựa chọn (đã xáo, có chứa đáp án). Rỗng với chế độ gõ pinyin / phát âm & so sánh. */
  options: string[];
  /** Gợi ý có cấu trúc (giao diện tự dịch). */
  hint: { initial?: string; final?: string; tone?: number; tones?: number[]; rule?: SandhiRule["id"] };
  /** Chỉ bài biến điệu: cách viết trong từ điển (trước biến điệu). */
  written?: string;
};

type Rng = () => number;
const INITIALS = [
  "zh",
  "ch",
  "sh",
  "b",
  "p",
  "m",
  "f",
  "d",
  "t",
  "n",
  "l",
  "g",
  "k",
  "h",
  "j",
  "q",
  "x",
  "r",
  "z",
  "c",
  "s",
];
const PALATAL = ["j", "q", "x"];

function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
/** Lấy n phần tử khác nhau (hết thì xáo lại và lấy tiếp). */
function sample<T>(arr: readonly T[], n: number, rng: Rng): T[] {
  const out: T[] = [];
  while (out.length < n) out.push(...shuffle(arr, rng).slice(0, n - out.length));
  return out;
}

/** "zhōng" → { initial: "zh", rest: "ong", tone: 1 }. */
export function parseSyllable(syl: string) {
  const { plain, tone } = splitTone(syl);
  const initial = INITIALS.find((i) => plain.startsWith(i) && plain.length > i.length) ?? "";
  return { plain, initial, rest: plain.slice(initial.length), tone };
}

/** Các âm tiết gần giống để làm phương án nhiễu: đổi phụ âm đầu (cùng thanh) và đổi thanh. */
export function distractors(syl: string, n: number, rng: Rng): string[] {
  const { plain, initial, rest, tone } = parseSyllable(syl);
  const t = tone === 5 ? 1 : tone;
  // j q x + u thực chất là ü: chỉ đổi trong nhóm j q x để không sinh âm sai nghĩa.
  const pool = initial && PALATAL.includes(initial) ? PALATAL : INITIALS;
  const byInitial = initial
    ? shuffle(pool, rng)
        .filter((i) => i !== initial && isPinyinSyllable(i + rest))
        .map((i) => markSyllable(i + rest, t))
    : [];
  const byTone = shuffle(
    [1, 2, 3, 4].filter((x) => x !== tone),
    rng,
  ).map((x) => markSyllable(plain, x));
  const out: string[] = [];
  // Ưu tiên 2 phương án đổi phụ âm đầu + 1 đổi thanh (giống thiết kế: bā / pā / mā / dā).
  for (const c of [...byInitial.slice(0, Math.max(0, n - 1)), ...byTone, ...byInitial.slice(n - 1)])
    if (out.length < n && c !== syl && !out.includes(c)) out.push(c);
  return out;
}

/** Đổi thanh một âm tiết của từ → phương án nhiễu cho luyện đọc từ / biến điệu. */
function toneVariants(pinyin: string, n: number, rng: Rng, exclude: string[] = []): string[] {
  const syl = splitSyllables(pinyin);
  const joiner = pinyin.includes(" ") ? " " : "";
  const out: string[] = [];
  for (let guard = 0; out.length < n && guard < 60; guard++) {
    const i = Math.floor(rng() * syl.length);
    const { plain, tone } = splitTone(syl[i]!);
    const others = [1, 2, 3, 4].filter((x) => x !== tone);
    const next = [...syl];
    next[i] = markSyllable(plain, others[Math.floor(rng() * others.length)]!);
    const cand = next.join(joiner);
    if (cand !== pinyin && !exclude.includes(cand) && !out.includes(cand)) out.push(cand);
  }
  return out;
}

const base = (mode: PracticeMode, i: number, item: BankItem) => ({
  id: `${mode}-${i + 1}`,
  mode,
  speak: item.hanzi,
  hanzi: item.hanzi,
  meaning: item.meaning,
  answer: item.pinyin,
});
const tonesOf = (pinyin: string) => splitSyllables(pinyin).map((s) => splitTone(s).tone);

export function generatePractice(mode: PracticeMode, count: number = PRACTICE_COUNT.DEFAULT, rng: Rng = Math.random) {
  const n = Math.min(PRACTICE_COUNT.MAX, Math.max(PRACTICE_COUNT.MIN, Math.floor(count)));
  switch (mode) {
    case "listen-choose":
      return sample(SYLLABLES, n, rng).map((s, i): PracticeQuestion => {
        const p = parseSyllable(s.pinyin);
        return {
          ...base(mode, i, s),
          options: shuffle([s.pinyin, ...distractors(s.pinyin, 3, rng)], rng),
          hint: { initial: p.initial || undefined, final: p.rest, tone: p.tone },
        };
      });
    case "listen-type":
      return sample([...SYLLABLES, ...WORDS.slice(0, 8)], n, rng).map((s, i): PracticeQuestion => ({
        ...base(mode, i, s),
        options: [],
        hint: { tones: tonesOf(s.pinyin) },
      }));
    case "speak-compare":
      return sample([...WORDS, ...SYLLABLES.slice(0, 10)], n, rng).map((s, i): PracticeQuestion => ({
        ...base(mode, i, s),
        options: [],
        hint: { tones: tonesOf(s.pinyin) },
      }));
    case "pairs":
      return sample(PAIRS, n, rng).map(([a, b], i): PracticeQuestion => {
        const pick = rng() < 0.5 ? a : b;
        const pa = parseSyllable(a.pinyin);
        const pb = parseSyllable(b.pinyin);
        return {
          ...base(mode, i, pick),
          options: [a.pinyin, b.pinyin],
          hint:
            pa.initial !== pb.initial
              ? { initial: `${pa.initial} / ${pb.initial}` }
              : { final: `${pa.rest} / ${pb.rest}` },
        };
      });
    case "read-words":
      return sample(WORDS, n, rng).map((w, i): PracticeQuestion => ({
        ...base(mode, i, w),
        options: shuffle([w.pinyin, ...toneVariants(w.pinyin, 3, rng)], rng),
        hint: { tones: tonesOf(w.pinyin) },
      }));
    case "sandhi": {
      const all = SANDHI_RULES.flatMap((r) => r.examples.map((e) => ({ rule: r.id, e })));
      return sample(all, n, rng).map(({ rule, e }, i): PracticeQuestion => {
        const wrong = [e.pinyin, ...toneVariants(e.spoken, 3, rng, [e.pinyin])].slice(0, 3);
        return {
          ...base(mode, i, { hanzi: e.hanzi, pinyin: e.spoken, meaning: e.meaning }),
          options: shuffle([e.spoken, ...wrong], rng),
          hint: { rule },
          written: e.pinyin,
        };
      });
    }
  }
}

/** Chấm một câu (dùng chung giao diện và test): lựa chọn phải trùng; gõ pinyin chấp nhận số thanh (ba1 ≡ bā). */
export function checkAnswer(q: Pick<PracticeQuestion, "answer" | "options">, input: string) {
  return q.options.length ? input === q.answer : samePinyin(input, q.answer);
}
