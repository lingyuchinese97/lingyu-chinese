import { describe, expect, it } from "vitest";
import { alignPinyin } from "@/features/grammar/align";
import { formulaParts, roleOf, splitStructure } from "@/features/grammar/components/structure-box";

describe("ghép pinyin theo từ (ví dụ ngữ pháp)", () => {
  it("mỗi cụm pinyin ứng với đúng số chữ; dấu câu đi kèm từ trước", () => {
    expect(alignPinyin("我昨天在学校吃饭。", "Wǒ zuótiān zài xuéxiào chī fàn.")).toEqual([
      { zh: "我", py: "Wǒ" },
      { zh: "昨天", py: "zuótiān" },
      { zh: "在", py: "zài" },
      { zh: "学校", py: "xuéxiào" },
      { zh: "吃", py: "chī" },
      { zh: "饭。", py: "fàn." },
    ]);
    expect(alignPinyin("你好！你叫什么？", "Nǐ hǎo! Nǐ jiào shénme?")!.map((x) => x.zh)).toEqual([
      "你",
      "好！",
      "你",
      "叫",
      "什么？",
    ]);
  });
  it("số âm tiết không khớp số chữ → null", () => {
    expect(alignPinyin("我很好", "wǒ hǎo")).toBeNull();
    expect(alignPinyin("我很好", "")).toBeNull();
  });
});

describe("công thức cấu trúc", () => {
  it("tách nhãn, tách phần theo +, nhận vai trò", () => {
    expect(splitStructure("Thời gian đầu câu: Thời gian + S + V")).toEqual({
      label: "Thời gian đầu câu",
      formula: "Thời gian + S + V",
    });
    expect(formulaParts("S + 是 + N")).toEqual(["S", "是", "N"]);
    expect(["S", "Thời gian", "Nơi chốn", "V", "O", "是", "N", "Adj", "xyz"].map(roleOf)).toEqual([
      "subj",
      "time",
      "place",
      "verb",
      "obj",
      "key",
      "noun",
      "adj",
      "other",
    ]);
  });
});
