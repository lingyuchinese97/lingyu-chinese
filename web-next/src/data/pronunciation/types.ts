/** Kiểu dữ liệu nội dung Phát âm & Biến điệu. Chữ hiển thị có sẵn 2 ngôn ngữ (`vi` / `en`). */
export type L = { vi: string; en: string };
export type Example = { hanzi: string; pinyin: string; meaning: L };

export type SoundItem = {
  /** Ký hiệu pinyin: "b", "zh", "ang"... */
  symbol: string;
  /** Chữ Hán đại diện để máy đọc âm này (giọng đọc không đọc được ký hiệu pinyin đứng một mình). */
  speak: string;
  /** Cách máy đọc chữ `speak` (hiện cạnh nút Nghe để người học biết đang nghe âm tiết nào). */
  speakPinyin: string;
  /** Nhóm (id trong danh sách nhóm). */
  group: string;
  /** Gần giống âm nào của tiếng Việt / tiếng Anh. */
  like: L;
  /** Cách phát âm, từng ý. */
  how: { vi: string[]; en: string[] };
  examples: Example[];
  tip: L;
};

export type SoundGroup = { id: string; name: L; desc: L };

export type Tone = {
  tone: 1 | 2 | 3 | 4 | 5;
  mark: string;
  name: L;
  /** Độ cao theo thang 5 bậc (1 thấp – 5 cao), vd [5,5] thanh 1, [2,1,4] thanh 3. Thanh nhẹ: một điểm ngắn. */
  contour: number[];
  desc: L;
  like: L;
  example: Example;
};

export type SandhiExample = Example & {
  /** Pinyin sau biến điệu (cách đọc thực tế); `pinyin` là cách viết trong từ điển (trước biến điệu). */
  spoken: string;
};
export type SandhiRule = {
  id: "third-two" | "third-three" | "yi" | "bu";
  /** Nhóm hiển thị: quy tắc thanh 3 hoặc từ cố định 一 / 不. */
  kind: "third" | "fixed";
  title: L;
  short: L;
  formula: string;
  desc: L;
  examples: SandhiExample[];
  tip: L;
};
