import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { R_PASSAGES } from "@/data/reading/passages";

// Font chữ Khải của giấy ô vuông chỉ chứa chữ có trong bài đọc (scripts/subset-paper-font.py) — thêm bài mới thì phải tạo lại font.
describe("font giấy ô vuông Đọc hiểu", () => {
  it("có đủ mọi chữ Hán trong tiêu đề, bài, câu hỏi và phương án", () => {
    const have = new Set(readFileSync("public/fonts/paper-kai.chars.txt", "utf8").trim());
    const text = R_PASSAGES.flatMap((p) => [
      p.title.zh,
      ...p.lines.map((l) => l.zh),
      ...p.words.map((w) => w.zh),
      ...p.questions.flatMap((q) => [q.zh, ...(q.kind === "choice" ? q.options : [])]),
    ]).join("");
    const missing = [...new Set(text.match(/\p{Script=Han}/gu))].filter((c) => !have.has(c));
    expect(missing, "chạy lại: python3 scripts/subset-paper-font.py").toEqual([]);
  });
});
