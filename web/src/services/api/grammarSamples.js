// Ngữ pháp mẫu — CHỈ nạp khi người dùng bấm “Dùng dữ liệu mẫu”.
export const SAMPLE_GRAMMAR = [
  {
    title: "Câu hỏi với 吗",
    meaning: "吗 được đặt cuối câu trần thuật để tạo câu hỏi Yes/No (có/không).",
    structure: "Chủ ngữ + tính từ/động từ + 吗？",
    examples: [
      { chinese: "你是学生吗？", pinyin: "Nǐ shì xuésheng ma?", vietnamese: "Bạn có phải là học sinh không?" },
      { chinese: "你好吗？", pinyin: "Nǐ hǎo ma?", vietnamese: "Bạn khỏe không?" },
    ],
    notes: "吗 thường đứng cuối câu.\nKhông dùng 吗 với câu đã có từ để hỏi (什么, 谁, 哪儿...).\nKhi nói thường lên giọng nhẹ cuối câu.",
    tags: ["HSK1", "Câu hỏi", "Cơ bản"],
  },
  {
    title: "Phủ định với 不",
    meaning: "不 đặt trước động từ/tính từ để phủ định ở hiện tại, tương lai hoặc thói quen.",
    structure: "Chủ ngữ + 不 + động từ/tính từ",
    examples: [
      { chinese: "我不喝咖啡。", pinyin: "Wǒ bù hē kāfēi.", vietnamese: "Tôi không uống cà phê." },
      { chinese: "今天不冷。", pinyin: "Jīntiān bù lěng.", vietnamese: "Hôm nay không lạnh." },
    ],
    notes: "不 đổi thành thanh 2 (bú) khi đứng trước âm tiết thanh 4: 不是 bú shì.\nPhủ định hành động đã xảy ra dùng 没, không dùng 不.",
    tags: ["HSK1", "Cơ bản", "Phủ định"],
  },
  {
    title: "Câu so sánh với 比",
    meaning: "Dùng 比 để so sánh hơn giữa hai đối tượng A và B.",
    structure: "A + 比 + B + tính từ",
    examples: [
      { chinese: "他比我高。", pinyin: "Tā bǐ wǒ gāo.", vietnamese: "Anh ấy cao hơn tôi." },
      { chinese: "今天比昨天热。", pinyin: "Jīntiān bǐ zuótiān rè.", vietnamese: "Hôm nay nóng hơn hôm qua." },
    ],
    notes: "Không dùng 很 / 非常 trước tính từ trong câu 比.\nMuốn nói “hơn nhiều” dùng: A 比 B + tính từ + 多了.",
    tags: ["HSK2", "Cấu trúc", "So sánh"],
  },
];
