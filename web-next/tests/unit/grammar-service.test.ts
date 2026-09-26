import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { pool } from "@/server/db/pool";
import { user } from "@/server/db/schema";
import * as g from "@/features/grammar/service";
import { grammarInputSchema, grammarListSchema, parseEmails } from "@/features/grammar/schema";
import { listNotifications, markRead, unreadCount } from "@/features/notifications/service";
import { splitStructure } from "@/features/grammar/components/structure-box";
import { cleanupUsers, makeUser } from "./helpers";

const input = (p: Record<string, unknown>) => grammarInputSchema.parse(p);
const params = (p: Record<string, unknown> = {}) => grammarListSchema.parse(p);
type Me = { id: string; name: string; email: string };
let A: Me;
let B: Me;
let C: Me;
async function me(tag: string): Promise<Me> {
  const id = await makeUser(tag);
  const [u] = await db.select({ id: user.id, name: user.name, email: user.email }).from(user).where(eq(user.id, id));
  return u!;
}
beforeAll(async () => {
  await cleanupUsers();
  [A, B, C] = [await me("ga"), await me("gb"), await me("gc")];
});
afterAll(async () => {
  await cleanupUsers();
  await pool.end();
});

describe("ngữ pháp — CRUD", () => {
  let id: string;
  it("kiểm tra đầu vào: tiêu đề bắt buộc, ví dụ phải có câu tiếng Trung, bỏ ví dụ trống", () => {
    expect(grammarInputSchema.safeParse({ title: "  " }).error?.issues[0]?.message).toBe(
      "Vui lòng nhập tiêu đề ngữ pháp.",
    );
    expect(
      grammarInputSchema.safeParse({ title: "x", examples: [{ chinese: "", pinyin: "a" }] }).error?.issues[0]?.message,
    ).toBe("Ví dụ 1: vui lòng nhập câu tiếng Trung.");
    expect(input({ title: "x", examples: [{ chinese: "", pinyin: "", vietnamese: "" }] }).examples).toEqual([]);
    expect(parseEmails("A@x.com, b@x.com;a@x.com\nc@x.com")).toEqual(["a@x.com", "b@x.com", "c@x.com"]);
  });

  it("cấu trúc nhiều dòng: bỏ dòng trống, tối đa 4 dòng, mỗi dòng tối đa 300 ký tự", () => {
    const one = (structure: string) => grammarInputSchema.safeParse({ title: "x", structure });
    expect(one(" 很 + ADJ \n\n 不太 + ADJ \r\n").data?.structure).toBe("很 + ADJ\n不太 + ADJ");
    expect(one("a\nb\nc\nd").success).toBe(true);
    const five = one("a\nb\nc\nd\ne");
    expect(five.success).toBe(false);
    expect(five.error!.issues[0]!.message).toBe("Tối đa 4 dòng cấu trúc.");
    expect(one("x".repeat(301)).success).toBe(false);
    expect(one("x".repeat(300) + "\n" + "y".repeat(300)).success).toBe(true);
  });

  it("ghi chú cá nhân sửa ngay trên trang chi tiết: chỉ chủ sở hữu, chuỗi rỗng = xoá", async () => {
    const u = await makeUser("gpn");
    const other = await makeUser("gpn2");
    const id = await g.createGrammar(u, grammarInputSchema.parse({ title: "Ghi chú" }));
    expect(await g.savePersonalNote(u, id, "  mẹo nhớ  ")).toBe("mẹo nhớ");
    expect((await g.getOwnGrammar(u, id))!.personalNote).toBe("mẹo nhớ");
    await expect(g.savePersonalNote(other, id, "xâm nhập")).rejects.toMatchObject({ code: "not-found" });
    expect((await g.getOwnGrammar(u, id))!.personalNote).toBe("mẹo nhớ");
    await g.savePersonalNote(u, id, "");
    expect((await g.getOwnGrammar(u, id))!.personalNote).toBe("");
  });

  it("tách nhãn cấu trúc: “Câu phủ định: A + 不是 + B”", () => {
    expect(splitStructure("Câu phủ định: A + 不是 + B")).toEqual({ label: "Câu phủ định", formula: "A + 不是 + B" });
    expect(splitStructure("不：Câu khẳng định")).toEqual({ label: "", formula: "不：Câu khẳng định" });
    expect(splitStructure("很 + ADJ")).toEqual({ label: "", formula: "很 + ADJ" });
  });

  it("tạo, sửa (giữ thứ tự ví dụ), tìm kiếm bỏ dấu, lọc thẻ, đã lưu", async () => {
    id = await g.createGrammar(
      A.id,
      input({
        title: "Câu hỏi với 吗",
        meaning: "Tạo câu hỏi có/không",
        examples: [
          { chinese: "你好吗？", pinyin: "Nǐ hǎo ma?" },
          { chinese: "你是学生吗？", pinyin: "Nǐ shì xuésheng ma?" },
        ],
        tags: ["HSK1", "hsk1", "Câu hỏi"],
        personalNote: "bí mật của A",
      }),
    );
    await g.updateGrammar(
      A.id,
      id,
      input({
        title: "Câu hỏi với 吗",
        meaning: "Tạo câu hỏi có/không",
        examples: [{ chinese: "你是学生吗？", pinyin: "Nǐ shì xuésheng ma?" }, { chinese: "你好吗？" }],
        tags: ["HSK1", "Câu hỏi"],
        personalNote: "bí mật của A",
      }),
    );
    const own = (await g.getOwnGrammar(A.id, id))!;
    expect(own.examples.map((e) => e.chinese)).toEqual(["你是学生吗？", "你好吗？"]);
    expect(own.tags.map((t) => t.name).sort()).toEqual(["Câu hỏi", "HSK1"]);
    expect(own.personalNote).toBe("bí mật của A");
    await g.createGrammar(A.id, input({ title: "Phủ định với 不" }));
    const hit = async (q: string) => (await g.listGrammar(A.id, params({ q }))).items.map((x) => x.title);
    expect(await hit("cau hoi")).toEqual(["Câu hỏi với 吗"]);
    expect(await hit("xuesheng")).toEqual(["Câu hỏi với 吗"]);
    const tags = await g.listGrammarTags(A.id);
    const hsk = tags.find((t) => t.name === "HSK1")!;
    expect(hsk.count).toBe(1);
    expect((await g.listGrammar(A.id, params({ tag: hsk.id }))).total).toBe(1);
    await g.setBookmark(A.id, id, true);
    const saved = await g.listGrammar(A.id, params({ view: "saved" }));
    expect(saved.items.map((x) => x.id)).toEqual([id]);
    expect(saved.savedCount).toBe(1);
    expect(saved.totalAll).toBe(2);
  });

  it("quản lý thẻ: tạo trùng bị chặn, đổi tên, xoá thẻ không xoá ngữ pháp", async () => {
    await expect(g.createGrammarTag(A.id, "hsk1")).rejects.toThrow("đã tồn tại");
    const t = await g.createGrammarTag(A.id, "Bài 2");
    await expect(g.renameGrammarTag(A.id, t.id, "Câu hỏi")).rejects.toThrow("đã tồn tại");
    await g.renameGrammarTag(A.id, t.id, "Bài 3");
    const hsk = (await g.listGrammarTags(A.id)).find((x) => x.name === "HSK1")!;
    await g.deleteGrammarTag(A.id, hsk.id);
    expect((await g.getOwnGrammar(A.id, id))!.tags.map((x) => x.name)).toEqual(["Câu hỏi"]);
  });

  it("dữ liệu mẫu bỏ qua bài trùng tiêu đề", async () => {
    expect(await g.importSampleGrammar(C.id)).toBe(3);
    expect(await g.importSampleGrammar(C.id)).toBe(0);
  });
});

describe("ngữ pháp — chia sẻ", () => {
  let gid: string;
  let shareId: string;
  beforeAll(async () => {
    gid = (await g.listGrammar(A.id, params({ q: "cau hoi" }))).items[0]!.id;
  });

  it("gửi cho nhiều email: báo lỗi từng email, không gửi trùng lời mời đang chờ", async () => {
    const r = await g.shareGrammar(A, gid, [B.email.toUpperCase(), "khong-co@unit.lingyu", A.email, "sai-dinh-dang"]);
    const by = Object.fromEntries(r.results.map((x) => [x.email, x.message]));
    expect(r.sent).toBe(1);
    expect(by[B.email]).toBe("Đã gửi lời mời.");
    expect(by["khong-co@unit.lingyu"]).toBe("Người dùng này chưa có tài khoản LingYu Chinese.");
    expect(by[A.email]).toBe("Bạn không thể chia sẻ cho chính mình.");
    expect(by["sai-dinh-dang"]).toBe("Email không đúng định dạng.");
    const again = await g.shareGrammar(A, gid, [B.email]);
    expect(again.results[0]!.message).toMatch(/Đã gửi lời mời trước đó/);
    expect((await g.listSent(A.id, gid)).map((s) => s.status)).toEqual(["PENDING"]);
    expect(await unreadCount(B.id)).toBe(1);
    shareId = (await g.listReceived(B.id))[0]!.id;
  });

  it("người nhận xem trước KHÔNG có ghi chú cá nhân; người lạ không xem được", async () => {
    const v = await g.viewGrammar(B.id, gid, shareId);
    expect(v.mode).toBe("preview");
    expect(v.grammar.personalNote).toBe("");
    expect(JSON.stringify(v)).not.toContain("bí mật của A");
    await expect(g.viewGrammar(C.id, gid)).rejects.toMatchObject({ code: "forbidden" });
    await expect(g.updateGrammar(B.id, gid, input({ title: "hack" }))).rejects.toThrow(g.GrammarError);
    await expect(g.deleteGrammar(B.id, gid)).rejects.toThrow(g.GrammarError);
    await expect(g.setBookmark(B.id, gid, true)).rejects.toThrow(g.GrammarError);
    await expect(g.shareGrammar(B, gid, [C.email])).rejects.toMatchObject({ code: "forbidden" });
    await expect(g.acceptShare(C, shareId)).rejects.toMatchObject({ code: "not-found" });
  });

  it("chấp nhận: bản riêng (giữ thẻ + thêm thẻ), không có ghi chú cá nhân; báo cho người gửi", async () => {
    expect(await g.shareSourceTags(B.id, shareId)).toEqual(["Câu hỏi"]);
    const copy = await g.acceptShare(B, shareId, { keepTags: true, extraTags: ["Của B"] });
    const mine = (await g.getOwnGrammar(B.id, copy.id))!;
    expect(mine).toMatchObject({
      title: "Câu hỏi với 吗",
      sourceGrammarId: gid,
      sourceOwnerName: A.name,
      personalNote: "",
    });
    expect(mine.examples.map((e) => e.chinese)).toEqual(["你是学生吗？", "你好吗？"]);
    expect(mine.tags.map((t) => t.name).sort()).toEqual(["Câu hỏi", "Của B"]);
    await expect(g.acceptShare(B, shareId)).rejects.toMatchObject({ code: "already-responded" });
    const notes = await listNotifications(A.id);
    expect(notes[0]).toMatchObject({ type: "grammar_share_accepted", payload: { actorName: B.name } });
    // Sửa bản của B không đụng bản của A.
    await g.updateGrammar(B.id, copy.id, input({ title: "Bản của B" }));
    expect((await g.getOwnGrammar(A.id, gid))!.title).toBe("Câu hỏi với 吗");
  });

  it("từ chối và xoá gốc huỷ lời mời đang chờ", async () => {
    await g.shareGrammar(A, gid, [C.email]);
    const s = (await g.listReceived(C.id))[0]!;
    await g.rejectShare(C, s.id);
    expect((await listNotifications(A.id))[0]!.type).toBe("grammar_share_rejected");
    const other = await g.createGrammar(A.id, input({ title: "Sẽ xoá" }));
    await g.shareGrammar(A, other, [C.email]);
    expect(await g.listReceived(C.id)).toHaveLength(1);
    await g.deleteGrammar(A.id, other);
    expect(await g.listReceived(C.id)).toHaveLength(0);
    await markRead(C.id);
    expect(await unreadCount(C.id)).toBe(0);
  });
});
