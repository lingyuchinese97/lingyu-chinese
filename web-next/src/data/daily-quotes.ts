/** Câu nói mỗi ngày (Trang chủ) — đổi theo ngày, bấm nút để xem câu khác. */
export const DAILY_QUOTES: { zh: string; pinyin: string; vi: string; en: string }[] = [
  {
    zh: "学习让生活更美好。",
    pinyin: "Xuéxí ràng shēnghuó gèng měihǎo.",
    vi: "Học tập làm cho cuộc sống tốt đẹp hơn.",
    en: "Learning makes life better.",
  },
  {
    zh: "千里之行，始于足下。",
    pinyin: "Qiān lǐ zhī xíng, shǐ yú zú xià.",
    vi: "Hành trình ngàn dặm bắt đầu từ một bước chân.",
    en: "A journey of a thousand miles begins with a single step.",
  },
  {
    zh: "有志者事竟成。",
    pinyin: "Yǒu zhì zhě shì jìng chéng.",
    vi: "Có chí thì nên.",
    en: "Where there's a will, there's a way.",
  },
  {
    zh: "熟能生巧。",
    pinyin: "Shú néng shēng qiǎo.",
    vi: "Có công mài sắt, có ngày nên kim — luyện nhiều sẽ thành thạo.",
    en: "Practice makes perfect.",
  },
  {
    zh: "活到老，学到老。",
    pinyin: "Huó dào lǎo, xué dào lǎo.",
    vi: "Học, học nữa, học mãi.",
    en: "Live and learn — never stop learning.",
  },
  {
    zh: "不怕慢，就怕站。",
    pinyin: "Bú pà màn, jiù pà zhàn.",
    vi: "Không sợ chậm, chỉ sợ dừng lại.",
    en: "Don't fear going slowly, only fear standing still.",
  },
  {
    zh: "每天进步一点点。",
    pinyin: "Měitiān jìnbù yìdiǎndiǎn.",
    vi: "Mỗi ngày tiến bộ một chút.",
    en: "A little progress every day.",
  },
  {
    zh: "学而时习之，不亦说乎？",
    pinyin: "Xué ér shí xí zhī, bú yì yuè hū?",
    vi: "Học rồi thường xuyên ôn luyện, chẳng phải vui lắm sao?",
    en: "To learn and practise it regularly — isn't that a joy?",
  },
  {
    zh: "书山有路勤为径。",
    pinyin: "Shū shān yǒu lù qín wéi jìng.",
    vi: "Núi sách có đường, chăm chỉ là lối đi.",
    en: "The mountain of books has a path, and diligence is the way.",
  },
  {
    zh: "失败是成功之母。",
    pinyin: "Shībài shì chénggōng zhī mǔ.",
    vi: "Thất bại là mẹ thành công.",
    en: "Failure is the mother of success.",
  },
  {
    zh: "加油，你可以的！",
    pinyin: "Jiāyóu, nǐ kěyǐ de!",
    vi: "Cố lên, bạn làm được mà!",
    en: "Keep going, you can do it!",
  },
  {
    zh: "今天的努力，明天的收获。",
    pinyin: "Jīntiān de nǔlì, míngtiān de shōuhuò.",
    vi: "Nỗ lực hôm nay, thu hoạch ngày mai.",
    en: "Today's effort is tomorrow's harvest.",
  },
];

/** Chỉ số câu theo ngày (giờ Việt Nam). */
export function quoteIndexForDay(now = new Date()) {
  const day = Math.floor((now.getTime() + 7 * 3600_000) / 86400_000);
  return day % DAILY_QUOTES.length;
}
