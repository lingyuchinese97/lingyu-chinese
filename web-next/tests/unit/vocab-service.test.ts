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
    const st = await svc.vocabStats(A);
    expect(st).toMatchObject({ total: 3, learned: 3, needReview: 0 });
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
