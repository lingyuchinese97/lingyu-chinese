/**
 * Kho câu mẫu Luyện dịch (nội dung tĩnh): câu và đoạn ngắn HSK 1–4, kèm bản dịch vi / en được chấp nhận, cách nói khác,
 * phân tích từ và điểm ngữ pháp (id trong `./grammar`, `pattern` = công thức áp vào câu).
 * Pinyin sinh bằng pinyin-pro rồi rà tay (thanh nhẹ, 儿化, chữ đa âm) — test kiểm tra lại chữ Hán / ngữ pháp hợp lệ.
 */
export type TWord = { zh: string; py: string; vi: string; en: string };
export type TItem = {
  id: string;
  type: "sentence" | "paragraph";
  level: number;
  topic: string;
  zh: string;
  py: string;
  /** Bản dịch được chấp nhận; bản đầu là bản tham khảo chính. */
  vi: string[];
  en: string[];
  /** Cách nói khác (tiếng Trung) cũng được chấm đúng. */
  alt?: string[];
  words: TWord[];
  grammar: { id: string; pattern: string }[];
};

export const T_TOPICS = [
  "daily",
  "family",
  "school",
  "work",
  "travel",
  "food",
  "weather",
  "hobby",
  "health",
  "shopping",
] as const;
export type TTopic = (typeof T_TOPICS)[number];

export const T_ITEMS: TItem[] = [
  {
    id: "s001",
    type: "sentence",
    level: 1,
    topic: "daily",
    zh: "我每天早上七点起床。",
    py: "Wǒ měi tiān zǎo shang qī diǎn qǐ chuáng.",
    vi: [
      "Tôi thức dậy lúc bảy giờ sáng mỗi ngày.",
      "Mỗi ngày tôi dậy lúc bảy giờ sáng.",
      "Hằng ngày tôi thức dậy lúc 7 giờ sáng.",
    ],
    en: ["I get up at seven every morning.", "I get up at 7 every morning."],
    alt: ["我每天早上七点钟起床。"],
    words: [
      {
        zh: "每天",
        py: "měi tiān",
        vi: "mỗi ngày",
        en: "every day",
      },
      {
        zh: "早上",
        py: "zǎo shang",
        vi: "buổi sáng",
        en: "morning",
      },
      {
        zh: "七点",
        py: "qī diǎn",
        vi: "bảy giờ",
        en: "seven o'clock",
      },
      {
        zh: "起床",
        py: "qǐ chuáng",
        vi: "thức dậy",
        en: "get up",
      },
    ],
    grammar: [
      {
        id: "time-first",
        pattern: "我 + 每天早上七点 + 起床",
      },
    ],
  },
  {
    id: "s002",
    type: "sentence",
    level: 1,
    topic: "family",
    zh: "我妈妈是医生。",
    py: "Wǒ mā ma shì yī shēng.",
    vi: ["Mẹ tôi là bác sĩ."],
    en: ["My mother is a doctor.", "My mom is a doctor."],
    alt: ["我的妈妈是医生。"],
    words: [
      {
        zh: "妈妈",
        py: "mā ma",
        vi: "mẹ",
        en: "mother",
      },
      {
        zh: "是",
        py: "shì",
        vi: "là",
        en: "to be",
      },
      {
        zh: "医生",
        py: "yī shēng",
        vi: "bác sĩ",
        en: "doctor",
      },
    ],
    grammar: [
      {
        id: "shi",
        pattern: "我妈妈 + 是 + 医生",
      },
      {
        id: "de-poss",
        pattern: "我(的)妈妈 — người thân thường bỏ 的",
      },
    ],
  },
  {
    id: "s003",
    type: "sentence",
    level: 1,
    topic: "school",
    zh: "你是学生吗？",
    py: "Nǐ shì xué sheng ma?",
    vi: ["Bạn là học sinh phải không?", "Bạn có phải là học sinh không?", "Bạn là sinh viên à?"],
    en: ["Are you a student?"],
    words: [
      {
        zh: "你",
        py: "nǐ",
        vi: "bạn",
        en: "you",
      },
      {
        zh: "是",
        py: "shì",
        vi: "là",
        en: "to be",
      },
      {
        zh: "学生",
        py: "xué sheng",
        vi: "học sinh, sinh viên",
        en: "student",
      },
      {
        zh: "吗",
        py: "ma",
        vi: "(trợ từ hỏi)",
        en: "(question particle)",
      },
    ],
    grammar: [
      {
        id: "shi",
        pattern: "你 + 是 + 学生",
      },
      {
        id: "ma",
        pattern: "你是学生 + 吗？",
      },
    ],
  },
  {
    id: "s004",
    type: "sentence",
    level: 1,
    topic: "food",
    zh: "我想喝一杯茶。",
    py: "Wǒ xiǎng hē yì bēi chá.",
    vi: ["Tôi muốn uống một cốc trà.", "Tôi muốn uống một tách trà.", "Tôi muốn uống một ly trà."],
    en: ["I would like a cup of tea.", "I want to drink a cup of tea."],
    alt: ["我想喝杯茶。"],
    words: [
      {
        zh: "想",
        py: "xiǎng",
        vi: "muốn",
        en: "would like to",
      },
      {
        zh: "喝",
        py: "hē",
        vi: "uống",
        en: "drink",
      },
      {
        zh: "一杯",
        py: "yì bēi",
        vi: "một cốc",
        en: "a cup",
      },
      {
        zh: "茶",
        py: "chá",
        vi: "trà",
        en: "tea",
      },
    ],
    grammar: [
      {
        id: "xiang-yao",
        pattern: "我 + 想 + 喝",
      },
      {
        id: "measure",
        pattern: "一 + 杯 + 茶",
      },
    ],
  },
  {
    id: "s005",
    type: "sentence",
    level: 1,
    topic: "daily",
    zh: "我在家吃饭。",
    py: "Wǒ zài jiā chī fàn.",
    vi: ["Tôi ăn cơm ở nhà.", "Tôi ăn ở nhà."],
    en: ["I eat at home.", "I have meals at home."],
    words: [
      {
        zh: "在",
        py: "zài",
        vi: "ở",
        en: "at",
      },
      {
        zh: "家",
        py: "jiā",
        vi: "nhà",
        en: "home",
      },
      {
        zh: "吃饭",
        py: "chī fàn",
        vi: "ăn cơm",
        en: "eat a meal",
      },
    ],
    grammar: [
      {
        id: "zai-place",
        pattern: "我 + 在家 + 吃饭",
      },
    ],
  },
  {
    id: "s006",
    type: "sentence",
    level: 1,
    topic: "family",
    zh: "我家有四口人。",
    py: "Wǒ jiā yǒu sì kǒu rén.",
    vi: ["Nhà tôi có bốn người.", "Gia đình tôi có bốn người."],
    en: ["There are four people in my family.", "My family has four people."],
    alt: ["我家有四个人。"],
    words: [
      {
        zh: "家",
        py: "jiā",
        vi: "nhà, gia đình",
        en: "family",
      },
      {
        zh: "有",
        py: "yǒu",
        vi: "có",
        en: "have",
      },
      {
        zh: "四",
        py: "sì",
        vi: "bốn",
        en: "four",
      },
      {
        zh: "口",
        py: "kǒu",
        vi: "(lượng từ cho người trong nhà)",
        en: "(measure word for family members)",
      },
      {
        zh: "人",
        py: "rén",
        vi: "người",
        en: "person",
      },
    ],
    grammar: [
      {
        id: "measure",
        pattern: "四 + 口 + 人",
      },
    ],
  },
  {
    id: "s007",
    type: "sentence",
    level: 1,
    topic: "hobby",
    zh: "他会说汉语。",
    py: "Tā huì shuō Hàn yǔ.",
    vi: ["Anh ấy biết nói tiếng Trung.", "Anh ấy nói được tiếng Trung."],
    en: ["He can speak Chinese."],
    alt: ["他会说中文。"],
    words: [
      {
        zh: "会",
        py: "huì",
        vi: "biết (làm)",
        en: "can, know how to",
      },
      {
        zh: "说",
        py: "shuō",
        vi: "nói",
        en: "speak",
      },
      {
        zh: "汉语",
        py: "Hàn yǔ",
        vi: "tiếng Hán, tiếng Trung",
        en: "Chinese (language)",
      },
    ],
    grammar: [
      {
        id: "hui-neng",
        pattern: "他 + 会 + 说汉语",
      },
    ],
  },
  {
    id: "s008",
    type: "sentence",
    level: 1,
    topic: "weather",
    zh: "今天很冷。",
    py: "Jīn tiān hěn lěng.",
    vi: ["Hôm nay rất lạnh.", "Hôm nay lạnh quá."],
    en: ["It is very cold today.", "It's very cold today."],
    alt: ["今天天气很冷。"],
    words: [
      {
        zh: "今天",
        py: "jīn tiān",
        vi: "hôm nay",
        en: "today",
      },
      {
        zh: "很",
        py: "hěn",
        vi: "rất",
        en: "very",
      },
      {
        zh: "冷",
        py: "lěng",
        vi: "lạnh",
        en: "cold",
      },
    ],
    grammar: [
      {
        id: "shi",
        pattern: "Tính từ làm vị ngữ: 今天 + 很 + 冷 (không dùng 是)",
      },
    ],
  },
  {
    id: "s009",
    type: "sentence",
    level: 1,
    topic: "shopping",
    zh: "这个多少钱？",
    py: "Zhè ge duō shǎo qián?",
    vi: ["Cái này bao nhiêu tiền?", "Cái này giá bao nhiêu?"],
    en: ["How much is this?", "How much does this cost?"],
    words: [
      {
        zh: "这个",
        py: "zhè ge",
        vi: "cái này",
        en: "this",
      },
      {
        zh: "多少",
        py: "duō shǎo",
        vi: "bao nhiêu",
        en: "how much",
      },
      {
        zh: "钱",
        py: "qián",
        vi: "tiền",
        en: "money",
      },
    ],
    grammar: [
      {
        id: "measure",
        pattern: "这 + 个",
      },
    ],
  },
  {
    id: "s010",
    type: "sentence",
    level: 1,
    topic: "travel",
    zh: "我明天去北京。",
    py: "Wǒ míng tiān qù Běi jīng.",
    vi: ["Ngày mai tôi đi Bắc Kinh.", "Tôi sẽ đi Bắc Kinh vào ngày mai."],
    en: ["I am going to Beijing tomorrow.", "I'm going to Beijing tomorrow.", "I will go to Beijing tomorrow."],
    alt: ["明天我去北京。"],
    words: [
      {
        zh: "明天",
        py: "míng tiān",
        vi: "ngày mai",
        en: "tomorrow",
      },
      {
        zh: "去",
        py: "qù",
        vi: "đi",
        en: "go",
      },
      {
        zh: "北京",
        py: "Běi jīng",
        vi: "Bắc Kinh",
        en: "Beijing",
      },
    ],
    grammar: [
      {
        id: "time-first",
        pattern: "我 + 明天 + 去北京",
      },
    ],
  },
  {
    id: "s011",
    type: "sentence",
    level: 1,
    topic: "school",
    zh: "这是我的书。",
    py: "Zhè shì wǒ de shū.",
    vi: ["Đây là sách của tôi.", "Đây là quyển sách của tôi."],
    en: ["This is my book."],
    words: [
      {
        zh: "这",
        py: "zhè",
        vi: "đây, này",
        en: "this",
      },
      {
        zh: "是",
        py: "shì",
        vi: "là",
        en: "to be",
      },
      {
        zh: "我的",
        py: "wǒ de",
        vi: "của tôi",
        en: "my",
      },
      {
        zh: "书",
        py: "shū",
        vi: "sách",
        en: "book",
      },
    ],
    grammar: [
      {
        id: "shi",
        pattern: "这 + 是 + 我的书",
      },
      {
        id: "de-poss",
        pattern: "我 + 的 + 书",
      },
    ],
  },
  {
    id: "s012",
    type: "sentence",
    level: 1,
    topic: "work",
    zh: "你在哪儿工作？",
    py: "Nǐ zài nǎr gōng zuò?",
    vi: ["Bạn làm việc ở đâu?"],
    en: ["Where do you work?"],
    alt: ["你在哪里工作？"],
    words: [
      {
        zh: "在",
        py: "zài",
        vi: "ở",
        en: "at",
      },
      {
        zh: "哪儿",
        py: "nǎr",
        vi: "ở đâu",
        en: "where",
      },
      {
        zh: "工作",
        py: "gōng zuò",
        vi: "làm việc",
        en: "work",
      },
    ],
    grammar: [
      {
        id: "zai-place",
        pattern: "你 + 在哪儿 + 工作",
      },
      {
        id: "ma",
        pattern: "Đã có từ để hỏi 哪儿 → không thêm 吗",
      },
    ],
  },
  {
    id: "s013",
    type: "sentence",
    level: 1,
    topic: "food",
    zh: "我不喜欢喝咖啡。",
    py: "Wǒ bù xǐ huan hē kā fēi.",
    vi: ["Tôi không thích uống cà phê."],
    en: ["I don't like drinking coffee.", "I do not like coffee.", "I don't like coffee."],
    words: [
      {
        zh: "不",
        py: "bù",
        vi: "không",
        en: "not",
      },
      {
        zh: "喜欢",
        py: "xǐ huan",
        vi: "thích",
        en: "like",
      },
      {
        zh: "喝",
        py: "hē",
        vi: "uống",
        en: "drink",
      },
      {
        zh: "咖啡",
        py: "kā fēi",
        vi: "cà phê",
        en: "coffee",
      },
    ],
    grammar: [
      {
        id: "xiang-yao",
        pattern: "Phủ định trước động từ: 我 + 不 + 喜欢 + 喝咖啡",
      },
    ],
  },
  {
    id: "s014",
    type: "sentence",
    level: 1,
    topic: "daily",
    zh: "现在几点？",
    py: "Xiàn zài jǐ diǎn?",
    vi: ["Bây giờ là mấy giờ?", "Bây giờ mấy giờ rồi?"],
    en: ["What time is it now?", "What time is it?"],
    alt: ["现在几点了？"],
    words: [
      {
        zh: "现在",
        py: "xiàn zài",
        vi: "bây giờ",
        en: "now",
      },
      {
        zh: "几点",
        py: "jǐ diǎn",
        vi: "mấy giờ",
        en: "what time",
      },
    ],
    grammar: [
      {
        id: "time-first",
        pattern: "现在 + 几点",
      },
    ],
  },
  {
    id: "s015",
    type: "sentence",
    level: 1,
    topic: "family",
    zh: "我有两个姐姐。",
    py: "Wǒ yǒu liǎng ge jiě jie.",
    vi: ["Tôi có hai chị gái.", "Tôi có hai người chị."],
    en: ["I have two older sisters."],
    words: [
      {
        zh: "有",
        py: "yǒu",
        vi: "có",
        en: "have",
      },
      {
        zh: "两",
        py: "liǎng",
        vi: "hai",
        en: "two",
      },
      {
        zh: "个",
        py: "ge",
        vi: "(lượng từ chung)",
        en: "(general measure word)",
      },
      {
        zh: "姐姐",
        py: "jiě jie",
        vi: "chị gái",
        en: "older sister",
      },
    ],
    grammar: [
      {
        id: "measure",
        pattern: "两 + 个 + 姐姐 (không nói 二个)",
      },
    ],
  },
  {
    id: "s016",
    type: "sentence",
    level: 1,
    topic: "hobby",
    zh: "我们一起去看电影吧。",
    py: "Wǒ men yì qǐ qù kàn diàn yǐng ba.",
    vi: ["Chúng ta cùng đi xem phim nhé.", "Chúng mình cùng đi xem phim đi."],
    en: ["Let's go to see a movie together.", "Let's go to the movies together."],
    words: [
      {
        zh: "我们",
        py: "wǒ men",
        vi: "chúng ta",
        en: "we",
      },
      {
        zh: "一起",
        py: "yì qǐ",
        vi: "cùng nhau",
        en: "together",
      },
      {
        zh: "看电影",
        py: "kàn diàn yǐng",
        vi: "xem phim",
        en: "watch a movie",
      },
      {
        zh: "吧",
        py: "ba",
        vi: "nhé, đi",
        en: "(suggestion particle)",
      },
    ],
    grammar: [
      {
        id: "xiang-yao",
        pattern: "我们 + 一起 + 去看电影 + 吧 (đề nghị)",
      },
    ],
  },
  {
    id: "s017",
    type: "sentence",
    level: 2,
    topic: "food",
    zh: "我昨天买了三个苹果。",
    py: "Wǒ zuó tiān mǎi le sān ge píng guǒ.",
    vi: ["Hôm qua tôi đã mua ba quả táo.", "Hôm qua tôi mua ba quả táo."],
    en: ["I bought three apples yesterday.", "Yesterday I bought three apples."],
    alt: ["昨天我买了三个苹果。"],
    words: [
      {
        zh: "昨天",
        py: "zuó tiān",
        vi: "hôm qua",
        en: "yesterday",
      },
      {
        zh: "买",
        py: "mǎi",
        vi: "mua",
        en: "buy",
      },
      {
        zh: "了",
        py: "le",
        vi: "(đã — hoàn thành)",
        en: "(completed action)",
      },
      {
        zh: "三个",
        py: "sān ge",
        vi: "ba cái / quả",
        en: "three",
      },
      {
        zh: "苹果",
        py: "píng guǒ",
        vi: "táo",
        en: "apple",
      },
    ],
    grammar: [
      {
        id: "le-done",
        pattern: "我 + 买 + 了 + 三个 + 苹果",
      },
      {
        id: "time-first",
        pattern: "我 + 昨天 + 买…",
      },
      {
        id: "measure",
        pattern: "三 + 个 + 苹果",
      },
    ],
  },
  {
    id: "s018",
    type: "sentence",
    level: 2,
    topic: "travel",
    zh: "你去过中国吗？",
    py: "Nǐ qù guo Zhōng guó ma?",
    vi: ["Bạn đã từng đến Trung Quốc chưa?", "Bạn đi Trung Quốc bao giờ chưa?"],
    en: ["Have you ever been to China?", "Have you been to China?"],
    words: [
      {
        zh: "去",
        py: "qù",
        vi: "đi",
        en: "go",
      },
      {
        zh: "过",
        py: "guo",
        vi: "đã từng",
        en: "(experience)",
      },
      {
        zh: "中国",
        py: "Zhōng guó",
        vi: "Trung Quốc",
        en: "China",
      },
    ],
    grammar: [
      {
        id: "guo",
        pattern: "你 + 去 + 过 + 中国",
      },
      {
        id: "ma",
        pattern: "你去过中国 + 吗？",
      },
    ],
  },
  {
    id: "s019",
    type: "sentence",
    level: 2,
    topic: "family",
    zh: "我哥哥比我高。",
    py: "Wǒ gē ge bǐ wǒ gāo.",
    vi: ["Anh trai tôi cao hơn tôi."],
    en: [
      "My older brother is taller than me.",
      "My brother is taller than me.",
      "My older brother is taller than I am.",
    ],
    words: [
      {
        zh: "哥哥",
        py: "gē ge",
        vi: "anh trai",
        en: "older brother",
      },
      {
        zh: "比",
        py: "bǐ",
        vi: "so với, hơn",
        en: "than",
      },
      {
        zh: "高",
        py: "gāo",
        vi: "cao",
        en: "tall",
      },
    ],
    grammar: [
      {
        id: "bi",
        pattern: "我哥哥 + 比 + 我 + 高",
      },
    ],
  },
  {
    id: "s020",
    type: "sentence",
    level: 2,
    topic: "hobby",
    zh: "她唱歌唱得很好。",
    py: "Tā chàng gē chàng de hěn hǎo.",
    vi: ["Cô ấy hát rất hay.", "Cô ấy hát hay lắm."],
    en: ["She sings very well."],
    alt: ["她歌唱得很好。"],
    words: [
      {
        zh: "唱歌",
        py: "chàng gē",
        vi: "hát",
        en: "sing",
      },
      {
        zh: "得",
        py: "de",
        vi: "(bổ ngữ trình độ)",
        en: "(degree complement)",
      },
      {
        zh: "很好",
        py: "hěn hǎo",
        vi: "rất tốt / hay",
        en: "very well",
      },
    ],
    grammar: [
      {
        id: "de-degree",
        pattern: "她 + 唱歌 + 唱 + 得 + 很好 (lặp động từ khi có tân ngữ)",
      },
    ],
  },
  {
    id: "s021",
    type: "sentence",
    level: 2,
    topic: "daily",
    zh: "我正在做饭呢。",
    py: "Wǒ zhèng zài zuò fàn ne.",
    vi: ["Tôi đang nấu cơm.", "Tôi đang nấu ăn."],
    en: ["I am cooking.", "I'm cooking right now."],
    alt: ["我在做饭呢。", "我正在做饭。"],
    words: [
      {
        zh: "正在",
        py: "zhèng zài",
        vi: "đang",
        en: "(in progress)",
      },
      {
        zh: "做饭",
        py: "zuò fàn",
        vi: "nấu cơm",
        en: "cook",
      },
      {
        zh: "呢",
        py: "ne",
        vi: "(trợ từ, đang…)",
        en: "(particle)",
      },
    ],
    grammar: [
      {
        id: "zhengzai",
        pattern: "我 + 正在 + 做饭 + 呢",
      },
    ],
  },
  {
    id: "s022",
    type: "sentence",
    level: 2,
    topic: "work",
    zh: "我从早上九点到下午五点工作。",
    py: "Wǒ cóng zǎo shang jiǔ diǎn dào xià wǔ wǔ diǎn gōng zuò.",
    vi: ["Tôi làm việc từ chín giờ sáng đến năm giờ chiều."],
    en: [
      "I work from nine in the morning to five in the afternoon.",
      "I work from 9 a.m. to 5 p.m.",
      "I work from 9am to 5pm.",
    ],
    words: [
      {
        zh: "从",
        py: "cóng",
        vi: "từ",
        en: "from",
      },
      {
        zh: "到",
        py: "dào",
        vi: "đến",
        en: "to",
      },
      {
        zh: "下午",
        py: "xià wǔ",
        vi: "buổi chiều",
        en: "afternoon",
      },
      {
        zh: "工作",
        py: "gōng zuò",
        vi: "làm việc",
        en: "work",
      },
    ],
    grammar: [
      {
        id: "cong-dao",
        pattern: "我 + 从早上九点 + 到下午五点 + 工作",
      },
    ],
  },
  {
    id: "s023",
    type: "sentence",
    level: 2,
    topic: "weather",
    zh: "因为下雨，所以我没去跑步。",
    py: "Yīn wèi xià yǔ, suǒ yǐ wǒ méi qù pǎo bù.",
    vi: ["Vì trời mưa nên tôi không đi chạy bộ.", "Vì mưa nên tôi đã không đi chạy bộ."],
    en: [
      "Because it rained, I didn't go running.",
      "Because it was raining, I didn't go running.",
      "I didn't go running because it rained.",
    ],
    alt: ["因为下雨了，所以我没去跑步。"],
    words: [
      {
        zh: "因为",
        py: "yīn wèi",
        vi: "vì",
        en: "because",
      },
      {
        zh: "下雨",
        py: "xià yǔ",
        vi: "mưa",
        en: "rain",
      },
      {
        zh: "所以",
        py: "suǒ yǐ",
        vi: "nên",
        en: "so",
      },
      {
        zh: "没",
        py: "méi",
        vi: "không (đã không)",
        en: "did not",
      },
      {
        zh: "跑步",
        py: "pǎo bù",
        vi: "chạy bộ",
        en: "run, jog",
      },
    ],
    grammar: [
      {
        id: "yinwei-suoyi",
        pattern: "因为 + 下雨，所以 + 我没去跑步",
      },
      {
        id: "le-done",
        pattern: "Phủ định việc đã qua: 没 + 去 (bỏ 了)",
      },
    ],
  },
  {
    id: "s024",
    type: "sentence",
    level: 2,
    topic: "travel",
    zh: "火车快要开了。",
    py: "Huǒ chē kuài yào kāi le.",
    vi: ["Tàu hỏa sắp chạy rồi.", "Tàu sắp chạy rồi.", "Tàu sắp khởi hành rồi."],
    en: ["The train is about to leave.", "The train is leaving soon."],
    alt: ["火车要开了。", "火车快开了。"],
    words: [
      {
        zh: "火车",
        py: "huǒ chē",
        vi: "tàu hỏa",
        en: "train",
      },
      {
        zh: "快要…了",
        py: "kuài yào … le",
        vi: "sắp … rồi",
        en: "about to",
      },
      {
        zh: "开",
        py: "kāi",
        vi: "chạy, khởi hành",
        en: "depart",
      },
    ],
    grammar: [
      {
        id: "kuaiyao-le",
        pattern: "火车 + 快要 + 开 + 了",
      },
    ],
  },
  {
    id: "s025",
    type: "sentence",
    level: 2,
    topic: "health",
    zh: "我身体不太舒服。",
    py: "Wǒ shēn tǐ bú tài shū fu.",
    vi: ["Tôi thấy trong người không được khỏe lắm.", "Tôi không được khỏe lắm.", "Người tôi hơi khó chịu."],
    en: ["I'm not feeling very well.", "I don't feel very well."],
    words: [
      {
        zh: "身体",
        py: "shēn tǐ",
        vi: "cơ thể, sức khỏe",
        en: "body, health",
      },
      {
        zh: "不太",
        py: "bú tài",
        vi: "không … lắm",
        en: "not very",
      },
      {
        zh: "舒服",
        py: "shū fu",
        vi: "dễ chịu, khỏe",
        en: "comfortable, well",
      },
    ],
    grammar: [
      {
        id: "shi",
        pattern: "Tính từ làm vị ngữ: 我身体 + 不太 + 舒服",
      },
    ],
  },
  {
    id: "s026",
    type: "sentence",
    level: 2,
    topic: "school",
    zh: "我学了两年汉语。",
    py: "Wǒ xué le liǎng nián Hàn yǔ.",
    vi: ["Tôi đã học tiếng Trung hai năm.", "Tôi học tiếng Trung được hai năm."],
    en: ["I studied Chinese for two years.", "I have studied Chinese for two years."],
    alt: ["我学汉语学了两年。", "我学了两年中文。"],
    words: [
      {
        zh: "学",
        py: "xué",
        vi: "học",
        en: "study",
      },
      {
        zh: "了",
        py: "le",
        vi: "(đã)",
        en: "(completed action)",
      },
      {
        zh: "两年",
        py: "liǎng nián",
        vi: "hai năm",
        en: "two years",
      },
      {
        zh: "汉语",
        py: "Hàn yǔ",
        vi: "tiếng Trung",
        en: "Chinese",
      },
    ],
    grammar: [
      {
        id: "le-done",
        pattern: "我 + 学 + 了 + 两年 + 汉语 (thời lượng đứng giữa động từ và tân ngữ)",
      },
    ],
  },
  {
    id: "s027",
    type: "sentence",
    level: 2,
    topic: "shopping",
    zh: "这件衣服比那件便宜。",
    py: "Zhè jiàn yī fu bǐ nà jiàn pián yi.",
    vi: ["Bộ quần áo này rẻ hơn bộ kia.", "Chiếc áo này rẻ hơn chiếc kia.", "Cái áo này rẻ hơn cái kia."],
    en: ["This piece of clothing is cheaper than that one.", "This shirt is cheaper than that one."],
    words: [
      {
        zh: "件",
        py: "jiàn",
        vi: "(lượng từ cho quần áo)",
        en: "(measure word for clothes)",
      },
      {
        zh: "衣服",
        py: "yī fu",
        vi: "quần áo",
        en: "clothes",
      },
      {
        zh: "比",
        py: "bǐ",
        vi: "hơn",
        en: "than",
      },
      {
        zh: "便宜",
        py: "pián yi",
        vi: "rẻ",
        en: "cheap",
      },
    ],
    grammar: [
      {
        id: "bi",
        pattern: "这件衣服 + 比 + 那件 + 便宜",
      },
      {
        id: "measure",
        pattern: "这 + 件 + 衣服",
      },
    ],
  },
  {
    id: "s028",
    type: "sentence",
    level: 2,
    topic: "daily",
    zh: "你吃过早饭了吗？",
    py: "Nǐ chī guo zǎo fàn le ma?",
    vi: ["Bạn đã ăn sáng chưa?", "Bạn ăn sáng chưa?"],
    en: ["Have you had breakfast?", "Have you eaten breakfast yet?"],
    alt: ["你吃早饭了吗？"],
    words: [
      {
        zh: "吃",
        py: "chī",
        vi: "ăn",
        en: "eat",
      },
      {
        zh: "过",
        py: "guo",
        vi: "(xong, rồi)",
        en: "(done)",
      },
      {
        zh: "早饭",
        py: "zǎo fàn",
        vi: "bữa sáng",
        en: "breakfast",
      },
      {
        zh: "了",
        py: "le",
        vi: "(rồi)",
        en: "(change / completion)",
      },
    ],
    grammar: [
      {
        id: "le-done",
        pattern: "你 + 吃过早饭 + 了 + 吗",
      },
      {
        id: "ma",
        pattern: "… + 吗？",
      },
    ],
  },
  {
    id: "s029",
    type: "sentence",
    level: 2,
    topic: "work",
    zh: "他每天坐地铁去公司。",
    py: "Tā měi tiān zuò dì tiě qù gōng sī.",
    vi: ["Mỗi ngày anh ấy đi tàu điện ngầm đến công ty.", "Anh ấy đi làm bằng tàu điện ngầm mỗi ngày."],
    en: ["He takes the subway to the office every day.", "He goes to work by subway every day."],
    words: [
      {
        zh: "坐",
        py: "zuò",
        vi: "ngồi, đi (xe)",
        en: "take (a vehicle)",
      },
      {
        zh: "地铁",
        py: "dì tiě",
        vi: "tàu điện ngầm",
        en: "subway",
      },
      {
        zh: "去",
        py: "qù",
        vi: "đi đến",
        en: "go to",
      },
      {
        zh: "公司",
        py: "gōng sī",
        vi: "công ty",
        en: "company, office",
      },
    ],
    grammar: [
      {
        id: "time-first",
        pattern: "他 + 每天 + 坐地铁 + 去公司 (phương tiện đứng trước 去)",
      },
    ],
  },
  {
    id: "s030",
    type: "sentence",
    level: 2,
    topic: "hobby",
    zh: "我可以用一下你的电脑吗？",
    py: "Wǒ kě yǐ yòng yí xià nǐ de diàn nǎo ma?",
    vi: [
      "Tôi có thể dùng máy tính của bạn một chút không?",
      "Tôi dùng máy tính của bạn một lát được không?",
      "Cho tôi mượn máy tính của bạn một chút được không?",
    ],
    en: ["Can I use your computer for a moment?", "May I use your computer for a bit?"],
    words: [
      {
        zh: "可以",
        py: "kě yǐ",
        vi: "có thể, được phép",
        en: "may, can",
      },
      {
        zh: "用",
        py: "yòng",
        vi: "dùng",
        en: "use",
      },
      {
        zh: "一下",
        py: "yí xià",
        vi: "một chút",
        en: "a moment",
      },
      {
        zh: "电脑",
        py: "diàn nǎo",
        vi: "máy tính",
        en: "computer",
      },
    ],
    grammar: [
      {
        id: "hui-neng",
        pattern: "我 + 可以 + 用 (xin phép)",
      },
      {
        id: "de-poss",
        pattern: "你 + 的 + 电脑",
      },
      {
        id: "ma",
        pattern: "… + 吗？",
      },
    ],
  },
  {
    id: "s031",
    type: "sentence",
    level: 3,
    topic: "weather",
    zh: "虽然今天很冷，但是我们还是去爬山了。",
    py: "Suī rán jīn tiān hěn lěng, dàn shì wǒ men hái shì qù pá shān le.",
    vi: [
      "Tuy hôm nay rất lạnh nhưng chúng tôi vẫn đi leo núi.",
      "Mặc dù hôm nay rất lạnh nhưng chúng tôi vẫn đi leo núi.",
    ],
    en: [
      "Although it was very cold today, we still went hiking.",
      "Even though it was very cold today, we still went mountain climbing.",
    ],
    alt: ["虽然今天很冷，可是我们还是去爬山了。"],
    words: [
      {
        zh: "虽然",
        py: "suī rán",
        vi: "tuy, mặc dù",
        en: "although",
      },
      {
        zh: "但是",
        py: "dàn shì",
        vi: "nhưng",
        en: "but",
      },
      {
        zh: "还是",
        py: "hái shì",
        vi: "vẫn",
        en: "still",
      },
      {
        zh: "爬山",
        py: "pá shān",
        vi: "leo núi",
        en: "climb a mountain",
      },
    ],
    grammar: [
      {
        id: "suiran-danshi",
        pattern: "虽然 + 今天很冷，但是 + 我们还是去爬山了",
      },
      {
        id: "le-done",
        pattern: "去爬山 + 了",
      },
    ],
  },
  {
    id: "s032",
    type: "sentence",
    level: 3,
    topic: "travel",
    zh: "如果明天不下雨，我们就去公园。",
    py: "Rú guǒ míng tiān bú xià yǔ, wǒ men jiù qù gōng yuán.",
    vi: ["Nếu ngày mai không mưa thì chúng ta sẽ đi công viên.", "Nếu mai không mưa thì chúng ta đi công viên."],
    en: ["If it doesn't rain tomorrow, we will go to the park.", "If it does not rain tomorrow, we'll go to the park."],
    alt: ["如果明天不下雨的话，我们就去公园。"],
    words: [
      {
        zh: "如果",
        py: "rú guǒ",
        vi: "nếu",
        en: "if",
      },
      {
        zh: "下雨",
        py: "xià yǔ",
        vi: "mưa",
        en: "rain",
      },
      {
        zh: "就",
        py: "jiù",
        vi: "thì",
        en: "then",
      },
      {
        zh: "公园",
        py: "gōng yuán",
        vi: "công viên",
        en: "park",
      },
    ],
    grammar: [
      {
        id: "ruguo-jiu",
        pattern: "如果 + 明天不下雨，我们 + 就 + 去公园",
      },
    ],
  },
  {
    id: "s033",
    type: "sentence",
    level: 3,
    topic: "hobby",
    zh: "他喜欢一边听音乐一边做作业。",
    py: "Tā xǐ huan yì biān tīng yīn yuè yì biān zuò zuò yè.",
    vi: ["Cậu ấy thích vừa nghe nhạc vừa làm bài tập.", "Anh ấy thích vừa nghe nhạc vừa làm bài tập."],
    en: ["He likes to listen to music while doing his homework.", "He likes doing homework while listening to music."],
    words: [
      {
        zh: "一边…一边…",
        py: "yì biān … yì biān …",
        vi: "vừa … vừa …",
        en: "while",
      },
      {
        zh: "听音乐",
        py: "tīng yīn yuè",
        vi: "nghe nhạc",
        en: "listen to music",
      },
      {
        zh: "做作业",
        py: "zuò zuò yè",
        vi: "làm bài tập",
        en: "do homework",
      },
    ],
    grammar: [
      {
        id: "yibian",
        pattern: "一边 + 听音乐 + 一边 + 做作业",
      },
    ],
  },
  {
    id: "s034",
    type: "sentence",
    level: 3,
    topic: "school",
    zh: "我的汉语越来越好了。",
    py: "Wǒ de Hàn yǔ yuè lái yuè hǎo le.",
    vi: ["Tiếng Trung của tôi ngày càng tốt hơn.", "Tiếng Trung của tôi càng ngày càng giỏi."],
    en: ["My Chinese is getting better and better."],
    alt: ["我的中文越来越好了。"],
    words: [
      {
        zh: "汉语",
        py: "Hàn yǔ",
        vi: "tiếng Trung",
        en: "Chinese",
      },
      {
        zh: "越来越",
        py: "yuè lái yuè",
        vi: "ngày càng",
        en: "more and more",
      },
      {
        zh: "好",
        py: "hǎo",
        vi: "tốt",
        en: "good",
      },
    ],
    grammar: [
      {
        id: "yuelaiyue",
        pattern: "我的汉语 + 越来越 + 好 + 了",
      },
    ],
  },
  {
    id: "s035",
    type: "sentence",
    level: 3,
    topic: "daily",
    zh: "请把门关上。",
    py: "Qǐng bǎ mén guān shang.",
    vi: ["Làm ơn đóng cửa lại.", "Hãy đóng cửa lại.", "Xin hãy đóng cửa lại."],
    en: ["Please close the door.", "Please shut the door."],
    words: [
      {
        zh: "请",
        py: "qǐng",
        vi: "xin mời, làm ơn",
        en: "please",
      },
      {
        zh: "把",
        py: "bǎ",
        vi: "(đưa tân ngữ lên trước)",
        en: "(把 construction)",
      },
      {
        zh: "门",
        py: "mén",
        vi: "cửa",
        en: "door",
      },
      {
        zh: "关上",
        py: "guān shang",
        vi: "đóng lại",
        en: "close",
      },
    ],
    grammar: [
      {
        id: "ba",
        pattern: "(你) + 把 + 门 + 关 + 上",
      },
    ],
  },
  {
    id: "s036",
    type: "sentence",
    level: 3,
    topic: "daily",
    zh: "我的手机被弟弟弄坏了。",
    py: "Wǒ de shǒu jī bèi dì di nòng huài le.",
    vi: ["Điện thoại của tôi bị em trai làm hỏng rồi.", "Điện thoại của tôi bị em trai làm hỏng."],
    en: ["My phone was broken by my younger brother.", "My younger brother broke my phone."],
    words: [
      {
        zh: "手机",
        py: "shǒu jī",
        vi: "điện thoại",
        en: "mobile phone",
      },
      {
        zh: "被",
        py: "bèi",
        vi: "bị",
        en: "(passive)",
      },
      {
        zh: "弟弟",
        py: "dì di",
        vi: "em trai",
        en: "younger brother",
      },
      {
        zh: "弄坏",
        py: "nòng huài",
        vi: "làm hỏng",
        en: "break",
      },
    ],
    grammar: [
      {
        id: "bei",
        pattern: "我的手机 + 被 + 弟弟 + 弄坏 + 了",
      },
    ],
  },
  {
    id: "s037",
    type: "sentence",
    level: 3,
    topic: "hobby",
    zh: "我对中国文化很感兴趣。",
    py: "Wǒ duì Zhōng guó wén huà hěn gǎn xìng qù.",
    vi: ["Tôi rất hứng thú với văn hóa Trung Quốc.", "Tôi rất quan tâm đến văn hóa Trung Quốc."],
    en: ["I am very interested in Chinese culture.", "I'm very interested in Chinese culture."],
    words: [
      {
        zh: "对",
        py: "duì",
        vi: "đối với",
        en: "towards",
      },
      {
        zh: "文化",
        py: "wén huà",
        vi: "văn hóa",
        en: "culture",
      },
      {
        zh: "感兴趣",
        py: "gǎn xìng qù",
        vi: "hứng thú",
        en: "be interested",
      },
    ],
    grammar: [
      {
        id: "dui-ganxingqu",
        pattern: "我 + 对 + 中国文化 + 很 + 感兴趣",
      },
    ],
  },
  {
    id: "s038",
    type: "sentence",
    level: 3,
    topic: "food",
    zh: "除了米饭以外，我还喜欢吃面条。",
    py: "Chú le mǐ fàn yǐ wài, wǒ hái xǐ huan chī miàn tiáo.",
    vi: ["Ngoài cơm ra, tôi còn thích ăn mì.", "Ngoài cơm, tôi còn thích ăn mì."],
    en: ["Besides rice, I also like eating noodles.", "Apart from rice, I also like noodles."],
    alt: ["除了米饭，我还喜欢吃面条。"],
    words: [
      {
        zh: "除了…以外",
        py: "chú le … yǐ wài",
        vi: "ngoài … ra",
        en: "besides",
      },
      {
        zh: "米饭",
        py: "mǐ fàn",
        vi: "cơm",
        en: "rice",
      },
      {
        zh: "还",
        py: "hái",
        vi: "còn",
        en: "also",
      },
      {
        zh: "面条",
        py: "miàn tiáo",
        vi: "mì",
        en: "noodles",
      },
    ],
    grammar: [
      {
        id: "chule",
        pattern: "除了 + 米饭 + 以外，我 + 还 + 喜欢吃面条",
      },
    ],
  },
  {
    id: "s039",
    type: "sentence",
    level: 3,
    topic: "work",
    zh: "我把报告发给你了。",
    py: "Wǒ bǎ bào gào fā gěi nǐ le.",
    vi: ["Tôi đã gửi báo cáo cho bạn rồi.", "Tôi gửi báo cáo cho bạn rồi."],
    en: ["I have sent the report to you.", "I sent you the report."],
    words: [
      {
        zh: "把",
        py: "bǎ",
        vi: "(đưa tân ngữ lên trước)",
        en: "(把 construction)",
      },
      {
        zh: "报告",
        py: "bào gào",
        vi: "báo cáo",
        en: "report",
      },
      {
        zh: "发给",
        py: "fā gěi",
        vi: "gửi cho",
        en: "send to",
      },
    ],
    grammar: [
      {
        id: "ba",
        pattern: "我 + 把 + 报告 + 发给你 + 了",
      },
    ],
  },
  {
    id: "s040",
    type: "sentence",
    level: 3,
    topic: "health",
    zh: "医生说我应该多喝水。",
    py: "Yī shēng shuō wǒ yīng gāi duō hē shuǐ.",
    vi: ["Bác sĩ nói tôi nên uống nhiều nước.", "Bác sĩ bảo tôi nên uống nhiều nước hơn."],
    en: ["The doctor said I should drink more water."],
    words: [
      {
        zh: "医生",
        py: "yī shēng",
        vi: "bác sĩ",
        en: "doctor",
      },
      {
        zh: "应该",
        py: "yīng gāi",
        vi: "nên",
        en: "should",
      },
      {
        zh: "多",
        py: "duō",
        vi: "nhiều (hơn)",
        en: "more",
      },
      {
        zh: "喝水",
        py: "hē shuǐ",
        vi: "uống nước",
        en: "drink water",
      },
    ],
    grammar: [
      {
        id: "hui-neng",
        pattern: "我 + 应该 + 多喝水 (động từ năng nguyện trước động từ)",
      },
    ],
  },
  {
    id: "s041",
    type: "sentence",
    level: 3,
    topic: "travel",
    zh: "从河内到胡志明市要坐两个小时飞机。",
    py: "Cóng Hé nèi dào Hú zhì míng Shì yào zuò liǎng ge xiǎo shí fēi jī.",
    vi: [
      "Từ Hà Nội đến Thành phố Hồ Chí Minh phải đi máy bay hai tiếng.",
      "Từ Hà Nội vào TP. Hồ Chí Minh đi máy bay mất hai tiếng.",
    ],
    en: [
      "It takes two hours by plane from Hanoi to Ho Chi Minh City.",
      "From Hanoi to Ho Chi Minh City is a two-hour flight.",
    ],
    words: [
      {
        zh: "从…到…",
        py: "cóng … dào …",
        vi: "từ … đến …",
        en: "from … to …",
      },
      {
        zh: "河内",
        py: "Hé nèi",
        vi: "Hà Nội",
        en: "Hanoi",
      },
      {
        zh: "胡志明市",
        py: "Hú zhì míng Shì",
        vi: "TP. Hồ Chí Minh",
        en: "Ho Chi Minh City",
      },
      {
        zh: "小时",
        py: "xiǎo shí",
        vi: "tiếng, giờ",
        en: "hour",
      },
      {
        zh: "飞机",
        py: "fēi jī",
        vi: "máy bay",
        en: "airplane",
      },
    ],
    grammar: [
      {
        id: "cong-dao",
        pattern: "从 + 河内 + 到 + 胡志明市",
      },
      {
        id: "measure",
        pattern: "两 + 个 + 小时",
      },
    ],
  },
  {
    id: "s042",
    type: "sentence",
    level: 3,
    topic: "shopping",
    zh: "这家店的东西又便宜又好。",
    py: "Zhè jiā diàn de dōng xi yòu pián yi yòu hǎo.",
    vi: ["Đồ ở cửa hàng này vừa rẻ vừa tốt.", "Đồ của tiệm này vừa rẻ vừa tốt."],
    en: ["The things in this shop are both cheap and good.", "This shop's goods are cheap and good."],
    words: [
      {
        zh: "家",
        py: "jiā",
        vi: "(lượng từ cho cửa hàng)",
        en: "(measure word for shops)",
      },
      {
        zh: "店",
        py: "diàn",
        vi: "cửa hàng",
        en: "shop",
      },
      {
        zh: "东西",
        py: "dōng xi",
        vi: "đồ vật",
        en: "things",
      },
      {
        zh: "又…又…",
        py: "yòu … yòu …",
        vi: "vừa … vừa …",
        en: "both … and …",
      },
    ],
    grammar: [
      {
        id: "de-poss",
        pattern: "这家店 + 的 + 东西",
      },
      {
        id: "measure",
        pattern: "这 + 家 + 店",
      },
    ],
  },
  {
    id: "s043",
    type: "sentence",
    level: 4,
    topic: "work",
    zh: "只要努力，就一定能成功。",
    py: "Zhǐ yào nǔ lì, jiù yí dìng néng chéng gōng.",
    vi: ["Chỉ cần cố gắng thì nhất định sẽ thành công.", "Chỉ cần nỗ lực là nhất định sẽ thành công."],
    en: ["As long as you work hard, you will surely succeed.", "As long as you try hard, you will definitely succeed."],
    words: [
      {
        zh: "只要",
        py: "zhǐ yào",
        vi: "chỉ cần",
        en: "as long as",
      },
      {
        zh: "努力",
        py: "nǔ lì",
        vi: "cố gắng",
        en: "work hard",
      },
      {
        zh: "一定",
        py: "yí dìng",
        vi: "nhất định",
        en: "surely",
      },
      {
        zh: "成功",
        py: "chéng gōng",
        vi: "thành công",
        en: "succeed",
      },
    ],
    grammar: [
      {
        id: "ruguo-jiu",
        pattern: "只要 + điều kiện，就 + kết quả (giống 如果…就…)",
      },
      {
        id: "hui-neng",
        pattern: "一定 + 能 + 成功",
      },
    ],
  },
  {
    id: "s044",
    type: "sentence",
    level: 4,
    topic: "school",
    zh: "我们不但要学好语法，而且要多练习口语。",
    py: "Wǒ men bú dàn yào xué hǎo yǔ fǎ, ér qiě yào duō liàn xí kǒu yǔ.",
    vi: [
      "Chúng ta không những phải học tốt ngữ pháp mà còn phải luyện nói nhiều.",
      "Chúng ta không chỉ cần học tốt ngữ pháp mà còn phải luyện khẩu ngữ nhiều hơn.",
    ],
    en: [
      "We should not only learn grammar well but also practice speaking more.",
      "Not only should we master grammar, we should also practice speaking a lot.",
    ],
    words: [
      {
        zh: "不但…而且…",
        py: "bú dàn … ér qiě …",
        vi: "không những … mà còn …",
        en: "not only … but also …",
      },
      {
        zh: "语法",
        py: "yǔ fǎ",
        vi: "ngữ pháp",
        en: "grammar",
      },
      {
        zh: "练习",
        py: "liàn xí",
        vi: "luyện tập",
        en: "practice",
      },
      {
        zh: "口语",
        py: "kǒu yǔ",
        vi: "khẩu ngữ, nói",
        en: "spoken language",
      },
    ],
    grammar: [
      {
        id: "xiang-yao",
        pattern: "要 + 学好 / 要 + 多练习 (cần phải)",
      },
    ],
  },
  {
    id: "s045",
    type: "sentence",
    level: 4,
    topic: "health",
    zh: "为了身体健康，他每天早上都去跑步。",
    py: "Wèi le shēn tǐ jiàn kāng, tā měi tiān zǎo shang dōu qù pǎo bù.",
    vi: ["Để có sức khỏe tốt, sáng nào anh ấy cũng đi chạy bộ.", "Vì sức khỏe, mỗi sáng anh ấy đều đi chạy bộ."],
    en: ["To stay healthy, he goes running every morning.", "For his health, he goes jogging every morning."],
    words: [
      {
        zh: "为了",
        py: "wèi le",
        vi: "để, vì",
        en: "in order to",
      },
      {
        zh: "健康",
        py: "jiàn kāng",
        vi: "khỏe mạnh",
        en: "healthy",
      },
      {
        zh: "都",
        py: "dōu",
        vi: "đều",
        en: "all, always",
      },
      {
        zh: "跑步",
        py: "pǎo bù",
        vi: "chạy bộ",
        en: "run",
      },
    ],
    grammar: [
      {
        id: "time-first",
        pattern: "他 + 每天早上 + 都 + 去跑步",
      },
    ],
  },
  {
    id: "s046",
    type: "sentence",
    level: 4,
    topic: "daily",
    zh: "他把房间打扫得干干净净。",
    py: "Tā bǎ fáng jiān dǎ sǎo de gān gān jìng jìng.",
    vi: ["Anh ấy dọn phòng sạch sẽ tinh tươm.", "Anh ấy dọn dẹp căn phòng sạch sẽ."],
    en: ["He cleaned the room spotlessly.", "He cleaned the room until it was spotless."],
    words: [
      {
        zh: "把",
        py: "bǎ",
        vi: "(đưa tân ngữ lên trước)",
        en: "(把 construction)",
      },
      {
        zh: "房间",
        py: "fáng jiān",
        vi: "phòng",
        en: "room",
      },
      {
        zh: "打扫",
        py: "dǎ sǎo",
        vi: "quét dọn",
        en: "clean",
      },
      {
        zh: "干干净净",
        py: "gān gān jìng jìng",
        vi: "sạch sẽ",
        en: "spotlessly clean",
      },
    ],
    grammar: [
      {
        id: "ba",
        pattern: "他 + 把 + 房间 + 打扫 + 得干干净净",
      },
      {
        id: "de-degree",
        pattern: "打扫 + 得 + 干干净净",
      },
    ],
  },
  {
    id: "s047",
    type: "sentence",
    level: 4,
    topic: "travel",
    zh: "这次旅行给我留下了很深的印象。",
    py: "Zhè cì lǚ xíng gěi wǒ liú xià le hěn shēn de yìn xiàng.",
    vi: [
      "Chuyến du lịch lần này để lại cho tôi ấn tượng rất sâu sắc.",
      "Chuyến đi này đã để lại ấn tượng sâu sắc cho tôi.",
    ],
    en: ["This trip left a deep impression on me.", "This trip made a deep impression on me."],
    words: [
      {
        zh: "旅行",
        py: "lǚ xíng",
        vi: "du lịch",
        en: "travel",
      },
      {
        zh: "留下",
        py: "liú xià",
        vi: "để lại",
        en: "leave behind",
      },
      {
        zh: "深",
        py: "shēn",
        vi: "sâu",
        en: "deep",
      },
      {
        zh: "印象",
        py: "yìn xiàng",
        vi: "ấn tượng",
        en: "impression",
      },
    ],
    grammar: [
      {
        id: "le-done",
        pattern: "留下 + 了 + 很深的印象",
      },
      {
        id: "de-poss",
        pattern: "很深 + 的 + 印象",
      },
    ],
  },
  {
    id: "s048",
    type: "sentence",
    level: 4,
    topic: "work",
    zh: "经理让我明天把计划书交给他。",
    py: "Jīng lǐ ràng wǒ míng tiān bǎ jì huà shū jiāo gěi tā.",
    vi: [
      "Giám đốc bảo tôi ngày mai nộp bản kế hoạch cho ông ấy.",
      "Quản lý bảo tôi ngày mai nộp bản kế hoạch cho anh ấy.",
    ],
    en: [
      "The manager asked me to hand in the plan to him tomorrow.",
      "The manager told me to give him the plan tomorrow.",
    ],
    words: [
      {
        zh: "经理",
        py: "jīng lǐ",
        vi: "giám đốc, quản lý",
        en: "manager",
      },
      {
        zh: "让",
        py: "ràng",
        vi: "bảo, để",
        en: "let, ask",
      },
      {
        zh: "计划书",
        py: "jì huà shū",
        vi: "bản kế hoạch",
        en: "written plan",
      },
      {
        zh: "交给",
        py: "jiāo gěi",
        vi: "nộp cho",
        en: "hand in to",
      },
    ],
    grammar: [
      {
        id: "ba",
        pattern: "我 + 明天 + 把 + 计划书 + 交给他",
      },
      {
        id: "time-first",
        pattern: "明天 đứng trước 把",
      },
    ],
  },
  {
    id: "p001",
    type: "paragraph",
    level: 1,
    topic: "family",
    zh: "我叫小明。我家有四口人：爸爸、妈妈、姐姐和我。爸爸是老师，妈妈是医生。",
    py: "Wǒ jiào Xiǎo Míng. Wǒ jiā yǒu sì kǒu rén: bà ba, mā ma, jiě jie hé wǒ. Bà ba shì lǎo shī, mā ma shì yī shēng.",
    vi: [
      "Tôi tên là Tiểu Minh. Nhà tôi có bốn người: bố, mẹ, chị gái và tôi. Bố tôi là giáo viên, mẹ tôi là bác sĩ.",
      "Tôi là Tiểu Minh. Gia đình tôi có bốn người: bố, mẹ, chị gái và tôi. Bố là giáo viên, mẹ là bác sĩ.",
    ],
    en: [
      "My name is Xiaoming. There are four people in my family: my dad, my mom, my older sister and me. My dad is a teacher and my mom is a doctor.",
    ],
    words: [
      {
        zh: "叫",
        py: "jiào",
        vi: "tên là",
        en: "be called",
      },
      {
        zh: "口",
        py: "kǒu",
        vi: "(lượng từ cho người trong nhà)",
        en: "(measure word)",
      },
      {
        zh: "爸爸",
        py: "bà ba",
        vi: "bố",
        en: "dad",
      },
      {
        zh: "姐姐",
        py: "jiě jie",
        vi: "chị gái",
        en: "older sister",
      },
      {
        zh: "老师",
        py: "lǎo shī",
        vi: "giáo viên",
        en: "teacher",
      },
      {
        zh: "医生",
        py: "yī shēng",
        vi: "bác sĩ",
        en: "doctor",
      },
    ],
    grammar: [
      {
        id: "shi",
        pattern: "爸爸 + 是 + 老师",
      },
      {
        id: "measure",
        pattern: "四 + 口 + 人",
      },
    ],
  },
  {
    id: "p002",
    type: "paragraph",
    level: 1,
    topic: "daily",
    zh: "我每天七点起床，八点去学校。中午我在学校吃饭。晚上我在家看书。",
    py: "Wǒ měi tiān qī diǎn qǐ chuáng, bā diǎn qù xué xiào. Zhōng wǔ wǒ zài xué xiào chī fàn. Wǎn shang wǒ zài jiā kàn shū.",
    vi: [
      "Mỗi ngày tôi dậy lúc bảy giờ, tám giờ đi học. Buổi trưa tôi ăn cơm ở trường. Buổi tối tôi đọc sách ở nhà.",
      "Hằng ngày tôi thức dậy lúc 7 giờ, 8 giờ đến trường. Trưa tôi ăn ở trường. Tối tôi ở nhà đọc sách.",
    ],
    en: [
      "I get up at seven every day and go to school at eight. At noon I eat at school. In the evening I read at home.",
    ],
    words: [
      {
        zh: "起床",
        py: "qǐ chuáng",
        vi: "thức dậy",
        en: "get up",
      },
      {
        zh: "学校",
        py: "xué xiào",
        vi: "trường học",
        en: "school",
      },
      {
        zh: "中午",
        py: "zhōng wǔ",
        vi: "buổi trưa",
        en: "noon",
      },
      {
        zh: "晚上",
        py: "wǎn shang",
        vi: "buổi tối",
        en: "evening",
      },
      {
        zh: "看书",
        py: "kàn shū",
        vi: "đọc sách",
        en: "read",
      },
    ],
    grammar: [
      {
        id: "time-first",
        pattern: "我 + 每天七点 + 起床",
      },
      {
        id: "zai-place",
        pattern: "我 + 在学校 + 吃饭",
      },
    ],
  },
  {
    id: "p003",
    type: "paragraph",
    level: 2,
    topic: "weather",
    zh: "今天天气很好，不冷也不热。我和朋友去公园跑步了。跑步以后，我们一起喝了咖啡。",
    py: "Jīn tiān tiān qì hěn hǎo, bù lěng yě bú rè. Wǒ hé péng you qù gōng yuán pǎo bù le. Pǎo bù yǐ hòu, wǒ men yì qǐ hē le kā fēi.",
    vi: [
      "Hôm nay thời tiết rất đẹp, không lạnh cũng không nóng. Tôi và bạn đã đi chạy bộ ở công viên. Sau khi chạy bộ, chúng tôi cùng uống cà phê.",
      "Hôm nay trời đẹp, không lạnh cũng không nóng. Tôi cùng bạn đến công viên chạy bộ. Chạy xong, chúng tôi cùng nhau uống cà phê.",
    ],
    en: [
      "The weather is nice today, neither cold nor hot. My friend and I went running in the park. After running, we had coffee together.",
    ],
    words: [
      {
        zh: "天气",
        py: "tiān qì",
        vi: "thời tiết",
        en: "weather",
      },
      {
        zh: "热",
        py: "rè",
        vi: "nóng",
        en: "hot",
      },
      {
        zh: "朋友",
        py: "péng you",
        vi: "bạn bè",
        en: "friend",
      },
      {
        zh: "公园",
        py: "gōng yuán",
        vi: "công viên",
        en: "park",
      },
      {
        zh: "以后",
        py: "yǐ hòu",
        vi: "sau khi",
        en: "after",
      },
      {
        zh: "一起",
        py: "yì qǐ",
        vi: "cùng nhau",
        en: "together",
      },
    ],
    grammar: [
      {
        id: "le-done",
        pattern: "去公园跑步 + 了 / 喝 + 了 + 咖啡",
      },
    ],
  },
  {
    id: "p004",
    type: "paragraph",
    level: 2,
    topic: "shopping",
    zh: "昨天我去商店买衣服。那件红色的比这件蓝色的贵，所以我买了蓝色的。",
    py: "Zuó tiān wǒ qù shāng diàn mǎi yī fu. Nà jiàn hóng sè de bǐ zhè jiàn lán sè de guì, suǒ yǐ wǒ mǎi le lán sè de.",
    vi: [
      "Hôm qua tôi đi cửa hàng mua quần áo. Chiếc màu đỏ kia đắt hơn chiếc màu xanh này, nên tôi đã mua chiếc màu xanh.",
      "Hôm qua tôi đến cửa hàng mua quần áo. Cái áo đỏ đắt hơn cái áo xanh nên tôi mua cái màu xanh.",
    ],
    en: [
      "Yesterday I went to a shop to buy clothes. The red one was more expensive than the blue one, so I bought the blue one.",
    ],
    words: [
      {
        zh: "商店",
        py: "shāng diàn",
        vi: "cửa hàng",
        en: "shop",
      },
      {
        zh: "红色",
        py: "hóng sè",
        vi: "màu đỏ",
        en: "red",
      },
      {
        zh: "蓝色",
        py: "lán sè",
        vi: "màu xanh lam",
        en: "blue",
      },
      {
        zh: "贵",
        py: "guì",
        vi: "đắt",
        en: "expensive",
      },
      {
        zh: "所以",
        py: "suǒ yǐ",
        vi: "nên",
        en: "so",
      },
    ],
    grammar: [
      {
        id: "bi",
        pattern: "那件红色的 + 比 + 这件蓝色的 + 贵",
      },
      {
        id: "le-done",
        pattern: "买 + 了 + 蓝色的",
      },
    ],
  },
  {
    id: "p005",
    type: "paragraph",
    level: 3,
    topic: "school",
    zh: "我学汉语已经一年了。虽然汉字很难，但是我觉得很有意思。现在我的汉语越来越好了。",
    py: "Wǒ xué Hàn yǔ yǐ jīng yì nián le. Suī rán Hàn zì hěn nán, dàn shì wǒ jué de hěn yǒu yì si. Xiàn zài wǒ de Hàn yǔ yuè lái yuè hǎo le.",
    vi: [
      "Tôi học tiếng Trung đã được một năm rồi. Tuy chữ Hán rất khó nhưng tôi thấy rất thú vị. Bây giờ tiếng Trung của tôi ngày càng tốt hơn.",
      "Tôi đã học tiếng Trung được một năm. Mặc dù chữ Hán khó nhưng tôi thấy rất hay. Giờ tiếng Trung của tôi càng ngày càng giỏi.",
    ],
    en: [
      "I have been learning Chinese for a year. Although Chinese characters are hard, I find them very interesting. Now my Chinese is getting better and better.",
    ],
    words: [
      {
        zh: "已经",
        py: "yǐ jīng",
        vi: "đã",
        en: "already",
      },
      {
        zh: "汉字",
        py: "Hàn zì",
        vi: "chữ Hán",
        en: "Chinese characters",
      },
      {
        zh: "难",
        py: "nán",
        vi: "khó",
        en: "difficult",
      },
      {
        zh: "觉得",
        py: "jué de",
        vi: "cảm thấy",
        en: "feel, think",
      },
      {
        zh: "有意思",
        py: "yǒu yì si",
        vi: "thú vị",
        en: "interesting",
      },
    ],
    grammar: [
      {
        id: "suiran-danshi",
        pattern: "虽然 + 汉字很难，但是 + 我觉得很有意思",
      },
      {
        id: "yuelaiyue",
        pattern: "我的汉语 + 越来越 + 好了",
      },
    ],
  },
  {
    id: "p006",
    type: "paragraph",
    level: 3,
    topic: "travel",
    zh: "如果周末天气好，我们就去海边玩儿。我们可以一边游泳一边晒太阳。",
    py: "Rú guǒ zhōu mò tiān qì hǎo, wǒ men jiù qù hǎi biān wánr. Wǒ men kě yǐ yì biān yóu yǒng yì biān shài tài yáng.",
    vi: [
      "Nếu cuối tuần thời tiết đẹp thì chúng tôi sẽ ra biển chơi. Chúng tôi có thể vừa bơi vừa tắm nắng.",
      "Nếu cuối tuần trời đẹp, chúng ta sẽ đi biển chơi. Chúng ta có thể vừa bơi vừa phơi nắng.",
    ],
    en: ["If the weather is good this weekend, we will go to the beach. We can swim and sunbathe at the same time."],
    words: [
      {
        zh: "周末",
        py: "zhōu mò",
        vi: "cuối tuần",
        en: "weekend",
      },
      {
        zh: "海边",
        py: "hǎi biān",
        vi: "bờ biển",
        en: "seaside",
      },
      {
        zh: "玩儿",
        py: "wánr",
        vi: "chơi",
        en: "have fun",
      },
      {
        zh: "游泳",
        py: "yóu yǒng",
        vi: "bơi",
        en: "swim",
      },
      {
        zh: "晒太阳",
        py: "shài tài yáng",
        vi: "tắm nắng",
        en: "sunbathe",
      },
    ],
    grammar: [
      {
        id: "ruguo-jiu",
        pattern: "如果 + 周末天气好，我们 + 就 + 去海边玩儿",
      },
      {
        id: "yibian",
        pattern: "一边 + 游泳 + 一边 + 晒太阳",
      },
      {
        id: "hui-neng",
        pattern: "我们 + 可以 + 一边…",
      },
    ],
  },
  {
    id: "p007",
    type: "paragraph",
    level: 3,
    topic: "daily",
    zh: "我回到家的时候，发现钥匙被我忘在办公室了。我只好给妈妈打电话，请她把门打开。",
    py: "Wǒ huí dào jiā de shí hou, fā xiàn yào shi bèi wǒ wàng zài bàn gōng shì le. Wǒ zhǐ hǎo gěi mā ma dǎ diàn huà, qǐng tā bǎ mén dǎ kāi.",
    vi: [
      "Khi về đến nhà, tôi phát hiện mình đã để quên chìa khóa ở văn phòng. Tôi đành gọi điện cho mẹ, nhờ mẹ mở cửa.",
      "Lúc về tới nhà tôi mới biết mình bỏ quên chìa khóa ở văn phòng. Tôi đành phải gọi cho mẹ nhờ mẹ mở cửa giúp.",
    ],
    en: [
      "When I got home, I found that I had left my keys at the office. I had no choice but to call my mom and ask her to open the door.",
    ],
    words: [
      {
        zh: "的时候",
        py: "de shí hou",
        vi: "khi, lúc",
        en: "when",
      },
      {
        zh: "发现",
        py: "fā xiàn",
        vi: "phát hiện",
        en: "discover",
      },
      {
        zh: "钥匙",
        py: "yào shi",
        vi: "chìa khóa",
        en: "key",
      },
      {
        zh: "忘",
        py: "wàng",
        vi: "quên",
        en: "forget",
      },
      {
        zh: "办公室",
        py: "bàn gōng shì",
        vi: "văn phòng",
        en: "office",
      },
      {
        zh: "只好",
        py: "zhǐ hǎo",
        vi: "đành phải",
        en: "have no choice but",
      },
      {
        zh: "打开",
        py: "dǎ kāi",
        vi: "mở ra",
        en: "open",
      },
    ],
    grammar: [
      {
        id: "bei",
        pattern: "钥匙 + 被 + 我 + 忘在办公室 + 了",
      },
      {
        id: "ba",
        pattern: "请她 + 把 + 门 + 打开",
      },
    ],
  },
  {
    id: "p008",
    type: "paragraph",
    level: 4,
    topic: "work",
    zh: "为了找到更好的工作，他每天下班以后都去学英语。虽然很累，但是他觉得很值得。",
    py: "Wèi le zhǎo dào gèng hǎo de gōng zuò, tā měi tiān xià bān yǐ hòu dōu qù xué Yīng yǔ. Suī rán hěn lèi, dàn shì tā jué de hěn zhí de.",
    vi: [
      "Để tìm được công việc tốt hơn, ngày nào tan làm anh ấy cũng đi học tiếng Anh. Tuy rất mệt nhưng anh ấy thấy rất đáng.",
      "Để kiếm được việc tốt hơn, mỗi ngày sau khi tan ca anh ấy đều đi học tiếng Anh. Mặc dù mệt nhưng anh ấy cảm thấy rất xứng đáng.",
    ],
    en: [
      "In order to find a better job, he goes to study English every day after work. Although it is tiring, he thinks it is worth it.",
    ],
    words: [
      {
        zh: "为了",
        py: "wèi le",
        vi: "để",
        en: "in order to",
      },
      {
        zh: "找到",
        py: "zhǎo dào",
        vi: "tìm được",
        en: "find",
      },
      {
        zh: "下班",
        py: "xià bān",
        vi: "tan làm",
        en: "get off work",
      },
      {
        zh: "英语",
        py: "Yīng yǔ",
        vi: "tiếng Anh",
        en: "English",
      },
      {
        zh: "累",
        py: "lèi",
        vi: "mệt",
        en: "tired",
      },
      {
        zh: "值得",
        py: "zhí de",
        vi: "đáng",
        en: "worth it",
      },
    ],
    grammar: [
      {
        id: "suiran-danshi",
        pattern: "虽然 + 很累，但是 + 他觉得很值得",
      },
      {
        id: "time-first",
        pattern: "他 + 每天下班以后 + 都 + 去学英语",
      },
    ],
  },
];

export const T_ITEM_BY_ID = new Map(T_ITEMS.map((i) => [i.id, i]));
