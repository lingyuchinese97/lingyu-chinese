import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool } from "@/server/db/pool";
import { R_PASSAGES } from "@/data/reading/passages";
import { T_GRAMMAR_BY_ID } from "@/data/translation/grammar";
import * as rd from "@/features/reading/service";
import { pickSchema, submitSchema } from "@/features/reading/schema";
import { history } from "@/features/progress/service";
import { createVocab, listVocab } from "@/features/vocabulary/service";
import { vocabInputSchema, listParamsSchema } from "@/features/vocabulary/schema";
import { cleanupUsers, makeUser } from "./helpers";

let A: string;
let B: string;
beforeAll(async () => {
  await cleanupUsers();
  [A, B] = [await makeUser("rda"), await makeUser("rdb")];
});
afterAll(async () => {
  await cleanupUsers();
  await pool.end();
});

describe("kho bài đọc", () => {
  it("dữ liệu hợp lệ: pinyin khớp số chữ Hán, từ khoá có trong bài, ngữ pháp tồn tại, đáp án hợp lệ", () => {
    expect(new Set(R_PASSAGES.map((p) => p.id)).size).toBe(R_PASSAGES.length);
    for (const p of R_PASSAGES) {
      const text = p.lines.map((l) => l.zh).join("");
      for (const l of p.lines) {
        const han = [...l.zh].filter((c) => /\p{Script=Han}/u.test(c)).length;
        expect(l.py.split(/\s+/).filter(Boolean).length, `${p.id} ${l.zh}`).toBe(han);
        expect(l.vi && l.en, p.id).toBeTruthy();
      }
      for (const w of p.words)
        for (const part of w.zh.split("…").filter(Boolean)) expect(text.includes(part), `${p.id} ${w.zh}`).toBe(true);
      for (const g of p.grammar) expect(T_GRAMMAR_BY_ID.has(g.id), `${p.id} ${g.id}`).toBe(true);
      expect(p.questions.length).toBeGreaterThanOrEqual(3);
      for (const q of p.questions) {
        if (q.kind === "choice") expect(q.options[q.answer], p.id).toBeTruthy();
        else {
          expect(q.zh.includes("＿"), p.id).toBe(true);
          expect(text.includes(q.answer), `${p.id} ${q.answer}`).toBe(true);
        }
      }
    }
    for (const lv of [1, 2, 3, 4]) expect(R_PASSAGES.filter((p) => p.level === lv).length).toBeGreaterThanOrEqual(4);
    expect(new Set(R_PASSAGES.map((p) => p.type))).toEqual(new Set(["short", "dialogue", "article"]));
  });

  it("bài hiển thị không có đáp án; lọc danh sách theo cấp / dạng", () => {
    const p = rd.localPassage(R_PASSAGES[0]!, "vi");
    expect(JSON.stringify(p.questions)).not.toContain('"answer"');
    expect(
      rd.listPassages({ level: 2, type: "dialogue" }, "vi").every((x) => x.level === 2 && x.type === "dialogue"),
    ).toBe(true);
    expect(rd.localPassage(R_PASSAGES[0]!, "en").lines[0]!.tr).toMatch(/Wang Ming/);
  });
});

describe("chấm, chọn bài, lưu", () => {
  it("chấm trắc nghiệm theo số thứ tự, điền từ bỏ dấu câu / khoảng trắng", () => {
    const p = R_PASSAGES.find((x) => x.id === "r101")!;
    const r = rd.gradeReading(p, [0, 0, " 七。"]);
    expect(r.map((x) => x.correct)).toEqual([true, false, true]);
    expect(rd.gradeReading(p, [null, null, ""]).every((x) => !x.correct)).toBe(true);
    expect(() => submitSchema.parse({ answers: [0, "x".repeat(41)] })).toThrow();
  });

  it("nộp bài: ghi lịch sử + Tiến độ; tự chọn ưu tiên bài chưa đọc; người khác không thấy", async () => {
    const first = await rd.pickPassage(A, pickSchema.parse({ level: 1 }));
    const p = R_PASSAGES.find((x) => x.id === first.id)!;
    expect(p.level).toBe(1);
    const res = await rd.submitReading(
      A,
      p.id,
      p.questions.map((q) => (q.kind === "choice" ? q.answer : q.answer)),
      90,
      "vi",
    );
    expect(res).toMatchObject({ correct: p.questions.length, total: p.questions.length, percent: 100 });
    expect(res.results[0]).toHaveProperty("answer");
    const next = await rd.pickPassage(A, pickSchema.parse({ level: 1 }));
    expect(next.id).not.toBe(p.id);
    const h = await rd.readingHistory(A, "vi");
    expect(h[0]).toMatchObject({ correct: p.questions.length, durationSec: 90 });
    expect(h[0]!.passage.id).toBe(p.id);
    expect(await rd.readingHistory(B, "vi")).toEqual([]);
    const act = (await history(A, { kind: "reading", days: 1 }))[0]!;
    expect(act).toMatchObject({ title: p.title.zh, correct: p.questions.length });
    await expect(rd.submitReading(A, "nope", [], 0, "vi")).rejects.toMatchObject({ code: "not-found" });
  });

  it("theo từ vựng: chọn bài có từ trong kho; theo ngữ pháp; không có bài → empty", async () => {
    const U = await makeUser("rdv");
    await expect(rd.pickPassage(U, pickSchema.parse({ source: "vocab" }))).rejects.toMatchObject({ code: "empty" });
    await createVocab(U, vocabInputSchema.parse({ hanzi: "钥匙", pinyin: "yàoshi", meaningVi: "chìa khóa" }));
    expect((await rd.pickPassage(U, pickSchema.parse({ source: "vocab" }))).id).toBe("r302");
    const g = await rd.pickPassage(U, pickSchema.parse({ source: "grammar", grammar: "dui-ganxingqu" }));
    expect(R_PASSAGES.find((x) => x.id === g.id)!.grammar.some((x) => x.id === "dui-ganxingqu")).toBe(true);
  });

  it("lưu / bỏ lưu bài và lưu từ vào Từ vựng (bỏ qua từ đã có); dữ liệu riêng từng người", async () => {
    expect(await rd.setSaved(A, "r203", true)).toEqual({ saved: true });
    await rd.setSaved(A, "r203", true); // lưu lại không lỗi
    expect((await rd.listSaved(A, "vi")).map((x) => x.id)).toEqual(["r203"]);
    expect(await rd.listSaved(B, "vi")).toEqual([]);
    expect((await rd.getPassage(A, "r203", "vi")).saved).toBe(true);
    expect((await rd.getPassage(B, "r203", "vi")).saved).toBe(false);
    await rd.setSaved(A, "r203", false);
    expect(await rd.listSaved(A, "vi")).toEqual([]);

    const one = await rd.saveWords(A, "r203", ["汉字"]);
    expect(one).toEqual({ added: ["汉字"], skipped: [] });
    const all = await rd.saveWords(A, "r203", undefined);
    expect(all.skipped).toEqual(["汉字"]);
    expect(all.added.length).toBe(R_PASSAGES.find((x) => x.id === "r203")!.words.length - 1);
    const mine = await listVocab(A, listParamsSchema.parse({ q: "汉字" }));
    expect(mine.items[0]).toMatchObject({ hanzi: "汉字", meaningVi: "chữ Hán" });
    expect((await listVocab(B, listParamsSchema.parse({ q: "汉字" }))).items).toEqual([]);
    await expect(rd.saveWords(A, "r203", ["không có"])).rejects.toMatchObject({ code: "invalid" });
  });
});
