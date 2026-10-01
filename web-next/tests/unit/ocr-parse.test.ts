import { describe, expect, it } from "vitest";
import { parseOcrLines, parseOcrText, type OcrCell } from "@/lib/ocr-parse";

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

  it("ảnh dạng bảng (giáo trình): số thứ tự · chữ Hán · (từ loại) · pinyin · (Hán Việt) · tiếng Anh · tiếng Việt", () => {
    // Ô thật đọc từ ảnh trang sách: `text` = bản giữ dấu (Tesseract), `alt` = bản Paddle (không dấu); toạ độ ngang.
    const c = (text: string, x0: number, x1: number, alt = text): OcrCell => ({ text, alt, x0, x1 });
    const lines: OcrCell[][] = [
      [
        c("1. 买", 25, 84, "1.买"),
        c("( 动 ) mời", 109, 202, "（动）mai"),
        c("(mãi)", 236, 286),
        c("to buy", 328, 383),
        c("mua", 502, 538),
      ],
      [
        c("2. 水果 ( 名 ) shuïguð (thủy quả)", 23, 329, "2. 水果（名） shuiguo (thuy qua)"),
        c(") fruit", 315, 369),
        c("hoa quả", 502, 562),
      ],
      [
        c("4. 斤", 25, 83),
        c("( 量 ) Jn", 111, 191, "（量）jin"),
        c("(cân)", 240, 287),
        c("jin,", 333, 373),
        c("cân", 508, 540),
      ],
      [c("a weight unit in China (Trung Q lu", 329, 609)],
      [
        c("公斤 （ 量 ) gõngjin (công cân) kilogram", 55, 410, "公斤（量）gongjin（cong can） kilogram"),
        c("cân, kg", 512, 571),
      ],
      [
        c("5. 贵", 26, 88),
        c("( 形 ) gu", 113, 197, "（形）gui"),
        c("(quy)", 243, 292),
        c("expensive", 333, 418),
        c("đắt", 514, 545),
      ],
      [
        c("7 吧", 26, 86, "7.吧"),
        c("( 助 ) bơ", 112, 195, "（助）ba"),
        c("(ba)", 244, 283),
        c("(a particle used at", 337, 487),
        c("trợ từ trong", 517, 611),
      ],
      [c("the end of a", 339, 441), c("khẳng định,", 520, 611)],
      [c("ý, câu yêu", 519, 611)],
    ];
    expect(parseOcrLines(lines)).toEqual([
      { hanzi: "买", pinyin: "mai", meaning: "mua" },
      { hanzi: "水果", pinyin: "shuiguo", meaning: "hoa quả" },
      { hanzi: "斤", pinyin: "jin", meaning: "cân" },
      { hanzi: "公斤", pinyin: "gongjin", meaning: "cân, kg" },
      // Tesseract đọc "gu" (thiếu chữ), Paddle đọc "gui" → lấy bản đúng chữ cái; dấu thanh do server gợi ý.
      { hanzi: "贵", pinyin: "gui", meaning: "đắt" },
      // Nghĩa xuống dòng trong cột tiếng Việt được nối lại; dòng tiếng Anh nối tiếp bị bỏ.
      { hanzi: "吧", pinyin: "ba", meaning: "trợ từ trong khẳng định ý, câu yêu" },
    ]);
  });

  it("bảng không có tiếng Anh, pinyin có dấu: chữ Hán · pinyin · nghĩa ở ba ô", () => {
    const c = (text: string, x0: number, x1: number): OcrCell => ({ text, x0, x1 });
    expect(
      parseOcrLines([
        [c("朋友", 10, 60), c("péngyou", 80, 160), c("bạn bè", 200, 280)],
        [c("学生", 10, 60), c("xuésheng", 80, 160), c("học sinh", 200, 280)],
      ]),
    ).toEqual([
      { hanzi: "朋友", pinyin: "péngyou", meaning: "bạn bè" },
      { hanzi: "学生", pinyin: "xuésheng", meaning: "học sinh" },
    ]);
  });

  it("bản giữ dấu mất ngoặc của nhãn từ loại: dựa vào bản Paddle để bỏ (không thành từ riêng, không dính vào từ trước)", () => {
    const c = (text: string, alt: string, x0: number, x1: number): OcrCell => ({ text, alt, x0, x1 });
    expect(
      parseOcrLines([
        [c("1. 买", "1.买", 25, 84), c("动 mǎi", "（动）mai", 109, 202), c("mua", "mua", 502, 538)],
        [c("2. 水果名 shuǐguǒ", "2. 水果（名） shuiguo", 23, 329), c("hoa quả", "hoa qua", 502, 562)],
        [c("5. 贵 （形 guì", "5. 贵（形）gui", 26, 197), c("đắt", "dat", 514, 545)],
      ]),
    ).toEqual([
      { hanzi: "买", pinyin: "mǎi", meaning: "mua" },
      { hanzi: "水果", pinyin: "shuǐguǒ", meaning: "hoa quả" },
      { hanzi: "贵", pinyin: "guì", meaning: "đắt" },
    ]);
  });
});
