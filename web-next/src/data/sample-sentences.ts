// Câu mẫu cho "Ôn dịch câu" — CHỈ nạp khi người dùng bấm "Dùng dữ liệu mẫu".
export const SAMPLE_SENTENCES: {
  chinese: string;
  pinyin: string;
  vietnamese: string;
  note?: string;
  tags: string[];
}[] = [
  { chinese: "你好！", pinyin: "Nǐ hǎo!", vietnamese: "Xin chào!", tags: ["HSK1", "Giao tiếp"] },
  { chinese: "我叫李明。", pinyin: "Wǒ jiào Lǐ Míng.", vietnamese: "Tôi tên là Lý Minh.", tags: ["Giới thiệu"] },
  {
    chinese: "我每天学习中文。",
    pinyin: "Wǒ měitiān xuéxí Zhōngwén.",
    vietnamese: "Tôi học tiếng Trung mỗi ngày.",
    tags: ["Hằng ngày", "HSK1"],
  },
  { chinese: "这是我的家。", pinyin: "Zhè shì wǒ de jiā.", vietnamese: "Đây là nhà của tôi.", tags: ["Gia đình"] },
  { chinese: "明天见！", pinyin: "Míngtiān jiàn!", vietnamese: "Hẹn gặp lại ngày mai!", tags: ["Hằng ngày"] },
  { chinese: "谢谢你！", pinyin: "Xièxie nǐ!", vietnamese: "Cảm ơn bạn!", tags: ["HSK1", "Giao tiếp"] },
  { chinese: "你是哪国人？", pinyin: "Nǐ shì nǎ guó rén?", vietnamese: "Bạn là người nước nào?", tags: ["Giới thiệu"] },
  { chinese: "我是越南人。", pinyin: "Wǒ shì Yuènán rén.", vietnamese: "Tôi là người Việt Nam.", tags: ["Giới thiệu"] },
  {
    chinese: "我喜欢喝咖啡。",
    pinyin: "Wǒ xǐhuan hē kāfēi.",
    vietnamese: "Tôi thích uống cà phê.",
    tags: ["Hằng ngày"],
  },
  {
    chinese: "我在公司工作。",
    pinyin: "Wǒ zài gōngsī gōngzuò.",
    vietnamese: "Tôi làm việc ở công ty.",
    tags: ["Công việc"],
  },
  { chinese: "机场在哪儿？", pinyin: "Jīchǎng zài nǎr?", vietnamese: "Sân bay ở đâu?", tags: ["Du lịch"] },
  { chinese: "我爸爸是老师。", pinyin: "Wǒ bàba shì lǎoshī.", vietnamese: "Bố tôi là giáo viên.", tags: ["Gia đình"] },
];
