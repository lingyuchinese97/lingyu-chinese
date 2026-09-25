import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { pool } from "@/server/db/pool";
import { image, srsCard, user, vocab } from "@/server/db/schema";
import * as svc from "@/features/vocabulary/service";
import * as share from "@/features/vocabulary/share-service";
import * as rad from "@/features/radicals/service";
import { vocabInputSchema } from "@/features/vocabulary/schema";
import { listNotifications } from "@/features/notifications/service";
import { storage } from "@/server/storage";
import { cleanupUsers, makeUser } from "./helpers";

const input = (p: Record<string, unknown>) => vocabInputSchema.parse({ pinyin: "x", meaningVi: "x", ...p });
type Me = { id: string; name: string; email: string };
let A: Me;
let B: Me;
let C: Me;
async function me(tag: string): Promise<Me> {
  const id = await makeUser(tag);
  const [u] = await db.select({ id: user.id, name: user.name, email: user.email }).from(user).where(eq(user.id, id));
  return u!;
}
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==",
  "base64",
);

beforeAll(async () => {
  await cleanupUsers();
  [A, B, C] = [await me("sa"), await me("sb"), await me("sc")];
});
afterAll(async () => {
  await cleanupUsers();
  await pool.end();
});

describe("chia sẻ từ vựng", () => {
  let ni: string;
  let hao: string;
  let shareId: string;

  it("kiểm tra người nhận từng email; không gửi trùng khi lời mời trước còn chờ", async () => {
    ni = await svc.createVocab(
      A.id,
      input({ hanzi: "你", pinyin: "nǐ", meaningVi: "bạn", note: "ghi chú", tags: ["HSK1"] }),
      { bytes: PNG, mime: "image/png", width: 2, height: 2 },
    );
    hao = await svc.createVocab(
      A.id,
      input({ hanzi: "好", pinyin: "hǎo", meaningVi: "tốt", tags: ["HSK1", "Tính từ"] }),
    );
    const r = await share.shareVocab(A, [ni, hao], [B.email.toUpperCase(), A.email, "khong-co@x.lingyu", "sai"]);
    expect(r.sent).toBe(1);
    expect(r.results.map((x) => x.message)).toEqual([
      "Đã gửi 2 từ.",
      "Bạn không thể chia sẻ cho chính mình.",
      "Người dùng này chưa có tài khoản LingYu Chinese.",
      "Email không đúng định dạng.",
    ]);
    const again = await share.shareVocab(A, [hao, ni], [B.email]);
    expect(again.results[0]!.message).toBe("Đã gửi các từ này trước đó, đang chờ người nhận phản hồi.");
    const n = await listNotifications(B.id);
    expect(n[0]).toMatchObject({ type: "vocab_share", payload: { actorName: A.name, title: "你, 好", count: 2 } });
    shareId = n[0]!.payload.shareId!;
  });

  it("không chia sẻ được từ của người khác; tối đa 200 từ", async () => {
    await expect(share.shareVocab(C, [ni], [B.email])).rejects.toThrow("Các từ đã chọn không còn tồn tại.");
    const many = Array.from({ length: 201 }, () => crypto.randomUUID());
    await expect(share.shareVocab(A, many, [B.email])).rejects.toThrow("tối đa 200 từ");
  });

  it("người nhận xem trước: bản chụp không lộ id ảnh; sửa từ gốc không ảnh hưởng lời mời", async () => {
    await svc.updateVocab(A.id, hao, input({ hanzi: "好", pinyin: "hǎo", meaningVi: "ĐÃ SỬA", tags: [] }));
    const [s] = await share.listReceivedVocab(B.id);
    expect(s).toMatchObject({ id: shareId, count: 2, senderName: A.name, senderTags: ["HSK1", "Tính từ"] });
    expect(s!.words[1]!.meaningVi).toBe("tốt");
    // Chức năng ảnh đã bỏ: ảnh của người gửi không đi kèm lời mời.
    expect(s!.words[0]).toMatchObject({ hanzi: "你", hasImage: false });
    expect(JSON.stringify(s)).not.toContain("imageId");
    expect(await share.listReceivedVocab(C.id)).toEqual([]);
    // Người khác không chấp nhận được lời mời không phải của mình.
    await expect(share.acceptVocabShare(C, shareId)).rejects.toThrow("Lời mời chia sẻ không còn tồn tại.");
  });

  it("chấp nhận: chép vào kho người nhận (bỏ từ trùng), không kèm ảnh, tạo thẻ ôn, báo người gửi", async () => {
    await svc.createVocab(B.id, input({ hanzi: "好", pinyin: "hǎo", meaningVi: "của B" }));
    const r = await share.acceptVocabShare(B, shareId, { keepTags: false, extraTags: ["Từ bạn gửi"] });
    expect(r).toEqual({ added: 1, skipped: ["好"], total: 2 });
    const [copy] = await db
      .select()
      .from(vocab)
      .where(and(eq(vocab.userId, B.id), eq(vocab.hanzi, "你")));
    expect(copy).toMatchObject({ pinyin: "nǐ", note: "ghi chú", status: "review" });
    expect((await svc.getVocab(B.id, copy!.id)).tags).toEqual(["Từ bạn gửi"]);
    // Không sao chép ảnh (chức năng ảnh đã bỏ); ảnh của A vẫn nguyên, B không đọc được.
    const [origA] = await db.select({ imageId: vocab.imageId }).from(vocab).where(eq(vocab.id, ni));
    expect(copy!.imageId).toBeNull();
    expect(await storage.get(B.id, origA!.imageId!)).toBeNull();
    expect(await db.select().from(image).where(eq(image.userId, B.id))).toEqual([]);
    expect(await db.select().from(srsCard).where(eq(srsCard.vocabId, copy!.id))).toHaveLength(1);
    const n = await listNotifications(A.id);
    expect(n[0]).toMatchObject({ type: "vocab_share_accepted", payload: { actorName: B.name, count: 1 } });
    const sent = await share.listSentVocab(A.id);
    expect(sent[0]).toMatchObject({ recipientEmail: B.email, status: "ACCEPTED", added: 1, title: "你, 好" });
    await expect(share.acceptVocabShare(B, shareId)).rejects.toThrow("Bạn đã chấp nhận lời mời này.");
  });

  it("từ chối: không thêm từ nào, báo người gửi", async () => {
    const r = await share.shareVocab(A, [hao], [C.email]);
    expect(r.sent).toBe(1);
    const [s] = await share.listReceivedVocab(C.id);
    await share.rejectVocabShare(C, s!.id);
    expect(await db.select().from(vocab).where(eq(vocab.userId, C.id))).toEqual([]);
    expect((await listNotifications(A.id))[0]).toMatchObject({ type: "vocab_share_rejected" });
    await expect(share.rejectVocabShare(C, s!.id)).rejects.toThrow("Bạn đã từ chối lời mời này.");
  });
});

describe("bộ thủ đã thuộc", () => {
  it("đánh dấu / bỏ đánh dấu theo từng người", async () => {
    await rad.setKnown(A.id, 85, true);
    await rad.setKnown(A.id, 85, true);
    await rad.setKnown(A.id, 1, true);
    expect(await rad.knownRadicals(A.id)).toEqual([1, 85]);
    expect(await rad.isKnown(A.id, 85)).toBe(true);
    expect(await rad.knownRadicals(B.id)).toEqual([]);
    await rad.setKnown(A.id, 85, false);
    expect(await rad.knownRadicals(A.id)).toEqual([1]);
    await expect(rad.setKnown(A.id, 215, true)).rejects.toThrow();
  });
});
