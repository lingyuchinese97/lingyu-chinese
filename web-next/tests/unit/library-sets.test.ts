import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool } from "@/server/db/pool";
import { LIB_SET_BY_ID, LIB_VOCAB_SETS } from "@/data/library/vocab-sets";
import { LIB_POS, setListSchema } from "@/features/library/schema";
import * as sets from "@/features/library/sets";
import { LibraryError } from "@/features/library/service";
import { listVocab } from "@/features/vocabulary/service";
import { listParamsSchema } from "@/features/vocabulary/schema";
import { isPinyinSyllable, splitSyllables } from "@/lib/pinyin";
import { cleanupUsers, makeUser } from "./helpers";

const p = (x: Record<string, unknown> = {}) => setListSchema.parse(x);
let A: string;
let B: string;
beforeAll(async () => {
  await cleanupUsers();
  [A, B] = [await makeUser("lsa"), await makeUser("lsb")];
});
afterAll(async () => {
  await cleanupUsers();
  await pool.end();
});

describe("nội dung bộ từ vựng (biên soạn sẵn)", () => {
  it("id duy nhất, số thứ tự liên tục; mỗi từ đủ trường, không trùng trong bộ, pinyin hợp lệ, ví dụ chứa đúng từ", () => {
    expect(new Set(LIB_VOCAB_SETS.map((s) => s.id)).size).toBe(LIB_VOCAB_SETS.length);
    expect(LIB_VOCAB_SETS.map((s) => s.no)).toEqual(LIB_VOCAB_SETS.map((_, i) => i + 1));
    for (const s of LIB_VOCAB_SETS) {
      expect(s.id).toMatch(/^[a-z0-9-]+$/);
      expect(s.id).not.toBe("hsk"); // trùng đường dẫn /library/vocabulary/hsk
      expect(new Set(s.words.map((w) => w.zh)).size, s.id).toBe(s.words.length);
      for (const w of s.words) {
        const where = `${s.id}/${w.zh}`;
        expect(w.zh, where).toMatch(/^\p{Script=Han}+$/u);
        expect(LIB_POS, where).toContain(w.pos);
        for (const k of [w.py, w.vi, w.en, w.emoji, w.ex.zh, w.ex.py, w.ex.vi, w.ex.en])
          expect(k.trim(), where).not.toBe("");
        // Số âm tiết pinyin = số chữ Hán; mọi âm tiết đều hợp lệ.
        const syl = w.py.split(/\s+/).flatMap((t) => splitSyllables(t.replace(/'/g, "")));
        expect(syl.length, where).toBe([...w.zh].length);
        expect(
          syl.every((x) => isPinyinSyllable(x.toLowerCase())),
          where,
        ).toBe(true);
        expect(w.ex.zh.includes(w.zh), where).toBe(true);
      }
    }
  });
});

describe("bộ từ vựng: lọc, tiến độ, yêu thích, lưu", () => {
  it("lọc HSK / chủ đề / nhóm, tìm theo tên bộ, chữ Hán, pinyin không dấu, 'HSK 2'; sắp xếp", async () => {
    const all = await sets.listSets(A, p(), "vi");
    expect(all.total).toBe(LIB_VOCAB_SETS.length);
    expect((await sets.listSets(A, p({ hsk: 1 }), "vi")).items.every((s) => s.hsk === 1)).toBe(true);
    expect((await sets.listSets(A, p({ topic: "food" }), "vi")).items.map((s) => s.id)).toContain("trai-cay");
    expect((await sets.listSets(A, p({ kind: "radical" }), "vi")).items.every((s) => s.kinds.includes("radical"))).toBe(
      true,
    );
    expect((await sets.listSets(A, p({ q: "trai cay" }), "vi")).items.map((s) => s.id)).toEqual(["trai-cay"]);
    expect((await sets.listSets(A, p({ q: "苹果" }), "vi")).items.map((s) => s.id)).toContain("trai-cay");
    expect((await sets.listSets(A, p({ q: "pingguo" }), "vi")).items.map((s) => s.id)).toContain("trai-cay");
    expect((await sets.listSets(A, p({ q: "HSK 2" }), "vi")).items.every((s) => s.hsk === 2)).toBe(true);
    const size = (await sets.listSets(A, p({ sort: "size" }), "vi")).items;
    expect(size[0]!.total).toBeGreaterThanOrEqual(size.at(-1)!.total);
    expect((await sets.listSets(A, p(), "en")).items[0]!.title).toBe("Basic greetings");
  });

  it("đã học / yêu thích là của riêng từng người; bộ / từ không có → not-found", async () => {
    const r = await sets.setWordLearned(A, "trai-cay", "苹果", true);
    expect(r.progress).toEqual({ learned: 1, total: LIB_SET_BY_ID.get("trai-cay")!.words.length });
    await sets.setWordLearned(A, "trai-cay", "苹果", true); // bấm lại không đếm trùng
    await sets.setFavorite(A, "trai-cay", null, true);
    await sets.setFavorite(A, "trai-cay", "香蕉", true);

    const a = await sets.getSet(A, "trai-cay", "vi");
    expect(a).toMatchObject({ learned: 1, favorite: true });
    expect(a.words.find((w) => w.zh === "苹果")).toMatchObject({ learned: true });
    expect(a.words.find((w) => w.zh === "香蕉")).toMatchObject({ favorite: true });
    const b = await sets.getSet(B, "trai-cay", "vi");
    expect(b).toMatchObject({ learned: 0, favorite: false });
    expect(b.words.some((w) => w.learned || w.favorite)).toBe(false);
    expect((await sets.listSets(B, p({ kind: "favorite" }), "vi")).items).toEqual([]);
    expect((await sets.listSets(A, p({ kind: "favorite" }), "vi")).items.map((s) => s.id)).toEqual(["trai-cay"]);

    await sets.setWordLearned(A, "trai-cay", "苹果", false);
    expect((await sets.getSet(A, "trai-cay", "vi")).learned).toBe(0);

    await expect(sets.getSet(A, "khong-co", "vi")).rejects.toBeInstanceOf(LibraryError);
    await expect(sets.setWordLearned(A, "trai-cay", "咖啡", true)).rejects.toBeInstanceOf(LibraryError);
    await expect(sets.getSetWord(A, "trai-cay", "咖啡", "vi")).rejects.toBeInstanceOf(LibraryError);
  });

  it("chi tiết từ: âm tiết + thanh, ví dụ (câu biên soạn đầu tiên), từ trước / sau", async () => {
    const d = await sets.getSetWord(A, "trai-cay", "苹果", "vi");
    expect(d.syllables).toEqual([
      { syl: "píng", tone: "t2" },
      { syl: "guǒ", tone: "t3" },
    ]);
    expect(d.examples[0]).toMatchObject({ zh: "我喜欢吃苹果。", meaning: "Tôi thích ăn táo." });
    expect(d).toMatchObject({ prev: null, next: "香蕉" });
    expect(d.words).toHaveLength(LIB_SET_BY_ID.get("trai-cay")!.words.length);
  });

  it("lưu bộ vào Từ vựng của tôi: chỉ vào kho người bấm, tag tên bộ + HSK, bấm lại không trùng", async () => {
    const r = await sets.saveSetToMyVocab(A, "so-dem", null, "vi");
    const n = LIB_SET_BY_ID.get("so-dem")!.words.length;
    expect(r).toEqual({ added: n, skipped: 0 });
    expect(await sets.saveSetToMyVocab(A, "so-dem", null, "vi")).toEqual({ added: 0, skipped: n });
    const mine = await listVocab(A, listParamsSchema.parse({ tag: "Số đếm" }));
    expect(mine.total).toBe(n);
    expect(mine.items[0]!.tags).toEqual(expect.arrayContaining(["Số đếm", "HSK1"]));
    expect((await listVocab(B, listParamsSchema.parse({}))).total).toBe(0);
    expect((await sets.getSet(A, "so-dem", "vi")).words.every((w) => w.saved)).toBe(true);
    expect((await sets.getSet(B, "so-dem", "vi")).words.some((w) => w.saved)).toBe(false);
    expect(await sets.saveSetToMyVocab(B, "so-dem", "一", "vi")).toEqual({ added: 1, skipped: 0 });
  });
});

describe("từ vựng HSK", () => {
  it("30 từ / trang, tìm theo pinyin, đã học theo từng người; từ không thuộc cấp → not-found", async () => {
    const l1 = await sets.listHskWords(A, { level: 1, q: "", page: 1 });
    expect(l1.items).toHaveLength(30);
    expect(l1.pageCount).toBe(Math.ceil(l1.total / 30));
    const ai = l1.items.find((x) => x.zh === "爱")!;
    expect(ai).toMatchObject({ py: "ài", pos: ["verb"] });
    expect((await sets.listHskWords(A, { level: 1, q: "baba", page: 1 })).items.map((x) => x.zh)).toContain("爸爸");
    await sets.setHskLearned(A, 1, "爱", true);
    expect((await sets.listHskWords(A, { level: 1, q: "", page: 1 })).learned).toBe(1);
    expect((await sets.listHskWords(B, { level: 1, q: "", page: 1 })).learned).toBe(0);
    await expect(sets.setHskLearned(A, 1, "科技", true)).rejects.toBeInstanceOf(LibraryError);
    await expect(sets.setHskLearned(A, 9, "爱", true)).rejects.toBeInstanceOf(LibraryError);
  });
});
