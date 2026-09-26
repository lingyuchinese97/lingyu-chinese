/** Ngân hàng câu luyện tập phát âm (âm tiết đơn, cặp âm dễ nhầm, từ 2 âm tiết). */
import type { L } from "./types";

type Row = [hanzi: string, pinyin: string, vi: string, en: string];
export type BankItem = { hanzi: string; pinyin: string; meaning: L };
const rows = (r: Row[]): BankItem[] => r.map(([hanzi, pinyin, vi, en]) => ({ hanzi, pinyin, meaning: { vi, en } }));

/** Âm tiết đơn (1 chữ) — nghe & chọn, nghe & gõ. */
export const SYLLABLES = rows([
  ["八", "bā", "số tám", "eight"],
  ["爸", "bà", "bố", "dad"],
  ["怕", "pà", "sợ", "to fear"],
  ["妈", "mā", "mẹ", "mom"],
  ["马", "mǎ", "ngựa", "horse"],
  ["米", "mǐ", "gạo", "rice"],
  ["饭", "fàn", "cơm", "meal"],
  ["飞", "fēi", "bay", "to fly"],
  ["大", "dà", "to", "big"],
  ["他", "tā", "anh ấy", "he"],
  ["你", "nǐ", "bạn", "you"],
  ["女", "nǚ", "nữ", "female"],
  ["来", "lái", "đến", "to come"],
  ["六", "liù", "số sáu", "six"],
  ["冷", "lěng", "lạnh", "cold"],
  ["哥", "gē", "anh trai", "older brother"],
  ["高", "gāo", "cao", "tall"],
  ["看", "kàn", "xem", "to look"],
  ["喝", "hē", "uống", "to drink"],
  ["好", "hǎo", "tốt", "good"],
  ["家", "jiā", "nhà", "home"],
  ["七", "qī", "số bảy", "seven"],
  ["去", "qù", "đi", "to go"],
  ["钱", "qián", "tiền", "money"],
  ["西", "xī", "phía tây", "west"],
  ["想", "xiǎng", "nghĩ", "to think"],
  ["吃", "chī", "ăn", "to eat"],
  ["茶", "chá", "trà", "tea"],
  ["中", "zhōng", "giữa", "middle"],
  ["是", "shì", "là", "to be"],
  ["书", "shū", "sách", "book"],
  ["人", "rén", "người", "person"],
  ["热", "rè", "nóng", "hot"],
  ["在", "zài", "ở", "at"],
  ["早", "zǎo", "sớm", "early"],
  ["菜", "cài", "món ăn", "dish"],
  ["四", "sì", "số bốn", "four"],
  ["三", "sān", "số ba", "three"],
  ["我", "wǒ", "tôi", "I"],
  ["鱼", "yú", "cá", "fish"],
  ["月", "yuè", "tháng", "month"],
  ["天", "tiān", "trời", "sky"],
  ["听", "tīng", "nghe", "to listen"],
  ["用", "yòng", "dùng", "to use"],
  ["门", "mén", "cửa", "door"],
  ["爱", "ài", "yêu", "love"],
  ["二", "èr", "số hai", "two"],
]);

/** Cặp âm dễ nhầm với người Việt (phân biệt cặp âm). */
export const PAIRS: [BankItem, BankItem][] = (
  [
    [
      ["四", "sì", "số bốn", "four"],
      ["是", "shì", "là", "to be"],
    ],
    [
      ["早", "zǎo", "sớm", "early"],
      ["找", "zhǎo", "tìm", "to look for"],
    ],
    [
      ["草", "cǎo", "cỏ", "grass"],
      ["吵", "chǎo", "ồn ào", "noisy"],
    ],
    [
      ["在", "zài", "ở", "at"],
      ["债", "zhài", "nợ", "debt"],
    ],
    [
      ["八", "bā", "số tám", "eight"],
      ["趴", "pā", "nằm sấp", "to lie prone"],
    ],
    [
      ["肚", "dù", "bụng", "belly"],
      ["兔", "tù", "con thỏ", "rabbit"],
    ],
    [
      ["哥", "gē", "anh trai", "older brother"],
      ["科", "kē", "khoa", "subject"],
    ],
    [
      ["男", "nán", "nam", "male"],
      ["蓝", "lán", "màu xanh lam", "blue"],
    ],
    [
      ["山", "shān", "núi", "mountain"],
      ["伤", "shāng", "vết thương", "wound"],
    ],
    [
      ["真", "zhēn", "thật", "real"],
      ["争", "zhēng", "tranh", "to compete"],
    ],
    [
      ["新", "xīn", "mới", "new"],
      ["星", "xīng", "ngôi sao", "star"],
    ],
    [
      ["路", "lù", "đường", "road"],
      ["绿", "lǜ", "xanh lá", "green"],
    ],
    [
      ["鸡", "jī", "con gà", "chicken"],
      ["知", "zhī", "biết", "to know"],
    ],
    [
      ["七", "qī", "số bảy", "seven"],
      ["吃", "chī", "ăn", "to eat"],
    ],
    [
      ["西", "xī", "phía tây", "west"],
      ["诗", "shī", "thơ", "poem"],
    ],
    [
      ["饭", "fàn", "cơm", "meal"],
      ["放", "fàng", "đặt", "to put"],
    ],
  ] as [Row, Row][]
).map(([a, b]) => [rows([a])[0]!, rows([b])[0]!]);

/** Từ 2 âm tiết (luyện đọc từ, phát âm & so sánh). Pinyin tách âm tiết bằng dấu cách. */
export const WORDS = rows([
  ["你好", "nǐ hǎo", "xin chào", "hello"],
  ["谢谢", "xiè xie", "cảm ơn", "thanks"],
  ["老师", "lǎo shī", "giáo viên", "teacher"],
  ["朋友", "péng you", "bạn bè", "friend"],
  ["中国", "zhōng guó", "Trung Quốc", "China"],
  ["学生", "xué sheng", "học sinh", "student"],
  ["飞机", "fēi jī", "máy bay", "plane"],
  ["米饭", "mǐ fàn", "cơm", "rice"],
  ["苹果", "píng guǒ", "quả táo", "apple"],
  ["电话", "diàn huà", "điện thoại", "phone"],
  ["明天", "míng tiān", "ngày mai", "tomorrow"],
  ["汉语", "hàn yǔ", "tiếng Hán", "Chinese"],
  ["早上", "zǎo shang", "buổi sáng", "morning"],
  ["医生", "yī shēng", "bác sĩ", "doctor"],
  ["手机", "shǒu jī", "điện thoại di động", "mobile phone"],
  ["天气", "tiān qì", "thời tiết", "weather"],
  ["工作", "gōng zuò", "công việc", "work"],
  ["时间", "shí jiān", "thời gian", "time"],
  ["学校", "xué xiào", "trường học", "school"],
  ["咖啡", "kā fēi", "cà phê", "coffee"],
]);
