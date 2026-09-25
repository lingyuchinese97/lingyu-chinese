// Dữ liệu mẫu — CHỈ nạp khi người dùng bấm "Dùng dữ liệu mẫu" (chép từ web/src/services/api/sampleData.js).
export type SampleWord = {
  hanzi: string;
  pinyin: string;
  meaningVi: string;
  note?: string;
  tags: string[];
  status?: "learned" | "review";
  isFavorite?: boolean;
};

export const SAMPLE_VOCABULARY: SampleWord[] = [
  { hanzi: "你", pinyin: "nǐ", meaningVi: "bạn, cậu", tags: ["HSK1", "Bài 1"], status: "learned", isFavorite: true },
  { hanzi: "好", pinyin: "hǎo", meaningVi: "tốt, khỏe", tags: ["HSK1", "Bài 1"] },
  {
    hanzi: "我",
    pinyin: "wǒ",
    meaningVi: "tôi, mình",
    tags: ["HSK1", "Bài 1", "Giao tiếp"],
    status: "learned",
    isFavorite: true,
  },
  {
    hanzi: "你好",
    pinyin: "nǐ hǎo",
    meaningVi: "xin chào",
    note: "你好 (nǐ hǎo) thường dùng để chào hỏi khi gặp mặt, nhất là lần đầu.",
    tags: ["HSK1", "Giao tiếp"],
  },
  {
    hanzi: "谢谢",
    pinyin: "xièxie",
    meaningVi: "cảm ơn",
    note: "Đáp lại bằng 不客气 (bú kèqi) — không có gì.",
    tags: ["HSK1", "Giao tiếp"],
  },
  {
    hanzi: "再见",
    pinyin: "zàijiàn",
    meaningVi: "tạm biệt",
    note: "再 (lại) + 见 (gặp) = hẹn gặp lại.",
    tags: ["HSK1", "Giao tiếp"],
  },
  {
    hanzi: "老师",
    pinyin: "lǎoshī",
    meaningVi: "giáo viên, thầy giáo, cô giáo",
    note: "老 ở đây mang nghĩa kính trọng, không phải “già”.",
    tags: ["HSK1", "Bài 2"],
  },
  {
    hanzi: "学校",
    pinyin: "xuéxiào",
    meaningVi: "trường học",
    tags: ["HSK1", "Bài 2", "Tự thêm"],
    status: "learned",
    isFavorite: true,
  },
  { hanzi: "朋友", pinyin: "péngyou", meaningVi: "bạn bè", tags: ["HSK1", "Giao tiếp"] },
  {
    hanzi: "家",
    pinyin: "jiā",
    meaningVi: "nhà, gia đình",
    note: "Bộ 宀 (mái nhà) ở trên đầu chữ.",
    tags: ["HSK1", "Gia đình"],
    status: "learned",
  },
  { hanzi: "咖啡", pinyin: "kāfēi", meaningVi: "cà phê", tags: ["Tự thêm", "Đồ uống"] },
  { hanzi: "妈妈", pinyin: "māma", meaningVi: "mẹ", tags: ["HSK1", "Gia đình"], status: "learned" },
  { hanzi: "爸爸", pinyin: "bàba", meaningVi: "bố, ba", tags: ["HSK1", "Gia đình"] },
  { hanzi: "喝水", pinyin: "hē shuǐ", meaningVi: "uống nước", tags: ["HSK1", "Đồ uống"] },
  { hanzi: "茶", pinyin: "chá", meaningVi: "trà", tags: ["HSK1", "Đồ uống"] },
  {
    hanzi: "工作",
    pinyin: "gōngzuò",
    meaningVi: "công việc, làm việc",
    note: "Vừa là danh từ vừa là động từ.",
    tags: ["HSK2", "Công việc"],
  },
  { hanzi: "公司", pinyin: "gōngsī", meaningVi: "công ty", tags: ["HSK2", "Công việc"] },
  { hanzi: "旅游", pinyin: "lǚyóu", meaningVi: "du lịch", tags: ["HSK2", "Du lịch"] },
  {
    hanzi: "机场",
    pinyin: "jīchǎng",
    meaningVi: "sân bay",
    note: "机 (máy) + 场 (bãi, sân).",
    tags: ["HSK2", "Du lịch"],
  },
  { hanzi: "认识", pinyin: "rènshi", meaningVi: "quen biết, nhận biết", tags: ["HSK2", "Giao tiếp"] },
  { hanzi: "学习", pinyin: "xuéxí", meaningVi: "học tập, học", tags: ["HSK1", "Bài 2"] },
  { hanzi: "经验", pinyin: "jīngyàn", meaningVi: "kinh nghiệm", tags: ["HSK3", "Công việc"] },
  { hanzi: "习惯", pinyin: "xíguàn", meaningVi: "thói quen, quen với", tags: ["HSK3"] },
  {
    hanzi: "加油",
    pinyin: "jiāyóu",
    meaningVi: "cố lên",
    note: "Nghĩa đen là “đổ thêm dầu”, dùng để cổ vũ.",
    tags: ["Tự thêm", "Giao tiếp"],
    isFavorite: true,
  },
];
