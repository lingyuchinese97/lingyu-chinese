/**
 * Thư viện LingYu — bài ngữ pháp do LingYu biên soạn (công khai), song ngữ vi / en.
 * Mỗi bài: giới thiệu, cấu trúc (từng phần, tô màu theo vai trò), cách dùng, ý nghĩa, lưu ý, ví dụ (pinyin + dịch), bài tập nhanh.
 */
import type { LibTone } from "./vocab-sets";

export type L = { vi: string; en: string };
/** Vai trò của một phần trong cấu trúc: chủ ngữ / từ khoá ngữ pháp / phần cần điền / phần phụ. */
export type GPartKind = "subj" | "key" | "slot" | "end";
export type GPart = { zh: string; kind: GPartKind; label: L };
export type GExample = { zh: string; py: string; vi: string; en: string; emoji: string };
export type GQuiz = { q: string; options: string[]; answer: number; explain: L; prompt?: L };

export const LIB_GRAMMAR_TOPICS = [
  "basic",
  "question",
  "describe",
  "place",
  "adverb",
  "modal",
  "aspect",
  "compare",
  "connect",
  "special",
] as const;
export type LibGrammarTopic = (typeof LIB_GRAMMAR_TOPICS)[number];

export type LibGrammar = {
  id: string;
  hsk: number;
  /** Thứ tự trong cấp HSK. */
  no: number;
  zh: string;
  py: string;
  emoji: string;
  tone: LibTone;
  topic: LibGrammarTopic;
  /** Nghĩa ngắn, vd "(thì) là … (mà)". */
  name: L;
  /** Một câu tóm tắt cách dùng. */
  summary: L;
  intro: L;
  structure: GPart[];
  usage: L[];
  meaning: L[];
  notes: L[];
  examples: GExample[];
  quiz: GQuiz[];
  related: string[];
  added: string;
};

const p = (zh: string, kind: GPartKind, vi: string, en: string): GPart => ({ zh, kind, label: { vi, en } });
const l = (rows: [string, string][]): L[] => rows.map(([vi, en]) => ({ vi, en }));
const e = (rows: [string, string, string, string, string][]): GExample[] =>
  rows.map(([zh, py, vi, en, emoji]) => ({ zh, py, vi, en, emoji }));
const PICK: L = { vi: "Chọn đáp án đúng", en: "Choose the right answer" };
const CORRECT: L = { vi: "Chọn câu đúng", en: "Choose the correct sentence" };
const q = (zh: string, options: string[], answer: number, vi: string, en: string, prompt: L = PICK): GQuiz => ({
  q: zh,
  options,
  answer,
  explain: { vi, en },
  prompt,
});

export const LIB_GRAMMAR: LibGrammar[] = [
  {
    id: "shi",
    hsk: 1,
    no: 1,
    zh: "是",
    py: "shì",
    emoji: "📘",
    tone: "sky",
    topic: "basic",
    name: { vi: "là", en: "to be" },
    summary: { vi: "Nối chủ ngữ với danh từ: “A là B”.", en: "Links a subject with a noun: “A is B”." },
    intro: {
      vi: "是 nối chủ ngữ với một danh từ để giới thiệu, định nghĩa hoặc chỉ ra sự vật: “A là B”.",
      en: "是 links a subject with a noun to introduce, define or point something out: “A is B”.",
    },
    structure: [p("S", "subj", "chủ ngữ", "subject"), p("是", "key", "là", "is"), p("N", "slot", "danh từ", "noun")],
    usage: l([
      ["Giới thiệu người, nghề nghiệp, quốc tịch: 我是学生.", "Introduce people, jobs, nationality: 我是学生."],
      ["Chỉ ra, định nghĩa sự vật: 这是我的书.", "Point out or define things: 这是我的书."],
      ["Phủ định bằng 不是: 他不是老师.", "Negate with 不是: 他不是老师."],
    ]),
    meaning: l([
      ["là", "is / am / are"],
      ["không phải là (不是)", "is not (不是)"],
    ]),
    notes: l([
      [
        "Không dùng 是 trước tính từ: nói 我很忙, không nói 我是忙.",
        "Don't put 是 before adjectives: say 我很忙, not 我是忙.",
      ],
      ["Phủ định của 是 luôn là 不是, không dùng 没是.", "The negative is always 不是, never 没是."],
    ]),
    examples: e([
      ["我是学生。", "Wǒ shì xuésheng.", "Tôi là học sinh.", "I am a student.", "🧑‍🎓"],
      ["他是我的老师。", "Tā shì wǒ de lǎoshī.", "Anh ấy là thầy giáo của tôi.", "He is my teacher.", "🧑‍🏫"],
      ["这是我的书。", "Zhè shì wǒ de shū.", "Đây là sách của tôi.", "This is my book.", "📘"],
      ["她不是中国人。", "Tā bú shì Zhōngguó rén.", "Cô ấy không phải người Trung Quốc.", "She is not Chinese.", "🌏"],
    ]),
    quiz: [
      q(
        "我___学生。",
        ["是", "有", "在", "很"],
        0,
        "Nối chủ ngữ với danh từ (học sinh) → 是.",
        "Linking the subject with a noun → 是.",
      ),
      q(
        "她___忙。",
        ["是", "很", "有", "的"],
        1,
        "Trước tính từ dùng 很, không dùng 是.",
        "Use 很 before adjectives, not 是.",
      ),
    ],
    related: ["you", "ma", "de"],
    added: "2026-10-05",
  },
  {
    id: "you",
    hsk: 1,
    no: 2,
    zh: "有",
    py: "yǒu",
    emoji: "🐱",
    tone: "rose",
    topic: "basic",
    name: { vi: "có, sở hữu", en: "to have; there is" },
    summary: { vi: "Diễn tả sở hữu hoặc sự tồn tại.", en: "Expresses possession or existence." },
    intro: {
      vi: "有 diễn tả sở hữu (ai có gì) hoặc sự tồn tại (ở đâu có gì).",
      en: "有 expresses possession (someone has something) or existence (there is something somewhere).",
    },
    structure: [
      p("S / Nơi chốn", "subj", "chủ ngữ / nơi chốn", "subject / place"),
      p("有", "key", "có", "has"),
      p("N", "slot", "danh từ", "noun"),
    ],
    usage: l([
      ["Sở hữu: 我有一个哥哥.", "Possession: 我有一个哥哥."],
      ["Tồn tại (nơi chốn đứng trước): 桌子上有一本书.", "Existence (place first): 桌子上有一本书."],
      ["Phủ định bằng 没有: 他没有时间.", "Negate with 没有: 他没有时间."],
    ]),
    meaning: l([
      ["có", "to have; there is / are"],
      ["không có (没有)", "not have; there isn't (没有)"],
    ]),
    notes: l([
      ["Phủ định của 有 là 没有, không dùng 不有.", "The negative of 有 is 没有, never 不有."],
      [
        "Khi nói về nơi chốn, đặt nơi chốn trước 有: 教室里有学生.",
        "For existence, put the place before 有: 教室里有学生.",
      ],
    ]),
    examples: e([
      ["我有一只猫。", "Wǒ yǒu yì zhī māo.", "Tôi có một con mèo.", "I have a cat.", "🐱"],
      [
        "我家有四口人。",
        "Wǒ jiā yǒu sì kǒu rén.",
        "Nhà tôi có bốn người.",
        "There are four people in my family.",
        "🏠",
      ],
      [
        "桌子上有一本书。",
        "Zhuōzi shang yǒu yì běn shū.",
        "Trên bàn có một quyển sách.",
        "There is a book on the table.",
        "📖",
      ],
      ["他没有时间。", "Tā méiyǒu shíjiān.", "Anh ấy không có thời gian.", "He doesn't have time.", "⏳"],
    ]),
    quiz: [
      q("我___一个姐姐。", ["有", "是", "在", "个"], 0, "Nói về sở hữu → 有.", "Possession → 有."),
      q("他___有钱。", ["不", "没", "很", "是"], 1, "Phủ định của 有 là 没有.", "The negative of 有 is 没有."),
    ],
    related: ["shi", "zai", "bu-mei"],
    added: "2026-10-05",
  },
  {
    id: "ma",
    hsk: 1,
    no: 3,
    zh: "吗",
    py: "ma",
    emoji: "❓",
    tone: "amber",
    topic: "question",
    name: { vi: "câu hỏi có / không", en: "yes/no questions" },
    summary: { vi: "Thêm vào cuối câu để hỏi có / không.", en: "Added to the end of a statement to ask yes/no." },
    intro: {
      vi: "Thêm 吗 vào cuối câu trần thuật để tạo câu hỏi có / không.",
      en: "Add 吗 to the end of a statement to ask a yes/no question.",
    },
    structure: [
      p("Câu trần thuật", "subj", "câu kể", "statement"),
      p("吗", "key", "không?", "question particle"),
      p("？", "end", "dấu hỏi", "question mark"),
    ],
    usage: l([
      ["Hỏi có / không: 你是学生吗？", "Yes/no questions: 你是学生吗？"],
      ["Trả lời bằng cách lặp lại động từ: 是 / 不是.", "Answer by repeating the verb: 是 / 不是."],
      ["Hỏi thăm lịch sự: 你好吗？", "Polite greetings: 你好吗？"],
    ]),
    meaning: l([["… không? / … phải không?", "…? (yes/no)"]]),
    notes: l([
      [
        "Không dùng 吗 khi câu đã có từ để hỏi (什么, 谁, 哪儿, 几…).",
        "Don't use 吗 with question words (什么, 谁, 哪儿, 几…).",
      ],
      ["吗 đọc thanh nhẹ, ngắn.", "吗 is read in the neutral tone."],
    ]),
    examples: e([
      ["你是学生吗？", "Nǐ shì xuésheng ma?", "Bạn là học sinh phải không?", "Are you a student?", "🧑‍🎓"],
      ["你好吗？", "Nǐ hǎo ma?", "Bạn khỏe không?", "How are you?", "😊"],
      ["你喜欢喝茶吗？", "Nǐ xǐhuan hē chá ma?", "Bạn có thích uống trà không?", "Do you like tea?", "🍵"],
      ["他是中国人吗？", "Tā shì Zhōngguó rén ma?", "Anh ấy là người Trung Quốc à?", "Is he Chinese?", "🌏"],
    ]),
    quiz: [
      q("你是老师___？", ["吗", "呢", "的", "了"], 0, "Câu hỏi có / không → thêm 吗.", "Yes/no question → 吗."),
      q(
        "",
        ["你叫什么名字吗？", "你叫什么名字？", "你吗叫什么名字？", "吗你叫什么名字？"],
        1,
        "Câu đã có 什么 thì không thêm 吗.",
        "With 什么 already there, don't add 吗.",
        CORRECT,
      ),
    ],
    related: ["ne", "shi"],
    added: "2026-10-05",
  },
  {
    id: "ne",
    hsk: 1,
    no: 4,
    zh: "呢",
    py: "ne",
    emoji: "💬",
    tone: "violet",
    topic: "question",
    name: { vi: "còn … thì sao?", en: "what about …?" },
    summary: { vi: "Hỏi lại “còn … thì sao?” hoặc hỏi vị trí.", en: "Asks “what about …?” or where something is." },
    intro: {
      vi: "呢 đặt sau danh từ / đại từ để hỏi lại “còn … thì sao?”, hoặc cuối câu hỏi để giọng nhẹ nhàng hơn.",
      en: "呢 after a noun or pronoun asks “what about …?”; at the end of a question it softens the tone.",
    },
    structure: [
      p("N / Đại từ", "subj", "danh từ / đại từ", "noun / pronoun"),
      p("呢", "key", "còn … thì sao?", "what about"),
      p("？", "end", "dấu hỏi", "question mark"),
    ],
    usage: l([
      ["Hỏi lại câu vừa hỏi: 我很好，你呢？", "Bounce the question back: 我很好，你呢？"],
      ["Hỏi vị trí khi lược động từ: 我的书呢？", "Ask where something is: 我的书呢？"],
      ["Làm câu hỏi có từ để hỏi mềm hơn: 你在做什么呢？", "Soften a wh-question: 你在做什么呢？"],
    ]),
    meaning: l([
      ["còn … thì sao?", "what about …?"],
      ["… đâu? (hỏi vị trí)", "where is …?"],
    ]),
    notes: l([
      ["Không dùng 呢 thay cho 吗 trong câu hỏi có / không.", "呢 doesn't replace 吗 in yes/no questions."],
      ["呢 đọc thanh nhẹ.", "呢 is read in the neutral tone."],
    ]),
    examples: e([
      ["我很好，你呢？", "Wǒ hěn hǎo, nǐ ne?", "Tôi khỏe, còn bạn?", "I'm fine, and you?", "🙂"],
      [
        "我是越南人，你呢？",
        "Wǒ shì Yuènán rén, nǐ ne?",
        "Tôi là người Việt Nam, còn bạn?",
        "I'm Vietnamese, and you?",
        "🌏",
      ],
      ["我的手机呢？", "Wǒ de shǒujī ne?", "Điện thoại của tôi đâu rồi?", "Where's my phone?", "📱"],
      ["他在哪儿呢？", "Tā zài nǎr ne?", "Anh ấy đang ở đâu thế?", "Where is he?", "📍"],
    ]),
    quiz: [
      q("我喝咖啡，你___？", ["呢", "吗", "的", "了"], 0, "Hỏi lại “còn bạn?” → 呢.", "“And you?” → 呢."),
      q(
        "你是学生___？",
        ["呢", "吗", "的", "了"],
        1,
        "Câu hỏi có / không dùng 吗, không dùng 呢.",
        "Yes/no questions use 吗, not 呢.",
      ),
    ],
    related: ["ma", "zai"],
    added: "2026-10-05",
  },
  {
    id: "de",
    hsk: 1,
    no: 5,
    zh: "的",
    py: "de",
    emoji: "🧩",
    tone: "green",
    topic: "describe",
    name: { vi: "của; mà (định ngữ)", en: "’s; that (modifier)" },
    summary: { vi: "Nối định ngữ với danh từ.", en: "Links a modifier to a noun." },
    intro: {
      vi: "的 nối định ngữ (người sở hữu, tính chất, cụm động từ) với danh từ đứng sau: “của”, “mà”.",
      en: "的 links a modifier (owner, quality, verb phrase) to the noun after it: “’s”, “of”, “that”.",
    },
    structure: [
      p("Định ngữ", "subj", "người sở hữu / tính chất", "owner / quality"),
      p("的", "key", "của / mà", "’s / that"),
      p("N", "slot", "danh từ", "noun"),
    ],
    usage: l([
      ["Sở hữu: 我的书 (sách của tôi).", "Possession: 我的书 (my book)."],
      ["Tính chất: 漂亮的衣服 (bộ quần áo đẹp).", "Quality: 漂亮的衣服 (pretty clothes)."],
      ["Cụm động từ làm định ngữ: 我买的书 (sách tôi mua).", "Verb phrases: 我买的书 (the book I bought)."],
    ]),
    meaning: l([
      ["của", "’s / of"],
      ["mà (người, vật …)", "that / which"],
    ]),
    notes: l([
      ["Quan hệ thân thiết thường bỏ 的: 我妈妈, 我们学校.", "Close relations often drop 的: 我妈妈, 我们学校."],
      ["Tính từ một âm tiết + danh từ thường không cần 的: 好朋友.", "One-syllable adjectives often skip 的: 好朋友."],
    ]),
    examples: e([
      ["这是我的书。", "Zhè shì wǒ de shū.", "Đây là sách của tôi.", "This is my book.", "📘"],
      ["她是我的朋友。", "Tā shì wǒ de péngyou.", "Cô ấy là bạn của tôi.", "She is my friend.", "👭"],
      [
        "这是很漂亮的衣服。",
        "Zhè shì hěn piàoliang de yīfu.",
        "Đây là bộ quần áo rất đẹp.",
        "These are very pretty clothes.",
        "👗",
      ],
      [
        "我买的苹果很甜。",
        "Wǒ mǎi de píngguǒ hěn tián.",
        "Táo tôi mua rất ngọt.",
        "The apples I bought are sweet.",
        "🍎",
      ],
    ]),
    quiz: [
      q(
        "这是老师___书。",
        ["的", "是", "有", "了"],
        0,
        "Sở hữu “sách của thầy” → 的.",
        "Possession “the teacher's book” → 的.",
      ),
      q(
        "我买___衣服很好看。",
        ["的", "了", "吗", "在"],
        0,
        "Cụm “tôi mua” bổ nghĩa cho 衣服 → 的.",
        "“I bought” modifies 衣服 → 的.",
      ),
    ],
    related: ["shi", "shi-de"],
    added: "2026-10-05",
  },
  {
    id: "zai",
    hsk: 1,
    no: 6,
    zh: "在",
    py: "zài",
    emoji: "📍",
    tone: "sky",
    topic: "place",
    name: { vi: "ở, tại", en: "at, in" },
    summary: {
      vi: "Cho biết vị trí của người / vật hoặc nơi diễn ra hành động.",
      en: "Shows where someone is or where an action happens.",
    },
    intro: {
      vi: "在 cho biết vị trí: làm động từ “ở”, hoặc làm giới từ trước động từ: “làm gì ở đâu”.",
      en: "在 shows location: as a verb “to be at”, or as a preposition before the verb: “do something at a place”.",
    },
    structure: [
      p("S", "subj", "chủ ngữ", "subject"),
      p("在", "key", "ở", "at"),
      p("Nơi chốn", "slot", "địa điểm", "place"),
      p("(V)", "end", "(động từ)", "(verb)"),
    ],
    usage: l([
      ["Ai / cái gì ở đâu: 我在家.", "Where someone is: 我在家."],
      [
        "Làm gì ở đâu (nơi chốn trước động từ): 我在学校学习.",
        "Doing something somewhere (place before verb): 我在学校学习.",
      ],
      ["Phủ định bằng 不在: 妈妈不在家.", "Negate with 不在: 妈妈不在家."],
    ]),
    meaning: l([["ở, tại", "at, in"]]),
    notes: l([
      ["Nơi chốn đứng trước động từ: không nói 我学习在学校.", "The place goes before the verb: not 我学习在学校."],
      ["Hỏi vị trí: …在哪儿？", "Ask for a location: …在哪儿？"],
    ]),
    examples: e([
      ["我在家。", "Wǒ zài jiā.", "Tôi ở nhà.", "I'm at home.", "🏠"],
      ["他在北京工作。", "Tā zài Běijīng gōngzuò.", "Anh ấy làm việc ở Bắc Kinh.", "He works in Beijing.", "🏙️"],
      ["你在哪儿？", "Nǐ zài nǎr?", "Bạn đang ở đâu?", "Where are you?", "📍"],
      ["妈妈不在厨房。", "Māma bú zài chúfáng.", "Mẹ không ở trong bếp.", "Mom isn't in the kitchen.", "🍳"],
    ]),
    quiz: [
      q(
        "我___学校学习。",
        ["在", "是", "有", "的"],
        0,
        "Nơi chốn trước động từ, dùng 在.",
        "Location before the verb → 在.",
      ),
      q(
        "",
        ["我学习在学校。", "我在学校学习。", "在我学校学习。", "我学校在学习。"],
        1,
        "Cụm 在 + nơi chốn đứng trước động từ.",
        "在 + place comes before the verb.",
        CORRECT,
      ),
    ],
    related: ["you", "zhengzai"],
    added: "2026-10-05",
  },
  {
    id: "ye",
    hsk: 1,
    no: 7,
    zh: "也",
    py: "yě",
    emoji: "➕",
    tone: "orange",
    topic: "adverb",
    name: { vi: "cũng", en: "also, too" },
    summary: { vi: "“Cũng”, đứng trước động từ / tính từ.", en: "“Also”, placed before the verb or adjective." },
    intro: {
      vi: "也 nghĩa “cũng”, đứng sau chủ ngữ và trước động từ / tính từ.",
      en: "也 means “also / too”; it goes after the subject and before the verb or adjective.",
    },
    structure: [
      p("S", "subj", "chủ ngữ", "subject"),
      p("也", "key", "cũng", "also"),
      p("V / Adj", "slot", "động từ / tính từ", "verb / adjective"),
    ],
    usage: l([
      ["Điều tương tự cũng đúng: 我也是学生.", "The same applies: 我也是学生."],
      ["Đi với phủ định: 我也不知道 (tôi cũng không biết).", "With negation: 我也不知道 (I don't know either)."],
      ["Dùng cùng 都: 我们也都去.", "With 都: 我们也都去."],
    ]),
    meaning: l([["cũng", "also, too, either"]]),
    notes: l([
      [
        "也 luôn đứng trước động từ, không đứng đầu câu: không nói 也我去.",
        "也 always goes before the verb, never first: not 也我去.",
      ],
      ["Thứ tự với 都 là 也都, không dùng 都也.", "Use 也都, not 都也."],
    ]),
    examples: e([
      ["我也是学生。", "Wǒ yě shì xuésheng.", "Tôi cũng là học sinh.", "I'm a student too.", "🧑‍🎓"],
      [
        "他喜欢喝茶，我也喜欢。",
        "Tā xǐhuan hē chá, wǒ yě xǐhuan.",
        "Anh ấy thích uống trà, tôi cũng thích.",
        "He likes tea, and so do I.",
        "🍵",
      ],
      ["我也不知道。", "Wǒ yě bù zhīdào.", "Tôi cũng không biết.", "I don't know either.", "🤷"],
      [
        "她也会说汉语。",
        "Tā yě huì shuō Hànyǔ.",
        "Cô ấy cũng biết nói tiếng Trung.",
        "She can speak Chinese too.",
        "🗣️",
      ],
    ]),
    quiz: [
      q("我___喜欢吃饺子。", ["也", "都", "很", "在"], 0, "“Tôi cũng thích” → 也.", "“I also like” → 也."),
      q(
        "",
        ["也我是老师。", "我是也老师。", "我也是老师。", "我是老师也。"],
        2,
        "也 đứng sau chủ ngữ, trước động từ.",
        "也 goes after the subject, before the verb.",
        CORRECT,
      ),
    ],
    related: ["dou"],
    added: "2026-10-05",
  },
  {
    id: "dou",
    hsk: 1,
    no: 8,
    zh: "都",
    py: "dōu",
    emoji: "👥",
    tone: "green",
    topic: "adverb",
    name: { vi: "đều, tất cả", en: "all, both" },
    summary: { vi: "Tổng kết những người / vật đứng trước nó.", en: "Sums up the people or things before it." },
    intro: {
      vi: "都 nghĩa “đều, tất cả”, đứng trước động từ, tổng kết những người / vật đã nói trước đó.",
      en: "都 means “all / both”; it goes before the verb and sums up the people or things mentioned before it.",
    },
    structure: [
      p("S (số nhiều)", "subj", "chủ ngữ số nhiều", "plural subject"),
      p("都", "key", "đều", "all"),
      p("V / Adj", "slot", "động từ / tính từ", "verb / adjective"),
    ],
    usage: l([
      ["Tất cả đều: 我们都是学生.", "All of them: 我们都是学生."],
      [
        "Với từ để hỏi để nói “mọi”: 谁都知道 (ai cũng biết).",
        "With question words for “every”: 谁都知道 (everyone knows).",
      ],
      ["不都 = không phải tất cả; 都不 = tất cả đều không.", "不都 = not all; 都不 = none."],
    ]),
    meaning: l([["đều, tất cả", "all, both"]]),
    notes: l([
      ["Những người / vật được tổng kết phải đứng trước 都.", "What 都 sums up must come before it."],
      ["都不 và 不都 nghĩa khác nhau.", "都不 and 不都 mean different things."],
    ]),
    examples: e([
      ["我们都是学生。", "Wǒmen dōu shì xuésheng.", "Chúng tôi đều là học sinh.", "We are all students.", "👥"],
      ["他们都喜欢喝咖啡。", "Tāmen dōu xǐhuan hē kāfēi.", "Họ đều thích uống cà phê.", "They all like coffee.", "☕"],
      [
        "我和姐姐都在北京。",
        "Wǒ hé jiějie dōu zài Běijīng.",
        "Tôi và chị gái đều ở Bắc Kinh.",
        "My sister and I are both in Beijing.",
        "🏙️",
      ],
      [
        "这些菜都不辣。",
        "Zhèxiē cài dōu bú là.",
        "Những món này đều không cay.",
        "None of these dishes are spicy.",
        "🥬",
      ],
    ]),
    quiz: [
      q("我们___是越南人。", ["都", "也", "很", "的"], 0, "“Chúng tôi đều là” → 都.", "“We are all” → 都."),
      q(
        "他们不___去。",
        ["都", "也", "在", "很"],
        0,
        "不都 = không phải tất cả đều đi.",
        "不都 = not all of them are going.",
      ),
    ],
    related: ["ye"],
    added: "2026-10-05",
  },
  {
    id: "bu-mei",
    hsk: 1,
    no: 9,
    zh: "不 / 没",
    py: "bù / méi",
    emoji: "🚫",
    tone: "rose",
    topic: "basic",
    name: { vi: "không; chưa", en: "not; didn't" },
    summary: {
      vi: "Hai cách phủ định: 不 (hiện tại, thói quen) và 没 (việc đã qua, 有).",
      en: "Two negations: 不 (present, habits) and 没 (past, 有).",
    },
    intro: {
      vi: "不 phủ định hiện tại, tương lai, thói quen, ý muốn; 没 (没有) phủ định việc đã xảy ra và phủ định 有.",
      en: "不 negates the present, future, habits and wishes; 没 (没有) negates past actions and 有.",
    },
    structure: [
      p("S", "subj", "chủ ngữ", "subject"),
      p("不 / 没", "key", "không / chưa", "not / didn't"),
      p("V / Adj", "slot", "động từ / tính từ", "verb / adjective"),
    ],
    usage: l([
      ["不 cho thói quen, ý muốn, tính chất: 我不喝咖啡.", "不 for habits, wishes, qualities: 我不喝咖啡."],
      ["没 cho việc đã không xảy ra: 昨天我没去.", "没 for things that didn't happen: 昨天我没去."],
      ["有 chỉ phủ định bằng 没: 我没有钱.", "有 is only negated with 没: 我没有钱."],
    ]),
    meaning: l([
      ["不: không", "不: not"],
      ["没: không, chưa (đã không)", "没: didn't, haven't"],
    ]),
    notes: l([
      ["不 đổi thành thanh 2 (bú) trước thanh 4: 不是 bú shì.", "不 becomes bú before a 4th tone: 不是 bú shì."],
      ["Câu có 没 không dùng 了: nói 我没去, không nói 我没去了.", "Don't use 了 with 没: say 我没去, not 我没去了."],
    ]),
    examples: e([
      ["我不喝咖啡。", "Wǒ bù hē kāfēi.", "Tôi không uống cà phê.", "I don't drink coffee.", "☕"],
      [
        "昨天我没去学校。",
        "Zuótiān wǒ méi qù xuéxiào.",
        "Hôm qua tôi không đi học.",
        "I didn't go to school yesterday.",
        "🏫",
      ],
      ["他没有哥哥。", "Tā méiyǒu gēge.", "Anh ấy không có anh trai.", "He doesn't have an older brother.", "👦"],
      ["明天我不上班。", "Míngtiān wǒ bú shàngbān.", "Ngày mai tôi không đi làm.", "I'm not working tomorrow.", "💼"],
    ]),
    quiz: [
      q(
        "昨天我___看电视。",
        ["不", "没", "很", "也"],
        1,
        "Việc trong quá khứ đã không xảy ra → 没.",
        "A past action that didn't happen → 没.",
      ),
      q("我___喜欢吃辣的。", ["不", "没", "没有", "了"], 0, "Sở thích, thói quen → 不.", "Likes and habits → 不."),
    ],
    related: ["you", "le"],
    added: "2026-10-05",
  },
  {
    id: "xiang",
    hsk: 1,
    no: 10,
    zh: "想",
    py: "xiǎng",
    emoji: "💭",
    tone: "violet",
    topic: "modal",
    name: { vi: "muốn; nhớ", en: "want to; miss" },
    summary: { vi: "想 + động từ: muốn làm gì.", en: "想 + verb: want to do something." },
    intro: {
      vi: "想 + động từ diễn tả mong muốn, dự định: “muốn làm gì”. 想 + người: “nhớ ai”.",
      en: "想 + verb expresses a wish or plan: “want to / would like to”. 想 + person: “miss someone”.",
    },
    structure: [
      p("S", "subj", "chủ ngữ", "subject"),
      p("想", "key", "muốn", "want to"),
      p("V", "slot", "động từ", "verb"),
    ],
    usage: l([
      ["Muốn làm gì: 我想去中国.", "Want to do: 我想去中国."],
      ["Phủ định: 不想.", "Negation: 不想."],
      ["想 + người: nhớ ai: 我想妈妈.", "想 + person: miss someone: 我想妈妈."],
    ]),
    meaning: l([
      ["muốn", "want to, would like to"],
      ["nhớ; nghĩ", "miss; think"],
    ]),
    notes: l([
      ["想 nhẹ nhàng hơn 要 (要 = muốn chắc chắn / cần).", "想 is softer than 要 (要 = firmly want / need)."],
      ["Hỏi: 你想…吗？ hoặc 你想不想…？", "Ask: 你想…吗？ or 你想不想…？"],
    ]),
    examples: e([
      [
        "我想去中国旅游。",
        "Wǒ xiǎng qù Zhōngguó lǚyóu.",
        "Tôi muốn đi du lịch Trung Quốc.",
        "I want to travel to China.",
        "✈️",
      ],
      ["你想喝什么？", "Nǐ xiǎng hē shénme?", "Bạn muốn uống gì?", "What would you like to drink?", "🥤"],
      ["我不想吃饭。", "Wǒ bù xiǎng chī fàn.", "Tôi không muốn ăn cơm.", "I don't want to eat.", "🍚"],
      ["我很想妈妈。", "Wǒ hěn xiǎng māma.", "Con rất nhớ mẹ.", "I miss my mom a lot.", "💗"],
    ]),
    quiz: [
      q("我___学习汉语。", ["想", "是", "有", "的"], 0, "Muốn làm gì → 想 + động từ.", "Want to do → 想 + verb."),
      q("你___不想去？", ["想", "要", "会", "在"], 0, "Câu hỏi chính phản: 想不想.", "A-not-A question: 想不想."),
    ],
    related: ["hui"],
    added: "2026-10-05",
  },
  {
    id: "hui",
    hsk: 1,
    no: 11,
    zh: "会",
    py: "huì",
    emoji: "🎓",
    tone: "amber",
    topic: "modal",
    name: { vi: "biết (làm gì); sẽ", en: "can (skill); will" },
    summary: { vi: "Kỹ năng học được, hoặc dự đoán “sẽ”.", en: "A learned skill, or a prediction “will”." },
    intro: {
      vi: "会 + động từ: biết làm gì (kỹ năng phải học), hoặc sẽ / có khả năng xảy ra.",
      en: "会 + verb: can (a learned skill), or will / is likely to.",
    },
    structure: [
      p("S", "subj", "chủ ngữ", "subject"),
      p("会", "key", "biết / sẽ", "can / will"),
      p("V", "slot", "động từ", "verb"),
    ],
    usage: l([
      ["Kỹ năng học được: 我会说汉语.", "Learned skills: 我会说汉语."],
      ["Dự đoán: 明天会下雨.", "Predictions: 明天会下雨."],
      ["Phủ định: 不会.", "Negation: 不会."],
    ]),
    meaning: l([
      ["biết (làm gì)", "can, know how to"],
      ["sẽ", "will, would"],
    ]),
    notes: l([
      [
        "会 dùng cho kỹ năng phải học (nói tiếng, bơi, lái xe), khác 能 (có điều kiện / được phép).",
        "会 is for learned skills (languages, swimming, driving), unlike 能 (able / allowed).",
      ],
    ]),
    examples: e([
      [
        "我会说一点儿汉语。",
        "Wǒ huì shuō yìdiǎnr Hànyǔ.",
        "Tôi biết nói một chút tiếng Trung.",
        "I can speak a little Chinese.",
        "🗣️",
      ],
      ["你会做饭吗？", "Nǐ huì zuò fàn ma?", "Bạn có biết nấu ăn không?", "Can you cook?", "🍳"],
      ["明天会下雨。", "Míngtiān huì xià yǔ.", "Ngày mai sẽ mưa.", "It will rain tomorrow.", "🌧️"],
      ["他不会开车。", "Tā bú huì kāi chē.", "Anh ấy không biết lái xe.", "He can't drive.", "🚗"],
    ]),
    quiz: [
      q("我___游泳。", ["会", "想", "是", "在"], 0, "Kỹ năng học được (bơi) → 会.", "A learned skill (swimming) → 会."),
      q("明天___下雪吗？", ["会", "是", "有", "的"], 0, "Dự đoán → 会.", "Prediction → 会."),
    ],
    related: ["xiang"],
    added: "2026-10-05",
  },
  {
    id: "shi-de",
    hsk: 2,
    no: 1,
    zh: "是 … 的",
    py: "shì … de",
    emoji: "🔎",
    tone: "rose",
    topic: "basic",
    name: { vi: "(chính) là … (mà)", en: "it was … that" },
    summary: {
      vi: "Nhấn mạnh thời gian, nơi chốn, cách thức hoặc đối tượng của hành động đã xảy ra.",
      en: "Emphasizes the time, place, manner or person of a past action.",
    },
    intro: {
      vi: "“是 … 的” dùng để nhấn mạnh thời gian, nơi chốn, cách thức hoặc đối tượng của một hành động đã xảy ra.",
      en: "“是 … 的” emphasizes the time, place, manner or person of an action that already happened.",
    },
    structure: [
      p("S", "subj", "chủ ngữ", "subject"),
      p("是", "key", "là", "is"),
      p("thời gian / nơi chốn / cách thức", "slot", "điều cần nhấn mạnh", "what is emphasized"),
      p("V", "slot", "động từ", "verb"),
      p("的", "key", "(trợ từ)", "(particle)"),
    ],
    usage: l([
      ["Nhấn mạnh thời gian: 我是昨天来的.", "Time: 我是昨天来的."],
      ["Nhấn mạnh nơi chốn: 他是在北京出生的.", "Place: 他是在北京出生的."],
      ["Nhấn mạnh cách thức: 我是坐地铁去的.", "Manner: 我是坐地铁去的."],
      ["Nhấn mạnh người làm: 这本书是我买的.", "Who did it: 这本书是我买的."],
    ]),
    meaning: l([
      ["(chính) là … (mà)", "it was … that"],
      ["Chỉ dùng cho việc đã xảy ra.", "Only for things that already happened."],
    ]),
    notes: l([
      ["Phủ định: 不是 … 的: 我不是坐飞机来的.", "Negative: 不是 … 的: 我不是坐飞机来的."],
      ["Câu khẳng định có thể lược 是, nhưng không lược 的.", "In positive sentences 是 can be dropped, but not 的."],
      ["Không dùng 了 trong câu 是 … 的.", "Don't add 了 to 是 … 的 sentences."],
    ]),
    examples: e([
      ["我是昨天来的。", "Wǒ shì zuótiān lái de.", "Tôi đến vào hôm qua (mà).", "I came yesterday.", "📅"],
      [
        "他是在学校学习的。",
        "Tā shì zài xuéxiào xuéxí de.",
        "Anh ấy học ở trường (mà).",
        "He studied at school.",
        "🏫",
      ],
      ["我是坐地铁去的。", "Wǒ shì zuò dìtiě qù de.", "Tôi đi bằng tàu điện ngầm (mà).", "I went by subway.", "🚇"],
      [
        "这本书是我买的。",
        "Zhè běn shū shì wǒ mǎi de.",
        "Cuốn sách này là tôi mua (mà).",
        "I'm the one who bought this book.",
        "📚",
      ],
    ]),
    quiz: [
      q(
        "我是昨天___。",
        ["去", "去的", "去了", "的去"],
        1,
        "是 … 的 kết thúc bằng 的 sau động từ.",
        "是 … 的 ends with 的 after the verb.",
      ),
      q(
        "",
        ["我是坐飞机来了。", "我是坐飞机来的。", "我坐飞机是来的。", "我是坐飞机的来。"],
        1,
        "Cấu trúc: 是 + cách thức + động từ + 的.",
        "Pattern: 是 + manner + verb + 的.",
        CORRECT,
      ),
    ],
    related: ["shi", "de", "le"],
    added: "2026-10-05",
  },
  {
    id: "le",
    hsk: 2,
    no: 2,
    zh: "了",
    py: "le",
    emoji: "✅",
    tone: "green",
    topic: "aspect",
    name: { vi: "đã, rồi", en: "completion; change" },
    summary: {
      vi: "Hành động đã hoàn thành hoặc tình hình đã thay đổi.",
      en: "A completed action or a change of situation.",
    },
    intro: {
      vi: "了 sau động từ cho biết hành động đã hoàn thành; 了 cuối câu cho biết tình hình đã thay đổi.",
      en: "了 after a verb marks a completed action; at the end of a sentence it marks a change of situation.",
    },
    structure: [
      p("S", "subj", "chủ ngữ", "subject"),
      p("V", "slot", "động từ", "verb"),
      p("了", "key", "đã, rồi", "done"),
      p("(O)", "end", "(tân ngữ)", "(object)"),
    ],
    usage: l([
      ["Hoàn thành: 我吃了饭.", "Completion: 我吃了饭."],
      ["Thay đổi: 天冷了 (trời lạnh rồi).", "Change: 天冷了 (it's gotten cold)."],
      ["Có số lượng: 我买了三本书.", "With amounts: 我买了三本书."],
    ]),
    meaning: l([["đã, rồi", "done; (has) become"]]),
    notes: l([
      ["Phủ định dùng 没 + động từ, bỏ 了: 我没吃饭.", "Negate with 没 + verb and drop 了: 我没吃饭."],
      ["Thói quen trong quá khứ không dùng 了: 以前我常常去.", "Past habits don't take 了: 以前我常常去."],
    ]),
    examples: e([
      ["我吃了。", "Wǒ chī le.", "Tôi ăn rồi.", "I've eaten.", "🍚"],
      ["我买了三本书。", "Wǒ mǎi le sān běn shū.", "Tôi đã mua ba quyển sách.", "I bought three books.", "📚"],
      ["天冷了。", "Tiān lěng le.", "Trời lạnh rồi.", "It's gotten cold.", "❄️"],
      ["他已经回家了。", "Tā yǐjīng huí jiā le.", "Anh ấy đã về nhà rồi.", "He has already gone home.", "🏠"],
    ]),
    quiz: [
      q(
        "我昨天买___一件衣服。",
        ["了", "过", "的", "吗"],
        0,
        "Hành động đã hoàn thành → 了.",
        "Completed action → 了.",
      ),
      q(
        "",
        ["我没吃了饭。", "我不吃了饭。", "我没吃饭。", "我吃没饭。"],
        2,
        "Phủ định việc đã qua: 没 + động từ, bỏ 了.",
        "Past negation: 没 + verb, no 了.",
        CORRECT,
      ),
    ],
    related: ["guo", "bu-mei", "shi-de"],
    added: "2026-10-05",
  },
  {
    id: "guo",
    hsk: 2,
    no: 3,
    zh: "过",
    py: "guo",
    emoji: "✈️",
    tone: "sky",
    topic: "aspect",
    name: { vi: "đã từng", en: "have ever done" },
    summary: { vi: "Nói về trải nghiệm đã từng có.", en: "Talks about past experience." },
    intro: {
      vi: "过 sau động từ nói về trải nghiệm: “đã từng làm gì”.",
      en: "过 after a verb talks about experience: “have ever done”.",
    },
    structure: [
      p("S", "subj", "chủ ngữ", "subject"),
      p("V", "slot", "động từ", "verb"),
      p("过", "key", "đã từng", "ever"),
      p("(O)", "end", "(tân ngữ)", "(object)"),
    ],
    usage: l([
      ["Đã từng: 我去过中国.", "Have done: 我去过中国."],
      ["Chưa từng: 没 + V + 过: 我没吃过烤鸭.", "Never: 没 + V + 过: 我没吃过烤鸭."],
      ["Hỏi trải nghiệm: 你…过…吗？", "Ask about experience: 你…过…吗？"],
    ]),
    meaning: l([["đã từng", "have (ever) done"]]),
    notes: l([
      [
        "过 nói về trải nghiệm, 了 nói về một lần hoàn thành cụ thể.",
        "过 is about experience; 了 is about one completed action.",
      ],
      ["Phủ định vẫn giữ 过: 没去过.", "Negation keeps 过: 没去过."],
    ]),
    examples: e([
      ["我去过中国。", "Wǒ qù guo Zhōngguó.", "Tôi đã từng đến Trung Quốc.", "I've been to China.", "✈️"],
      [
        "你吃过北京烤鸭吗？",
        "Nǐ chī guo Běijīng kǎoyā ma?",
        "Bạn đã từng ăn vịt quay Bắc Kinh chưa?",
        "Have you ever had Peking duck?",
        "🦆",
      ],
      [
        "我没看过这个电影。",
        "Wǒ méi kàn guo zhège diànyǐng.",
        "Tôi chưa từng xem bộ phim này.",
        "I've never seen this movie.",
        "🎬",
      ],
      [
        "她学过两年汉语。",
        "Tā xué guo liǎng nián Hànyǔ.",
        "Cô ấy đã từng học tiếng Trung hai năm.",
        "She studied Chinese for two years.",
        "📚",
      ],
    ]),
    quiz: [
      q(
        "我去___上海。",
        ["过", "了", "的", "在"],
        0,
        "Nói về trải nghiệm (đã từng) → 过.",
        "Experience (have been) → 过.",
      ),
      q("我没吃___火锅。", ["过", "了", "的", "吗"], 0, "Chưa từng: 没 + V + 过.", "Never: 没 + V + 过."),
    ],
    related: ["le"],
    added: "2026-10-05",
  },
  {
    id: "bi",
    hsk: 2,
    no: 4,
    zh: "比",
    py: "bǐ",
    emoji: "⚖️",
    tone: "amber",
    topic: "compare",
    name: { vi: "hơn (so sánh)", en: "more … than" },
    summary: { vi: "So sánh hơn: A hơn B.", en: "Comparison: A is more … than B." },
    intro: {
      vi: "比 dùng để so sánh hơn: “A hơn B (về mặt nào đó)”.",
      en: "比 makes comparisons: “A is more … than B”.",
    },
    structure: [
      p("A", "subj", "người / vật thứ nhất", "first item"),
      p("比", "key", "hơn", "than"),
      p("B", "slot", "người / vật thứ hai", "second item"),
      p("Adj", "slot", "tính từ", "adjective"),
    ],
    usage: l([
      ["So sánh hơn: 他比我高.", "Comparison: 他比我高."],
      ["Thêm mức chênh: 他比我高一点儿.", "Add the difference: 他比我高一点儿."],
      ["Phủ định: A 没有 B + Adj: 我没有他高.", "Negation: A 没有 B + Adj: 我没有他高."],
    ]),
    meaning: l([["hơn", "more … than"]]),
    notes: l([
      ["Không dùng 很 / 非常 trong câu 比; dùng 得多 / 多了.", "Don't use 很 / 非常 with 比; use 得多 / 多了."],
      ["Phủ định thường dùng 没有, ít dùng 不比.", "Usually negate with 没有 rather than 不比."],
    ]),
    examples: e([
      ["哥哥比我高。", "Gēge bǐ wǒ gāo.", "Anh trai cao hơn tôi.", "My brother is taller than me.", "📏"],
      [
        "今天比昨天冷。",
        "Jīntiān bǐ zuótiān lěng.",
        "Hôm nay lạnh hơn hôm qua.",
        "Today is colder than yesterday.",
        "❄️",
      ],
      [
        "这件比那件便宜一点儿。",
        "Zhè jiàn bǐ nà jiàn piányi yìdiǎnr.",
        "Cái này rẻ hơn cái kia một chút.",
        "This one is a bit cheaper than that one.",
        "🏷️",
      ],
      ["我没有他忙。", "Wǒ méiyǒu tā máng.", "Tôi không bận bằng anh ấy.", "I'm not as busy as him.", "⏰"],
    ]),
    quiz: [
      q("他___我大两岁。", ["比", "是", "很", "和"], 0, "So sánh hơn → 比.", "Comparison → 比."),
      q(
        "",
        ["我比他很高。", "我比他高多了。", "我很比他高。", "我比高他。"],
        1,
        "Không dùng 很 trong câu 比; dùng 多了 để nhấn mạnh.",
        "No 很 with 比; use 多了 for emphasis.",
        CORRECT,
      ),
    ],
    related: ["yuelaiyue"],
    added: "2026-10-05",
  },
  {
    id: "yinwei-suoyi",
    hsk: 2,
    no: 5,
    zh: "因为 … 所以 …",
    py: "yīnwèi … suǒyǐ …",
    emoji: "🔗",
    tone: "violet",
    topic: "connect",
    name: { vi: "vì … nên …", en: "because … so …" },
    summary: { vi: "Nối nguyên nhân với kết quả.", en: "Links a reason with its result." },
    intro: {
      vi: "因为 nêu nguyên nhân, 所以 nêu kết quả: “Vì … nên …”.",
      en: "因为 gives the reason and 所以 the result: “Because …, so …”.",
    },
    structure: [
      p("因为", "key", "vì", "because"),
      p("nguyên nhân", "slot", "nguyên nhân", "reason"),
      p("所以", "key", "nên", "so"),
      p("kết quả", "slot", "kết quả", "result"),
    ],
    usage: l([
      ["Nối nguyên nhân – kết quả: 因为下雨，所以我不去.", "Cause and effect: 因为下雨，所以我不去."],
      ["Có thể chỉ dùng một vế: 我很累，所以想休息.", "You can use just one part: 我很累，所以想休息."],
      ["Trả lời 为什么: 因为…", "Answer 为什么: 因为…"],
    ]),
    meaning: l([["vì … nên …", "because … so …"]]),
    notes: l([
      ["Thứ tự cố định: nguyên nhân trước, kết quả sau.", "Fixed order: reason first, result second."],
      ["所以 đứng đầu vế sau, sau dấu phẩy.", "所以 starts the second clause, after the comma."],
    ]),
    examples: e([
      [
        "因为下雨，所以我没去公园。",
        "Yīnwèi xià yǔ, suǒyǐ wǒ méi qù gōngyuán.",
        "Vì trời mưa nên tôi không đi công viên.",
        "Because it rained, I didn't go to the park.",
        "🌧️",
      ],
      [
        "因为他生病了，所以没来上课。",
        "Yīnwèi tā shēngbìng le, suǒyǐ méi lái shàngkè.",
        "Vì bị ốm nên anh ấy không đến lớp.",
        "He didn't come to class because he was sick.",
        "🤒",
      ],
      [
        "我很累，所以想早点儿睡觉。",
        "Wǒ hěn lèi, suǒyǐ xiǎng zǎo diǎnr shuìjiào.",
        "Tôi rất mệt nên muốn đi ngủ sớm.",
        "I'm tired, so I want to go to bed early.",
        "😴",
      ],
      [
        "因为喜欢中国文化，所以我学汉语。",
        "Yīnwèi xǐhuan Zhōngguó wénhuà, suǒyǐ wǒ xué Hànyǔ.",
        "Vì thích văn hoá Trung Quốc nên tôi học tiếng Trung.",
        "I study Chinese because I like Chinese culture.",
        "🏮",
      ],
    ]),
    quiz: [
      q(
        "因为太贵了，___我没买。",
        ["所以", "因为", "但是", "如果"],
        0,
        "Vế kết quả bắt đầu bằng 所以.",
        "The result clause starts with 所以.",
      ),
      q(
        "___他很忙，所以不能来。",
        ["因为", "所以", "虽然", "和"],
        0,
        "Vế nguyên nhân bắt đầu bằng 因为.",
        "The reason clause starts with 因为.",
      ),
    ],
    related: ["suiran-danshi"],
    added: "2026-10-05",
  },
  {
    id: "zhengzai",
    hsk: 2,
    no: 6,
    zh: "正在 … 呢",
    py: "zhèngzài … ne",
    emoji: "⏳",
    tone: "orange",
    topic: "aspect",
    name: { vi: "đang", en: "be doing" },
    summary: { vi: "Hành động đang diễn ra.", en: "An action in progress." },
    intro: {
      vi: "正在 (hoặc 在) + động từ (+ 呢) diễn tả hành động đang diễn ra.",
      en: "正在 (or 在) + verb (+ 呢) describes an action in progress.",
    },
    structure: [
      p("S", "subj", "chủ ngữ", "subject"),
      p("正在", "key", "đang", "be -ing"),
      p("V", "slot", "động từ", "verb"),
      p("(呢)", "end", "(trợ từ)", "(particle)"),
    ],
    usage: l([
      ["Đang làm gì: 我正在吃饭.", "In progress: 我正在吃饭."],
      ["Có thể dùng 在, hoặc chỉ 呢 cuối câu: 他看书呢.", "Use 在, or just 呢 at the end: 他看书呢."],
      ["Kết hợp thời điểm: 昨天八点我正在上课.", "With a time point: 昨天八点我正在上课."],
    ]),
    meaning: l([["đang", "be doing"]]),
    notes: l([
      ["Phủ định: 没在 + V: 我没在看电视.", "Negation: 没在 + verb: 我没在看电视."],
      ["Không dùng 了 / 过 cùng 正在.", "Don't use 了 / 过 with 正在."],
    ]),
    examples: e([
      ["我正在吃饭呢。", "Wǒ zhèngzài chī fàn ne.", "Tôi đang ăn cơm.", "I'm eating.", "🍚"],
      ["妈妈在做饭。", "Māma zài zuò fàn.", "Mẹ đang nấu cơm.", "Mom is cooking.", "🍳"],
      ["他们正在开会。", "Tāmen zhèngzài kāi huì.", "Họ đang họp.", "They're in a meeting.", "🗣️"],
      ["你在做什么呢？", "Nǐ zài zuò shénme ne?", "Bạn đang làm gì thế?", "What are you doing?", "❓"],
    ]),
    quiz: [
      q("我___看书呢。", ["正在", "了", "过", "的"], 0, "Đang làm → 正在.", "In progress → 正在."),
      q(
        "",
        ["我正在吃了饭。", "我正在吃饭呢。", "我吃饭正在。", "我正吃过饭。"],
        1,
        "正在 + động từ + 呢, không dùng 了 / 过.",
        "正在 + verb + 呢, without 了 / 过.",
        CORRECT,
      ),
    ],
    related: ["zai", "le"],
    added: "2026-10-05",
  },
  {
    id: "ba",
    hsk: 3,
    no: 1,
    zh: "把",
    py: "bǎ",
    emoji: "📦",
    tone: "amber",
    topic: "special",
    name: { vi: "câu chữ 把 (xử lý tân ngữ)", en: "the 把 sentence" },
    summary: {
      vi: "Đưa tân ngữ lên trước động từ để nói hành động tác động lên nó.",
      en: "Moves the object before the verb to say what happens to it.",
    },
    intro: {
      vi: "Câu chữ 把 đưa tân ngữ lên trước động từ để nói hành động tác động / xử lý tân ngữ đó thế nào.",
      en: "The 把 sentence moves the object before the verb to say what the action does to it.",
    },
    structure: [
      p("S", "subj", "chủ ngữ", "subject"),
      p("把", "key", "đem", "(把)"),
      p("O", "slot", "tân ngữ", "object"),
      p("V", "slot", "động từ", "verb"),
      p("thành phần khác", "end", "kết quả / nơi chốn / 了", "result / place / 了"),
    ],
    usage: l([
      ["Xử lý vật cụ thể: 我把作业做完了.", "Handling something specific: 我把作业做完了."],
      ["Đặt / để vào đâu: 请把书放在桌子上.", "Putting something somewhere: 请把书放在桌子上."],
      ["Mệnh lệnh: 把门关上!", "Commands: 把门关上!"],
    ]),
    meaning: l([["đem, lấy (… làm gì)", "take / handle (the object)"]]),
    notes: l([
      ["Sau động từ phải có thành phần khác: không nói 我把饭吃.", "The verb needs something after it: not 我把饭吃."],
      ["Tân ngữ phải là vật xác định.", "The object must be something specific."],
      ["Phủ định đặt trước 把: 我没把书带来.", "Negation goes before 把: 我没把书带来."],
    ]),
    examples: e([
      ["我把作业做完了。", "Wǒ bǎ zuòyè zuò wán le.", "Tôi đã làm xong bài tập.", "I finished my homework.", "📝"],
      [
        "请把书放在桌子上。",
        "Qǐng bǎ shū fàng zài zhuōzi shang.",
        "Hãy đặt sách lên bàn.",
        "Please put the book on the table.",
        "📖",
      ],
      [
        "他把手机忘在家里了。",
        "Tā bǎ shǒujī wàng zài jiā li le.",
        "Anh ấy để quên điện thoại ở nhà.",
        "He left his phone at home.",
        "📱",
      ],
      ["我没把门关上。", "Wǒ méi bǎ mén guān shang.", "Tôi chưa đóng cửa.", "I didn't close the door.", "🚪"],
    ]),
    quiz: [
      q(
        "请___窗户打开。",
        ["把", "被", "给", "在"],
        0,
        "Tác động lên tân ngữ “cửa sổ” → 把.",
        "Acting on the object “window” → 把.",
      ),
      q(
        "",
        ["我把饭吃。", "我把饭吃完了。", "我吃把饭了。", "把我饭吃完了。"],
        1,
        "Sau động từ cần thành phần khác (完了).",
        "The verb needs a complement (完了).",
        CORRECT,
      ),
    ],
    related: ["bei"],
    added: "2026-10-05",
  },
  {
    id: "bei",
    hsk: 3,
    no: 2,
    zh: "被",
    py: "bèi",
    emoji: "🔄",
    tone: "sky",
    topic: "special",
    name: { vi: "bị, được (bị động)", en: "passive voice" },
    summary: {
      vi: "Câu bị động: chủ ngữ chịu tác động của hành động.",
      en: "Passive: the subject receives the action.",
    },
    intro: {
      vi: "Câu bị động với 被: chủ ngữ là người / vật chịu tác động của hành động.",
      en: "Passive sentences with 被: the subject receives the action.",
    },
    structure: [
      p("Người / vật chịu tác động", "subj", "chủ ngữ", "receiver"),
      p("被", "key", "bị / được", "by"),
      p("(người làm)", "slot", "người làm (có thể lược)", "doer (optional)"),
      p("V + thành phần khác", "end", "động từ + kết quả / 了", "verb + result / 了"),
    ],
    usage: l([
      ["Bị / được ai làm gì: 我的手机被弟弟拿走了.", "Done by someone: 我的手机被弟弟拿走了."],
      ["Có thể bỏ người làm: 自行车被偷了.", "The doer can be dropped: 自行车被偷了."],
      ["Thường nói về việc không mong muốn.", "Often for unwanted events."],
    ]),
    meaning: l([["bị, được", "be done (by)"]]),
    notes: l([
      [
        "Giống 把, sau động từ cần thành phần khác (了, kết quả…).",
        "Like 把, the verb needs something after it (了, a result…).",
      ],
      ["Phủ định đặt trước 被: 我没被老师批评.", "Negation goes before 被: 我没被老师批评."],
    ]),
    examples: e([
      [
        "我的手机被弟弟拿走了。",
        "Wǒ de shǒujī bèi dìdi ná zǒu le.",
        "Điện thoại của tôi bị em trai lấy mất.",
        "My phone was taken by my little brother.",
        "📱",
      ],
      ["他的自行车被偷了。", "Tā de zìxíngchē bèi tōu le.", "Xe đạp của anh ấy bị trộm.", "His bike was stolen.", "🚲"],
      ["蛋糕被吃完了。", "Dàngāo bèi chī wán le.", "Bánh kem bị ăn hết rồi.", "The cake has been eaten up.", "🍰"],
      [
        "我被老师表扬了。",
        "Wǒ bèi lǎoshī biǎoyáng le.",
        "Tôi được cô giáo khen.",
        "I was praised by the teacher.",
        "🌟",
      ],
    ]),
    quiz: [
      q(
        "我的书___他拿走了。",
        ["被", "把", "给", "在"],
        0,
        "Chủ ngữ chịu tác động → 被.",
        "The subject receives the action → 被.",
      ),
      q(
        "",
        ["蛋糕被吃。", "蛋糕被吃完了。", "被蛋糕吃完了。", "蛋糕吃被完了。"],
        1,
        "Sau động từ cần thành phần khác.",
        "The verb needs a complement.",
        CORRECT,
      ),
    ],
    related: ["ba"],
    added: "2026-10-05",
  },
  {
    id: "suiran-danshi",
    hsk: 3,
    no: 3,
    zh: "虽然 … 但是 …",
    py: "suīrán … dànshì …",
    emoji: "🌗",
    tone: "violet",
    topic: "connect",
    name: { vi: "tuy … nhưng …", en: "although … (but) …" },
    summary: { vi: "Nối hai vế trái ngược nhau.", en: "Links two contrasting clauses." },
    intro: {
      vi: "虽然 … 但是 … nối hai vế trái ngược: “Tuy … nhưng …”.",
      en: "虽然 … 但是 … links two contrasting clauses: “Although …, (but) …”.",
    },
    structure: [
      p("虽然", "key", "tuy", "although"),
      p("vế 1", "slot", "sự thật", "fact"),
      p("但是", "key", "nhưng", "but"),
      p("vế 2", "slot", "điều trái ngược", "contrast"),
    ],
    usage: l([
      ["Nhượng bộ: 虽然很累，但是我很高兴.", "Concession: 虽然很累，但是我很高兴."],
      ["但是 có thể thay bằng 可是 / 但.", "但是 can be replaced by 可是 / 但."],
      ["虽然 có thể đứng sau chủ ngữ: 他虽然很忙，但是…", "虽然 can come after the subject: 他虽然很忙，但是…"],
    ]),
    meaning: l([["tuy … nhưng …", "although … (but) …"]]),
    notes: l([
      [
        "Tiếng Trung dùng cả 虽然 và 但是 trong cùng một câu (khác tiếng Anh).",
        "Chinese uses both 虽然 and 但是 together (unlike English).",
      ],
    ]),
    examples: e([
      [
        "虽然下雨了，但是我们还去公园。",
        "Suīrán xià yǔ le, dànshì wǒmen hái qù gōngyuán.",
        "Tuy trời mưa nhưng chúng tôi vẫn đi công viên.",
        "Although it's raining, we're still going to the park.",
        "🌂",
      ],
      [
        "虽然汉语很难，但是很有意思。",
        "Suīrán Hànyǔ hěn nán, dànshì hěn yǒu yìsi.",
        "Tuy tiếng Trung khó nhưng rất thú vị.",
        "Chinese is hard, but very interesting.",
        "📚",
      ],
      [
        "他虽然很忙，可是每天都运动。",
        "Tā suīrán hěn máng, kěshì měi tiān dōu yùndòng.",
        "Tuy anh ấy rất bận nhưng ngày nào cũng tập thể dục.",
        "Although he's busy, he exercises every day.",
        "🏃",
      ],
      [
        "虽然这件衣服很贵，但是质量很好。",
        "Suīrán zhè jiàn yīfu hěn guì, dànshì zhìliàng hěn hǎo.",
        "Tuy bộ quần áo này đắt nhưng chất lượng rất tốt.",
        "This clothing is expensive, but the quality is good.",
        "👕",
      ],
    ]),
    quiz: [
      q(
        "虽然他很累，___还在工作。",
        ["但是", "所以", "因为", "如果"],
        0,
        "Hai vế trái ngược → 虽然 … 但是.",
        "Contrast → 虽然 … 但是.",
      ),
      q(
        "___天气不好，但是我们很开心。",
        ["虽然", "因为", "所以", "和"],
        0,
        "Vế nhượng bộ bắt đầu bằng 虽然.",
        "The concession clause starts with 虽然.",
      ),
    ],
    related: ["yinwei-suoyi"],
    added: "2026-10-05",
  },
  {
    id: "yuelaiyue",
    hsk: 3,
    no: 4,
    zh: "越来越",
    py: "yuèláiyuè",
    emoji: "📈",
    tone: "green",
    topic: "adverb",
    name: { vi: "càng ngày càng", en: "more and more" },
    summary: { vi: "Mức độ tăng dần theo thời gian.", en: "A degree that increases over time." },
    intro: {
      vi: "越来越 + tính từ / động từ tâm lý: “càng ngày càng …”.",
      en: "越来越 + adjective / feeling verb: “more and more …”.",
    },
    structure: [
      p("S", "subj", "chủ ngữ", "subject"),
      p("越来越", "key", "càng ngày càng", "more and more"),
      p("Adj / V tâm lý", "slot", "tính từ / động từ tâm lý", "adjective / feeling verb"),
    ],
    usage: l([
      ["Thay đổi dần: 天气越来越冷.", "Gradual change: 天气越来越冷."],
      ["Với động từ tâm lý: 我越来越喜欢汉语.", "With feeling verbs: 我越来越喜欢汉语."],
      ["Thường có 了 cuối câu.", "Often ends with 了."],
    ]),
    meaning: l([["càng ngày càng", "more and more"]]),
    notes: l([
      ["Không dùng 很 / 非常 sau 越来越: không nói 越来越很冷.", "No 很 / 非常 after 越来越: not 越来越很冷."],
    ]),
    examples: e([
      [
        "天气越来越冷了。",
        "Tiānqì yuèláiyuè lěng le.",
        "Thời tiết càng ngày càng lạnh.",
        "It's getting colder and colder.",
        "❄️",
      ],
      [
        "她的汉语越来越好。",
        "Tā de Hànyǔ yuèláiyuè hǎo.",
        "Tiếng Trung của cô ấy càng ngày càng giỏi.",
        "Her Chinese is getting better and better.",
        "📈",
      ],
      [
        "我越来越喜欢这个城市。",
        "Wǒ yuèláiyuè xǐhuan zhège chéngshì.",
        "Tôi càng ngày càng thích thành phố này.",
        "I like this city more and more.",
        "🏙️",
      ],
      [
        "东西越来越贵了。",
        "Dōngxi yuèláiyuè guì le.",
        "Đồ đạc càng ngày càng đắt.",
        "Things are getting more and more expensive.",
        "💰",
      ],
    ]),
    quiz: [
      q("他___高了。", ["越来越", "比", "很", "都"], 0, "Thay đổi dần → 越来越.", "Gradual change → 越来越."),
      q(
        "",
        ["天气越来越很热。", "天气越来越热了。", "天气很越来越热。", "越来越天气热。"],
        1,
        "Không dùng 很 sau 越来越.",
        "No 很 after 越来越.",
        CORRECT,
      ),
    ],
    related: ["bi"],
    added: "2026-10-05",
  },
];

export const LIB_GRAMMAR_BY_ID = new Map(LIB_GRAMMAR.map((g) => [g.id, g]));
