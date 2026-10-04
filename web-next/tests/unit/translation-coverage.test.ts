import { describe, expect, it } from "vitest";
import { coverage, newWordsOf } from "@/features/translation/coverage";

const item = {
  zh: "我每天早上七点起床。",
  words: [
    { zh: "每天", py: "měi tiān", vi: "mỗi ngày", en: "every day" },
    { zh: "早上", py: "zǎo shang", vi: "buổi sáng", en: "morning" },
    { zh: "七点", py: "qī diǎn", vi: "bảy giờ", en: "seven o'clock" },
    { zh: "起床", py: "qǐ chuáng", vi: "thức dậy", en: "get up" },
  ],
};

describe("độ quen của câu với Từ vựng của tôi", () => {
  it("tỉ lệ chữ Hán nằm trong từ đã có (dấu câu không tính)", () => {
    expect(coverage(item.zh, [])).toBe(0);
    expect(coverage(item.zh, ["我", "每天", "早上", "七点", "起床"])).toBe(1);
    expect(coverage(item.zh, ["每天", "起床"])).toBeCloseTo(4 / 9, 5);
    // Từ có trong kho nhưng không xuất hiện trong câu không được tính.
    expect(coverage(item.zh, ["咖啡"])).toBe(0);
  });

  it("từ mới: từ khoá chưa có (kèm pinyin + nghĩa), phần còn lại tách theo từ điển; không lặp, đúng thứ tự", () => {
    const w = newWordsOf(item, new Set(["每天", "七点"]));
    expect(w.map((x) => x.zh)).toEqual(["我", "早上", "起床"]);
    expect(w[1]).toEqual({ zh: "早上", py: "zǎo shang", vi: "buổi sáng", en: "morning" });
    expect(w[0]!.py).toBe("wǒ");
    expect(newWordsOf(item, new Set(["我", "每天", "早上", "七点", "起床"]))).toEqual([]);
  });

  it("từ trong kho phủ một phần từ khoá (起 trong 起床) vẫn báo từ khoá là từ mới", () => {
    expect(newWordsOf(item, new Set(["我", "每天", "早上", "七点", "起"])).map((x) => x.zh)).toEqual(["起床"]);
  });
});
