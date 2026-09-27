/**
 * Điểm ngữ pháp dùng trong kho câu mẫu Luyện dịch (nội dung tĩnh, song ngữ vi / en).
 * `structure` là công thức; mỗi câu mẫu ghi thêm `pattern` = công thức áp vào đúng câu đó.
 */
export type L10n = { vi: string; en: string };
export type TGrammar = {
  id: string;
  level: number;
  name: L10n;
  structure: string;
  explain: L10n;
};

export const T_GRAMMAR: TGrammar[] = [
  {
    id: "shi",
    level: 1,
    name: { vi: "Câu chữ 是", en: "是 sentences" },
    structure: "A + 是 + B",
    explain: {
      vi: "是 nối hai danh từ: “A là B”. Phủ định dùng 不是. Không dùng 是 trước tính từ (không nói 我是忙).",
      en: "是 links two nouns: “A is B”. Negate with 不是. Do not put 是 before adjectives (not 我是忙).",
    },
  },
  {
    id: "ma",
    level: 1,
    name: { vi: "Câu hỏi với 吗", en: "Questions with 吗" },
    structure: "Câu trần thuật + 吗？",
    explain: {
      vi: "Thêm 吗 vào cuối câu trần thuật để hỏi có / không. Không dùng 吗 khi câu đã có từ để hỏi (什么, 谁, 哪儿…).",
      en: "Add 吗 to the end of a statement to make a yes/no question. Do not use it when the sentence already has a question word (什么, 谁, 哪儿…).",
    },
  },
  {
    id: "de-poss",
    level: 1,
    name: { vi: "Sở hữu / định ngữ với 的", en: "Possession / modifiers with 的" },
    structure: "Định ngữ + 的 + danh từ",
    explain: {
      vi: "的 đứng giữa phần bổ nghĩa và danh từ: 我的书 (sách của tôi), 漂亮的衣服 (áo đẹp). Người thân, nơi gần gũi thường bỏ 的: 我妈妈.",
      en: "的 joins a modifier to a noun: 我的书 (my book), 漂亮的衣服 (pretty clothes). It is often dropped for family and close relations: 我妈妈.",
    },
  },
  {
    id: "zai-place",
    level: 1,
    name: { vi: "在 + nơi chốn + động từ", en: "在 + place + verb" },
    structure: "Chủ ngữ + 在 + nơi chốn + động từ",
    explain: {
      vi: "Nơi diễn ra hành động đứng TRƯỚC động từ (ngược với tiếng Việt): 我在家吃饭 = Tôi ăn cơm ở nhà.",
      en: "The place where an action happens comes BEFORE the verb: 我在家吃饭 = I eat at home.",
    },
  },
  {
    id: "time-first",
    level: 1,
    name: { vi: "Thời gian đứng trước động từ", en: "Time before the verb" },
    structure: "Chủ ngữ + thời gian + (nơi chốn) + động từ",
    explain: {
      vi: "Từ chỉ thời gian (今天, 每天, 明天…) đứng trước động từ, có thể đứng đầu câu; không đặt cuối câu như tiếng Việt.",
      en: "Time words (今天, 每天, 明天…) go before the verb, or at the start of the sentence — never at the end.",
    },
  },
  {
    id: "le-done",
    level: 2,
    name: { vi: "了 — hành động đã hoàn thành", en: "了 — completed action" },
    structure: "Chủ ngữ + động từ + 了 + (số lượng) + tân ngữ",
    explain: {
      vi: "了 sau động từ cho biết hành động đã xảy ra / hoàn thành. Phủ định dùng 没(有) + động từ và bỏ 了.",
      en: "了 after a verb marks a completed action. Negate with 没(有) + verb and drop 了.",
    },
  },
  {
    id: "guo",
    level: 2,
    name: { vi: "过 — đã từng", en: "过 — past experience" },
    structure: "Chủ ngữ + động từ + 过 + tân ngữ",
    explain: {
      vi: "过 sau động từ nói về trải nghiệm đã từng có. Phủ định: 没(有) + động từ + 过.",
      en: "过 after a verb expresses having had an experience. Negative: 没(有) + verb + 过.",
    },
  },
  {
    id: "bi",
    level: 2,
    name: { vi: "So sánh hơn với 比", en: "Comparison with 比" },
    structure: "A + 比 + B + tính từ (+ mức độ)",
    explain: {
      vi: "A 比 B + tính từ = A … hơn B. Không dùng 很 / 非常 trước tính từ; muốn nói “hơn nhiều” thêm 多了 hoặc 得多 sau tính từ.",
      en: "A 比 B + adjective = A is more … than B. Do not use 很 / 非常; for “much more” add 多了 or 得多 after the adjective.",
    },
  },
  {
    id: "hui-neng",
    level: 1,
    name: { vi: "Động từ năng nguyện 会 / 能 / 可以", en: "Modal verbs 会 / 能 / 可以" },
    structure: "Chủ ngữ + 会 / 能 / 可以 + động từ",
    explain: {
      vi: "会: biết làm (do học mà có) hoặc sẽ; 能: có khả năng / điều kiện; 可以: được phép. Đứng ngay trước động từ.",
      en: "会: know how to (learned skill) or will; 能: be able to; 可以: be allowed to. They go right before the verb.",
    },
  },
  {
    id: "xiang-yao",
    level: 1,
    name: { vi: "想 / 要 + động từ", en: "想 / 要 + verb" },
    structure: "Chủ ngữ + 想 / 要 + động từ",
    explain: {
      vi: "想: muốn (nhẹ nhàng); 要: muốn / sắp / cần (mạnh hơn). Phủ định của 要 (muốn) thường dùng 不想.",
      en: "想: would like to (softer); 要: want / be going to / need (stronger). The negative of 要 (want) is usually 不想.",
    },
  },
  {
    id: "yinwei-suoyi",
    level: 2,
    name: { vi: "因为…所以… (vì … nên …)", en: "因为…所以… (because … so …)" },
    structure: "因为 + nguyên nhân，所以 + kết quả",
    explain: {
      vi: "Nguyên nhân đứng trước, kết quả đứng sau. Có thể bỏ một trong hai từ, nhưng khác tiếng Việt: thường không đảo kết quả lên trước.",
      en: "The cause comes first and the result second. Either word may be dropped; the result rarely comes first.",
    },
  },
  {
    id: "suiran-danshi",
    level: 3,
    name: { vi: "虽然…但是… (tuy … nhưng …)", en: "虽然…但是… (although … but …)" },
    structure: "虽然 + A，但是 / 可是 + B",
    explain: {
      vi: "Khác tiếng Anh, tiếng Trung dùng cả hai vế 虽然 và 但是 trong cùng một câu. 虽然 đứng trước hoặc sau chủ ngữ.",
      en: "Unlike English, Chinese uses both 虽然 and 但是 in the same sentence. 虽然 can come before or after the subject.",
    },
  },
  {
    id: "ruguo-jiu",
    level: 3,
    name: { vi: "如果…就… (nếu … thì …)", en: "如果…就… (if … then …)" },
    structure: "如果 + điều kiện，(chủ ngữ) + 就 + kết quả",
    explain: {
      vi: "就 đứng sau chủ ngữ của vế sau, trước động từ. Có thể thêm 的话 cuối vế điều kiện: 如果明天下雨的话…",
      en: "就 goes after the subject of the second clause, before the verb. 的话 can close the condition: 如果明天下雨的话…",
    },
  },
  {
    id: "yibian",
    level: 3,
    name: { vi: "一边…一边… (vừa … vừa …)", en: "一边…一边… (while doing …)" },
    structure: "Chủ ngữ + 一边 + động từ 1 + 一边 + động từ 2",
    explain: {
      vi: "Hai hành động diễn ra cùng lúc. Mỗi 一边 đứng trước một động từ.",
      en: "Two actions happen at the same time. Each 一边 precedes a verb.",
    },
  },
  {
    id: "yuelaiyue",
    level: 3,
    name: { vi: "越来越 + tính từ (ngày càng …)", en: "越来越 + adjective (more and more …)" },
    structure: "Chủ ngữ + 越来越 + tính từ / động từ tâm lý",
    explain: {
      vi: "Diễn tả mức độ tăng dần theo thời gian. Không thêm 很 / 非常 sau 越来越.",
      en: "Shows a gradual increase over time. Do not add 很 / 非常 after 越来越.",
    },
  },
  {
    id: "ba",
    level: 3,
    name: { vi: "Câu chữ 把", en: "把 sentences" },
    structure: "Chủ ngữ + 把 + tân ngữ + động từ + thành phần khác",
    explain: {
      vi: "Đưa tân ngữ (đã xác định) lên trước động từ để nhấn mạnh việc xử lý nó. Sau động từ phải có thêm thành phần (了, bổ ngữ, 在 + nơi chốn…).",
      en: "Moves a definite object before the verb to stress what is done to it. The verb must be followed by something (了, a complement, 在 + place…).",
    },
  },
  {
    id: "bei",
    level: 3,
    name: { vi: "Câu bị động với 被", en: "Passive with 被" },
    structure: "Chủ thể chịu tác động + 被 + (người làm) + động từ + thành phần khác",
    explain: {
      vi: "Thường nói về việc không mong muốn. Người làm có thể lược bỏ. Sau động từ thường có 了 hoặc bổ ngữ.",
      en: "Often used for unwanted events. The doer can be omitted. The verb is usually followed by 了 or a complement.",
    },
  },
  {
    id: "de-degree",
    level: 2,
    name: { vi: "Bổ ngữ trình độ với 得", en: "Degree complement with 得" },
    structure: "Chủ ngữ + (tân ngữ + động từ) + 得 + (很) + tính từ",
    explain: {
      vi: "Đánh giá hành động làm như thế nào: 他说得很好. Có tân ngữ thì lặp động từ: 他说汉语说得很好 (hoặc 他汉语说得很好).",
      en: "Describes how well an action is done: 他说得很好. With an object, repeat the verb: 他说汉语说得很好 (or 他汉语说得很好).",
    },
  },
  {
    id: "zhengzai",
    level: 2,
    name: { vi: "正在…呢 — đang làm", en: "正在…呢 — in progress" },
    structure: "Chủ ngữ + 正在 / 在 + động từ + (呢)",
    explain: {
      vi: "Hành động đang diễn ra. Có thể dùng 正在, 在 hoặc chỉ 呢 cuối câu.",
      en: "An action in progress. Use 正在, 在, or just 呢 at the end.",
    },
  },
  {
    id: "cong-dao",
    level: 2,
    name: { vi: "从…到… (từ … đến …)", en: "从…到… (from … to …)" },
    structure: "从 + điểm bắt đầu + 到 + điểm kết thúc",
    explain: {
      vi: "Chỉ khoảng thời gian hoặc quãng đường. Cả cụm đứng trước động từ: 我从八点到五点工作.",
      en: "Marks a span of time or distance. The phrase goes before the verb: 我从八点到五点工作.",
    },
  },
  {
    id: "chule",
    level: 3,
    name: { vi: "除了…以外，还 / 都… (ngoài … ra)", en: "除了…以外 (besides / except)" },
    structure: "除了 + A + (以外)，(chủ ngữ) + 还 / 也 / 都 + …",
    explain: {
      vi: "Đi với 还 / 也: “ngoài A ra còn …” (tính cả A). Đi với 都: “trừ A ra thì đều …” (loại A).",
      en: "With 还 / 也: “besides A, also …” (A included). With 都: “except A, all …” (A excluded).",
    },
  },
  {
    id: "kuaiyao-le",
    level: 2,
    name: { vi: "快要…了 (sắp … rồi)", en: "快要…了 (about to)" },
    structure: "(Chủ ngữ) + 快(要) / 要 + động từ / tính từ + 了",
    explain: {
      vi: "Việc sắp xảy ra. Khi có thời gian cụ thể (明天, 下个月…) dùng 就要…了, không dùng 快要.",
      en: "Something is about to happen. With a specific time (明天, 下个月…) use 就要…了 instead of 快要.",
    },
  },
  {
    id: "dui-ganxingqu",
    level: 3,
    name: { vi: "对…感兴趣 (hứng thú với …)", en: "对…感兴趣 (interested in …)" },
    structure: "Chủ ngữ + 对 + đối tượng + 感兴趣",
    explain: {
      vi: "Đối tượng đứng giữa 对 và 感兴趣 (không nói 感兴趣对…). Phủ định: 对…不感兴趣.",
      en: "The object sits between 对 and 感兴趣 (not 感兴趣对…). Negative: 对…不感兴趣.",
    },
  },
  {
    id: "measure",
    level: 1,
    name: { vi: "Số từ + lượng từ + danh từ", en: "Number + measure word + noun" },
    structure: "Số / 这 / 那 + lượng từ + danh từ",
    explain: {
      vi: "Giữa số (hoặc 这 / 那) và danh từ luôn cần lượng từ: 一本书, 两个人, 这杯咖啡. “2” trước lượng từ đọc là 两.",
      en: "A measure word is required between a number (or 这 / 那) and a noun: 一本书, 两个人, 这杯咖啡. “2” before a measure word is 两.",
    },
  },
];

export const T_GRAMMAR_BY_ID = new Map(T_GRAMMAR.map((g) => [g.id, g]));
