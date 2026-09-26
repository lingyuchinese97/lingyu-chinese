/** 36 vận mẫu (vần): 6 đơn, 13 kép, 16 mũi và er. Số lượng trên giao diện đếm từ dữ liệu này. */
import type { SoundGroup, SoundItem } from "./types";

export const FINAL_GROUPS: SoundGroup[] = [
  {
    id: "single",
    name: { vi: "Vận mẫu đơn", en: "Simple finals" },
    desc: { vi: "Một nguyên âm, giữ nguyên khẩu hình", en: "One vowel, mouth shape stays the same" },
  },
  {
    id: "compound",
    name: { vi: "Vận mẫu kép", en: "Compound finals" },
    desc: { vi: "Hai – ba nguyên âm, lướt từ âm này sang âm kia", en: "Two or three vowels glided together" },
  },
  {
    id: "nasal",
    name: { vi: "Vận mẫu mũi", en: "Nasal finals" },
    desc: { vi: "Kết thúc bằng -n (đầu lưỡi) hoặc -ng (cuống lưỡi)", en: "End in -n (tongue tip) or -ng (back)" },
  },
  {
    id: "special",
    name: { vi: "Vận mẫu đặc biệt", en: "Special final" },
    desc: { vi: "er — cuốn lưỡi", en: "er — with a curled tongue" },
  },
];

const f = (
  symbol: string,
  speak: [char: string, pinyin: string],
  group: string,
  like: [string, string],
  how: [string[], string[]],
  examples: [string, string, string, string][],
  tip: [string, string],
): SoundItem => ({
  symbol,
  speak: speak[0],
  speakPinyin: speak[1],
  group,
  like: { vi: like[0], en: like[1] },
  how: { vi: how[0], en: how[1] },
  examples: examples.map(([hanzi, pinyin, vi, en]) => ({ hanzi, pinyin, meaning: { vi, en } })),
  tip: { vi: tip[0], en: tip[1] },
});

const N = { vi: "Kết thúc: đầu lưỡi chạm lợi trên (-n).", en: "End with the tongue tip on the upper gum (-n)." };
const NG = {
  vi: "Kết thúc: cuống lưỡi nâng lên, miệng hơi mở (-ng).",
  en: "End with the back of the tongue raised (-ng).",
};

export const FINALS: SoundItem[] = [
  // ----- Đơn -----
  f(
    "a",
    ["阿", "ā"],
    "single",
    ["Như “a” tiếng Việt", "Like “a” in “father”"],
    [["Miệng mở to, lưỡi hạ thấp."], ["Open the mouth wide, tongue low."]],
    [
      ["八", "bā", "số tám", "eight"],
      ["妈妈", "māma", "mẹ", "mom"],
    ],
    ["Mở miệng to hơn “a” tiếng Việt một chút.", "Open a bit wider than you think."],
  ),
  f(
    "o",
    ["哦", "ò"],
    "single",
    ["Gần “ua / uô” tiếng Việt", "Like “aw” in “law” with rounded lips"],
    [
      ["Môi tròn, hơi đưa ra trước.", "Bắt đầu hơi có “u” rất nhẹ."],
      ["Round the lips.", "Starts with a light “u”."],
    ],
    [
      ["波", "bō", "sóng", "wave"],
      ["摸", "mō", "sờ, chạm", "to touch"],
    ],
    ["bo, po, mo, fo đọc gần “bua, pua, mua, phua”.", "bo, po, mo, fo sound like “bwo, pwo…”."],
  ),
  f(
    "e",
    ["鹅", "é"],
    "single",
    ["Gần “ưa / ơ” tiếng Việt, phát từ cổ họng", "Like “uh” pushed from the throat"],
    [
      ["Miệng hơi mở, môi dẹt, không tròn.", "Lưỡi lùi về sau."],
      ["Mouth half-open, lips unrounded.", "Tongue pulled back."],
    ],
    [
      ["喝", "hē", "uống", "to drink"],
      ["饿", "è", "đói", "hungry"],
    ],
    ["e không phải “e” tiếng Việt: 喝 hē đọc gần “hưa”.", "Not like English “e”: 喝 hē is close to “huh”."],
  ),
  f(
    "i",
    ["衣", "yī"],
    "single",
    ["Như “i” tiếng Việt", "Like “ee” in “see”"],
    [["Môi dẹt như cười, lưỡi nâng cao."], ["Spread the lips as if smiling."]],
    [
      ["你", "nǐ", "bạn", "you"],
      ["米", "mǐ", "gạo", "rice"],
    ],
    [
      "Sau z c s, zh ch sh r, “i” đọc gần “ư”: 四 sì, 是 shì.",
      "After z c s / zh ch sh r, “i” is a buzz: 四 sì, 是 shì.",
    ],
  ),
  f(
    "u",
    ["乌", "wū"],
    "single",
    ["Như “u” tiếng Việt", "Like “oo” in “food”"],
    [["Môi tròn, chúm nhỏ, lưỡi lùi sau."], ["Round and push the lips forward."]],
    [
      ["书", "shū", "sách", "book"],
      ["五", "wǔ", "số năm", "five"],
    ],
    ["Sau j q x y, “u” là ü: 去 qù, 鱼 yú.", "After j q x y, “u” is ü: 去 qù, 鱼 yú."],
  ),
  f(
    "ü",
    ["鱼", "yú"],
    "single",
    ["Gần “uy” tiếng Việt nhưng giữ môi tròn", "Like French “u” / German “ü”"],
    [
      ["Đọc “i” rồi giữ lưỡi, chúm môi tròn lại.", "Khẩu hình không đổi trong lúc đọc."],
      ["Say “ee”, then round the lips.", "Keep the shape steady."],
    ],
    [
      ["女", "nǚ", "nữ", "female"],
      ["去", "qù", "đi", "to go"],
    ],
    ["Gõ ü bằng “v”: nv3 → nǚ, lv4 → lǜ.", "Type ü as “v”: nv3 → nǚ."],
  ),
  // ----- Kép -----
  f(
    "ai",
    ["哀", "āi"],
    "compound",
    ["Như “ai” tiếng Việt", "Like “eye”"],
    [["Từ a lướt sang i."], ["Glide from a to i."]],
    [
      ["爱", "ài", "yêu", "love"],
      ["来", "lái", "đến", "to come"],
    ],
    ["Nhấn ở a, i nhẹ.", "Stress the a, keep i light."],
  ),
  f(
    "ei",
    ["飞", "fēi"],
    "compound",
    ["Như “ây” tiếng Việt", "Like “ay” in “say”"],
    [["Từ e (gần “ê”) lướt sang i."], ["Glide from e to i."]],
    [
      ["飞", "fēi", "bay", "to fly"],
      ["美", "měi", "đẹp", "beautiful"],
    ],
    ["ei đọc “ây”, không đọc “ê-i”.", "Say it as one sound: “ay”."],
  ),
  f(
    "ao",
    ["奥", "ào"],
    "compound",
    ["Như “ao” tiếng Việt", "Like “ow” in “how”"],
    [["Từ a lướt sang o (u), môi tròn dần."], ["Glide from a to o, rounding the lips."]],
    [
      ["好", "hǎo", "tốt", "good"],
      ["高", "gāo", "cao", "tall"],
    ],
    ["Đọc liền một hơi.", "One smooth glide."],
  ),
  f(
    "ou",
    ["欧", "ōu"],
    "compound",
    ["Như “âu” tiếng Việt", "Like “o” in “go”"],
    [["Từ o lướt sang u, môi tròn."], ["Glide from o to u."]],
    [
      ["口", "kǒu", "miệng", "mouth"],
      ["狗", "gǒu", "con chó", "dog"],
    ],
    ["ou đọc “âu”, không đọc “ô-u”.", "Keep it short: “oh”."],
  ),
  f(
    "ia",
    ["压", "yā"],
    "compound",
    ["“i-a” đọc liền (gần “da”)", "Like “ya” in “yard”"],
    [["i ngắn lướt nhanh sang a."], ["A short i gliding into a."]],
    [
      ["家", "jiā", "nhà", "home"],
      ["下", "xià", "dưới", "down"],
    ],
    ["Đứng đầu viết ya: 呀 ya.", "Written ya without an initial."],
  ),
  f(
    "ie",
    ["耶", "yē"],
    "compound",
    ["Như “iê” tiếng Việt", "Like “ye” in “yes”"],
    [["i lướt sang ê (e ở đây đọc “ê”)."], ["i gliding into “eh”."]],
    [
      ["谢谢", "xièxie", "cảm ơn", "thanks"],
      ["姐姐", "jiějie", "chị gái", "older sister"],
    ],
    ["e trong ie đọc “ê”, khác e đơn.", "This e is “eh”, not the throaty e."],
  ),
  f(
    "ua",
    ["蛙", "wā"],
    "compound",
    ["Như “oa” tiếng Việt", "Like “wa” in “want”"],
    [["u ngắn lướt sang a."], ["A short u gliding into a."]],
    [
      ["花", "huā", "hoa", "flower"],
      ["话", "huà", "lời nói", "speech"],
    ],
    ["Đứng đầu viết wa: 娃 wá.", "Written wa without an initial."],
  ),
  f(
    "uo",
    ["窝", "wō"],
    "compound",
    ["Như “ua / uô” tiếng Việt", "Like “wo” in “wore”"],
    [["u lướt sang o, môi tròn."], ["u gliding into o."]],
    [
      ["我", "wǒ", "tôi", "I"],
      ["多", "duō", "nhiều", "many"],
    ],
    ["Đứng đầu viết wo.", "Written wo without an initial."],
  ),
  f(
    "üe",
    ["月", "yuè"],
    "compound",
    ["Như “uê” tiếng Việt, môi tròn", "Like “ü” + “eh”"],
    [["ü lướt sang ê."], ["ü gliding into “eh”."]],
    [
      ["月", "yuè", "tháng, mặt trăng", "month, moon"],
      ["学", "xué", "học", "to study"],
    ],
    ["Sau j q x y viết ue (bỏ hai chấm).", "After j q x y it's written ue."],
  ),
  f(
    "iao",
    ["腰", "yāo"],
    "compound",
    ["Như “i-ao” / “eo” tiếng Việt", "Like “yow”"],
    [["i → a → o lướt liền."], ["i → a → o in one glide."]],
    [
      ["小", "xiǎo", "nhỏ", "small"],
      ["要", "yào", "muốn", "to want"],
    ],
    ["Đứng đầu viết yao.", "Written yao without an initial."],
  ),
  f(
    "iou",
    ["优", "yōu"],
    "compound",
    ["Như “iêu” tiếng Việt", "Like “yo” in “yoga”"],
    [
      ["i → o → u lướt liền.", "Sau phụ âm viết gọn “iu”: 六 liù."],
      ["i → o → u in one glide.", "After an initial it's written “iu”."],
    ],
    [
      ["六", "liù", "số sáu", "six"],
      ["有", "yǒu", "có", "to have"],
    ],
    ["iu vẫn đọc đủ “iêu”, không đọc “iu”.", "iu is still said as “yo”."],
  ),
  f(
    "uai",
    ["歪", "wāi"],
    "compound",
    ["Như “oai” tiếng Việt", "Like “why”"],
    [["u → a → i lướt liền."], ["u → a → i in one glide."]],
    [
      ["快", "kuài", "nhanh", "fast"],
      ["外", "wài", "ngoài", "outside"],
    ],
    ["Đứng đầu viết wai.", "Written wai without an initial."],
  ),
  f(
    "uei",
    ["威", "wēi"],
    "compound",
    ["Như “uây” tiếng Việt", "Like “way”"],
    [
      ["u → e → i lướt liền.", "Sau phụ âm viết gọn “ui”: 对 duì."],
      ["u → e → i in one glide.", "After an initial it's written “ui”."],
    ],
    [
      ["对", "duì", "đúng", "correct"],
      ["会", "huì", "biết, sẽ", "can, will"],
    ],
    ["ui đọc “uây”, không đọc “ui”.", "ui is said as “way”."],
  ),
  // ----- Mũi -----
  f(
    "an",
    ["安", "ān"],
    "nasal",
    ["Như “an” tiếng Việt", "Like “an” in “ban”"],
    [
      ["Đọc a rồi đóng bằng -n.", N.vi],
      ["Say a, then close with -n.", N.en],
    ],
    [
      ["三", "sān", "số ba", "three"],
      ["饭", "fàn", "cơm", "meal"],
    ],
    ["an (-n) và ang (-ng) khác nghĩa: 饭 fàn – 放 fàng.", "an vs ang change meaning: 饭 fàn – 放 fàng."],
  ),
  f(
    "en",
    ["恩", "ēn"],
    "nasal",
    ["Như “ân” tiếng Việt", "Like “un” in “under”"],
    [
      ["e (ơ) ngắn rồi đóng -n.", N.vi],
      ["A short “uh”, then -n.", N.en],
    ],
    [
      ["人", "rén", "người", "person"],
      ["门", "mén", "cửa", "door"],
    ],
    ["en ↔ eng: 门 mén – 梦 mèng.", "en vs eng: 门 mén – 梦 mèng."],
  ),
  f(
    "in",
    ["因", "yīn"],
    "nasal",
    ["Như “in” tiếng Việt", "Like “in”"],
    [
      ["i rồi đóng -n.", N.vi],
      ["Say i, then -n.", N.en],
    ],
    [
      ["您", "nín", "ngài (lịch sự)", "you (polite)"],
      ["今天", "jīntiān", "hôm nay", "today"],
    ],
    ["in ↔ ing: 新 xīn – 星 xīng.", "in vs ing: 新 xīn – 星 xīng."],
  ),
  f(
    "ün",
    ["晕", "yūn"],
    "nasal",
    ["Như “uyn” tiếng Việt, môi tròn", "ü + n"],
    [
      ["ü rồi đóng -n.", "Sau j q x y viết un: 云 yún."],
      ["ü then -n.", "After j q x y it's written un."],
    ],
    [
      ["云", "yún", "mây", "cloud"],
      ["裙子", "qúnzi", "váy", "skirt"],
    ],
    ["Giữ môi tròn đến hết.", "Keep the lips rounded."],
  ),
  f(
    "ian",
    ["烟", "yān"],
    "nasal",
    ["Như “iên” tiếng Việt", "Like “yen”"],
    [
      ["a trong ian đọc gần “ê”.", N.vi],
      ["The a here sounds like “eh”.", N.en],
    ],
    [
      ["天", "tiān", "trời, ngày", "sky, day"],
      ["钱", "qián", "tiền", "money"],
    ],
    ["天 tiān đọc gần “thiên”, không đọc “thian”.", "天 tiān sounds like “tyen”."],
  ),
  f(
    "uan",
    ["弯", "wān"],
    "nasal",
    ["Như “oan” tiếng Việt", "Like “wan”"],
    [
      ["u lướt sang an.", N.vi],
      ["u gliding into an.", N.en],
    ],
    [
      ["完", "wán", "xong", "to finish"],
      ["短", "duǎn", "ngắn", "short"],
    ],
    ["Sau j q x y, “uan” là üan: 远 yuǎn.", "After j q x y, “uan” is üan."],
  ),
  f(
    "üan",
    ["冤", "yuān"],
    "nasal",
    ["Như “uyên” tiếng Việt", "ü + an (a like “eh”)"],
    [
      ["ü lướt sang an (a đọc gần “ê”).", "Sau j q x y viết uan."],
      ["ü gliding into an.", "After j q x y it's written uan."],
    ],
    [
      ["远", "yuǎn", "xa", "far"],
      ["选", "xuǎn", "chọn", "to choose"],
    ],
    ["远 yuǎn đọc gần “duyền”.", "Keep the lips rounded at the start."],
  ),
  f(
    "uen",
    ["温", "wēn"],
    "nasal",
    ["Như “uân” tiếng Việt", "Like “won”"],
    [
      ["u lướt sang en.", "Sau phụ âm viết gọn “un”: 春 chūn."],
      ["u gliding into en.", "After an initial it's written “un”."],
    ],
    [
      ["问", "wèn", "hỏi", "to ask"],
      ["春天", "chūntiān", "mùa xuân", "spring"],
    ],
    ["un (sau phụ âm) đọc “uân”.", "un is said as “won”."],
  ),
  f(
    "ang",
    ["昂", "áng"],
    "nasal",
    ["Như “ang” tiếng Việt", "Like “ahng”"],
    [
      ["a rồi đóng -ng.", NG.vi],
      ["Say a, then -ng.", NG.en],
    ],
    [
      ["忙", "máng", "bận", "busy"],
      ["长", "cháng", "dài", "long"],
    ],
    ["-ng miệng vẫn mở, -n lưỡi chạm lợi.", "-ng keeps the mouth open."],
  ),
  f(
    "eng",
    ["亨", "hēng"],
    "nasal",
    ["Như “âng” tiếng Việt", "Like “ung” in “lung”"],
    [
      ["e (ơ) rồi đóng -ng.", NG.vi],
      ["A short “uh”, then -ng.", NG.en],
    ],
    [
      ["冷", "lěng", "lạnh", "cold"],
      ["朋友", "péngyou", "bạn bè", "friend"],
    ],
    ["peng đọc gần “pâng”.", "peng sounds like “pung”."],
  ),
  f(
    "ing",
    ["英", "yīng"],
    "nasal",
    ["Như “inh” tiếng Việt", "Like “ing” in “sing”"],
    [
      ["i rồi đóng -ng.", NG.vi],
      ["Say i, then -ng.", NG.en],
    ],
    [
      ["听", "tīng", "nghe", "to listen"],
      ["名字", "míngzi", "tên", "name"],
    ],
    ["ing đọc “inh”, in đọc “in”.", "ing vs in: -ng vs -n."],
  ),
  f(
    "ong",
    ["轰", "hōng"],
    "nasal",
    ["Như “ung” tiếng Việt", "Like “oong”"],
    [
      ["o (u) tròn môi rồi -ng.", NG.vi],
      ["Rounded o, then -ng.", NG.en],
    ],
    [
      ["中", "zhōng", "giữa", "middle"],
      ["东", "dōng", "đông", "east"],
    ],
    ["ong đọc “ung”, không đọc “ông”.", "ong sounds like “oong”."],
  ),
  f(
    "iang",
    ["央", "yāng"],
    "nasal",
    ["Như “i-ang” đọc liền", "Like “yahng”"],
    [
      ["i lướt sang ang.", NG.vi],
      ["i gliding into ang.", NG.en],
    ],
    [
      ["想", "xiǎng", "nghĩ, nhớ", "to think"],
      ["两", "liǎng", "hai", "two"],
    ],
    ["Đứng đầu viết yang.", "Written yang without an initial."],
  ),
  f(
    "uang",
    ["汪", "wāng"],
    "nasal",
    ["Như “oang” tiếng Việt", "Like “wahng”"],
    [
      ["u lướt sang ang.", NG.vi],
      ["u gliding into ang.", NG.en],
    ],
    [
      ["黄", "huáng", "màu vàng", "yellow"],
      ["床", "chuáng", "giường", "bed"],
    ],
    ["Đứng đầu viết wang.", "Written wang without an initial."],
  ),
  f(
    "ueng",
    ["翁", "wēng"],
    "nasal",
    ["Như “uâng” tiếng Việt", "Like “wung”"],
    [
      ["u lướt sang eng.", "Chỉ đứng một mình, viết weng."],
      ["u gliding into eng.", "Only used alone, written weng."],
    ],
    [["老翁", "lǎowēng", "ông lão", "old man"]],
    ["Rất ít gặp — chỉ có dạng weng.", "Rare — only appears as weng."],
  ),
  f(
    "iong",
    ["拥", "yōng"],
    "nasal",
    ["Như “i-ung” đọc liền", "Like “yoong”"],
    [
      ["i (ü) lướt sang ong.", NG.vi],
      ["i gliding into ong.", NG.en],
    ],
    [
      ["用", "yòng", "dùng", "to use"],
      ["熊猫", "xióngmāo", "gấu trúc", "panda"],
    ],
    ["Đứng đầu viết yong.", "Written yong without an initial."],
  ),
  // ----- Đặc biệt -----
  f(
    "er",
    ["儿", "ér"],
    "special",
    ["“ơ” rồi cuốn lưỡi lên", "Like American “er”"],
    [
      ["Đọc e (ơ) rồi cong đầu lưỡi lên.", "Không ghép với phụ âm đầu."],
      ["Say “uh” and curl the tongue up.", "Never follows an initial."],
    ],
    [
      ["二", "èr", "số hai", "two"],
      ["儿子", "érzi", "con trai", "son"],
    ],
    ["Âm “儿hoá”: 哪儿 nǎr, 玩儿 wánr cũng cuốn lưỡi ở cuối.", "Also used as an -r ending: 哪儿 nǎr."],
  ),
];
