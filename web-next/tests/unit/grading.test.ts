import { describe, expect, it } from "vitest";
import { findMatchingWord, grade, normalizePinyin, splitMeanings } from "@/lib/grading";

const nihao = { hanzi: "你好", pinyin: "nǐ hǎo", meaningVi: "xin chào; chào bạn" };
const lv = { hanzi: "绿", pinyin: "lǜ", meaningVi: "màu xanh lá / xanh lục" };

describe("chấm nghĩa tiếng Việt", () => {
  it("không phân biệt hoa thường, bỏ khoảng trắng thừa và dấu câu cuối", () => {
    expect(grade("meaning", nihao, "  XIN   Chào. ")).toBe(true);
    expect(grade("meaning", nihao, "xin chào; chào bạn")).toBe(true);
  });
  it("chấp nhận từng nghĩa tách bằng , ; /", () => {
    expect(grade("meaning", nihao, "chào bạn")).toBe(true);
    expect(grade("meaning", lv, "xanh lục")).toBe(true);
    expect(grade("meaning", { ...nihao, meaningVi: "bạn, cậu" }, "cậu")).toBe(true);
  });
  it("sai / bỏ trống / thiếu dấu tiếng Việt là sai", () => {
    expect(grade("meaning", nihao, "tạm biệt")).toBe(false);
    expect(grade("meaning", nihao, "   ")).toBe(false);
    expect(grade("meaning", nihao, "xin chao")).toBe(false);
  });
  it("tách nghĩa", () => expect(splitMeanings("a, B; c / d.")).toEqual(["a", "b", "c", "d"]));
});

describe("chấm chữ Hán", () => {
  it("khớp chính xác, bỏ khoảng trắng", () => {
    expect(grade("hanzi", nihao, "你 好")).toBe(true);
    expect(grade("hanzi", nihao, "你")).toBe(false);
    expect(grade("hanzi", nihao, "妳好")).toBe(false);
  });
});

describe("chấm pinyin", () => {
  it.each(["nǐ hǎo", "nǐhǎo", "ni3 hao3", "ni3hao3", "NI3 HAO3", "nǐ'hǎo", "ni3-hao3"])("%s = nǐ hǎo", (a) =>
    expect(grade("pinyin", nihao, a)).toBe(true),
  );
  it("v và u: đều là ü", () => {
    expect(grade("pinyin", lv, "lv4")).toBe(true);
    expect(grade("pinyin", lv, "lu:4")).toBe(true);
    expect(grade("pinyin", lv, "lǜ")).toBe(true);
  });
  it("sai thanh điệu hoặc không dấu là sai", () => {
    expect(grade("pinyin", nihao, "ni2 hao3")).toBe(false);
    expect(grade("pinyin", nihao, "ni hao")).toBe(false);
  });
  it("chuẩn hoá", () => expect(normalizePinyin(" Ni3 hao3 ")).toBe("nǐhǎo"));
});

describe("tìm từ khớp câu sai", () => {
  it("bỏ qua chính từ đang hỏi", () => {
    const list = [
      { id: "1", ...nihao },
      { id: "2", hanzi: "好", pinyin: "hǎo", meaningVi: "tốt" },
    ];
    expect(findMatchingWord("meaning", list, "tốt", "1")?.id).toBe("2");
    expect(findMatchingWord("meaning", list, "xin chào", "1")).toBeNull();
  });
});
