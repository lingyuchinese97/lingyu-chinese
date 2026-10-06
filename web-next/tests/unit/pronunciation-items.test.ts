import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool } from "@/server/db/pool";
import { INITIALS, SANDHI_RULES } from "@/data/pronunciation";
import * as items from "@/features/pronunciation/items";
import { fromLibrarySchema, itemInputSchema, itemListSchema } from "@/features/pronunciation/schema";
import { PronunciationError } from "@/features/pronunciation/service";
import { exportData, importData } from "@/features/account/transfer";
import { cleanupUsers, makeUser } from "./helpers";

const L = (x: Record<string, unknown> = {}) => itemListSchema.parse(x);
const I = (x: Record<string, unknown>) => itemInputSchema.parse(x);
let A: string;
let B: string;
beforeAll(async () => {
  await cleanupUsers();
  [A, B] = [await makeUser("pia"), await makeUser("pib")];
});
afterAll(async () => {
  await cleanupUsers();
  await pool.end();
});

describe("Phát âm của tôi: tự nhập, sửa, thêm tag, xoá", () => {
  it("tự điền pinyin khi bỏ trống; trùng chữ Hán + pinyin → duplicate; sửa / thêm tag; chỉ của mình", async () => {
    const a = await items.createItem(A, I({ hanzi: "四十", meaning: "bốn mươi", tags: ["Khó đọc"] }));
    expect(a).toMatchObject({ hanzi: "四十", pinyin: "sì shí", source: null, tags: ["Khó đọc"] });
    await expect(items.createItem(A, I({ hanzi: "四十", pinyin: "sì shí" }))).rejects.toMatchObject({
      code: "duplicate",
    });
    const b = await items.updateItem(A, a.id, I({ ...a, note: "s – sh", tags: ["Khó đọc", "Số đếm"] }));
    expect(b).toMatchObject({ note: "s – sh", tags: ["Khó đọc", "Số đếm"] });

    const list = await items.listItems(A, L({ q: "si shi" }));
    expect(list.items.map((x) => x.hanzi)).toEqual(["四十"]);
    expect((await items.listItems(A, L({ tag: "số đếm" }))).total).toBe(1);
    expect((await items.listItems(A, L({ from: "library" }))).total).toBe(0);

    // Người khác: không thấy, không sửa / xoá được.
    expect((await items.listItems(B, L())).total).toBe(0);
    await expect(items.getItem(B, a.id)).rejects.toBeInstanceOf(PronunciationError);
    await expect(items.updateItem(B, a.id, I({ hanzi: "x", pinyin: "x" }))).rejects.toBeInstanceOf(PronunciationError);
    await expect(items.deleteItem(B, a.id)).rejects.toBeInstanceOf(PronunciationError);
    expect(await items.deleteItem(A, a.id)).toEqual({ deleted: true });
  });
});

describe("Phát âm của tôi: lưu từ Thư viện LingYu", () => {
  const b = INITIALS.find((x) => x.symbol === "b")!;

  it("một từ / cả mục, tag Thư viện + tên mục, bấm lại bỏ qua; ví dụ biến điệu ghi cách đọc thực tế", async () => {
    expect(await items.saveFromLibrary(A, "initial:b", b.examples[0]!.hanzi, "vi")).toEqual({ added: 1, skipped: 0 });
    expect(await items.saveFromLibrary(A, "initial:b", null, "vi")).toEqual({
      added: b.examples.length - 1,
      skipped: 1,
    });
    const lib = await items.listItems(A, L({ from: "library" }));
    expect(lib.total).toBe(b.examples.length);
    expect(lib.items[0]!.tags).toEqual(expect.arrayContaining(["Thư viện LingYu", "Thanh mẫu b"]));
    expect(lib.items[0]!.source).toBe("initial:b");

    const rule = SANDHI_RULES.find((r) => r.id === "third-two")!;
    await items.saveFromLibrary(A, "sandhi:third-two", rule.examples[0]!.hanzi, "vi");
    const nh = (await items.listItems(A, L({ q: rule.examples[0]!.hanzi }))).items[0]!;
    expect(nh.note).toBe(`Đọc: ${rule.examples[0]!.spoken}`);

    expect(await items.savedFromLibrary(A)).toEqual(expect.arrayContaining(b.examples.map((e) => e.hanzi)));
    expect(await items.savedFromLibrary(B)).toEqual([]);
  });

  it("bản sao sửa / thêm tag được, giữ nguồn; nội dung Thư viện không đổi", async () => {
    const it0 = (await items.listItems(A, L({ tag: "Thanh mẫu b" }))).items[0]!;
    const after = await items.updateItem(
      A,
      it0.id,
      I({ ...it0, meaning: "nghĩa tôi tự ghi", tags: [...it0.tags, "Ôn"] }),
    );
    expect(after).toMatchObject({ meaning: "nghĩa tôi tự ghi", source: "initial:b" });
    expect(after.tags).toContain("Ôn");
    expect(b.examples.find((e) => e.hanzi === it0.hanzi)!.meaning.vi).not.toBe("nghĩa tôi tự ghi");
  });

  it("mục / từ không có trong Thư viện → not-found; mã mục sai → lỗi dữ liệu", async () => {
    await expect(items.saveFromLibrary(A, "initial:xx", null, "vi")).rejects.toMatchObject({ code: "not-found" });
    await expect(items.saveFromLibrary(A, "final:ang", "咖啡", "vi")).rejects.toMatchObject({ code: "not-found" });
    expect(fromLibrarySchema.safeParse({ topic: "vocab:1" }).success).toBe(false);
  });

  it("xuất / nhập dữ liệu mang theo Phát âm của tôi (trùng bỏ qua)", async () => {
    const file = await exportData({ id: A, name: "A", email: "a@unit.lingyu" });
    expect(file.pronunciationItems.length).toBeGreaterThan(0);
    const r = await importData(B, JSON.parse(JSON.stringify(file)));
    expect(r.pronunciation.added).toBeGreaterThanOrEqual(file.pronunciationItems.length);
    const again = await importData(B, JSON.parse(JSON.stringify(file)));
    expect(again.pronunciation.added).toBe(0);
    expect((await items.listItems(B, L({ from: "library" }))).total).toBe(
      (await items.listItems(A, L({ from: "library" }))).total,
    );
  });
});
