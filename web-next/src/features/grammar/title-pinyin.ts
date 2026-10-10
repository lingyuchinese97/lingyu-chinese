import "server-only";

/** Pinyin của các cụm chữ Hán trong tiêu đề ("Cách dùng 也" → "yě"); không có chữ Hán → "". */
export async function titlePinyin(titles: string[]): Promise<string[]> {
  const groups = titles.map((t) => t.match(/\p{Script=Han}+/gu) ?? []);
  if (!groups.some((g) => g.length)) return titles.map(() => "");
  const { pinyin } = await import("pinyin-pro");
  return groups.map((g) => g.map((h) => pinyin(h, { toneType: "symbol" })).join(" / "));
}
