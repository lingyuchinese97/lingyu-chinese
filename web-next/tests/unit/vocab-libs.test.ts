import { describe, expect, it } from "vitest";
import { fold, foldCompact } from "@/lib/fold";
import { toneNumbersToMarks } from "@/lib/pinyin";
import { imageSize, sniffImage } from "@/lib/image-sniff";
import { radicalOf, radicalsOfText, searchRadicals } from "@/lib/radicals";
import { cleanRadicals, cleanTags, vocabInputSchema } from "@/features/vocabulary/schema";

describe("fold", () => {
  it("bỏ dấu tiếng Việt và dấu thanh pinyin", () => {
    expect(fold("  Đường Phố ")).toBe("duong pho");
    expect(foldCompact("nǐ hǎo")).toBe("nihao");
    expect(fold("lǜ")).toBe("lu");
  });
});

describe("pinyin: số thanh → dấu", () => {
  it.each([
    ["ni3 hao3", "nǐ hǎo"],
    ["ni3hao3", "nǐhǎo"],
    ["nihao3", "nihǎo"],
    ["lv4", "lǜ"],
    ["xie4xie5", "xièxie"],
    ["zhuang1", "zhuāng"],
    ["gou3", "gǒu"],
  ])("%s → %s", (a, b) => expect(toneNumbersToMarks(a)).toBe(b));
  it("chế độ strict giữ nguyên HSK1, Bài 2", () => {
    expect(toneNumbersToMarks("HSK1 bai2 ni3", { strict: true })).toBe("HSK1 bái nǐ");
    expect(toneNumbersToMarks("HSK1", { strict: true })).toBe("HSK1");
  });
});

describe("magic bytes", () => {
  it("nhận đúng PNG/JPEG/WebP, từ chối thứ khác", () => {
    const png = Buffer.from("89504e470d0a1a0a0000000d49484452000000100000000808060000", "hex");
    expect(sniffImage(png)).toBe("image/png");
    expect(imageSize(png, "image/png")).toEqual({ width: 16, height: 8 });
    expect(sniffImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffImage(Buffer.from("RIFF\0\0\0\0WEBPVP8 ", "latin1"))).toBe("image/webp");
    expect(sniffImage(Buffer.from("<svg xmlns=", "latin1"))).toBeNull();
    expect(sniffImage(Buffer.from("GIF89a", "latin1"))).toBeNull();
  });
});

describe("bộ thủ", () => {
  it("tìm theo nghĩa/tên, nhận bộ từ chữ Hán", () => {
    expect(searchRadicals("nước")[0]?.num).toBe(85);
    expect(searchRadicals("Thủy")[0]?.num).toBe(85);
    expect(searchRadicals("người")[0]?.num).toBe(9);
    expect(radicalOf("海")?.num).toBe(85);
    expect(radicalsOfText("你好a").map((x) => x.char)).toEqual(["你", "好"]);
  });
});

describe("schema từ vựng", () => {
  it("bắt buộc Hán tự có chữ Hán, ghi chú ≤ 200", () => {
    expect(vocabInputSchema.safeParse({ hanzi: "abc", pinyin: "a", meaningVi: "b" }).error?.issues[0]?.message).toBe(
      "Hán tự phải chứa ít nhất một chữ Hán.",
    );
    expect(vocabInputSchema.safeParse({ hanzi: "你", pinyin: "", meaningVi: "b" }).error?.issues[0]?.message).toBe(
      "Vui lòng nhập pinyin.",
    );
    expect(
      vocabInputSchema.safeParse({ hanzi: "你", pinyin: "a", meaningVi: "b", note: "x".repeat(201) }).success,
    ).toBe(false);
  });
  it("làm sạch tag và bộ thủ", () => {
    expect(cleanTags([" A ", "a", "B", ""])).toEqual(["A", "B"]);
    expect(cleanRadicals([85, "85", 0, 215, 1.5, 9])).toEqual([85, 9]);
  });
});
