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

  {
    id: "p009",
    type: "paragraph",
    level: 1,
    topic: "food",
    zh: "我很喜欢吃中国菜。我家旁边有一个中国饭馆。我和朋友常常去那儿吃饭。",
    py: "Wǒ hěn xǐ huan chī Zhōng guó cài. Wǒ jiā páng biān yǒu yí gè Zhōng guó fàn guǎn. Wǒ hé péng you cháng cháng qù nàr chī fàn.",
    vi: [
      "Tôi rất thích ăn món Trung Quốc. Bên cạnh nhà tôi có một nhà hàng Trung Quốc. Tôi và bạn thường đến đó ăn cơm.",
    ],
    en: [
      "I really like Chinese food. There is a Chinese restaurant next to my home. My friends and I often eat there.",
    ],
    words: [
      {
        zh: "中国菜",
        py: "Zhōng guó cài",
        vi: "món ăn Trung Quốc",
        en: "Chinese food",
      },
      {
        zh: "旁边",
        py: "páng biān",
        vi: "bên cạnh",
        en: "next to",
      },
      {
        zh: "饭馆",
        py: "fàn guǎn",
        vi: "nhà hàng, quán ăn",
        en: "restaurant",
      },
      {
        zh: "常常",
        py: "cháng cháng",
        vi: "thường, hay",
        en: "often",
      },
      {
        zh: "那儿",
        py: "nàr",
        vi: "ở đó",
        en: "there",
      },
    ],
    grammar: [
      {
        id: "measure",
        pattern: "一 + 个 + 中国饭馆",
      },
      {
        id: "time-first",
        pattern: "我和朋友 + 常常 + 去那儿吃饭",
      },
    ],
  },
  {
    id: "p010",
    type: "paragraph",
    level: 1,
    topic: "weather",
    zh: "今天天气不好，很冷。下午下雨了。我不想出去，我想在家看电视。",
    py: "Jīn tiān tiān qì bù hǎo, hěn lěng. Xià wǔ xià yǔ le. Wǒ bù xiǎng chū qù, wǒ xiǎng zài jiā kàn diàn shì.",
    vi: [
      "Hôm nay thời tiết không đẹp, rất lạnh. Buổi chiều trời mưa. Tôi không muốn ra ngoài, tôi muốn ở nhà xem tivi.",
    ],
    en: [
      "The weather is bad today, it is very cold. It rained in the afternoon. I don't want to go out; I want to watch TV at home.",
    ],
    words: [
      {
        zh: "天气",
        py: "tiān qì",
        vi: "thời tiết",
        en: "weather",
      },
      {
        zh: "下雨",
        py: "xià yǔ",
        vi: "mưa",
        en: "rain",
      },
      {
        zh: "出去",
        py: "chū qù",
        vi: "ra ngoài",
        en: "go out",
      },
      {
        zh: "看电视",
        py: "kàn diàn shì",
        vi: "xem tivi",
        en: "watch TV",
      },
    ],
    grammar: [
      {
        id: "xiang-yao",
        pattern: "我 + 不想 + 出去 / 我 + 想 + 在家看电视",
      },
      {
        id: "zai-place",
        pattern: "在家 + 看电视",
      },
    ],
  },
  {
    id: "p011",
    type: "paragraph",
    level: 1,
    topic: "shopping",
    zh: "我想买一件衣服。这件衣服很漂亮，多少钱？一百块。太贵了！",
    py: "Wǒ xiǎng mǎi yí jiàn yī fu. Zhè jiàn yī fu hěn piào liang, duō shǎo qián? Yì bǎi kuài. Tài guì le!",
    vi: [
      "Tôi muốn mua một bộ quần áo. Bộ quần áo này rất đẹp, bao nhiêu tiền? Một trăm tệ. Đắt quá!",
      "Tôi muốn mua một chiếc áo. Chiếc áo này rất đẹp, bao nhiêu tiền? Một trăm tệ. Đắt quá!",
    ],
    en: [
      "I want to buy a piece of clothing. This one is very pretty. How much is it? One hundred yuan. That's too expensive!",
    ],
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
        zh: "漂亮",
        py: "piào liang",
        vi: "đẹp",
        en: "pretty",
      },
      {
        zh: "块",
        py: "kuài",
        vi: "tệ (tiền)",
        en: "yuan",
      },
      {
        zh: "太…了",
        py: "tài … le",
        vi: "quá",
        en: "too",
      },
    ],
    grammar: [
      {
        id: "measure",
        pattern: "一 + 件 + 衣服 / 这 + 件 + 衣服",
      },
      {
        id: "xiang-yao",
        pattern: "我 + 想 + 买",
      },
    ],
  },
  {
    id: "p012",
    type: "paragraph",
    level: 1,
    topic: "school",
    zh: "我是大学生。我在北京大学学习汉语。我的老师是中国人，她很好。",
    py: "Wǒ shì dà xué shēng. Wǒ zài Běi jīng Dà xué xué xí Hàn yǔ. Wǒ de lǎo shī shì Zhōng guó rén, tā hěn hǎo.",
    vi: [
      "Tôi là sinh viên đại học. Tôi học tiếng Trung ở Đại học Bắc Kinh. Giáo viên của tôi là người Trung Quốc, cô ấy rất tốt.",
    ],
    en: [
      "I am a university student. I study Chinese at Peking University. My teacher is Chinese, and she is very nice.",
    ],
    words: [
      {
        zh: "大学生",
        py: "dà xué shēng",
        vi: "sinh viên đại học",
        en: "university student",
      },
      {
        zh: "北京大学",
        py: "Běi jīng Dà xué",
        vi: "Đại học Bắc Kinh",
        en: "Peking University",
      },
      {
        zh: "学习",
        py: "xué xí",
        vi: "học",
        en: "study",
      },
      {
        zh: "老师",
        py: "lǎo shī",
        vi: "giáo viên",
        en: "teacher",
      },
    ],
    grammar: [
      {
        id: "shi",
        pattern: "我 + 是 + 大学生",
      },
      {
        id: "zai-place",
        pattern: "我 + 在北京大学 + 学习汉语",
      },
      {
        id: "de-poss",
        pattern: "我 + 的 + 老师",
      },
    ],
  },
  {
    id: "p013",
    type: "paragraph",
    level: 1,
    topic: "work",
    zh: "我爸爸在医院工作，他是医生。他每天都很忙，晚上九点才回家。",
    py: "Wǒ bà ba zài yī yuàn gōng zuò, tā shì yī shēng. Tā měi tiān dōu hěn máng, wǎn shang jiǔ diǎn cái huí jiā.",
    vi: ["Bố tôi làm việc ở bệnh viện, ông ấy là bác sĩ. Ngày nào ông ấy cũng rất bận, chín giờ tối mới về nhà."],
    en: [
      "My father works at a hospital; he is a doctor. He is busy every day and only gets home at nine in the evening.",
    ],
    words: [
      {
        zh: "医院",
        py: "yī yuàn",
        vi: "bệnh viện",
        en: "hospital",
      },
      {
        zh: "医生",
        py: "yī shēng",
        vi: "bác sĩ",
        en: "doctor",
      },
      {
        zh: "忙",
        py: "máng",
        vi: "bận",
        en: "busy",
      },
      {
        zh: "才",
        py: "cái",
        vi: "mới (muộn)",
        en: "only then",
      },
      {
        zh: "回家",
        py: "huí jiā",
        vi: "về nhà",
        en: "go home",
      },
    ],
    grammar: [
      {
        id: "zai-place",
        pattern: "我爸爸 + 在医院 + 工作",
      },
      {
        id: "shi",
        pattern: "他 + 是 + 医生",
      },
      {
        id: "time-first",
        pattern: "晚上九点 + 才 + 回家",
      },
    ],
  },
  {
    id: "p014",
    type: "paragraph",
    level: 1,
    topic: "hobby",
    zh: "我喜欢看书，也喜欢看电影。星期六我和朋友一起去看电影。",
    py: "Wǒ xǐ huan kàn shū, yě xǐ huan kàn diàn yǐng. Xīng qī liù wǒ hé péng you yì qǐ qù kàn diàn yǐng.",
    vi: [
      "Tôi thích đọc sách, cũng thích xem phim. Thứ bảy tôi cùng bạn đi xem phim.",
      "Tôi thích đọc sách và cũng thích xem phim. Thứ bảy tôi và bạn cùng đi xem phim.",
    ],
    en: [
      "I like reading and I also like watching movies. On Saturday my friend and I are going to see a movie together.",
    ],
    words: [
      {
        zh: "看书",
        py: "kàn shū",
        vi: "đọc sách",
        en: "read",
      },
      {
        zh: "也",
        py: "yě",
        vi: "cũng",
        en: "also",
      },
      {
        zh: "看电影",
        py: "kàn diàn yǐng",
        vi: "xem phim",
        en: "watch a movie",
      },
      {
        zh: "星期六",
        py: "xīng qī liù",
        vi: "thứ bảy",
        en: "Saturday",
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
        id: "time-first",
        pattern: "星期六 + 我和朋友 + 一起去看电影",
      },
    ],
  },
  {
    id: "p015",
    type: "paragraph",
    level: 2,
    topic: "travel",
    zh: "我去过上海，没去过北京。听说北京很大，也很漂亮。明年我想去北京旅游。",
    py: "Wǒ qù guo Shàng hǎi, méi qù guo Běi jīng. Tīng shuō Běi jīng hěn dà, yě hěn piào liang. Míng nián wǒ xiǎng qù Běi jīng lǚ yóu.",
    vi: [
      "Tôi đã từng đến Thượng Hải, chưa từng đến Bắc Kinh. Nghe nói Bắc Kinh rất lớn, cũng rất đẹp. Năm sau tôi muốn đi du lịch Bắc Kinh.",
    ],
    en: [
      "I have been to Shanghai, but I have never been to Beijing. I hear Beijing is very big and beautiful. Next year I want to travel to Beijing.",
    ],
    words: [
      {
        zh: "上海",
        py: "Shàng hǎi",
        vi: "Thượng Hải",
        en: "Shanghai",
      },
      {
        zh: "听说",
        py: "tīng shuō",
        vi: "nghe nói",
        en: "I hear that",
      },
      {
        zh: "明年",
        py: "míng nián",
        vi: "năm sau",
        en: "next year",
      },
      {
        zh: "旅游",
        py: "lǚ yóu",
        vi: "du lịch",
        en: "travel",
      },
    ],
    grammar: [
      {
        id: "guo",
        pattern: "我 + 去 + 过 + 上海 / 没 + 去 + 过 + 北京",
      },
      {
        id: "xiang-yao",
        pattern: "我 + 想 + 去北京旅游",
      },
    ],
  },
  {
    id: "p016",
    type: "paragraph",
    level: 2,
    topic: "health",
    zh: "昨天我生病了，没去上班。医生让我多休息，多喝水。今天我觉得好多了。",
    py: "Zuó tiān wǒ shēng bìng le, méi qù shàng bān. Yī shēng ràng wǒ duō xiū xi, duō hē shuǐ. Jīn tiān wǒ jué de hǎo duō le.",
    vi: [
      "Hôm qua tôi bị ốm, không đi làm. Bác sĩ bảo tôi nghỉ ngơi nhiều, uống nhiều nước. Hôm nay tôi thấy khỏe hơn nhiều rồi.",
    ],
    en: [
      "Yesterday I was sick and didn't go to work. The doctor told me to rest more and drink more water. Today I feel much better.",
    ],
    words: [
      {
        zh: "生病",
        py: "shēng bìng",
        vi: "bị ốm",
        en: "get sick",
      },
      {
        zh: "上班",
        py: "shàng bān",
        vi: "đi làm",
        en: "go to work",
      },
      {
        zh: "让",
        py: "ràng",
        vi: "bảo, để",
        en: "let, tell",
      },
      {
        zh: "休息",
        py: "xiū xi",
        vi: "nghỉ ngơi",
        en: "rest",
      },
      {
        zh: "觉得",
        py: "jué de",
        vi: "cảm thấy",
        en: "feel",
      },
    ],
    grammar: [
      {
        id: "le-done",
        pattern: "我生病 + 了 / 没 + 去上班",
      },
    ],
  },
  {
    id: "p017",
    type: "paragraph",
    level: 2,
    topic: "family",
    zh: "我姐姐比我大三岁。她唱歌唱得很好，也喜欢跳舞。我们的关系非常好。",
    py: "Wǒ jiě jie bǐ wǒ dà sān suì. Tā chàng gē chàng de hěn hǎo, yě xǐ huan tiào wǔ. Wǒ men de guān xi fēi cháng hǎo.",
    vi: ["Chị gái tôi hơn tôi ba tuổi. Chị ấy hát rất hay, cũng thích nhảy múa. Quan hệ của chúng tôi rất tốt."],
    en: [
      "My older sister is three years older than me. She sings very well and also likes dancing. We get along very well.",
    ],
    words: [
      {
        zh: "岁",
        py: "suì",
        vi: "tuổi",
        en: "years old",
      },
      {
        zh: "唱歌",
        py: "chàng gē",
        vi: "hát",
        en: "sing",
      },
      {
        zh: "跳舞",
        py: "tiào wǔ",
        vi: "nhảy múa",
        en: "dance",
      },
      {
        zh: "关系",
        py: "guān xi",
        vi: "quan hệ",
        en: "relationship",
      },
      {
        zh: "非常",
        py: "fēi cháng",
        vi: "rất",
        en: "very",
      },
    ],
    grammar: [
      {
        id: "bi",
        pattern: "我姐姐 + 比 + 我 + 大 + 三岁 (số lượng đứng sau tính từ)",
      },
      {
        id: "de-degree",
        pattern: "唱歌 + 唱 + 得 + 很好",
      },
    ],
  },
  {
    id: "p018",
    type: "paragraph",
    level: 2,
    topic: "daily",
    zh: "我正在做作业，妈妈叫我去吃饭。我告诉她我快要做完了。",
    py: "Wǒ zhèng zài zuò zuò yè, mā ma jiào wǒ qù chī fàn. Wǒ gào su tā wǒ kuài yào zuò wán le.",
    vi: [
      "Tôi đang làm bài tập thì mẹ gọi tôi đi ăn cơm. Tôi nói với mẹ là tôi sắp làm xong rồi.",
      "Tôi đang làm bài tập, mẹ gọi tôi đi ăn cơm. Tôi bảo mẹ là tôi sắp làm xong rồi.",
    ],
    en: ["I was doing my homework when my mom called me to eat. I told her I was almost finished."],
    words: [
      {
        zh: "正在",
        py: "zhèng zài",
        vi: "đang",
        en: "(in progress)",
      },
      {
        zh: "做作业",
        py: "zuò zuò yè",
        vi: "làm bài tập",
        en: "do homework",
      },
      {
        zh: "叫",
        py: "jiào",
        vi: "gọi",
        en: "call",
      },
      {
        zh: "告诉",
        py: "gào su",
        vi: "nói cho biết",
        en: "tell",
      },
      {
        zh: "做完",
        py: "zuò wán",
        vi: "làm xong",
        en: "finish",
      },
    ],
    grammar: [
      {
        id: "zhengzai",
        pattern: "我 + 正在 + 做作业",
      },
      {
        id: "kuaiyao-le",
        pattern: "我 + 快要 + 做完 + 了",
      },
    ],
  },
  {
    id: "p019",
    type: "paragraph",
    level: 2,
    topic: "work",
    zh: "我从星期一到星期五上班。每天早上我坐公共汽车去公司。周末我不工作，在家休息。",
    py: "Wǒ cóng xīng qī yī dào xīng qī wǔ shàng bān. Měi tiān zǎo shang wǒ zuò gōng gòng qì chē qù gōng sī. Zhōu mò wǒ bù gōng zuò, zài jiā xiū xi.",
    vi: [
      "Tôi đi làm từ thứ hai đến thứ sáu. Mỗi sáng tôi đi xe buýt đến công ty. Cuối tuần tôi không làm việc, ở nhà nghỉ ngơi.",
    ],
    en: [
      "I work from Monday to Friday. Every morning I take the bus to the office. At weekends I don't work; I rest at home.",
    ],
    words: [
      {
        zh: "星期一",
        py: "xīng qī yī",
        vi: "thứ hai",
        en: "Monday",
      },
      {
        zh: "星期五",
        py: "xīng qī wǔ",
        vi: "thứ sáu",
        en: "Friday",
      },
      {
        zh: "公共汽车",
        py: "gōng gòng qì chē",
        vi: "xe buýt",
        en: "bus",
      },
      {
        zh: "公司",
        py: "gōng sī",
        vi: "công ty",
        en: "company",
      },
      {
        zh: "周末",
        py: "zhōu mò",
        vi: "cuối tuần",
        en: "weekend",
      },
    ],
    grammar: [
      {
        id: "cong-dao",
        pattern: "我 + 从星期一 + 到星期五 + 上班",
      },
      {
        id: "time-first",
        pattern: "每天早上 + 我 + 坐公共汽车去公司",
      },
    ],
  },
  {
    id: "p020",
    type: "paragraph",
    level: 2,
    topic: "food",
    zh: "这家饭馆的菜很好吃，但是有点儿贵。我们点了三个菜和两碗米饭。",
    py: "Zhè jiā fàn guǎn de cài hěn hǎo chī, dàn shì yǒu diǎnr guì. Wǒ men diǎn le sān ge cài hé liǎng wǎn mǐ fàn.",
    vi: [
      "Món ăn của nhà hàng này rất ngon nhưng hơi đắt. Chúng tôi đã gọi ba món và hai bát cơm.",
      "Đồ ăn ở quán này rất ngon nhưng hơi đắt. Chúng tôi gọi ba món và hai bát cơm.",
    ],
    en: [
      "The food in this restaurant is delicious, but a little expensive. We ordered three dishes and two bowls of rice.",
    ],
    words: [
      {
        zh: "饭馆",
        py: "fàn guǎn",
        vi: "nhà hàng",
        en: "restaurant",
      },
      {
        zh: "好吃",
        py: "hǎo chī",
        vi: "ngon",
        en: "delicious",
      },
      {
        zh: "有点儿",
        py: "yǒu diǎnr",
        vi: "hơi, một chút",
        en: "a little",
      },
      {
        zh: "点",
        py: "diǎn",
        vi: "gọi (món)",
        en: "order",
      },
      {
        zh: "碗",
        py: "wǎn",
        vi: "bát",
        en: "bowl",
      },
    ],
    grammar: [
      {
        id: "le-done",
        pattern: "我们 + 点 + 了 + 三个菜",
      },
      {
        id: "measure",
        pattern: "两 + 碗 + 米饭 / 这 + 家 + 饭馆",
      },
    ],
  },
  {
    id: "p021",
    type: "paragraph",
    level: 3,
    topic: "hobby",
    zh: "我对画画儿很感兴趣。周末我常常一边听音乐一边画画儿。我的画儿越来越好了。",
    py: "Wǒ duì huà huàr hěn gǎn xìng qù. Zhōu mò wǒ cháng cháng yì biān tīng yīn yuè yì biān huà huàr. Wǒ de huàr yuè lái yuè hǎo le.",
    vi: [
      "Tôi rất hứng thú với vẽ tranh. Cuối tuần tôi thường vừa nghe nhạc vừa vẽ tranh. Tranh của tôi ngày càng đẹp hơn.",
    ],
    en: [
      "I am very interested in painting. At weekends I often listen to music while I paint. My paintings are getting better and better.",
    ],
    words: [
      {
        zh: "画画儿",
        py: "huà huàr",
        vi: "vẽ tranh",
        en: "draw, paint",
      },
      {
        zh: "感兴趣",
        py: "gǎn xìng qù",
        vi: "hứng thú",
        en: "be interested",
      },
      {
        zh: "一边…一边…",
        py: "yì biān … yì biān …",
        vi: "vừa … vừa …",
        en: "while",
      },
      {
        zh: "画儿",
        py: "huàr",
        vi: "bức tranh",
        en: "painting",
      },
    ],
    grammar: [
      {
        id: "dui-ganxingqu",
        pattern: "我 + 对 + 画画儿 + 很 + 感兴趣",
      },
      {
        id: "yibian",
        pattern: "一边 + 听音乐 + 一边 + 画画儿",
      },
      {
        id: "yuelaiyue",
        pattern: "我的画儿 + 越来越 + 好了",
      },
    ],
  },
  {
    id: "p022",
    type: "paragraph",
    level: 3,
    topic: "weather",
    zh: "虽然外面在下雪，但是房间里很暖和。我们一边喝茶一边聊天，非常舒服。",
    py: "Suī rán wài miàn zài xià xuě, dàn shì fáng jiān li hěn nuǎn huo. Wǒ men yì biān hē chá yì biān liáo tiān, fēi cháng shū fu.",
    vi: [
      "Tuy bên ngoài đang có tuyết rơi nhưng trong phòng rất ấm áp. Chúng tôi vừa uống trà vừa trò chuyện, rất dễ chịu.",
    ],
    en: [
      "Although it is snowing outside, it is warm in the room. We chat while drinking tea, and it is very comfortable.",
    ],
    words: [
      {
        zh: "外面",
        py: "wài miàn",
        vi: "bên ngoài",
        en: "outside",
      },
      {
        zh: "下雪",
        py: "xià xuě",
        vi: "tuyết rơi",
        en: "snow",
      },
      {
        zh: "暖和",
        py: "nuǎn huo",
        vi: "ấm áp",
        en: "warm",
      },
      {
        zh: "聊天",
        py: "liáo tiān",
        vi: "trò chuyện",
        en: "chat",
      },
      {
        zh: "舒服",
        py: "shū fu",
        vi: "dễ chịu",
        en: "comfortable",
      },
    ],
    grammar: [
      {
        id: "suiran-danshi",
        pattern: "虽然 + 外面在下雪，但是 + 房间里很暖和",
      },
      {
        id: "yibian",
        pattern: "一边 + 喝茶 + 一边 + 聊天",
      },
    ],
  },
  {
    id: "p023",
    type: "paragraph",
    level: 3,
    topic: "shopping",
    zh: "我把新买的手机忘在出租车上了。幸好司机很好，他把手机送回来了。",
    py: "Wǒ bǎ xīn mǎi de shǒu jī wàng zài chū zū chē shang le. Xìng hǎo sī jī hěn hǎo, tā bǎ shǒu jī sòng huí lai le.",
    vi: [
      "Tôi đã để quên chiếc điện thoại mới mua trên taxi. May mà tài xế rất tốt, anh ấy đã mang điện thoại trả lại.",
    ],
    en: ["I left my newly bought phone in a taxi. Luckily the driver was very kind and brought the phone back."],
    words: [
      {
        zh: "新买的",
        py: "xīn mǎi de",
        vi: "mới mua",
        en: "newly bought",
      },
      {
        zh: "忘",
        py: "wàng",
        vi: "quên",
        en: "forget",
      },
      {
        zh: "出租车",
        py: "chū zū chē",
        vi: "taxi",
        en: "taxi",
      },
      {
        zh: "幸好",
        py: "xìng hǎo",
        vi: "may mà",
        en: "luckily",
      },
      {
        zh: "司机",
        py: "sī jī",
        vi: "tài xế",
        en: "driver",
      },
      {
        zh: "送回来",
        py: "sòng huí lai",
        vi: "mang trả lại",
        en: "bring back",
      },
    ],
    grammar: [
      {
        id: "ba",
        pattern: "我 + 把 + 新买的手机 + 忘在出租车上 + 了",
      },
      {
        id: "de-poss",
        pattern: "新买 + 的 + 手机",
      },
    ],
  },
  {
    id: "p024",
    type: "paragraph",
    level: 3,
    topic: "school",
    zh: "除了汉语以外，我还学习英语。如果有时间，我就去图书馆看书。",
    py: "Chú le Hàn yǔ yǐ wài, wǒ hái xué xí Yīng yǔ. Rú guǒ yǒu shí jiān, wǒ jiù qù tú shū guǎn kàn shū.",
    vi: ["Ngoài tiếng Trung ra, tôi còn học tiếng Anh. Nếu có thời gian thì tôi đi thư viện đọc sách."],
    en: ["Besides Chinese, I also study English. If I have time, I go to the library to read."],
    words: [
      {
        zh: "除了…以外",
        py: "chú le … yǐ wài",
        vi: "ngoài … ra",
        en: "besides",
      },
      {
        zh: "还",
        py: "hái",
        vi: "còn",
        en: "also",
      },
      {
        zh: "英语",
        py: "Yīng yǔ",
        vi: "tiếng Anh",
        en: "English",
      },
      {
        zh: "时间",
        py: "shí jiān",
        vi: "thời gian",
        en: "time",
      },
      {
        zh: "图书馆",
        py: "tú shū guǎn",
        vi: "thư viện",
        en: "library",
      },
    ],
    grammar: [
      {
        id: "chule",
        pattern: "除了 + 汉语 + 以外，我 + 还 + 学习英语",
      },
      {
        id: "ruguo-jiu",
        pattern: "如果 + 有时间，我 + 就 + 去图书馆看书",
      },
    ],
  },
  {
    id: "p025",
    type: "paragraph",
    level: 3,
    topic: "health",
    zh: "医生说我太累了，应该多休息。所以我决定每天早点儿睡觉，少玩儿手机。",
    py: "Yī shēng shuō wǒ tài lèi le, yīng gāi duō xiū xi. Suǒ yǐ wǒ jué dìng měi tiān zǎo diǎnr shuì jiào, shǎo wánr shǒu jī.",
    vi: [
      "Bác sĩ nói tôi mệt quá, nên nghỉ ngơi nhiều hơn. Vì vậy tôi quyết định mỗi ngày đi ngủ sớm hơn một chút, ít chơi điện thoại hơn.",
    ],
    en: [
      "The doctor said I was too tired and should rest more. So I decided to go to bed a bit earlier every day and spend less time on my phone.",
    ],
    words: [
      {
        zh: "太…了",
        py: "tài … le",
        vi: "quá",
        en: "too",
      },
      {
        zh: "应该",
        py: "yīng gāi",
        vi: "nên",
        en: "should",
      },
      {
        zh: "决定",
        py: "jué dìng",
        vi: "quyết định",
        en: "decide",
      },
      {
        zh: "早点儿",
        py: "zǎo diǎnr",
        vi: "sớm một chút",
        en: "a bit earlier",
      },
      {
        zh: "睡觉",
        py: "shuì jiào",
        vi: "đi ngủ",
        en: "sleep",
      },
      {
        zh: "少",
        py: "shǎo",
        vi: "ít",
        en: "less",
      },
    ],
    grammar: [
      {
        id: "hui-neng",
        pattern: "我 + 应该 + 多休息",
      },
      {
        id: "time-first",
        pattern: "每天 + 早点儿 + 睡觉",
      },
    ],
  },
  {
    id: "p026",
    type: "paragraph",
    level: 3,
    topic: "family",
    zh: "我的自行车被弟弟骑走了。我只好走路去学校，差点儿迟到了。",
    py: "Wǒ de zì xíng chē bèi dì di qí zǒu le. Wǒ zhǐ hǎo zǒu lù qù xué xiào, chà diǎnr chí dào le.",
    vi: ["Chiếc xe đạp của tôi bị em trai đạp đi mất rồi. Tôi đành đi bộ đến trường, suýt nữa thì muộn."],
    en: ["My younger brother rode off on my bike. I had to walk to school and was almost late."],
    words: [
      {
        zh: "自行车",
        py: "zì xíng chē",
        vi: "xe đạp",
        en: "bicycle",
      },
      {
        zh: "被",
        py: "bèi",
        vi: "bị",
        en: "(passive)",
      },
      {
        zh: "骑走",
        py: "qí zǒu",
        vi: "đạp đi mất",
        en: "ride away",
      },
      {
        zh: "只好",
        py: "zhǐ hǎo",
        vi: "đành phải",
        en: "have to",
      },
      {
        zh: "走路",
        py: "zǒu lù",
        vi: "đi bộ",
        en: "walk",
      },
      {
        zh: "差点儿",
        py: "chà diǎnr",
        vi: "suýt nữa",
        en: "almost",
      },
      {
        zh: "迟到",
        py: "chí dào",
        vi: "đến muộn",
        en: "be late",
      },
    ],
    grammar: [
      {
        id: "bei",
        pattern: "我的自行车 + 被 + 弟弟 + 骑走 + 了",
      },
    ],
  },
  {
    id: "p027",
    type: "paragraph",
    level: 4,
    topic: "travel",
    zh: "这次去云南旅行，我们不但看到了美丽的风景，而且认识了很多新朋友。",
    py: "Zhè cì qù Yún nán lǚ xíng, wǒ men bú dàn kàn dào le měi lì de fēng jǐng, ér qiě rèn shi le hěn duō xīn péng you.",
    vi: [
      "Chuyến du lịch Vân Nam lần này, chúng tôi không những được ngắm phong cảnh đẹp mà còn làm quen được nhiều bạn mới.",
    ],
    en: ["On this trip to Yunnan, we not only saw beautiful scenery but also made many new friends."],
    words: [
      {
        zh: "云南",
        py: "Yún nán",
        vi: "Vân Nam",
        en: "Yunnan",
      },
      {
        zh: "不但…而且…",
        py: "bú dàn … ér qiě …",
        vi: "không những … mà còn …",
        en: "not only … but also …",
      },
      {
        zh: "美丽",
        py: "měi lì",
        vi: "đẹp",
        en: "beautiful",
      },
      {
        zh: "风景",
        py: "fēng jǐng",
        vi: "phong cảnh",
        en: "scenery",
      },
      {
        zh: "认识",
        py: "rèn shi",
        vi: "quen biết",
        en: "get to know",
      },
    ],
    grammar: [
      {
        id: "le-done",
        pattern: "看到 + 了 + 美丽的风景 / 认识 + 了 + 很多新朋友",
      },
      {
        id: "de-poss",
        pattern: "美丽 + 的 + 风景",
      },
    ],
  },
  {
    id: "p028",
    type: "paragraph",
    level: 4,
    topic: "work",
    zh: "只要大家一起努力，这个问题就一定能解决。经理对我们的计划非常满意。",
    py: "Zhǐ yào dà jiā yì qǐ nǔ lì, zhè ge wèn tí jiù yí dìng néng jiě jué. Jīng lǐ duì wǒ men de jì huà fēi cháng mǎn yì.",
    vi: [
      "Chỉ cần mọi người cùng cố gắng thì vấn đề này nhất định sẽ giải quyết được. Giám đốc rất hài lòng với kế hoạch của chúng tôi.",
    ],
    en: [
      "As long as everyone works hard together, this problem can definitely be solved. The manager is very satisfied with our plan.",
    ],
    words: [
      {
        zh: "只要…就…",
        py: "zhǐ yào … jiù …",
        vi: "chỉ cần … thì …",
        en: "as long as",
      },
      {
        zh: "努力",
        py: "nǔ lì",
        vi: "cố gắng",
        en: "work hard",
      },
      {
        zh: "问题",
        py: "wèn tí",
        vi: "vấn đề",
        en: "problem",
      },
      {
        zh: "解决",
        py: "jiě jué",
        vi: "giải quyết",
        en: "solve",
      },
      {
        zh: "满意",
        py: "mǎn yì",
        vi: "hài lòng",
        en: "satisfied",
      },
    ],
    grammar: [
      {
        id: "ruguo-jiu",
        pattern: "只要 + 大家一起努力，这个问题 + 就 + 一定能解决",
      },
      {
        id: "hui-neng",
        pattern: "一定 + 能 + 解决",
      },
    ],
  },
  {
    id: "p029",
    type: "paragraph",
    level: 4,
    topic: "daily",
    zh: "为了不迟到，我每天早上六点就起床。虽然有点儿累，但是我已经习惯了。",
    py: "Wèi le bù chí dào, wǒ měi tiān zǎo shang liù diǎn jiù qǐ chuáng. Suī rán yǒu diǎnr lèi, dàn shì wǒ yǐ jīng xí guàn le.",
    vi: ["Để không đi muộn, mỗi sáng tôi dậy từ sáu giờ. Tuy hơi mệt nhưng tôi đã quen rồi."],
    en: ["So as not to be late, I get up at six every morning. Although it is a bit tiring, I am already used to it."],
    words: [
      {
        zh: "为了",
        py: "wèi le",
        vi: "để",
        en: "in order to",
      },
      {
        zh: "迟到",
        py: "chí dào",
        vi: "đến muộn",
        en: "be late",
      },
      {
        zh: "起床",
        py: "qǐ chuáng",
        vi: "thức dậy",
        en: "get up",
      },
      {
        zh: "有点儿",
        py: "yǒu diǎnr",
        vi: "hơi",
        en: "a little",
      },
      {
        zh: "习惯",
        py: "xí guàn",
        vi: "quen",
        en: "be used to",
      },
    ],
    grammar: [
      {
        id: "suiran-danshi",
        pattern: "虽然 + 有点儿累，但是 + 我已经习惯了",
      },
      {
        id: "time-first",
        pattern: "我 + 每天早上六点 + 就 + 起床",
      },
    ],
  },
  {
    id: "p030",
    type: "paragraph",
    level: 4,
    topic: "food",
    zh: "我妈妈做的饺子特别好吃。每次过年，我们全家都一边包饺子一边聊天。",
    py: "Wǒ mā ma zuò de jiǎo zi tè bié hǎo chī. Měi cì guò nián, wǒ men quán jiā dōu yì biān bāo jiǎo zi yì biān liáo tiān.",
    vi: [
      "Sủi cảo mẹ tôi làm đặc biệt ngon. Mỗi lần đón Tết, cả nhà tôi đều vừa gói sủi cảo vừa trò chuyện.",
      "Bánh sủi cảo mẹ tôi làm rất ngon. Mỗi dịp Tết, cả nhà tôi đều vừa gói sủi cảo vừa trò chuyện.",
    ],
    en: [
      "The dumplings my mom makes are especially delicious. Every New Year, my whole family chats while making dumplings.",
    ],
    words: [
      {
        zh: "饺子",
        py: "jiǎo zi",
        vi: "sủi cảo",
        en: "dumplings",
      },
      {
        zh: "特别",
        py: "tè bié",
        vi: "đặc biệt",
        en: "especially",
      },
      {
        zh: "过年",
        py: "guò nián",
        vi: "đón Tết",
        en: "celebrate the New Year",
      },
      {
        zh: "全家",
        py: "quán jiā",
        vi: "cả nhà",
        en: "whole family",
      },
      {
        zh: "包",
        py: "bāo",
        vi: "gói",
        en: "wrap",
      },
    ],
    grammar: [
      {
        id: "de-poss",
        pattern: "我妈妈做 + 的 + 饺子",
      },
      {
        id: "yibian",
        pattern: "一边 + 包饺子 + 一边 + 聊天",
      },
    ],
  },
  {
    id: "p031",
    type: "paragraph",
    level: 4,
    topic: "school",
    zh: "通过这次考试，我发现自己的听力还不够好。以后我要多听多练，努力提高听力水平。",
    py: "Tōng guò zhè cì kǎo shì, wǒ fā xiàn zì jǐ de tīng lì hái bú gòu hǎo. Yǐ hòu wǒ yào duō tīng duō liàn, nǔ lì tí gāo tīng lì shuǐ píng.",
    vi: [
      "Qua kỳ thi lần này, tôi phát hiện kỹ năng nghe của mình vẫn chưa đủ tốt. Sau này tôi phải nghe nhiều luyện nhiều, cố gắng nâng cao trình độ nghe.",
    ],
    en: [
      "Through this exam I found that my listening is still not good enough. From now on I will listen and practise more and work hard to improve my listening.",
    ],
    words: [
      {
        zh: "通过",
        py: "tōng guò",
        vi: "thông qua",
        en: "through",
      },
      {
        zh: "考试",
        py: "kǎo shì",
        vi: "kỳ thi",
        en: "exam",
      },
      {
        zh: "发现",
        py: "fā xiàn",
        vi: "phát hiện",
        en: "find",
      },
      {
        zh: "听力",
        py: "tīng lì",
        vi: "kỹ năng nghe",
        en: "listening",
      },
      {
        zh: "提高",
        py: "tí gāo",
        vi: "nâng cao",
        en: "improve",
      },
      {
        zh: "水平",
        py: "shuǐ píng",
        vi: "trình độ",
        en: "level",
      },
    ],
    grammar: [
      {
        id: "xiang-yao",
        pattern: "以后 + 我 + 要 + 多听多练",
      },
      {
        id: "de-poss",
        pattern: "自己 + 的 + 听力",
      },
    ],
  },
  {
    id: "p032",
    type: "paragraph",
    level: 4,
    topic: "hobby",
    zh: "我越来越喜欢打篮球了。因为打篮球不仅能锻炼身体，还能交到很多朋友。",
    py: "Wǒ yuè lái yuè xǐ huan dǎ lán qiú le. Yīn wèi dǎ lán qiú bù jǐn néng duàn liàn shēn tǐ, hái néng jiāo dào hěn duō péng you.",
    vi: [
      "Tôi ngày càng thích chơi bóng rổ. Vì chơi bóng rổ không chỉ rèn luyện được sức khỏe mà còn kết bạn được với nhiều người.",
    ],
    en: [
      "I like playing basketball more and more, because it not only keeps me fit but also helps me make many friends.",
    ],
    words: [
      {
        zh: "打篮球",
        py: "dǎ lán qiú",
        vi: "chơi bóng rổ",
        en: "play basketball",
      },
      {
        zh: "不仅…还…",
        py: "bù jǐn … hái …",
        vi: "không chỉ … mà còn …",
        en: "not only … but also …",
      },
      {
        zh: "锻炼",
        py: "duàn liàn",
        vi: "rèn luyện",
        en: "exercise",
      },
      {
        zh: "身体",
        py: "shēn tǐ",
        vi: "cơ thể, sức khỏe",
        en: "body, health",
      },
      {
        zh: "交",
        py: "jiāo",
        vi: "kết (bạn)",
        en: "make (friends)",
      },
    ],
    grammar: [
      {
        id: "yuelaiyue",
        pattern: "我 + 越来越 + 喜欢打篮球了",
      },
      {
        id: "hui-neng",
        pattern: "不仅 + 能 + 锻炼身体，还 + 能 + 交到很多朋友",
      },
    ],
  },
];

export const T_ITEM_BY_ID = new Map(T_ITEMS.map((i) => [i.id, i]));
