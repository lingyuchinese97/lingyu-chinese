import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { pool } from "@/server/db/pool";
import { image, srsCard } from "@/server/db/schema";
import { storage } from "@/server/storage";
import * as svc from "@/features/vocabulary/service";
import { listParamsSchema, vocabInputSchema } from "@/features/vocabulary/schema";
import { cleanupUsers, makeUser } from "./helpers";

const params = (p: Record<string, unknown> = {}) => listParamsSchema.parse(p);
const input = (p: Record<string, unknown>) => vocabInputSchema.parse({ pinyin: "x", meaningVi: "x", ...p });
// 1x1 PNG
const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f5f0000000049454e44ae426082",
  "hex",
);

let A: string;
let B: string;
beforeAll(async () => {
  await cleanupUsers();
  A = await makeUser("a");
  B = await makeUser("b");
});
afterAll(async () => {
  await cleanupUsers();
  await pool.end();
});

describe("từ vựng — nghiệp vụ", () => {
  it("tạo từ: tag không trùng, tạo sẵn thẻ FSRS", async () => {
    const id = await svc.createVocab(
      A,
      input({ hanzi: "你好", pinyin: "nǐ hǎo", meaningVi: "xin chào", tags: ["HSK1", "hsk1", "Giao tiếp"] }),
    );
    const v = await svc.getVocab(A, id);
    expect(v.tags).toEqual(["HSK1", "Giao tiếp"]);
    expect(v.status).toBe("review");
    const cards = await db.select().from(srsCard).where(eq(srsCard.vocabId, id));
    expect(cards).toHaveLength(1);
    expect(cards[0]!.state).toBe(0);
  });

  it("tìm kiếm bỏ dấu: pinyin viết liền, nghĩa không dấu, tag", async () => {
    await svc.createVocab(A, input({ hanzi: "朋友", pinyin: "péngyou", meaningVi: "bạn bè", tags: ["Giao tiếp"] }));
    const hit = async (q: string) => (await svc.listVocab(A, params({ q }))).items.map((x) => x.hanzi).sort();
    expect(await hit("nihao")).toEqual(["你好"]);
    expect(await hit("ni hao")).toEqual(["你好"]);
    expect(await hit("ban be")).toEqual(["朋友"]);
    expect(await hit("BẠN")).toEqual(["朋友"]);
    expect(await hit("giao tiep")).toEqual(["你好", "朋友"]);
    expect(await hit("友")).toEqual(["朋友"]);
    expect(await hit("%")).toEqual([]);
  });

  it("lọc tag, bộ thủ; sắp xếp pinyin; phân trang", async () => {
    await svc.createVocab(A, input({ hanzi: "海", pinyin: "hǎi", meaningVi: "biển" }));
    expect((await svc.listVocab(A, params({ tag: "giao tiếp" }))).total).toBe(2);
    expect((await svc.listVocab(A, params({ tag: "không có" }))).total).toBe(0);
    // 海 thuộc bộ Thủy (85) → tự nhận ra từ chữ Hán.
    expect((await svc.listVocab(A, params({ radical: 85 }))).items.map((x) => x.hanzi)).toEqual(["海"]);
    const byPinyin = (await svc.listVocab(A, params({ sort: "pinyin" }))).items.map((x) => x.pinyin);
    expect(byPinyin).toEqual(["hǎi", "nǐ hǎo", "péngyou"]);
    const p = await svc.listVocab(A, params({ page: 9 }), 2);
    expect(p.pageCount).toBe(2);
    expect(p.page).toBe(2);
    expect(p.items).toHaveLength(1);
    expect(p.totalAll).toBe(3);
  });

  it("đổi trạng thái, yêu thích, gắn thêm tag", async () => {
    const { items } = await svc.listVocab(A, params());
    const ids = items.map((x) => x.id);
    expect(await svc.setStatus(A, ids, "learned")).toBe(3);
    const fav = await svc.toggleFavorite(A, ids[0]!);
    expect(fav.isFavorite).toBe(true);
    expect(await svc.addTags(A, ids, ["Bài 1"])).toBe(3);
    const tags = await svc.listTags(A);
    expect(tags.find((t) => t.name === "Bài 1")?.count).toBe(3);
    // Tag xếp A → Z, số theo giá trị ("HSK1_Bài 2" trước "HSK1_Bài 10"), không theo số từ.
    for (const name of ["HSK1_Bài 10", "HSK1_Bài 2", "hsk1_Bài 1"]) await svc.createTag(A, name);
    expect((await svc.listTags(A)).map((t) => t.name).filter((n) => n.toLowerCase().startsWith("hsk1_"))).toEqual([
      "hsk1_Bài 1",
      "HSK1_Bài 2",
      "HSK1_Bài 10",
    ]);
    const st = await svc.vocabStats(A);
    expect(st).toMatchObject({ total: 3, learned: 3, needReview: 0 });
  });

  it("lọc theo cấp HSK (tag HSK1 / HSK 2 / HSK3_Bài 1, cấp nhỏ nhất), trạng thái, yêu thích; đếm theo cấp; số từ mỗi trang", async () => {
    const C = await makeUser("hskv");
    await svc.createVocab(C, input({ hanzi: "一", tags: ["HSK1", "HSK 2"] }));
    await svc.createVocab(C, input({ hanzi: "二", tags: ["HSK 2"] }));
    await svc.createVocab(C, input({ hanzi: "三", tags: ["HSK3_Bài 1"] }));
    await svc.createVocab(C, input({ hanzi: "四", tags: ["Tự thêm"] }));
    const all = await svc.listVocab(C, params());
    expect(all.hskCounts).toMatchObject({ "1": 1, "2": 1, "3": 1, other: 1 });
    const hz = async (p: Record<string, unknown>) =>
      (await svc.listVocab(C, params(p))).items.map((x) => x.hanzi).sort();
    expect(await hz({ hsk: "1" })).toEqual(["一"]);
    expect(await hz({ hsk: "2" })).toEqual(["二"]);
    expect(await hz({ hsk: "3" })).toEqual(["三"]);
    expect(await hz({ hsk: "other" })).toEqual(["四"]);
    const two = all.items.find((x) => x.hanzi === "二")!;
    await svc.setStatus(C, [two.id], "learned");
    await svc.toggleFavorite(C, two.id);
    expect(await hz({ status: "learned" })).toEqual(["二"]);
    expect(await hz({ status: "review" })).toEqual(["一", "三", "四"]);
    expect(await hz({ fav: "1" })).toEqual(["二"]);
    expect(params({ fav: "false" }).fav).toBe(false);
    expect((await svc.listVocab(C, params(), 2)).items).toHaveLength(2);
    expect(params({ size: 7 }).size).toBe(8);
    // Không lộ sang người khác.
    expect((await svc.listVocab(B, params({ hsk: "1" }))).items.some((x) => x.hanzi === "一")).toBe(false);
  });

  it("ảnh: lưu, đổi ảnh xoá ảnh cũ, xoá từ xoá ảnh", async () => {
    const id = await svc.createVocab(A, input({ hanzi: "茶", pinyin: "chá", meaningVi: "trà" }), {
      bytes: PNG,
      mime: "image/png",
      width: 1,
      height: 1,
    });
    const first = (await svc.getVocab(A, id)).imageId!;
    expect(await storage.get(A, first)).not.toBeNull();
    await svc.updateVocab(A, id, input({ hanzi: "茶", pinyin: "chá", meaningVi: "trà" }), {
      bytes: PNG,
      mime: "image/png",
      width: 1,
      height: 1,
    });
    const second = (await svc.getVocab(A, id)).imageId!;
    expect(second).not.toBe(first);
    expect(await storage.get(A, first)).toBeNull();
    // Giữ ảnh (undefined) khi sửa chữ.
    await svc.updateVocab(A, id, input({ hanzi: "茶", pinyin: "chá", meaningVi: "trà xanh" }));
    expect((await svc.getVocab(A, id)).imageId).toBe(second);
    expect(await svc.deleteVocab(A, [id])).toBe(1);
    expect(await db.select().from(image).where(eq(image.id, second))).toHaveLength(0);
  });

  it("dữ liệu mẫu bỏ qua từ trùng Hán tự", async () => {
    const added = await svc.importSample(B);
    expect(added).toBe(24);
    expect(await svc.importSample(B)).toBe(0);
  });
});

describe("từ vựng — không lộ dữ liệu giữa hai người dùng", () => {
  it("B không thấy, không sửa, không xoá được từ và ảnh của A", async () => {
    const id = await svc.createVocab(
      A,
      input({ hanzi: "秘密", pinyin: "mìmì", meaningVi: "bí mật", note: "ghi chú riêng" }),
      {
        bytes: PNG,
        mime: "image/png",
        width: 1,
        height: 1,
      },
    );
    const imgId = (await svc.getVocab(A, id)).imageId!;
    expect((await svc.listVocab(B, params({ q: "bi mat" }))).total).toBe(0);
    await expect(svc.getVocab(B, id)).rejects.toThrow(svc.VocabError);
    await expect(svc.updateVocab(B, id, input({ hanzi: "改" }))).rejects.toThrow(svc.VocabError);
    expect(await svc.deleteVocab(B, [id])).toBe(0);
    expect(await svc.setStatus(B, [id], "learned")).toBe(0);
    expect(await svc.addTags(B, [id], ["hack"])).toBe(0);
    await expect(svc.toggleFavorite(B, id)).rejects.toThrow(svc.VocabError);
    expect(await storage.get(B, imgId)).toBeNull();
    // Từ của A vẫn nguyên.
    const v = await svc.getVocab(A, id);
    expect(v).toMatchObject({ hanzi: "秘密", note: "ghi chú riêng", status: "review", tags: [] });
    expect((await svc.listTags(B)).some((t) => t.name === "hack")).toBe(false);
  });
});

describe("tag — tạo, đổi tên, xoá", () => {
  it("đổi tên (trùng tên → duplicate), xoá tag giữ nguyên từ; người khác không đụng được", async () => {
    const id = await svc.createVocab(A, input({ hanzi: "飞机", meaningVi: "máy bay", tags: ["Đi lại"] }));
    const tagId = await svc.createTag(A, "Đi lại");
    expect(await svc.createTag(A, "đi lại")).toBe(tagId);
    const other = await svc.createTag(A, "Du lịch");
    await expect(svc.renameTag(A, tagId, "du LỊCH")).rejects.toMatchObject({ code: "duplicate" });
    expect(await svc.renameTag(A, tagId, "Giao thông ")).toEqual({ id: tagId, name: "Giao thông", count: 1 });
    expect((await svc.getVocab(A, id)).tags).toEqual(["Giao thông"]);

    await expect(svc.renameTag(B, tagId, "hack")).rejects.toMatchObject({ code: "not-found" });
    await expect(svc.deleteTag(B, tagId)).rejects.toMatchObject({ code: "not-found" });
    expect((await svc.getVocab(A, id)).tags).toEqual(["Giao thông"]);

    expect(await svc.deleteTag(A, tagId)).toEqual({ removed: 1 });
    await expect(svc.deleteTag(A, tagId)).rejects.toMatchObject({ code: "not-found" });
    expect((await svc.getVocab(A, id)).tags).toEqual([]);
    expect((await svc.listTags(A)).map((t) => t.id)).toContain(other);
  });
});

describe("thêm từ từ ảnh — gợi ý + thêm nhiều", () => {
  it("gợi ý pinyin / nghĩa / bộ thủ / HSK; 'đã có' chỉ tính kho của chính mình; thêm nhiều bỏ qua từ trùng", async () => {
    const U = await makeUser("ocr");
    const V = await makeUser("ocr2");
    await svc.createVocab(V, input({ hanzi: "苹果", pinyin: "píngguǒ", meaningVi: "táo (riêng của V)" }));
    const s = await svc.suggestWords(U, ["你好", "苹果", "你好", "龘"]);
    expect(s.map((x) => x.hanzi)).toEqual(["你好", "苹果", "龘"]);
    expect(s[0]).toMatchObject({ pinyin: "nǐ hǎo", meaningVi: "xin chào", hskLevel: 1, exists: false });
    expect(s[0]!.radicals.length).toBeGreaterThan(0);
    expect(s[1]).toMatchObject({ exists: false });
    expect(s[1]!.meaningVi).not.toContain("riêng của V");
    expect(s[2]).toMatchObject({ meaningVi: "", hskLevel: null });
    expect(s[2]!.pinyin).toBeTruthy();

    const r = await svc.createMany(U, [
      input({ hanzi: "你好", pinyin: "nǐ hǎo", meaningVi: "xin chào", tags: ["Từ ảnh"] }),
      input({ hanzi: "苹果", pinyin: "píngguǒ", meaningVi: "quả táo" }),
      input({ hanzi: "你好", pinyin: "nǐ hǎo", meaningVi: "lặp" }),
    ]);
    expect(r).toEqual({ added: ["你好", "苹果"], skipped: ["你好"] });
    expect((await svc.suggestWords(U, ["你好"]))[0]!.exists).toBe(true);
    expect((await svc.createMany(U, [input({ hanzi: "苹果", meaningVi: "x" })])).skipped).toEqual(["苹果"]);
    const mine = await svc.listVocab(U, params({ tag: "Từ ảnh" }));
    expect(mine.items.map((x) => x.hanzi)).toEqual(["你好"]);
    expect((await svc.listVocab(V, params())).total).toBe(1);
  });
});
