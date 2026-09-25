/** Màu pastel ổn định cho tag theo tên (như bản cũ); tag bắt đầu bằng "HSK" luôn màu xanh. */
const TAG_PALETTE: [string, string][] = [
  ["#E6F2FF", "#0A6BC9"],
  ["#FFEAEA", "#D0262D"],
  ["#E7F8EF", "#0F7A4B"],
  ["#FFF1E3", "#A35604"],
  ["#F1EAFF", "#6B3FD0"],
  ["#E3F7F8", "#087078"],
  ["#FDEAF5", "#B8327D"],
  ["#EEF1F6", "#4B5E7A"],
];

export function tagColors(name: string): { background: string; color: string } {
  const n = String(name || "");
  let pair = TAG_PALETTE[0]!;
  if (!/^hsk/i.test(n)) {
    let h = 0;
    for (const ch of n) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
    pair = TAG_PALETTE[1 + (h % (TAG_PALETTE.length - 1))]!;
  }
  return { background: pair[0], color: pair[1] };
}
