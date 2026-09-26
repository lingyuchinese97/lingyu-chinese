/** 21 thanh mẫu (phụ âm đầu), chia theo vị trí phát âm. */
import type { SoundGroup, SoundItem } from "./types";

export const INITIAL_GROUPS: SoundGroup[] = [
  {
    id: "labial",
    name: { vi: "Âm môi", en: "Lip sounds" },
    desc: { vi: "Hai môi (hoặc môi dưới – răng trên) chạm nhau", en: "Both lips (or lower lip and upper teeth)" },
  },
  {
    id: "alveolar",
    name: { vi: "Âm đầu lưỡi", en: "Tongue-tip sounds" },
    desc: { vi: "Đầu lưỡi chạm lợi trên", en: "Tongue tip touches the upper gum" },
  },
  {
    id: "velar",
    name: { vi: "Âm cuống lưỡi", en: "Back-of-tongue sounds" },
    desc: { vi: "Cuống lưỡi nâng lên sát ngạc mềm", en: "Back of the tongue rises to the soft palate" },
  },
  {
    id: "palatal",
    name: { vi: "Âm mặt lưỡi (lưỡi trước)", en: "Front-of-tongue sounds" },
    desc: { vi: "Mặt lưỡi áp sát ngạc cứng, đầu lưỡi chạm răng dưới", en: "Tongue blade near the hard palate" },
  },
  {
    id: "retroflex",
    name: { vi: "Âm cuốn lưỡi (lưỡi sau)", en: "Retroflex sounds" },
    desc: { vi: "Đầu lưỡi cong lên, chạm phần sau lợi trên", en: "Tongue tip curls up behind the gum" },
  },
  {
    id: "dental",
    name: { vi: "Âm đầu lưỡi – răng", en: "Tongue-tip & teeth sounds" },
    desc: { vi: "Đầu lưỡi đặt sau răng cửa trên", en: "Tongue tip behind the upper front teeth" },
  },
];

const i = (
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

const UNASP = {
  vi: "Không bật hơi: đặt tay trước miệng gần như không thấy hơi.",
  en: "Unaspirated: almost no puff of air.",
};
const ASP = { vi: "Bật hơi mạnh: đặt tay trước miệng thấy luồng hơi rõ.", en: "Aspirated: a strong puff of air." };

export const INITIALS: SoundItem[] = [
  i(
    "b",
    ["波", "bō"],
    "labial",
    ["Gần “p” trong “pin” (không bật hơi)", "Like “b” in “boy”, voiceless"],
    [
      ["Hai môi khép lại rồi bật mở nhẹ.", UNASP.vi, "Dây thanh không rung — không đọc thành “b” tiếng Việt."],
      ["Close both lips, then release gently.", UNASP.en, "Vocal cords don't vibrate."],
    ],
    [
      ["爸爸", "bàba", "bố", "dad"],
      ["八", "bā", "số tám", "eight"],
    ],
    ["b – p là cặp: b nhẹ, p bật hơi. Thử với tờ giấy trước miệng.", "b and p are a pair: b is soft, p puffs air."],
  ),
  i(
    "p",
    ["坡", "pō"],
    "labial",
    ["“p” bật hơi mạnh (không phải “ph”)", "Like “p” in “pie”"],
    [
      ["Hai môi khép lại rồi bật mạnh.", ASP.vi],
      ["Close both lips, then burst open.", ASP.en],
    ],
    [
      ["朋友", "péngyou", "bạn bè", "friend"],
      ["苹果", "píngguǒ", "quả táo", "apple"],
    ],
    ["Giữ tờ giấy trước miệng: đọc p đúng thì giấy rung.", "Hold a sheet of paper: it should flutter on p."],
  ),
  i(
    "m",
    ["摸", "mō"],
    "labial",
    ["Như “m” tiếng Việt", "Like “m” in “mom”"],
    [
      ["Hai môi khép, hơi đi ra đằng mũi.", "Âm mũi, dây thanh rung."],
      ["Close the lips, air flows through the nose.", "Nasal and voiced."],
    ],
    [
      ["妈妈", "māma", "mẹ", "mom"],
      ["米饭", "mǐfàn", "cơm", "rice"],
    ],
    ["Âm dễ nhất — đọc như tiếng Việt.", "The easiest one — just like English."],
  ),
  i(
    "f",
    ["佛", "fó"],
    "labial",
    ["Như “ph” tiếng Việt", "Like “f” in “fun”"],
    [
      ["Răng trên chạm nhẹ môi dưới.", "Hơi đi qua khe hẹp tạo tiếng xát."],
      ["Upper teeth touch the lower lip.", "Air passes through the narrow gap."],
    ],
    [
      ["飞机", "fēijī", "máy bay", "plane"],
      ["饭", "fàn", "cơm, bữa ăn", "meal"],
    ],
    ["f không bật như p: răng phải chạm môi.", "Unlike p, the teeth must touch the lip."],
  ),
  i(
    "d",
    ["德", "dé"],
    "alveolar",
    ["Gần “t” tiếng Việt (không bật hơi)", "Like “d” in “day”, voiceless"],
    [
      ["Đầu lưỡi chạm lợi trên rồi bật ra nhẹ.", UNASP.vi],
      ["Tongue tip touches the upper gum, then releases.", UNASP.en],
    ],
    [
      ["大", "dà", "to, lớn", "big"],
      ["弟弟", "dìdi", "em trai", "younger brother"],
    ],
    [
      "Đừng đọc thành “đ” tiếng Việt: d tiếng Trung giống “t”.",
      "Don't voice it: Chinese d sounds close to an unaspirated t.",
    ],
  ),
  i(
    "t",
    ["特", "tè"],
    "alveolar",
    ["Như “th” tiếng Việt", "Like “t” in “top”"],
    [
      ["Vị trí như d nhưng bật hơi mạnh.", ASP.vi],
      ["Same place as d, but with a strong puff.", ASP.en],
    ],
    [
      ["他", "tā", "anh ấy", "he"],
      ["太", "tài", "quá", "too"],
    ],
    ["d – t là cặp: d nhẹ, t có hơi.", "d and t are a pair: d is soft, t puffs air."],
  ),
  i(
    "n",
    ["讷", "nè"],
    "alveolar",
    ["Như “n” tiếng Việt", "Like “n” in “no”"],
    [
      ["Đầu lưỡi chạm lợi trên, hơi ra đằng mũi.", "Âm mũi, dây thanh rung."],
      ["Tongue tip on the upper gum, air through the nose.", "Nasal and voiced."],
    ],
    [
      ["你", "nǐ", "bạn", "you"],
      ["牛奶", "niúnǎi", "sữa bò", "milk"],
    ],
    [
      "Phân biệt n – l: bịt mũi lại, đọc n sẽ nghẹt, l thì không.",
      "n vs l: pinch your nose — n gets blocked, l doesn't.",
    ],
  ),
  i(
    "l",
    ["勒", "lè"],
    "alveolar",
    ["Như “l” tiếng Việt", "Like “l” in “let”"],
    [
      ["Đầu lưỡi chạm lợi trên, hơi đi ra hai bên lưỡi.", "Dây thanh rung."],
      ["Tongue tip on the upper gum, air flows around the sides.", "Voiced."],
    ],
    [
      ["老师", "lǎoshī", "giáo viên", "teacher"],
      ["来", "lái", "đến", "to come"],
    ],
    ["Không để hơi đi qua mũi (khác n).", "Keep air out of the nose (unlike n)."],
  ),
  i(
    "g",
    ["哥", "gē"],
    "velar",
    ["Gần “c / k” tiếng Việt (không bật hơi)", "Like “g” in “go”, voiceless"],
    [
      ["Cuống lưỡi chạm ngạc mềm rồi bật ra nhẹ.", UNASP.vi],
      ["Back of the tongue touches the soft palate, then releases.", UNASP.en],
    ],
    [
      ["哥哥", "gēge", "anh trai", "older brother"],
      ["高", "gāo", "cao", "tall"],
    ],
    ["Không đọc thành “g” tiếng Việt (gờ): g tiếng Trung giống “c”.", "Chinese g sounds close to an unaspirated k."],
  ),
  i(
    "k",
    ["科", "kē"],
    "velar",
    ["“k” bật hơi (không phải “kh”)", "Like “k” in “kite”"],
    [
      ["Vị trí như g nhưng bật hơi mạnh.", ASP.vi],
      ["Same place as g, but with a strong puff.", ASP.en],
    ],
    [
      ["可以", "kěyǐ", "có thể", "can"],
      ["看", "kàn", "xem, nhìn", "to look"],
    ],
    ["k là âm tắc bật hơi, không xát như “kh” tiếng Việt.", "k is a burst, not a friction sound."],
  ),
  i(
    "h",
    ["喝", "hē"],
    "velar",
    ["Giữa “h” và “kh” tiếng Việt", "Like a rough “h”"],
    [
      ["Cuống lưỡi nâng gần ngạc mềm.", "Hơi đi qua khe hẹp, có tiếng xát nhẹ."],
      ["Back of the tongue rises near the soft palate.", "Air passes with light friction."],
    ],
    [
      ["喝", "hē", "uống", "to drink"],
      ["好", "hǎo", "tốt, khỏe", "good"],
    ],
    ["Xát nhẹ ở cổ họng, không đọc hơi nhẹ như “h” tiếng Việt.", "Add a little friction at the back of the throat."],
  ),
  i(
    "j",
    ["基", "jī"],
    "palatal",
    ["Gần “ch” tiếng Việt (không bật hơi)", "Like “j” in “jeep”, softer"],
    [
      ["Đầu lưỡi chạm răng dưới, mặt lưỡi áp ngạc cứng.", "Bật ra nhẹ, không bật hơi. Chỉ đi với i, ü."],
      ["Tongue tip behind the lower teeth, blade on the hard palate.", "Soft release. Only before i and ü."],
    ],
    [
      ["家", "jiā", "nhà", "home"],
      ["鸡", "jī", "con gà", "chicken"],
    ],
    ["j q x + u thực ra là ü: 去 qù đọc “chuy”.", "After j q x, “u” is really ü: 去 qù."],
  ),
  i(
    "q",
    ["七", "qī"],
    "palatal",
    ["Như “ch” tiếng Việt nhưng bật hơi", "Like “ch” in “cheese”"],
    [
      ["Vị trí như j nhưng bật hơi mạnh.", ASP.vi],
      ["Same place as j, but with a strong puff.", ASP.en],
    ],
    [
      ["七", "qī", "số bảy", "seven"],
      ["去", "qù", "đi", "to go"],
    ],
    ["q không đọc là “qu” (quờ).", "q is never “kw”."],
  ),
  i(
    "x",
    ["西", "xī"],
    "palatal",
    ["Gần “x” tiếng Việt, cười nhẹ khi đọc", "Like “sh” with a smile"],
    [
      ["Mặt lưỡi gần ngạc cứng, đầu lưỡi chạm răng dưới.", "Hơi đi qua khe hẹp, môi hơi dẹt."],
      ["Tongue blade near the hard palate, tip behind the lower teeth.", "Air flows through; lips spread."],
    ],
    [
      ["谢谢", "xièxie", "cảm ơn", "thanks"],
      ["学生", "xuésheng", "học sinh", "student"],
    ],
    ["x (mặt lưỡi) khác sh (cuốn lưỡi): x môi dẹt, sh lưỡi cong.", "x (flat tongue, smile) vs sh (curled tongue)."],
  ),
  i(
    "zh",
    ["知", "zhī"],
    "retroflex",
    ["Như “tr” tiếng Việt (không bật hơi)", "Like “j” in “jungle”, tongue curled"],
    [
      ["Đầu lưỡi cong lên chạm phần sau lợi trên.", UNASP.vi],
      ["Curl the tongue tip up behind the gum.", UNASP.en],
    ],
    [
      ["中国", "Zhōngguó", "Trung Quốc", "China"],
      ["知道", "zhīdào", "biết", "to know"],
    ],
    [
      "zh / ch / sh / r: nhớ “cong lưỡi”. zh ↔ z chỉ khác ở lưỡi cong.",
      "zh / ch / sh / r all curl the tongue. zh ↔ z differ only in the curl.",
    ],
  ),
  i(
    "ch",
    ["吃", "chī"],
    "retroflex",
    ["“tr” tiếng Việt nhưng bật hơi", "Like “ch” in “church”, tongue curled"],
    [
      ["Vị trí như zh nhưng bật hơi mạnh.", ASP.vi],
      ["Same place as zh, but with a strong puff.", ASP.en],
    ],
    [
      ["吃", "chī", "ăn", "to eat"],
      ["茶", "chá", "trà", "tea"],
    ],
    ["吃 chī: cong lưỡi + bật hơi, không đọc thành “chi”.", "吃 chī: curled tongue plus air."],
  ),
  i(
    "sh",
    ["诗", "shī"],
    "retroflex",
    ["Như “s” (uốn lưỡi) tiếng Việt", "Like “sh” in “shirt”, tongue curled"],
    [
      ["Đầu lưỡi cong lên gần phần sau lợi trên.", "Hơi đi qua khe hẹp, không chạm hẳn."],
      ["Curl the tongue tip near the back of the gum.", "Air flows through without full contact."],
    ],
    [
      ["是", "shì", "là", "to be"],
      ["书", "shū", "sách", "book"],
    ],
    ["四 sì (s) và 是 shì (sh) rất hay nhầm — luyện cặp này.", "四 sì vs 是 shì is a classic pair to practise."],
  ),
  i(
    "r",
    ["日", "rì"],
    "retroflex",
    ["Giữa “r” và “gi” tiếng Việt, lưỡi cong", "Like “r” in “run” with a buzz"],
    [
      ["Vị trí như sh, dây thanh rung.", "Không rung đầu lưỡi như “r” tiếng Việt."],
      ["Same place as sh, but voiced.", "Don't trill the tongue."],
    ],
    [
      ["人", "rén", "người", "person"],
      ["热", "rè", "nóng", "hot"],
    ],
    ["Đọc sh rồi cho dây thanh rung là ra r.", "Say sh and add voice — that's r."],
  ),
  i(
    "z",
    ["资", "zī"],
    "dental",
    ["Gần “ch” đầu lưỡi / “ts” (không bật hơi)", "Like “ds” in “kids”"],
    [
      ["Đầu lưỡi chạm sau răng cửa trên.", UNASP.vi],
      ["Tongue tip behind the upper front teeth.", UNASP.en],
    ],
    [
      ["在", "zài", "ở", "at, in"],
      ["早", "zǎo", "sớm", "early"],
    ],
    ["Lưỡi phẳng, không cong (khác zh).", "Keep the tongue flat (unlike zh)."],
  ),
  i(
    "c",
    ["词", "cí"],
    "dental",
    ["“ts” bật hơi", "Like “ts” in “cats”, with air"],
    [
      ["Vị trí như z nhưng bật hơi mạnh.", ASP.vi],
      ["Same place as z, but with a strong puff.", ASP.en],
    ],
    [
      ["菜", "cài", "rau, món ăn", "dish"],
      ["从", "cóng", "từ", "from"],
    ],
    ["c không đọc là “k” hay “x”.", "c is never “k” or “s”."],
  ),
  i(
    "s",
    ["思", "sī"],
    "dental",
    ["Như “x” tiếng Việt", "Like “s” in “sun”"],
    [
      ["Đầu lưỡi gần sau răng cửa trên.", "Hơi đi qua khe hẹp."],
      ["Tongue tip near the upper front teeth.", "Air hisses through the gap."],
    ],
    [
      ["四", "sì", "số bốn", "four"],
      ["三", "sān", "số ba", "three"],
    ],
    ["s lưỡi phẳng, sh lưỡi cong.", "s is flat, sh is curled."],
  ),
];
