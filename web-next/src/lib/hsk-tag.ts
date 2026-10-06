/** Cấp HSK của một thẻ / tag (tên bắt đầu bằng HSK + số 1–6: "HSK1", "HSK 2", "HSK3_Bài 1"); không phải → null. */
export const hskOfTag = (name: string) => {
  const m = /^hsk\s*_?([1-6])(?!\d)/i.exec(name.trim());
  return m ? Number(m[1]) : null;
};
export const HSK_FILTERS = ["", "1", "2", "3", "4", "5", "6", "other"] as const;
export type HskFilter = (typeof HSK_FILTERS)[number];
