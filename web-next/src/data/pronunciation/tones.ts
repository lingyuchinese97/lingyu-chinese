/** 4 thanh điệu + thanh nhẹ và các quy tắc biến điệu thường gặp. */
import type { Example, L, SandhiRule, Tone } from "./types";

const ex = (hanzi: string, pinyin: string, vi: string, en: string): Example => ({ hanzi, pinyin, meaning: { vi, en } });

export const TONES: Tone[] = [
  {
    tone: 1,
    mark: "ˉ",
    name: { vi: "Thanh 1", en: "Tone 1" },
    contour: [5, 5],
    desc: { vi: "Cao và bằng, giữ nguyên độ cao", en: "High and level" },
    like: { vi: "Như thanh ngang nhưng cao hơn", en: "Like singing one high note" },
    example: ex("妈", "mā", "mẹ", "mom"),
  },
  {
    tone: 2,
    mark: "ˊ",
    name: { vi: "Thanh 2", en: "Tone 2" },
    contour: [3, 5],
    desc: { vi: "Từ trung bình đi lên cao", en: "Rises from mid to high" },
    like: { vi: "Gần dấu sắc, như khi hỏi “hả?”", en: "Like asking “what?”" },
    example: ex("麻", "má", "cây gai; tê", "hemp; numb"),
  },
  {
    tone: 3,
    mark: "ˇ",
    name: { vi: "Thanh 3", en: "Tone 3" },
    contour: [2, 1, 4],
    desc: { vi: "Xuống thấp rồi lên", en: "Dips low, then rises" },
    like: { vi: "Gần dấu hỏi, đọc trầm và thấp", en: "Low and dipping" },
    example: ex("马", "mǎ", "con ngựa", "horse"),
  },
  {
    tone: 4,
    mark: "ˋ",
    name: { vi: "Thanh 4", en: "Tone 4" },
    contour: [5, 1],
    desc: { vi: "Từ cao rơi mạnh xuống thấp", en: "Falls sharply from high to low" },
    like: { vi: "Gần dấu huyền nhưng dứt khoát, như ra lệnh", en: "Like a firm “No!”" },
    example: ex("骂", "mà", "mắng", "to scold"),
  },
  {
    tone: 5,
    mark: "·",
    name: { vi: "Thanh nhẹ", en: "Neutral tone" },
    contour: [3],
    desc: { vi: "Ngắn và nhẹ, không có dấu", en: "Short and light, no mark" },
    like: { vi: "Đọc lướt, nhẹ hơn âm tiết trước", en: "Said quickly and softly" },
    example: ex("吗", "ma", "(trợ từ hỏi)", "(question particle)"),
  },
];

/** Bộ ví dụ so sánh 4 thanh: cùng âm, khác thanh → khác nghĩa. */
export const TONE_SETS: { syllable: string; items: Example[] }[] = [
  {
    syllable: "ma",
    items: [
      ex("妈", "mā", "mẹ", "mom"),
      ex("麻", "má", "tê", "numb"),
      ex("马", "mǎ", "ngựa", "horse"),
      ex("骂", "mà", "mắng", "to scold"),
    ],
  },
  {
    syllable: "tang",
    items: [
      ex("汤", "tāng", "canh", "soup"),
      ex("糖", "táng", "đường", "sugar"),
      ex("躺", "tǎng", "nằm", "to lie down"),
      ex("烫", "tàng", "bỏng", "scalding"),
    ],
  },
  {
    syllable: "yi",
    items: [
      ex("衣", "yī", "áo", "clothes"),
      ex("姨", "yí", "dì", "aunt"),
      ex("椅", "yǐ", "ghế", "chair"),
      ex("意", "yì", "ý", "meaning"),
    ],
  },
];

export const TONE_TIPS: L[] = [
  {
    vi: "Vẽ tay theo đường thanh điệu khi đọc để nhớ lâu hơn.",
    en: "Trace the pitch line with your hand as you speak.",
  },
  {
    vi: "Thanh 3 đứng trước âm khác thường chỉ đọc nửa (xuống thấp, không lên).",
    en: "Before other tones, tone 3 is usually just the low half.",
  },
  {
    vi: "Dấu đặt trên a / e trước; có “ou” thì đặt trên o; còn lại trên nguyên âm cuối.",
    en: "Marks go on a / e first, then o in “ou”, else the last vowel.",
  },
];

export const SANDHI_RULES: SandhiRule[] = [
  {
    id: "third-two",
    kind: "third",
    title: { vi: "Hai thanh 3 liên tiếp", en: "Two third tones" },
    short: { vi: "Thanh 3 đầu → thanh 2", en: "First becomes tone 2" },
    formula: "Aˇ + Bˇ → Aˊ + Bˇ",
    desc: {
      vi: "Khi hai âm tiết thanh 3 đứng liền nhau, âm tiết thứ nhất đọc thành thanh 2. Cách viết pinyin không đổi.",
      en: "When two third tones meet, the first is said as tone 2. The written pinyin doesn't change.",
    },
    examples: [
      { ...ex("你好", "nǐ hǎo", "xin chào", "hello"), spoken: "ní hǎo" },
      { ...ex("很好", "hěn hǎo", "rất tốt", "very good"), spoken: "hén hǎo" },
      { ...ex("我也", "wǒ yě", "tôi cũng", "me too"), spoken: "wó yě" },
      { ...ex("水果", "shuǐguǒ", "hoa quả", "fruit"), spoken: "shuíguǒ" },
      { ...ex("可以", "kěyǐ", "có thể", "can"), spoken: "kéyǐ" },
    ],
    tip: {
      vi: "Nhớ: “3 + 3 → 2 + 3”. Từ điển vẫn ghi 你好 nǐ hǎo nhưng đọc ní hǎo.",
      en: "Remember “3 + 3 → 2 + 3”. Dictionaries still write nǐ hǎo.",
    },
  },
  {
    id: "third-three",
    kind: "third",
    title: { vi: "Ba thanh 3 liên tiếp", en: "Three third tones" },
    short: { vi: "Thường đọc 2 + 2 + 3", en: "Usually 2 + 2 + 3" },
    formula: "Aˇ + Bˇ + Cˇ → Aˊ + Bˊ + Cˇ",
    desc: {
      vi: "Ba thanh 3 liền nhau khi nói nhanh thường đọc hai âm đầu thành thanh 2, chỉ giữ thanh 3 ở âm cuối. Khi ngắt nhịp (vd 我 | 很好) âm đầu có thể giữ nửa thanh 3.",
      en: "Three third tones in a row are usually said 2 + 2 + 3. With a pause (我 | 很好) the first may stay a low tone 3.",
    },
    examples: [
      { ...ex("我很好", "wǒ hěn hǎo", "tôi rất khỏe", "I'm very well"), spoken: "wó hén hǎo" },
      { ...ex("展览馆", "zhǎnlǎnguǎn", "nhà triển lãm", "exhibition hall"), spoken: "zhánlánguǎn" },
      { ...ex("你也好", "nǐ yě hǎo", "bạn cũng khỏe", "you're well too"), spoken: "ní yé hǎo" },
    ],
    tip: { vi: "Chỉ âm cuối giữ thanh 3 đầy đủ.", en: "Only the last syllable keeps a full tone 3." },
  },
  {
    id: "yi",
    kind: "fixed",
    title: { vi: "Biến điệu của 一 (yī)", en: "Tone change of 一 (yī)" },
    short: { vi: "yí trước thanh 4 · yì trước thanh 1, 2, 3", en: "yí before tone 4 · yì before 1, 2, 3" },
    formula: "一 yī → yí + ˋ · yì + ˉ ˊ ˇ",
    desc: {
      vi: "一 đọc yī khi đứng một mình, khi đếm số hoặc ở cuối từ (第一 dì yī). Trước thanh 4 đọc yí; trước thanh 1, 2, 3 đọc yì.",
      en: "一 is yī alone, in numbers or at the end (第一 dì yī). Before tone 4 it's yí; before tones 1, 2, 3 it's yì.",
    },
    examples: [
      { ...ex("一个", "yī gè", "một cái", "one (item)"), spoken: "yí gè" },
      { ...ex("一样", "yīyàng", "giống nhau", "the same"), spoken: "yíyàng" },
      { ...ex("一天", "yī tiān", "một ngày", "one day"), spoken: "yì tiān" },
      { ...ex("一年", "yī nián", "một năm", "one year"), spoken: "yì nián" },
      { ...ex("一起", "yīqǐ", "cùng nhau", "together"), spoken: "yìqǐ" },
    ],
    tip: {
      vi: "Nhìn thanh của chữ đứng sau: thanh 4 → yí, còn lại → yì.",
      en: "Look at the next syllable: tone 4 → yí, others → yì.",
    },
  },
  {
    id: "bu",
    kind: "fixed",
    title: { vi: "Biến điệu của 不 (bù)", en: "Tone change of 不 (bù)" },
    short: { vi: "bú trước thanh 4", en: "bú before tone 4" },
    formula: "不 bù + ˋ → bú + ˋ",
    desc: {
      vi: "不 vốn là thanh 4 (bù). Khi đứng trước một âm tiết thanh 4 thì đọc thành thanh 2 (bú). Trước thanh 1, 2, 3 vẫn đọc bù.",
      en: "不 is normally bù. Before another tone 4 it becomes bú; before tones 1, 2, 3 it stays bù.",
    },
    examples: [
      { ...ex("不是", "bù shì", "không phải", "is not"), spoken: "bú shì" },
      { ...ex("不对", "bù duì", "không đúng", "not right"), spoken: "bú duì" },
      { ...ex("不要", "bù yào", "không muốn", "don't want"), spoken: "bú yào" },
      { ...ex("不去", "bù qù", "không đi", "not go"), spoken: "bú qù" },
    ],
    tip: { vi: "Hai thanh 4 liền nhau với 不 → bú.", en: "不 before tone 4 → bú." },
  },
];

export const SANDHI_TIPS: L[] = [
  {
    vi: "Biến điệu chỉ đổi cách đọc, không đổi cách viết pinyin (trừ sách dạy đọc).",
    en: "Tone sandhi changes how you say it, not how it's written.",
  },
  {
    vi: "Đọc chậm từng chữ trước, rồi đọc liền cả từ để cảm nhận sự thay đổi.",
    en: "Say each syllable slowly, then the whole word, to feel the change.",
  },
];
