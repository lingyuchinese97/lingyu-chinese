/**
 * Kho bài Đọc hiểu (nội dung tĩnh, HSK 1–4): đoạn ngắn, hội thoại, bài đọc. Mỗi dòng có pinyin TỪNG CHỮ (cách nhau bằng khoảng
 * trắng, khớp số chữ Hán — hiện pinyin trên đầu chữ), bản dịch vi / en; từ khoá (bấm để xem nghĩa, lưu vào Từ vựng), điểm ngữ
 * pháp (id trong `../translation/grammar`), câu hỏi trắc nghiệm / điền từ. Pinyin sinh bằng pinyin-pro rồi rà tay.
 */
export type RLine = { s?: string; zh: string; py: string; vi: string; en: string };
export type RWord = { zh: string; py: string; vi: string; en: string };
export type RQuestion =
  | { kind: "choice"; zh: string; vi: string; en: string; options: string[]; answer: number }
  | { kind: "fill"; zh: string; vi: string; en: string; answer: string };
export type RPassage = {
  id: string;
  level: number;
  type: "short" | "dialogue" | "article";
  topic: string;
  title: { zh: string; vi: string; en: string };
  lines: RLine[];
  words: RWord[];
  grammar: { id: string; pattern: string }[];
  questions: RQuestion[];
};
export const R_TYPES = ["short", "dialogue", "article"] as const;
export type RType = (typeof R_TYPES)[number];

export const R_PASSAGES: RPassage[] = [
  {
    id: "r101",
    level: 1,
    type: "short",
    topic: "daily",
    title: {
      zh: "我的一天",
      vi: "Một ngày của tôi",
      en: "My day",
    },
    lines: [
      {
        zh: "我叫王明，是学生。",
        vi: "Tôi tên là Vương Minh, là học sinh.",
        en: "My name is Wang Ming. I am a student.",
        py: "wǒ jiào Wáng Míng shì xué sheng",
      },
      {
        zh: "我每天早上七点起床，八点去学校。",
        vi: "Mỗi ngày tôi dậy lúc bảy giờ sáng, tám giờ đi học.",
        en: "Every day I get up at seven and go to school at eight.",
        py: "wǒ měi tiān zǎo shang qī diǎn qǐ chuáng bā diǎn qù xué xiào",
      },
      {
        zh: "中午我在学校吃饭。",
        vi: "Buổi trưa tôi ăn cơm ở trường.",
        en: "At noon I eat at school.",
        py: "zhōng wǔ wǒ zài xué xiào chī fàn",
      },
      {
        zh: "晚上我在家看书。",
        vi: "Buổi tối tôi đọc sách ở nhà.",
        en: "In the evening I read at home.",
        py: "wǎn shang wǒ zài jiā kàn shū",
      },
    ],
    words: [
      {
        zh: "学生",
        py: "xué sheng",
        vi: "học sinh",
        en: "student",
      },
      {
        zh: "每天",
        py: "měi tiān",
        vi: "mỗi ngày",
        en: "every day",
      },
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
    ],
    grammar: [
      {
        id: "time-first",
        pattern: "我 + 每天早上七点 + 起床",
      },
      {
        id: "zai-place",
        pattern: "我 + 在学校 + 吃饭",
      },
    ],
    questions: [
      {
        kind: "choice",
        zh: "王明是做什么的？",
        vi: "Vương Minh làm nghề gì?",
        en: "What does Wang Ming do?",
        options: ["学生", "老师", "医生", "司机"],
        answer: 0,
      },
      {
        kind: "choice",
        zh: "他中午在哪儿吃饭？",
        vi: "Buổi trưa cậu ấy ăn cơm ở đâu?",
        en: "Where does he eat at noon?",
        options: ["在家", "在学校", "在饭馆", "在公司"],
        answer: 1,
      },
      {
        kind: "fill",
        zh: "王明每天早上＿点起床。",
        vi: "Vương Minh mỗi sáng dậy lúc mấy giờ?",
        en: "What time does Wang Ming get up?",
        answer: "七",
      },
    ],
  },
  {
    id: "r102",
    level: 1,
    type: "dialogue",
    topic: "shopping",
    title: {
      zh: "买水果",
      vi: "Mua hoa quả",
      en: "Buying fruit",
    },
    lines: [
      {
        s: "A",
        zh: "你好！苹果多少钱一斤？",
        vi: "Chào anh! Táo bao nhiêu tiền một cân?",
        en: "Hello! How much is a jin of apples?",
        py: "nǐ hǎo píng guǒ duō shǎo qián yì jīn",
      },
      {
        s: "B",
        zh: "五块钱一斤。",
        vi: "Năm tệ một cân.",
        en: "Five yuan a jin.",
        py: "wǔ kuài qián yì jīn",
      },
      {
        s: "A",
        zh: "太贵了！三块可以吗？",
        vi: "Đắt quá! Ba tệ được không?",
        en: "That's too expensive! Is three yuan OK?",
        py: "tài guì le sān kuài kě yǐ ma",
      },
      {
        s: "B",
        zh: "好吧。你要几斤？",
        vi: "Thôi được. Chị lấy mấy cân?",
        en: "All right. How many jin do you want?",
        py: "hǎo ba nǐ yào jǐ jīn",
      },
      {
        s: "A",
        zh: "我要两斤。谢谢！",
        vi: "Tôi lấy hai cân. Cảm ơn!",
        en: "I'll take two jin. Thank you!",
        py: "wǒ yào liǎng jīn xiè xie",
      },
    ],
    words: [
      {
        zh: "苹果",
        py: "píng guǒ",
        vi: "táo",
        en: "apple",
      },
      {
        zh: "多少钱",
        py: "duō shǎo qián",
        vi: "bao nhiêu tiền",
        en: "how much",
      },
      {
        zh: "斤",
        py: "jīn",
        vi: "cân (0,5 kg)",
        en: "jin (0.5 kg)",
      },
      {
        zh: "块",
        py: "kuài",
        vi: "tệ",
        en: "yuan",
      },
      {
        zh: "太…了",
        py: "tài le",
        vi: "quá",
        en: "too",
      },
      {
        zh: "可以",
        py: "kě yǐ",
        vi: "được, có thể",
        en: "can, OK",
      },
    ],
    grammar: [
      {
        id: "measure",
        pattern: "两 + 斤 (苹果)",
      },
      {
        id: "ma",
        pattern: "三块可以 + 吗？",
      },
    ],
    questions: [
      {
        kind: "choice",
        zh: "苹果一开始多少钱一斤？",
        vi: "Lúc đầu táo giá bao nhiêu một cân?",
        en: "What was the first price per jin?",
        options: ["五块", "三块", "两块", "十块"],
        answer: 0,
      },
      {
        kind: "choice",
        zh: "最后她买了几斤苹果？",
        vi: "Cuối cùng chị ấy mua mấy cân táo?",
        en: "How many jin did she buy in the end?",
        options: ["一斤", "两斤", "三斤", "五斤"],
        answer: 1,
      },
      {
        kind: "fill",
        zh: "她觉得苹果太＿了。",
        vi: "Chị ấy thấy táo quá … (đắt)",
        en: "She thinks the apples are too … (expensive)",
        answer: "贵",
      },
    ],
  },
  {
    id: "r103",
    level: 1,
    type: "short",
    topic: "family",
    title: {
      zh: "我的家",
      vi: "Gia đình tôi",
      en: "My family",
    },
    lines: [
      {
        zh: "我家有四口人：爸爸、妈妈、哥哥和我。",
        vi: "Nhà tôi có bốn người: bố, mẹ, anh trai và tôi.",
        en: "There are four people in my family: dad, mom, my older brother and me.",
        py: "wǒ jiā yǒu sì kǒu rén bà ba mā ma gē ge hé wǒ",
      },
      {
        zh: "爸爸是医生，妈妈是老师。",
        vi: "Bố là bác sĩ, mẹ là giáo viên.",
        en: "My dad is a doctor and my mom is a teacher.",
        py: "bà ba shì yī shēng mā ma shì lǎo shī",
      },
      {
        zh: "哥哥在北京工作。",
        vi: "Anh trai làm việc ở Bắc Kinh.",
        en: "My brother works in Beijing.",
        py: "gē ge zài Běi jīng gōng zuò",
      },
      {
        zh: "我很爱我的家。",
        vi: "Tôi rất yêu gia đình mình.",
        en: "I love my family very much.",
        py: "wǒ hěn ài wǒ de jiā",
      },
    ],
    words: [
      {
        zh: "口",
        py: "kǒu",
        vi: "(lượng từ cho người trong nhà)",
        en: "(measure word for family members)",
      },
      {
        zh: "哥哥",
        py: "gē ge",
        vi: "anh trai",
        en: "older brother",
      },
      {
        zh: "医生",
        py: "yī shēng",
        vi: "bác sĩ",
        en: "doctor",
      },
      {
        zh: "老师",
        py: "lǎo shī",
        vi: "giáo viên",
        en: "teacher",
      },
      {
        zh: "工作",
        py: "gōng zuò",
        vi: "làm việc",
        en: "work",
      },
      {
        zh: "爱",
        py: "ài",
        vi: "yêu",
        en: "love",
      },
    ],
    grammar: [
      {
        id: "shi",
        pattern: "爸爸 + 是 + 医生",
      },
      {
        id: "zai-place",
        pattern: "哥哥 + 在北京 + 工作",
      },
    ],
    questions: [
      {
        kind: "choice",
        zh: "哥哥在哪儿工作？",
        vi: "Anh trai làm việc ở đâu?",
        en: "Where does the older brother work?",
        options: ["北京", "上海", "学校", "医院"],
        answer: 0,
      },
      {
        kind: "choice",
        zh: "妈妈做什么工作？",
        vi: "Mẹ làm nghề gì?",
        en: "What is the mother's job?",
        options: ["医生", "老师", "学生", "司机"],
        answer: 1,
      },
      {
        kind: "fill",
        zh: "我家有＿口人。",
        vi: "Nhà tôi có mấy người?",
        en: "How many people are in the family?",
        answer: "四",
      },
    ],
  },
  {
    id: "r104",
    level: 1,
    type: "article",
    topic: "weather",
    title: {
      zh: "今天的天气",
      vi: "Thời tiết hôm nay",
      en: "Today's weather",
    },
    lines: [
      {
        zh: "今天星期六，天气很好，不冷也不热。",
        vi: "Hôm nay thứ bảy, thời tiết rất đẹp, không lạnh cũng không nóng.",
        en: "Today is Saturday. The weather is nice, neither cold nor hot.",
        py: "jīn tiān xīng qī liù tiān qì hěn hǎo bù lěng yě bú rè",
      },
      {
        zh: "我和朋友去公园。",
        vi: "Tôi và bạn đi công viên.",
        en: "My friend and I go to the park.",
        py: "wǒ hé péng you qù gōng yuán",
      },
      {
        zh: "公园里人很多。",
        vi: "Trong công viên có rất nhiều người.",
        en: "There are many people in the park.",
        py: "gōng yuán li rén hěn duō",
      },
      {
        zh: "我们一起喝茶、说话，很高兴。",
        vi: "Chúng tôi cùng uống trà, nói chuyện, rất vui.",
        en: "We drink tea and chat together, and we are very happy.",
        py: "wǒ men yì qǐ hē chá shuō huà hěn gāo xìng",
      },
    ],
    words: [
      {
        zh: "星期六",
        py: "xīng qī liù",
        vi: "thứ bảy",
        en: "Saturday",
      },
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
        zh: "公园",
        py: "gōng yuán",
        vi: "công viên",
        en: "park",
      },
      {
        zh: "一起",
        py: "yì qǐ",
        vi: "cùng nhau",
        en: "together",
      },
      {
        zh: "高兴",
        py: "gāo xìng",
        vi: "vui",
        en: "happy",
      },
    ],
    grammar: [
      {
        id: "time-first",
        pattern: "今天 + 星期六",
      },
      {
        id: "xiang-yao",
        pattern: "我和朋友 + 去 + 公园",
      },
    ],
    questions: [
      {
        kind: "choice",
        zh: "今天星期几？",
        vi: "Hôm nay là thứ mấy?",
        en: "What day is it today?",
        options: ["星期五", "星期六", "星期天", "星期一"],
        answer: 1,
      },
      {
        kind: "choice",
        zh: "他们去哪儿了？",
        vi: "Họ đã đi đâu?",
        en: "Where did they go?",
        options: ["商店", "学校", "公园", "饭馆"],
        answer: 2,
      },
      {
        kind: "fill",
        zh: "今天天气不冷也不＿。",
        vi: "Hôm nay không lạnh cũng không …",
        en: "Today it is neither cold nor …",
        answer: "热",
      },
    ],
  },
  {
    id: "r201",
    level: 2,
    type: "short",
    topic: "travel",
    title: {
      zh: "去上海旅游",
      vi: "Đi du lịch Thượng Hải",
      en: "A trip to Shanghai",
    },
    lines: [
      {
        zh: "上个月我去上海旅游了。",
        vi: "Tháng trước tôi đã đi du lịch Thượng Hải.",
        en: "Last month I travelled to Shanghai.",
        py: "shàng ge yuè wǒ qù Shàng hǎi lǚ yóu le",
      },
      {
        zh: "上海很大，也很漂亮。",
        vi: "Thượng Hải rất lớn, cũng rất đẹp.",
        en: "Shanghai is very big and very beautiful.",
        py: "Shàng hǎi hěn dà yě hěn piào liang",
      },
      {
        zh: "我是坐飞机去的，两个小时就到了。",
        vi: "Tôi đi bằng máy bay, hai tiếng là tới.",
        en: "I went by plane and got there in two hours.",
        py: "wǒ shì zuò fēi jī qù de liǎng ge xiǎo shí jiù dào le",
      },
      {
        zh: "我在那里住了三天，吃了很多好吃的东西。",
        vi: "Tôi ở đó ba ngày, ăn rất nhiều món ngon.",
        en: "I stayed there three days and ate lots of delicious food.",
        py: "wǒ zài nà lǐ zhù le sān tiān chī le hěn duō hǎo chī de dōng xi",
      },
    ],
    words: [
      {
        zh: "上个月",
        py: "shàng ge yuè",
        vi: "tháng trước",
        en: "last month",
      },
      {
        zh: "旅游",
        py: "lǚ yóu",
        vi: "du lịch",
        en: "travel",
      },
      {
        zh: "漂亮",
        py: "piào liang",
        vi: "đẹp",
        en: "beautiful",
      },
      {
        zh: "飞机",
        py: "fēi jī",
        vi: "máy bay",
        en: "plane",
      },
      {
        zh: "小时",
        py: "xiǎo shí",
        vi: "tiếng, giờ",
        en: "hour",
      },
      {
        zh: "好吃",
        py: "hǎo chī",
        vi: "ngon",
        en: "delicious",
      },
    ],
    grammar: [
      {
        id: "le-done",
        pattern: "我去上海旅游 + 了 / 住 + 了 + 三天",
      },
      {
        id: "measure",
        pattern: "两 + 个 + 小时",
      },
    ],
    questions: [
      {
        kind: "choice",
        zh: "他是怎么去上海的？",
        vi: "Anh ấy đi Thượng Hải bằng gì?",
        en: "How did he go to Shanghai?",
        options: ["坐火车", "坐飞机", "开车", "坐船"],
        answer: 1,
      },
      {
        kind: "choice",
        zh: "他在上海住了几天？",
        vi: "Anh ấy ở Thượng Hải mấy ngày?",
        en: "How many days did he stay in Shanghai?",
        options: ["两天", "三天", "四天", "一个星期"],
        answer: 1,
      },
      {
        kind: "fill",
        zh: "坐飞机两个＿就到了。",
        vi: "Đi máy bay hai … là tới.",
        en: "By plane he arrived in two …",
        answer: "小时",
      },
    ],
  },
  {
    id: "r202",
    level: 2,
    type: "dialogue",
    topic: "health",
    title: {
      zh: "看医生",
      vi: "Đi khám bệnh",
      en: "Seeing the doctor",
    },
    lines: [
      {
        s: "A",
        zh: "你怎么了？",
        vi: "Anh bị sao vậy?",
        en: "What's wrong?",
        py: "nǐ zěn me le",
      },
      {
        s: "B",
        zh: "我头疼，身体不舒服。",
        vi: "Tôi đau đầu, trong người không khỏe.",
        en: "I have a headache and don't feel well.",
        py: "wǒ tóu téng shēn tǐ bù shū fu",
      },
      {
        s: "A",
        zh: "你昨天晚上几点睡觉的？",
        vi: "Tối qua anh đi ngủ lúc mấy giờ?",
        en: "What time did you go to bed last night?",
        py: "nǐ zuó tiān wǎn shang jǐ diǎn shuì jiào de",
      },
      {
        s: "B",
        zh: "十二点多。",
        vi: "Hơn mười hai giờ.",
        en: "After twelve.",
        py: "shí èr diǎn duō",
      },
      {
        s: "A",
        zh: "你睡得太晚了。多休息，多喝水吧。",
        vi: "Anh ngủ muộn quá. Nghỉ ngơi nhiều, uống nhiều nước nhé.",
        en: "You went to bed too late. Rest more and drink more water.",
        py: "nǐ shuì de tài wǎn le duō xiū xi duō hē shuǐ ba",
      },
    ],
    words: [
      {
        zh: "怎么了",
        py: "zěn me le",
        vi: "bị sao vậy",
        en: "what's wrong",
      },
      {
        zh: "头疼",
        py: "tóu téng",
        vi: "đau đầu",
        en: "headache",
      },
      {
        zh: "舒服",
        py: "shū fu",
        vi: "dễ chịu, khỏe",
        en: "comfortable, well",
      },
      {
        zh: "睡觉",
        py: "shuì jiào",
        vi: "đi ngủ",
        en: "sleep",
      },
      {
        zh: "晚",
        py: "wǎn",
        vi: "muộn",
        en: "late",
      },
      {
        zh: "休息",
        py: "xiū xi",
        vi: "nghỉ ngơi",
        en: "rest",
      },
    ],
    grammar: [
      {
        id: "de-degree",
        pattern: "你 + 睡 + 得 + 太晚了",
      },
    ],
    questions: [
      {
        kind: "choice",
        zh: "他哪儿不舒服？",
        vi: "Anh ấy bị khó chịu ở đâu?",
        en: "What is wrong with him?",
        options: ["头疼", "肚子疼", "眼睛疼", "腿疼"],
        answer: 0,
      },
      {
        kind: "choice",
        zh: "他昨天晚上几点睡觉？",
        vi: "Tối qua anh ấy ngủ lúc mấy giờ?",
        en: "When did he go to bed last night?",
        options: ["十点", "十一点", "十二点多", "两点"],
        answer: 2,
      },
      {
        kind: "fill",
        zh: "医生说他睡得太＿了。",
        vi: "Bác sĩ nói anh ấy ngủ quá …",
        en: "The doctor says he went to bed too …",
        answer: "晚",
      },
    ],
  },
  {
    id: "r203",
    level: 2,
    type: "short",
    topic: "school",
    title: {
      zh: "学汉语",
      vi: "Học tiếng Trung",
      en: "Learning Chinese",
    },
    lines: [
      {
        zh: "我学汉语已经一年了。",
        vi: "Tôi đã học tiếng Trung được một năm rồi.",
        en: "I have been learning Chinese for a year.",
        py: "wǒ xué Hàn yǔ yǐ jīng yì nián le",
      },
      {
        zh: "我觉得汉字很难，但是说汉语很有意思。",
        vi: "Tôi thấy chữ Hán rất khó, nhưng nói tiếng Trung rất thú vị.",
        en: "I find Chinese characters hard, but speaking Chinese is fun.",
        py: "wǒ jué de hàn zì hěn nán dàn shì shuō Hàn yǔ hěn yǒu yì si",
      },
      {
        zh: "每个星期二和星期四，我去学校上汉语课。",
        vi: "Mỗi thứ ba và thứ năm, tôi đến trường học tiếng Trung.",
        en: "Every Tuesday and Thursday I go to school for Chinese class.",
        py: "měi ge xīng qī èr hé xīng qī sì wǒ qù xué xiào shàng Hàn yǔ kè",
      },
      {
        zh: "我的老师非常好，常常帮助我。",
        vi: "Cô giáo của tôi rất tốt, thường xuyên giúp đỡ tôi.",
        en: "My teacher is very kind and often helps me.",
        py: "wǒ de lǎo shī fēi cháng hǎo cháng cháng bāng zhù wǒ",
      },
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
        py: "hàn zì",
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
        zh: "有意思",
        py: "yǒu yì si",
        vi: "thú vị",
        en: "interesting",
      },
      {
        zh: "汉语课",
        py: "Hàn yǔ kè",
        vi: "lớp tiếng Trung",
        en: "Chinese class",
      },
      {
        zh: "帮助",
        py: "bāng zhù",
        vi: "giúp đỡ",
        en: "help",
      },
    ],
    grammar: [
      {
        id: "le-done",
        pattern: "我学汉语已经一年 + 了",
      },
      {
        id: "de-poss",
        pattern: "我 + 的 + 老师",
      },
    ],
    questions: [
      {
        kind: "choice",
        zh: "他学汉语多长时间了？",
        vi: "Anh ấy học tiếng Trung bao lâu rồi?",
        en: "How long has he been learning Chinese?",
        options: ["半年", "一年", "两年", "三年"],
        answer: 1,
      },
      {
        kind: "choice",
        zh: "他觉得什么很难？",
        vi: "Anh ấy thấy cái gì khó?",
        en: "What does he find difficult?",
        options: ["说汉语", "汉字", "听力", "唱歌"],
        answer: 1,
      },
      {
        kind: "fill",
        zh: "每个星期二和星期＿，他去上汉语课。",
        vi: "Thứ ba và thứ … anh ấy đi học.",
        en: "Tuesday and … he has Chinese class.",
        answer: "四",
      },
    ],
  },
  {
    id: "r204",
    level: 2,
    type: "article",
    topic: "work",
    title: {
      zh: "我的工作",
      vi: "Công việc của tôi",
      en: "My job",
    },
    lines: [
      {
        zh: "我在一家公司工作。",
        vi: "Tôi làm việc ở một công ty.",
        en: "I work at a company.",
        py: "wǒ zài yì jiā gōng sī gōng zuò",
      },
      {
        zh: "我每天早上八点半上班，下午五点半下班。",
        vi: "Mỗi ngày tôi đi làm lúc tám rưỡi sáng, tan làm lúc năm rưỡi chiều.",
        en: "I start work at 8:30 every morning and finish at 5:30 in the afternoon.",
        py: "wǒ měi tiān zǎo shang bā diǎn bàn shàng bān xià wǔ wǔ diǎn bàn xià bān",
      },
      {
        zh: "工作虽然很忙，但是同事们都很好。",
        vi: "Công việc tuy rất bận nhưng các đồng nghiệp đều rất tốt.",
        en: "Although work is busy, my colleagues are all very nice.",
        py: "gōng zuò suī rán hěn máng dàn shì tóng shì men dōu hěn hǎo",
      },
      {
        zh: "周末我喜欢在家休息，或者和朋友去看电影。",
        vi: "Cuối tuần tôi thích nghỉ ở nhà, hoặc cùng bạn đi xem phim.",
        en: "At weekends I like to rest at home or go to the movies with friends.",
        py: "zhōu mò wǒ xǐ huan zài jiā xiū xi huò zhě hé péng you qù kàn diàn yǐng",
      },
    ],
    words: [
      {
        zh: "公司",
        py: "gōng sī",
        vi: "công ty",
        en: "company",
      },
      {
        zh: "上班",
        py: "shàng bān",
        vi: "đi làm",
        en: "go to work",
      },
      {
        zh: "下班",
        py: "xià bān",
        vi: "tan làm",
        en: "finish work",
      },
      {
        zh: "同事",
        py: "tóng shì",
        vi: "đồng nghiệp",
        en: "colleague",
      },
      {
        zh: "周末",
        py: "zhōu mò",
        vi: "cuối tuần",
        en: "weekend",
      },
      {
        zh: "或者",
        py: "huò zhě",
        vi: "hoặc",
        en: "or",
      },
    ],
    grammar: [
      {
        id: "suiran-danshi",
        pattern: "工作虽然很忙，但是同事们都很好",
      },
      {
        id: "zai-place",
        pattern: "我 + 在一家公司 + 工作",
      },
    ],
    questions: [
      {
        kind: "choice",
        zh: "他几点下班？",
        vi: "Anh ấy tan làm lúc mấy giờ?",
        en: "What time does he finish work?",
        options: ["五点", "五点半", "六点", "八点半"],
        answer: 1,
      },
      {
        kind: "choice",
        zh: "周末他喜欢做什么？",
        vi: "Cuối tuần anh ấy thích làm gì?",
        en: "What does he like to do at weekends?",
        options: ["上班", "在家休息或者看电影", "去学校", "出差"],
        answer: 1,
      },
      {
        kind: "fill",
        zh: "工作虽然很忙，但是同事们都很＿。",
        vi: "Tuy bận nhưng đồng nghiệp đều rất …",
        en: "Although busy, his colleagues are all very …",
        answer: "好",
      },
    ],
  },
  {
    id: "r301",
    level: 3,
    type: "short",
    topic: "hobby",
    title: {
      zh: "我的爱好",
      vi: "Sở thích của tôi",
      en: "My hobby",
    },
    lines: [
      {
        zh: "我对音乐很感兴趣。",
        vi: "Tôi rất hứng thú với âm nhạc.",
        en: "I am very interested in music.",
        py: "wǒ duì yīn yuè hěn gǎn xìng qù",
      },
      {
        zh: "我从小就开始学弹钢琴，现在已经弹了十年了。",
        vi: "Tôi bắt đầu học đàn piano từ nhỏ, đến nay đã chơi được mười năm.",
        en: "I started learning the piano as a child and have played for ten years.",
        py: "wǒ cóng xiǎo jiù kāi shǐ xué tán gāng qín xiàn zài yǐ jīng tán le shí nián le",
      },
      {
        zh: "每天晚上我都会练习一个小时。",
        vi: "Tối nào tôi cũng luyện tập một tiếng.",
        en: "I practise for an hour every evening.",
        py: "měi tiān wǎn shang wǒ dōu huì liàn xí yí gè xiǎo shí",
      },
      {
        zh: "音乐让我觉得很放松。",
        vi: "Âm nhạc khiến tôi thấy rất thư giãn.",
        en: "Music makes me feel relaxed.",
        py: "yīn yuè ràng wǒ jué de hěn fàng sōng",
      },
    ],
    words: [
      {
        zh: "感兴趣",
        py: "gǎn xìng qù",
        vi: "hứng thú",
        en: "be interested",
      },
      {
        zh: "从小",
        py: "cóng xiǎo",
        vi: "từ nhỏ",
        en: "since childhood",
      },
      {
        zh: "弹钢琴",
        py: "tán gāng qín",
        vi: "chơi đàn piano",
        en: "play the piano",
      },
      {
        zh: "练习",
        py: "liàn xí",
        vi: "luyện tập",
        en: "practise",
      },
      {
        zh: "放松",
        py: "fàng sōng",
        vi: "thư giãn",
        en: "relaxed",
      },
    ],
    grammar: [
      {
        id: "dui-ganxingqu",
        pattern: "我 + 对 + 音乐 + 很 + 感兴趣",
      },
      {
        id: "le-done",
        pattern: "已经弹 + 了 + 十年 + 了",
      },
    ],
    questions: [
      {
        kind: "choice",
        zh: "他弹钢琴弹了多少年了？",
        vi: "Anh ấy chơi piano bao nhiêu năm rồi?",
        en: "How many years has he played the piano?",
        options: ["五年", "八年", "十年", "十二年"],
        answer: 2,
      },
      {
        kind: "choice",
        zh: "他每天练习多长时间？",
        vi: "Mỗi ngày anh ấy luyện bao lâu?",
        en: "How long does he practise each day?",
        options: ["半个小时", "一个小时", "两个小时", "三个小时"],
        answer: 1,
      },
      {
        kind: "fill",
        zh: "音乐让我觉得很＿。",
        vi: "Âm nhạc khiến tôi thấy rất …",
        en: "Music makes me feel very …",
        answer: "放松",
      },
    ],
  },
  {
    id: "r302",
    level: 3,
    type: "dialogue",
    topic: "daily",
    title: {
      zh: "找钥匙",
      vi: "Tìm chìa khóa",
      en: "Looking for the keys",
    },
    lines: [
      {
        s: "A",
        zh: "你看见我的钥匙了吗？",
        vi: "Anh có thấy chìa khóa của em không?",
        en: "Have you seen my keys?",
        py: "nǐ kàn jiàn wǒ de yào shi le ma",
      },
      {
        s: "B",
        zh: "没有。你是不是放在包里了？",
        vi: "Không. Có phải em để trong túi rồi không?",
        en: "No. Did you put them in your bag?",
        py: "méi yǒu nǐ shì bu shì fàng zài bāo li le",
      },
      {
        s: "A",
        zh: "我找过了，包里没有。",
        vi: "Em tìm rồi, trong túi không có.",
        en: "I've looked. They're not in my bag.",
        py: "wǒ zhǎo guo le bāo li méi yǒu",
      },
      {
        s: "B",
        zh: "桌子上呢？",
        vi: "Trên bàn thì sao?",
        en: "What about on the table?",
        py: "zhuō zi shang ne",
      },
      {
        s: "A",
        zh: "啊，找到了！原来在电脑旁边。",
        vi: "A, tìm thấy rồi! Hóa ra ở cạnh máy tính.",
        en: "Ah, found them! They were next to the computer.",
        py: "a zhǎo dào le yuán lái zài diàn nǎo páng biān",
      },
    ],
    words: [
      {
        zh: "看见",
        py: "kàn jiàn",
        vi: "nhìn thấy",
        en: "see",
      },
      {
        zh: "钥匙",
        py: "yào shi",
        vi: "chìa khóa",
        en: "key",
      },
      {
        zh: "放",
        py: "fàng",
        vi: "đặt, để",
        en: "put",
      },
      {
        zh: "包",
        py: "bāo",
        vi: "túi",
        en: "bag",
      },
      {
        zh: "原来",
        py: "yuán lái",
        vi: "hóa ra",
        en: "it turns out",
      },
      {
        zh: "旁边",
        py: "páng biān",
        vi: "bên cạnh",
        en: "next to",
      },
    ],
    grammar: [
      {
        id: "guo",
        pattern: "我 + 找 + 过 + 了",
      },
      {
        id: "ma",
        pattern: "你看见我的钥匙了 + 吗？",
      },
    ],
    questions: [
      {
        kind: "choice",
        zh: "他们在找什么？",
        vi: "Họ đang tìm cái gì?",
        en: "What are they looking for?",
        options: ["手机", "钥匙", "钱包", "电脑"],
        answer: 1,
      },
      {
        kind: "choice",
        zh: "钥匙最后在哪儿？",
        vi: "Cuối cùng chìa khóa ở đâu?",
        en: "Where were the keys in the end?",
        options: ["包里", "桌子下面", "电脑旁边", "门口"],
        answer: 2,
      },
      {
        kind: "fill",
        zh: "我找过了，＿里没有。",
        vi: "Em tìm rồi, trong … không có.",
        en: "I've looked, they're not in the …",
        answer: "包",
      },
    ],
  },
  {
    id: "r303",
    level: 3,
    type: "short",
    topic: "weather",
    title: {
      zh: "北京的冬天",
      vi: "Mùa đông ở Bắc Kinh",
      en: "Winter in Beijing",
    },
    lines: [
      {
        zh: "北京的冬天很冷，常常刮风，有时候还会下雪。",
        vi: "Mùa đông ở Bắc Kinh rất lạnh, thường có gió, đôi khi còn có tuyết.",
        en: "Winter in Beijing is cold and windy, and sometimes it snows.",
        py: "Běi jīng de dōng tiān hěn lěng cháng cháng guā fēng yǒu shí hou hái huì xià xuě",
      },
      {
        zh: "虽然外面很冷，但是房间里很暖和。",
        vi: "Tuy bên ngoài rất lạnh nhưng trong phòng rất ấm.",
        en: "Although it's cold outside, it's warm inside.",
        py: "suī rán wài miàn hěn lěng dàn shì fáng jiān li hěn nuǎn huo",
      },
      {
        zh: "冬天的时候，我最喜欢和家人一起吃火锅。",
        vi: "Vào mùa đông, tôi thích nhất là cùng gia đình ăn lẩu.",
        en: "In winter, my favourite thing is eating hotpot with my family.",
        py: "dōng tiān de shí hou wǒ zuì xǐ huan hé jiā rén yì qǐ chī huǒ guō",
      },
    ],
    words: [
      {
        zh: "冬天",
        py: "dōng tiān",
        vi: "mùa đông",
        en: "winter",
      },
      {
        zh: "刮风",
        py: "guā fēng",
        vi: "có gió",
        en: "be windy",
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
        zh: "家人",
        py: "jiā rén",
        vi: "người nhà",
        en: "family",
      },
      {
        zh: "火锅",
        py: "huǒ guō",
        vi: "lẩu",
        en: "hotpot",
      },
    ],
    grammar: [
      {
        id: "suiran-danshi",
        pattern: "虽然 + 外面很冷，但是 + 房间里很暖和",
      },
      {
        id: "de-poss",
        pattern: "北京 + 的 + 冬天",
      },
    ],
    questions: [
      {
        kind: "choice",
        zh: "北京的冬天怎么样？",
        vi: "Mùa đông Bắc Kinh thế nào?",
        en: "What is winter in Beijing like?",
        options: ["很热", "很冷", "不冷不热", "常常下雨"],
        answer: 1,
      },
      {
        kind: "choice",
        zh: "冬天他最喜欢做什么？",
        vi: "Mùa đông anh ấy thích làm gì nhất?",
        en: "What does he like doing most in winter?",
        options: ["滑冰", "吃火锅", "看电影", "睡觉"],
        answer: 1,
      },
      {
        kind: "fill",
        zh: "虽然外面很冷，但是房间里很＿。",
        vi: "Tuy ngoài lạnh nhưng trong phòng rất …",
        en: "Although it's cold outside, the room is very …",
        answer: "暖和",
      },
    ],
  },
  {
    id: "r304",
    level: 3,
    type: "article",
    topic: "shopping",
    title: {
      zh: "网上购物",
      vi: "Mua sắm trên mạng",
      en: "Online shopping",
    },
    lines: [
      {
        zh: "现在越来越多的人喜欢在网上买东西。",
        vi: "Bây giờ ngày càng nhiều người thích mua đồ trên mạng.",
        en: "More and more people like to shop online now.",
        py: "xiàn zài yuè lái yuè duō de rén xǐ huan zài wǎng shàng mǎi dōng xi",
      },
      {
        zh: "网上的东西又便宜又方便，而且可以送到家里。",
        vi: "Đồ trên mạng vừa rẻ vừa tiện, lại còn được giao tận nhà.",
        en: "Things online are cheap and convenient, and they are delivered to your home.",
        py: "wǎng shàng de dōng xi yòu pián yi yòu fāng biàn ér qiě kě yǐ sòng dào jiā li",
      },
      {
        zh: "但是有时候，买到的东西和照片上的不一样。",
        vi: "Nhưng đôi khi, đồ mua về không giống trong ảnh.",
        en: "But sometimes what you get is different from the photo.",
        py: "dàn shì yǒu shí hou mǎi dào de dōng xi hé zhào piàn shang de bù yí yàng",
      },
      {
        zh: "所以买东西以前，最好先看看别人的评价。",
        vi: "Vì vậy trước khi mua, tốt nhất nên xem đánh giá của người khác.",
        en: "So before buying, it's best to read other people's reviews.",
        py: "suǒ yǐ mǎi dōng xi yǐ qián zuì hǎo xiān kàn kan bié rén de píng jià",
      },
    ],
    words: [
      {
        zh: "越来越",
        py: "yuè lái yuè",
        vi: "ngày càng",
        en: "more and more",
      },
      {
        zh: "网上",
        py: "wǎng shàng",
        vi: "trên mạng",
        en: "online",
      },
      {
        zh: "方便",
        py: "fāng biàn",
        vi: "tiện lợi",
        en: "convenient",
      },
      {
        zh: "照片",
        py: "zhào piàn",
        vi: "ảnh",
        en: "photo",
      },
      {
        zh: "最好",
        py: "zuì hǎo",
        vi: "tốt nhất là",
        en: "had better",
      },
      {
        zh: "评价",
        py: "píng jià",
        vi: "đánh giá",
        en: "review",
      },
    ],
    grammar: [
      {
        id: "yuelaiyue",
        pattern: "越来越 + 多的人",
      },
      {
        id: "yinwei-suoyi",
        pattern: "所以 + 买东西以前最好先看看评价",
      },
    ],
    questions: [
      {
        kind: "choice",
        zh: "为什么很多人喜欢网上购物？",
        vi: "Vì sao nhiều người thích mua sắm trên mạng?",
        en: "Why do many people like online shopping?",
        options: ["又便宜又方便", "东西质量最好", "可以试穿", "店员很热情"],
        answer: 0,
      },
      {
        kind: "choice",
        zh: "买东西以前最好做什么？",
        vi: "Trước khi mua nên làm gì?",
        en: "What should you do before buying?",
        options: ["问朋友", "看看别人的评价", "去商店看看", "打电话"],
        answer: 1,
      },
      {
        kind: "fill",
        zh: "现在＿多的人喜欢在网上买东西。",
        vi: "Bây giờ … nhiều người thích mua trên mạng.",
        en: "Now … people like shopping online.",
        answer: "越来越",
      },
    ],
  },
  {
    id: "r401",
    level: 4,
    type: "short",
    topic: "travel",
    title: {
      zh: "一次难忘的旅行",
      vi: "Một chuyến đi khó quên",
      en: "An unforgettable trip",
    },
    lines: [
      {
        zh: "去年夏天，我和朋友去云南旅行了一个星期。",
        vi: "Mùa hè năm ngoái, tôi và bạn đi du lịch Vân Nam một tuần.",
        en: "Last summer my friend and I travelled in Yunnan for a week.",
        py: "qù nián xià tiān wǒ hé péng you qù Yún nán lǚ xíng le yí gè xīng qī",
      },
      {
        zh: "那里的风景美极了，空气也特别新鲜。",
        vi: "Phong cảnh ở đó đẹp tuyệt, không khí cũng đặc biệt trong lành.",
        en: "The scenery there was stunning and the air was very fresh.",
        py: "nà lǐ de fēng jǐng měi jí le kōng qì yě tè bié xīn xiān",
      },
      {
        zh: "我们不但爬了雪山，而且还参观了很多有名的古城。",
        vi: "Chúng tôi không những leo núi tuyết mà còn tham quan nhiều cổ trấn nổi tiếng.",
        en: "We not only climbed a snow mountain but also visited many famous ancient towns.",
        py: "wǒ men bú dàn pá le xuě shān ér qiě hái cān guān le hěn duō yǒu míng de gǔ chéng",
      },
      {
        zh: "这次旅行给我留下了很深的印象。",
        vi: "Chuyến đi này để lại cho tôi ấn tượng rất sâu sắc.",
        en: "This trip left a deep impression on me.",
        py: "zhè cì lǚ xíng gěi wǒ liú xià le hěn shēn de yìn xiàng",
      },
    ],
    words: [
      {
        zh: "去年",
        py: "qù nián",
        vi: "năm ngoái",
        en: "last year",
      },
      {
        zh: "风景",
        py: "fēng jǐng",
        vi: "phong cảnh",
        en: "scenery",
      },
      {
        zh: "新鲜",
        py: "xīn xiān",
        vi: "trong lành, tươi",
        en: "fresh",
      },
      {
        zh: "参观",
        py: "cān guān",
        vi: "tham quan",
        en: "visit",
      },
      {
        zh: "有名",
        py: "yǒu míng",
        vi: "nổi tiếng",
        en: "famous",
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
        pattern: "旅行 + 了 + 一个星期",
      },
      {
        id: "de-poss",
        pattern: "很深 + 的 + 印象",
      },
    ],
    questions: [
      {
        kind: "choice",
        zh: "他们在云南旅行了多长时间？",
        vi: "Họ du lịch Vân Nam bao lâu?",
        en: "How long did they travel in Yunnan?",
        options: ["三天", "五天", "一个星期", "一个月"],
        answer: 2,
      },
      {
        kind: "choice",
        zh: "他们在云南做了什么？",
        vi: "Họ đã làm gì ở Vân Nam?",
        en: "What did they do in Yunnan?",
        options: ["爬雪山、参观古城", "去海边游泳", "在城市购物", "看电影"],
        answer: 0,
      },
      {
        kind: "fill",
        zh: "这次旅行给我留下了很深的＿。",
        vi: "Chuyến đi để lại cho tôi … sâu sắc.",
        en: "This trip left a deep … on me.",
        answer: "印象",
      },
    ],
  },
  {
    id: "r402",
    level: 4,
    type: "dialogue",
    topic: "work",
    title: {
      zh: "面试",
      vi: "Phỏng vấn",
      en: "A job interview",
    },
    lines: [
      {
        s: "A",
        zh: "请简单介绍一下你自己。",
        vi: "Mời bạn giới thiệu ngắn gọn về bản thân.",
        en: "Please briefly introduce yourself.",
        py: "qǐng jiǎn dān jiè shào yí xià nǐ zì jǐ",
      },
      {
        s: "B",
        zh: "我叫李华，大学学的是经济，毕业以后在一家银行工作了三年。",
        vi: "Tôi tên là Lý Hoa, đại học học ngành kinh tế, sau khi tốt nghiệp làm ở một ngân hàng ba năm.",
        en: "My name is Li Hua. I studied economics and worked at a bank for three years after graduating.",
        py: "wǒ jiào Lǐ Huá dà xué xué de shì jīng jì bì yè yǐ hòu zài yì jiā yín háng gōng zuò le sān nián",
      },
      {
        s: "A",
        zh: "你为什么想来我们公司？",
        vi: "Vì sao bạn muốn đến công ty chúng tôi?",
        en: "Why do you want to join our company?",
        py: "nǐ wèi shén me xiǎng lái wǒ men gōng sī",
      },
      {
        s: "B",
        zh: "因为贵公司发展得很快，我希望能在这里学到更多东西。",
        vi: "Vì quý công ty phát triển rất nhanh, tôi hy vọng có thể học được nhiều điều hơn ở đây.",
        en: "Because your company is growing fast and I hope to learn more here.",
        py: "yīn wèi guì gōng sī fā zhǎn de hěn kuài wǒ xī wàng néng zài zhè lǐ xué dào gèng duō dōng xi",
      },
    ],
    words: [
      {
        zh: "介绍",
        py: "jiè shào",
        vi: "giới thiệu",
        en: "introduce",
      },
      {
        zh: "经济",
        py: "jīng jì",
        vi: "kinh tế",
        en: "economics",
      },
      {
        zh: "毕业",
        py: "bì yè",
        vi: "tốt nghiệp",
        en: "graduate",
      },
      {
        zh: "银行",
        py: "yín háng",
        vi: "ngân hàng",
        en: "bank",
      },
      {
        zh: "发展",
        py: "fā zhǎn",
        vi: "phát triển",
        en: "develop",
      },
      {
        zh: "希望",
        py: "xī wàng",
        vi: "hy vọng",
        en: "hope",
      },
    ],
    grammar: [
      {
        id: "de-degree",
        pattern: "贵公司 + 发展 + 得 + 很快",
      },
      {
        id: "yinwei-suoyi",
        pattern: "因为 + 贵公司发展得很快",
      },
    ],
    questions: [
      {
        kind: "choice",
        zh: "李华大学学的是什么？",
        vi: "Lý Hoa học ngành gì ở đại học?",
        en: "What did Li Hua study at university?",
        options: ["法律", "经济", "医学", "中文"],
        answer: 1,
      },
      {
        kind: "choice",
        zh: "他在银行工作了几年？",
        vi: "Anh ấy làm ở ngân hàng mấy năm?",
        en: "How many years did he work at the bank?",
        options: ["一年", "两年", "三年", "五年"],
        answer: 2,
      },
      {
        kind: "fill",
        zh: "因为贵公司发展得很＿。",
        vi: "Vì quý công ty phát triển rất …",
        en: "Because your company is developing very …",
        answer: "快",
      },
    ],
  },
  {
    id: "r403",
    level: 4,
    type: "short",
    topic: "health",
    title: {
      zh: "健康的生活",
      vi: "Lối sống lành mạnh",
      en: "A healthy life",
    },
    lines: [
      {
        zh: "为了保持健康，很多人开始注意自己的饮食和运动。",
        vi: "Để giữ gìn sức khỏe, nhiều người bắt đầu chú ý đến ăn uống và vận động.",
        en: "To stay healthy, many people have started paying attention to their diet and exercise.",
        py: "wèi le bǎo chí jiàn kāng hěn duō rén kāi shǐ zhù yì zì jǐ de yǐn shí hé yùn dòng",
      },
      {
        zh: "医生建议我们每天至少运动半个小时，少吃油和盐，多吃水果和蔬菜。",
        vi: "Bác sĩ khuyên mỗi ngày nên vận động ít nhất nửa tiếng, ăn ít dầu mỡ và muối, ăn nhiều hoa quả và rau.",
        en: "Doctors suggest exercising at least half an hour a day, eating less oil and salt and more fruit and vegetables.",
        py: "yī shēng jiàn yì wǒ men měi tiān zhì shǎo yùn dòng bàn ge xiǎo shí shǎo chī yóu hé yán duō chī shuǐ guǒ hé shū cài",
      },
      {
        zh: "另外，保证充足的睡眠也非常重要。",
        vi: "Ngoài ra, đảm bảo ngủ đủ giấc cũng rất quan trọng.",
        en: "Also, getting enough sleep is very important.",
        py: "lìng wài bǎo zhèng chōng zú de shuì mián yě fēi cháng zhòng yào",
      },
    ],
    words: [
      {
        zh: "保持",
        py: "bǎo chí",
        vi: "giữ gìn",
        en: "maintain",
      },
      {
        zh: "健康",
        py: "jiàn kāng",
        vi: "sức khỏe",
        en: "health",
      },
      {
        zh: "注意",
        py: "zhù yì",
        vi: "chú ý",
        en: "pay attention",
      },
      {
        zh: "建议",
        py: "jiàn yì",
        vi: "khuyên, đề nghị",
        en: "suggest",
      },
      {
        zh: "至少",
        py: "zhì shǎo",
        vi: "ít nhất",
        en: "at least",
      },
      {
        zh: "睡眠",
        py: "shuì mián",
        vi: "giấc ngủ",
        en: "sleep",
      },
    ],
    grammar: [
      {
        id: "de-poss",
        pattern: "自己 + 的 + 饮食和运动",
      },
      {
        id: "time-first",
        pattern: "每天 + 至少运动半个小时",
      },
    ],
    questions: [
      {
        kind: "choice",
        zh: "医生建议每天至少运动多长时间？",
        vi: "Bác sĩ khuyên mỗi ngày vận động ít nhất bao lâu?",
        en: "How long should we exercise each day at least?",
        options: ["十分钟", "半个小时", "一个小时", "两个小时"],
        answer: 1,
      },
      {
        kind: "choice",
        zh: "下面哪个不是医生的建议？",
        vi: "Điều nào không phải lời khuyên của bác sĩ?",
        en: "Which is NOT the doctor's advice?",
        options: ["少吃油和盐", "多吃水果", "多喝咖啡", "保证睡眠"],
        answer: 2,
      },
      {
        kind: "fill",
        zh: "另外，保证充足的＿也非常重要。",
        vi: "Ngoài ra, đảm bảo đủ … cũng rất quan trọng.",
        en: "Also, enough … is very important.",
        answer: "睡眠",
      },
    ],
  },
  {
    id: "r404",
    level: 4,
    type: "article",
    topic: "school",
    title: {
      zh: "读书的好处",
      vi: "Lợi ích của việc đọc sách",
      en: "The benefits of reading",
    },
    lines: [
      {
        zh: "读书不仅能让我们学到知识，还能让我们更了解这个世界。",
        vi: "Đọc sách không chỉ giúp ta học được kiến thức mà còn giúp ta hiểu thế giới hơn.",
        en: "Reading not only gives us knowledge but also helps us understand the world better.",
        py: "dú shū bù jǐn néng ràng wǒ men xué dào zhī shi hái néng ràng wǒ men gèng liǎo jiě zhè ge shì jiè",
      },
      {
        zh: "通过读书，我们可以认识不同的人，了解不同的文化。",
        vi: "Qua đọc sách, ta có thể biết những con người khác nhau, hiểu những nền văn hóa khác nhau.",
        en: "Through books we can meet different people and learn about different cultures.",
        py: "tōng guò dú shū wǒ men kě yǐ rèn shi bù tóng de rén liǎo jiě bù tóng de wén huà",
      },
      {
        zh: "即使每天只读二十分钟，坚持下去，你也会发现自己的变化。",
        vi: "Dù mỗi ngày chỉ đọc hai mươi phút, cứ kiên trì thì bạn cũng sẽ thấy mình thay đổi.",
        en: "Even if you read only twenty minutes a day, keep it up and you will see yourself change.",
        py: "jí shǐ měi tiān zhǐ dú èr shí fēn zhōng jiān chí xià qu nǐ yě huì fā xiàn zì jǐ de biàn huà",
      },
    ],
    words: [
      {
        zh: "知识",
        py: "zhī shi",
        vi: "kiến thức",
        en: "knowledge",
      },
      {
        zh: "了解",
        py: "liǎo jiě",
        vi: "hiểu",
        en: "understand",
      },
      {
        zh: "世界",
        py: "shì jiè",
        vi: "thế giới",
        en: "world",
      },
      {
        zh: "文化",
        py: "wén huà",
        vi: "văn hóa",
        en: "culture",
      },
      {
        zh: "坚持",
        py: "jiān chí",
        vi: "kiên trì",
        en: "persist",
      },
      {
        zh: "变化",
        py: "biàn huà",
        vi: "thay đổi",
        en: "change",
      },
    ],
    grammar: [
      {
        id: "hui-neng",
        pattern: "不仅 + 能 + 让我们学到知识，还 + 能 + 让我们更了解这个世界",
      },
      {
        id: "de-poss",
        pattern: "自己 + 的 + 变化",
      },
    ],
    questions: [
      {
        kind: "choice",
        zh: "读书能让我们怎么样？",
        vi: "Đọc sách giúp chúng ta điều gì?",
        en: "What can reading do for us?",
        options: ["学到知识、了解世界", "赚很多钱", "交很多朋友", "身体更好"],
        answer: 0,
      },
      {
        kind: "choice",
        zh: "作者说每天读多长时间也有用？",
        vi: "Tác giả nói mỗi ngày đọc bao lâu cũng có ích?",
        en: "How long a day does the author say is still useful?",
        options: ["十分钟", "二十分钟", "一个小时", "两个小时"],
        answer: 1,
      },
      {
        kind: "fill",
        zh: "即使每天只读二十分钟，＿下去，你也会发现自己的变化。",
        vi: "Dù chỉ đọc hai mươi phút, cứ … thì sẽ thấy thay đổi.",
        en: "Even twenty minutes a day — … and you will see a change.",
        answer: "坚持",
      },
    ],
  },
];

export const R_PASSAGE_BY_ID = new Map(R_PASSAGES.map((p) => [p.id, p]));
