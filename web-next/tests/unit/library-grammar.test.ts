import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool } from "@/server/db/pool";
import { LIB_GRAMMAR, LIB_GRAMMAR_BY_ID } from "@/data/library/grammar";
import { grammarListSchema } from "@/features/library/schema";
import * as g from "@/features/library/grammar";
import { LibraryError } from "@/features/library/service";
import { listGrammar } from "@/features/grammar/service";
import { grammarListSchema as myGrammarListSchema } from "@/features/grammar/schema";
import { cleanupUsers, makeUser } from "./helpers";

const p = (x: Record<string, unknown> = {}) => grammarListSchema.parse(x);
let A: string;
let B: string;
beforeAll(async () => {
  await cleanupUsers();
  [A, B] = [await makeUser("lga"), await makeUser("lgb")];
});
afterAll(async () => {
  await cleanupUsers();
  await pool.end();
});

describe("nội dung bài ngữ pháp (biên soạn sẵn)", () => {
  it("id duy nhất, thứ tự liên tục theo cấp, đủ nội dung song ngữ, bài tập hợp lệ, bài liên quan tồn tại", () => {
    expect(new Set(LIB_GRAMMAR.map((x) => x.id)).size).toBe(LIB_GRAMMAR.length);
    for (const hsk of new Set(LIB_GRAMMAR.map((x) => x.hsk))) {
      const nos = LIB_GRAMMAR.filter((x) => x.hsk === hsk).map((x) => x.no);
      expect(nos, `HSK${hsk}`).toEqual(nos.map((_, i) => i + 1));
    }
    for (const x of LIB_GRAMMAR) {
      expect(x.id).toMatch(/^[a-z0-9-]{1,40}$/);
      for (const s of [x.zh, x.py, x.emoji, x.name.vi, x.name.en, x.summary.vi, x.summary.en, x.intro.vi, x.intro.en])
        expect(s.trim(), x.id).not.toBe("");
      expect(x.structure.length, x.id).toBeGreaterThan(1);
      for (const list of [x.usage, x.meaning, x.notes]) {
        expect(list.length, x.id).toBeGreaterThan(0);
        for (const it of list) expect(it.vi.trim() && it.en.trim(), x.id).toBeTruthy();
      }
      expect(x.examples.length, x.id).toBeGreaterThanOrEqual(3);
      for (const e of x.examples) {
        expect(e.zh, x.id).toMatch(/\p{Script=Han}/u);
        for (const s of [e.py, e.vi, e.en, e.emoji]) expect(s.trim(), `${x.id}/${e.zh}`).not.toBe("");
      }
      expect(x.quiz.length, x.id).toBeGreaterThan(0);
      for (const q of x.quiz) {
        expect(q.options.length, x.id).toBeGreaterThanOrEqual(2);
        expect(new Set(q.options).size, x.id).toBe(q.options.length);
        expect(q.answer, x.id).toBeLessThan(q.options.length);
        if (q.q) expect(q.q, x.id).toContain("___");
      }
      for (const r of x.related) {
        expect(LIB_GRAMMAR_BY_ID.has(r), `${x.id} → ${r}`).toBe(true);
        expect(r).not.toBe(x.id);
      }
    }
  });
});

describe("ngữ pháp Thư viện: lọc, đã học, yêu thích, lưu", () => {
  it("lọc HSK / chủ đề, tìm theo chữ Hán, pinyin không dấu, nghĩa, 'HSK 2'; lộ trình đếm đúng", async () => {
    const all = await g.listLibGrammar(A, p(), "vi");
    expect(all.total).toBe(LIB_GRAMMAR.length);
    expect(all.items[0]).toMatchObject({ id: "shi", hsk: 1 });
    expect((await g.listLibGrammar(A, p({ hsk: 2 }), "vi")).items.every((x) => x.hsk === 2)).toBe(true);
    expect((await g.listLibGrammar(A, p({ topic: "compare" }), "vi")).items.map((x) => x.id)).toContain("bi");
    expect((await g.listLibGrammar(A, p({ q: "是的" }), "vi")).items.map((x) => x.id)).toContain("shi-de");
    expect((await g.listLibGrammar(A, p({ q: "yuelaiyue" }), "vi")).items.map((x) => x.id)).toEqual(["yuelaiyue"]);
    expect((await g.listLibGrammar(A, p({ q: "HSK 3" }), "vi")).items.every((x) => x.hsk === 3)).toBe(true);
    expect(all.roadmap.find((r) => r.hsk === 1)!.total).toBe(LIB_GRAMMAR.filter((x) => x.hsk === 1).length);
    expect((await g.listLibGrammar(A, p(), "en")).items[0]!.name).toBe("to be");
  });

  it("đã học / yêu thích là của riêng từng người; bài không có → not-found", async () => {
    const r = await g.setLibGrammarLearned(A, "shi-de", true);
    expect(r.progress).toEqual({ learned: 1, total: LIB_GRAMMAR.filter((x) => x.hsk === 2).length });
    await g.setLibGrammarLearned(A, "shi-de", true);
    await g.setLibGrammarFavorite(A, "shi-de", true);

    const a = await g.getLibGrammar(A, "shi-de", "vi");
    expect(a).toMatchObject({ learned: true, favorite: true, progress: { learned: 1 } });
    expect(a.level.find((x) => x.id === "shi-de")!.learned).toBe(true);
    expect(a.related.map((x) => x.id)).toEqual(["shi", "de", "le"]);
    expect(a.structure.map((s) => s.zh)).toContain("的");
    const b = await g.getLibGrammar(B, "shi-de", "vi");
    expect(b).toMatchObject({ learned: false, favorite: false, saved: false, progress: { learned: 0 } });
    expect((await g.listLibGrammar(B, p({ status: "favorite" }), "vi")).items).toEqual([]);
    expect((await g.listLibGrammar(A, p({ status: "favorite" }), "vi")).items.map((x) => x.id)).toEqual(["shi-de"]);
    expect((await g.listLibGrammar(A, p({ status: "learned" }), "vi")).items.map((x) => x.id)).toEqual(["shi-de"]);
    expect((await g.listLibGrammar(A, p({ status: "todo" }), "vi")).total).toBe(LIB_GRAMMAR.length - 1);
    expect((await g.listLibGrammar(B, p(), "vi")).learned).toBe(0);

    await g.setLibGrammarLearned(A, "shi-de", false);
    expect((await g.getLibGrammar(A, "shi-de", "vi")).learned).toBe(false);

    await expect(g.getLibGrammar(A, "khong-co", "vi")).rejects.toBeInstanceOf(LibraryError);
    await expect(g.setLibGrammarLearned(A, "khong-co", true)).rejects.toBeInstanceOf(LibraryError);
    await expect(g.saveLibGrammarToMine(A, "khong-co", "vi")).rejects.toBeInstanceOf(LibraryError);
  });

  it("lưu vào Ngữ pháp của tôi: chỉ vào kho người bấm, tag Thư viện + HSK, bấm lại không trùng (kể cả đổi ngôn ngữ)", async () => {
    const r = await g.saveLibGrammarToMine(A, "ba", "vi");
    expect(r.added).toBe(true);
    expect(await g.saveLibGrammarToMine(A, "ba", "vi")).toEqual({ added: false });
    expect(await g.saveLibGrammarToMine(A, "ba", "en")).toEqual({ added: false });
    const mine = (await listGrammar(A, myGrammarListSchema.parse({}))).items;
    expect(mine).toHaveLength(1);
    expect(mine[0]!.title).toBe(`把 – ${LIB_GRAMMAR_BY_ID.get("ba")!.name.vi}`);
    expect(mine[0]!.structure).toContain("把");
    expect(mine[0]!.examples).toHaveLength(LIB_GRAMMAR_BY_ID.get("ba")!.examples.length);
    expect(mine[0]!.tags.map((t) => t.name)).toEqual(expect.arrayContaining(["Thư viện LingYu", "HSK3"]));
    expect((await listGrammar(B, myGrammarListSchema.parse({}))).total).toBe(0);
    expect((await g.getLibGrammar(A, "ba", "vi")).saved).toBe(true);
    expect((await g.getLibGrammar(B, "ba", "vi")).saved).toBe(false);
  });
});
