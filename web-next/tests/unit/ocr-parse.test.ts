import { describe, expect, it } from "vitest";
import { parseOcrText } from "@/lib/ocr-parse";

describe("tách kết quả OCR thành từ vựng", () => {
  it("Hán tự · pinyin · nghĩa trên một dòng, nhiều kiểu ngăn cách", () => {
    expect(
      parseOcrText(
        ["1. 你好 nǐ hǎo - xin chào", "谢谢：xièxie = cảm ơn", "老 师 lǎoshī giáo viên", "朋友 (péngyou) bạn bè"].join(
          "\n",
        ),
      ),
    ).toEqual([
      { hanzi: "你好", pinyin: "nǐ hǎo", meaning: "xin chào" },
      { hanzi: "谢谢", pinyin: "xièxie", meaning: "cảm ơn" },
      { hanzi: "老师", pinyin: "lǎoshī", meaning: "giáo viên" },
      { hanzi: "朋友", pinyin: "péngyou", meaning: "bạn bè" },
    ]);
  });

  it("không có pinyin: nghĩa tiếng Việt không bị nhầm là pinyin (xin chào ≠ 2 âm tiết của 1 chữ)", () => {
    expect(parseOcrText("好 tốt\n再见 chào tạm biệt\n书 shū")).toEqual([
      { hanzi: "好", pinyin: "", meaning: "tốt" },
      { hanzi: "再见", pinyin: "", meaning: "chào tạm biệt" },
      { hanzi: "书", pinyin: "shū", meaning: "" },
    ]);
  });

  it("nhiều từ trên một dòng, bỏ trùng (gộp thông tin), bỏ dòng không có chữ Hán, giới hạn số từ", () => {
    expect(parseOcrText("苹果、香蕉 , 苹果 píngguǒ quả táo\nBài 3: Từ mới\n")).toEqual([
      { hanzi: "苹果", pinyin: "píngguǒ", meaning: "quả táo" },
      { hanzi: "香蕉", pinyin: "", meaning: "" },
    ]);
    expect(parseOcrText("一 二 三 四", 2).map((w) => w.hanzi)).toEqual(["一二三四"]);
    expect(parseOcrText("一、二、三、四", 2).map((w) => w.hanzi)).toEqual(["一", "二"]);
  });

  it("OCR đọc sai dấu pinyin: vẫn tách đúng nghĩa theo dấu ngăn cách, pinyin sai để trống", () => {
    expect(parseOcrText("老师 IEoshT - giáo viên\n苹果 pinggu6 - quả táo\n你好 ni hǎo - xin chào")).toEqual([
      { hanzi: "老师", pinyin: "", meaning: "giáo viên" },
      { hanzi: "苹果", pinyin: "", meaning: "quả táo" },
      { hanzi: "你好", pinyin: "ni hǎo", meaning: "xin chào" },
    ]);
  });
});
