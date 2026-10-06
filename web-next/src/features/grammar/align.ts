import { splitSyllables } from "@/lib/pinyin";

const isHan = (c: string) => /\p{Script=Han}/u.test(c);

/**
 * Ghép câu tiếng Trung với pinyin theo từng từ: mỗi cụm pinyin (cách nhau bằng khoảng trắng) ứng với số chữ Hán bằng
 * số âm tiết của nó; dấu câu đi kèm chữ đứng trước. Không khớp số chữ → null (hiện kiểu cũ: câu + pinyin bên dưới).
 */
export function alignPinyin(chinese: string, pinyin: string): { zh: string; py: string }[] | null {
  const tokens = pinyin.trim().split(/\s+/).filter(Boolean);
  const chars = [...chinese.trim()];
  const han = chars.filter(isHan).length;
  if (!tokens.length || !han) return null;
  const counts = tokens.map((tk) => {
    const plain = tk.replace(/[^\p{L}']/gu, "");
    return plain ? splitSyllables(plain).length : 0;
  });
  if (counts.reduce((a, b) => a + b, 0) !== han) return null;
  const out: { zh: string; py: string }[] = [];
  let i = 0;
  for (let k = 0; k < tokens.length; k++) {
    let need = counts[k]!;
    let zh = "";
    while (i < chars.length && (need > 0 || !isHan(chars[i]!))) {
      if (isHan(chars[i]!)) need--;
      zh += chars[i++];
      if (need === 0) break;
    }
    // Dấu câu ngay sau từ → gộp vào từ đó.
    while (i < chars.length && !isHan(chars[i]!) && !/\s/.test(chars[i]!)) zh += chars[i++];
    if (zh.trim()) out.push({ zh: zh.trim(), py: tokens[k]! });
  }
  if (i < chars.length) out[out.length - 1]!.zh += chars.slice(i).join("").trim();
  return out;
}
