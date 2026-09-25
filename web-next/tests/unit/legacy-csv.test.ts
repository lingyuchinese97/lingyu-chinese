import { describe, expect, it } from "vitest";
import { legacyCsvToExport, parseCsv, ImportError } from "@/features/account/transfer";

/** Đúng hàm toCsv của bản cũ (web/src/features/vocabulary/bulkActions.js). */
function oldToCsv(words: { hanzi: string; pinyin: string; meaningVi: string; note: string; tags: string[] }[]) {
  const cell = (s: string) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const rows = [["Hán tự", "Pinyin", "Nghĩa tiếng Việt", "Ghi chú", "Tag"]].concat(
    words.map((v) => [v.hanzi, v.pinyin, v.meaningVi, v.note, v.tags.join(", ")]),
  );
  return "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
}

describe("nhập CSV từ bản cũ", () => {
  it("đọc đúng file CSV bản cũ (BOM, ngoặc kép, dấu phẩy và xuống dòng trong ô, nhiều tag)", () => {
    const csv = oldToCsv([
      {
        hanzi: "你好",
        pinyin: "nǐ hǎo",
        meaningVi: "xin chào",
        note: 'dùng khi "gặp nhau", lịch sự',
        tags: ["HSK1", "Giao tiếp"],
      },
      { hanzi: "谢谢", pinyin: "xièxie", meaningVi: "cảm ơn", note: "dòng 1\ndòng 2", tags: [] },
    ]);
    const f = legacyCsvToExport(csv);
    expect(f.format).toBe("lingyu-export");
    expect(f.vocab).toEqual([
      {
        hanzi: "你好",
        pinyin: "nǐ hǎo",
        meaningVi: "xin chào",
        note: 'dùng khi "gặp nhau", lịch sự',
        tags: ["HSK1", "Giao tiếp"],
      },
      { hanzi: "谢谢", pinyin: "xièxie", meaningVi: "cảm ơn", note: "dòng 1\ndòng 2", tags: [] },
    ]);
    expect(parseCsv("a,b\n\n1,2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("báo lỗi khi thiếu cột bắt buộc", () => {
    expect(() => legacyCsvToExport("Tên,Tuổi\nA,1")).toThrow(ImportError);
  });
});
