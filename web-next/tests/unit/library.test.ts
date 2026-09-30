import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { pool } from "@/server/db/pool";
import { libraryImage, libraryWord } from "@/server/db/schema";
import { analyzeWord, findCandidates } from "@/features/library/analyze";
import * as lib from "@/features/library/service";
import { libListSchema, libWordInputSchema } from "@/features/library/schema";
import { listVocab } from "@/features/vocabulary/service";
import { listParamsSchema } from "@/features/vocabulary/schema";
import { cleanupUsers, makeUser } from "./helpers";

// 1x1 PNG
const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f5f0000000049454e44ae426082",
  "hex",
);
const word = (p: Record<string, unknown>) => libWordInputSchema.parse(p);
const params = (p: Record<string, unknown> = {}) => libListSchema.parse(p);

let ADMIN: string;
let A: string;
let B: string;
beforeAll(async () => {
  await cleanupUsers();
  await db.delete(libraryWord);
  await db.delete(libraryImage);
  [ADMIN, A, B] = [await makeUser("libadm"), await makeUser("liba"), await makeUser("libb")];
});
afterAll(async () => {
  await db.delete(libraryWord);
  await db.delete(libraryImage);
  await cleanupUsers();
  await pool.end();
});

describe("phân tích từ (dữ liệu có sẵn)", () => {
  it("chữ Hán → pinyin, nghĩa, HSK, bộ thủ, cách nhớ, từ liên quan, ví dụ; không có dữ liệu → để trống", () => {
    const a = analyzeWord("学");
    expect(a).toMatchObject({ hanzi: "学", pinyin: "xué", meaningVi: "học", hskLevel: 1, pos: "" });
    expect(a.components[0]).toMatchObject({ char: "子", pinyin: "zǐ" });
    expect(a.mnemonic).toContain("→ 学 (học)");
    expect(a.related.map((r) => r.zh)).toContain("学校");
    expect(a.examples.length).toBeGreaterThan(0);
    expect(a.examples.every((e) => e.zh.includes("学"))).toBe(true);
    const x = analyzeWord("龘");
    expect(x.meaningVi).toBe("");
    expect(x.pinyin).toBeTruthy();
  });

  it("pinyin / tiếng Việt → gợi ý từ để chọn", () => {
    expect(findCandidates("học").map((c) => c.hanzi)).toContain("学");
    expect(findCandidates("xuexiao")[0]).toMatchObject({ hanzi: "学校" });
    expect(findCandidates("   ")).toEqual([]);
  });
});

describe("thư viện: nháp / public / lưu vào kho", () => {
  it("nháp không hiện với người dùng; public cần pinyin + nghĩa; trùng Hán tự → duplicate", async () => {
    const id = await lib.createWord(ADMIN, word({ hanzi: "学", hskLevel: 1 }), false);
    expect((await lib.listPublicWords(A, params())).items).toEqual([]);
    await expect(lib.getPublicWord(A, id)).rejects.toMatchObject({ code: "not-found" });
    await expect(lib.setWordStatus(id, true)).rejects.toMatchObject({ code: "validation" });
    await expect(lib.createWord(ADMIN, word({ hanzi: "学" }), false)).rejects.toMatchObject({ code: "duplicate" });

    await lib.updateWord(id, word({ ...analyzeWord("学"), pos: "verb", topic: "school" }), true);
    const pub = await lib.listPublicWords(A, params({ hsk: 1 }));
    expect(pub.items).toMatchObject([{ id, hanzi: "学", pinyin: "xué", meaningVi: "học", saved: false }]);
    expect(pub.levels[1]).toBe(1);
    expect((await lib.listPublicWords(A, params({ hsk: 2 }))).items).toEqual([]);
    expect((await lib.listPublicWords(A, params({ hsk: 0, q: "hoc" }))).total).toBe(1);
    expect((await lib.listPublicWords(A, params({ hsk: 0, topic: "food" }))).total).toBe(0);
    const d = await lib.getPublicWord(A, id);
    expect(d).toMatchObject({ pos: "verb", topic: "school", hasImage: false, saved: false });
    expect(d).not.toHaveProperty("status");
    expect(d).not.toHaveProperty("createdBy");

    // Về nháp → biến mất khỏi thư viện.
    await lib.setWordStatus(id, false);
    expect((await lib.listPublicWords(A, params({ hsk: 0 }))).total).toBe(0);
    await lib.setWordStatus(id, true);
  });

  it("ảnh: kiểm tra magic bytes; chỉ trả ảnh của từ public; thay / xoá ảnh xoá hẳn ảnh cũ", async () => {
    expect(() => lib.parseLibImage(Buffer.from("not an image"))).toThrow(lib.LibraryError);
    const id = await lib.createWord(ADMIN, word({ hanzi: "字", pinyin: "zì", meaningVi: "chữ" }), false);
    await lib.setWordImage(id, lib.parseLibImage(PNG));
    expect(await lib.wordImage(id)).toBeNull(); // nháp → người dùng không xem được
    expect(await lib.wordImage(id, true)).not.toBeNull();
    await lib.setWordStatus(id, true);
    expect((await lib.wordImage(id))?.mime).toBe("image/png");
    await lib.setWordImage(id, lib.parseLibImage(PNG));
    expect((await db.select().from(libraryImage)).length).toBe(1);
    await lib.deleteWord(id);
    expect((await db.select().from(libraryImage)).length).toBe(0);
    await expect(lib.deleteWord(id)).rejects.toMatchObject({ code: "not-found" });
  });

  it("lưu vào Từ vựng của tôi: chỉ vào kho người bấm, bấm lại không trùng; 'đã lưu' theo từng người", async () => {
    const [w] = await db.select().from(libraryWord).where(eq(libraryWord.hanzi, "学"));
    expect(await lib.saveToMyVocab(A, w!.id)).toEqual({ saved: true, added: true });
    expect(await lib.saveToMyVocab(A, w!.id)).toEqual({ saved: true, added: false });
    const mine = await listVocab(A, listParamsSchema.parse({ q: "学" }));
    expect(mine.items[0]).toMatchObject({ hanzi: "学", pinyin: "xué", meaningVi: "học" });
    expect(mine.items[0]!.tags).toEqual(["Thư viện LingYu", "HSK1"]);
    expect((await lib.listPublicWords(A, params({ hsk: 1 }))).items[0]!.saved).toBe(true);
    expect((await lib.listPublicWords(B, params({ hsk: 1 }))).items[0]!.saved).toBe(false);
    expect((await listVocab(B, listParamsSchema.parse({}))).total).toBe(0);
    // Từ nháp không lưu được.
    const draft = await lib.createWord(ADMIN, word({ hanzi: "书", pinyin: "shū", meaningVi: "sách" }), false);
    await expect(lib.saveToMyVocab(A, draft)).rejects.toMatchObject({ code: "not-found" });
  });
});
