/**
 * Danh sách từ vựng HSK 3.1 (gói `hsk3.1-syllabus`, giấy phép MIT): cấp 1–6 và 7–9 (ghi là 7).
 * Chỉ dùng ở server (dữ liệu ~500KB). Một từ xuất hiện ở nhiều cấp → lấy cấp thấp nhất.
 */
import vocabulary from "hsk3.1-syllabus";

export const HSK_LEVELS = [1, 2, 3, 4, 5, 6, 7] as const;
export type HskLevel = (typeof HSK_LEVELS)[number];

type Tuple = [number, string, string, string, string[]];
const LEVEL_OF = new Map<string, HskLevel>();
const PINYIN_OF = new Map<string, string>();
const BY_LEVEL = new Map<HskLevel, string[]>(HSK_LEVELS.map((l) => [l, []]));

for (const row of vocabulary as unknown as (Tuple | Tuple[])[]) {
  const entries: Tuple[] = typeof row[0] === "number" ? [row as Tuple] : (row as Tuple[]);
  for (const [, lv, word, pinyin] of entries) {
    const level = (lv === "7-9" ? 7 : Number(lv)) as HskLevel;
    const prev = LEVEL_OF.get(word);
    if (prev !== undefined && prev <= level) continue;
    if (prev !== undefined)
      BY_LEVEL.set(
        prev,
        BY_LEVEL.get(prev)!.filter((w) => w !== word),
      );
    LEVEL_OF.set(word, level);
    PINYIN_OF.set(word, pinyin);
    BY_LEVEL.get(level)!.push(word);
  }
}

/** Cấp HSK của một từ (null nếu không có trong danh sách). */
export const hskLevelOf = (word: string): HskLevel | null => LEVEL_OF.get(word.trim()) ?? null;
/** Pinyin theo đề cương HSK. */
export const hskPinyinOf = (word: string) => PINYIN_OF.get(word.trim()) ?? null;
/** Các từ của một cấp. */
export const hskWords = (level: HskLevel): readonly string[] => BY_LEVEL.get(level) ?? [];
/** Số từ mỗi cấp. */
export const hskCounts = () =>
  Object.fromEntries(HSK_LEVELS.map((l) => [l, BY_LEVEL.get(l)!.length])) as Record<HskLevel, number>;
