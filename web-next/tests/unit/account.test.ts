import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, like } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db } from "@/server/db/client";
import { pool } from "@/server/db/pool";
import { image, session, srsCard, user, vocab } from "@/server/db/schema";
import { findUserByEmail } from "@/server/users";
import { changePassword, removeUser, updateName, verifyPassword } from "@/features/account/service";
import { exportData, importData, ImportError } from "@/features/account/transfer";
import { listUsers } from "@/features/admin/service";
import * as svc from "@/features/vocabulary/service";
import * as g from "@/features/grammar/service";
import { vocabInputSchema } from "@/features/vocabulary/schema";
import { grammarInputSchema } from "@/features/grammar/schema";
import { setKnown } from "@/features/radicals/service";
import { createSentence } from "@/features/sentences/service";
import { sentenceInputSchema } from "@/features/sentences/schema";
import { recordSection } from "@/features/lessons/service";
import { getLesson } from "@/data/lessons";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const post = (path: string, body: unknown) =>
  auth.handler(
    new Request(`${BASE}/api/auth${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: BASE },
      body: JSON.stringify(body),
    }),
  );
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==",
  "base64",
);
const cleanup = () => db.delete(user).where(like(user.email, "%@acc.lingyu"));

/** Đăng ký qua Better Auth (có mật khẩu thật), trả về user. */
async function signUp(tag: string, password = "matkhau123") {
  const email = `${tag}-${Date.now()}@acc.lingyu`;
  expect((await post("/sign-up/email", { name: `Người ${tag}`, email, password })).status).toBe(200);
  const u = (await findUserByEmail(email))!;
  return { id: u.id, name: u.name, email: u.email };
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await pool.end();
});

describe("tài khoản", () => {
  it("đổi tên; đổi mật khẩu cần đúng mật khẩu hiện tại, giữ phiên hiện tại, đăng xuất thiết bị khác", async () => {
    const u = await signUp("pw");
    await updateName(u.id, "Tên Mới");
    expect((await findUserByEmail(u.email))!.name).toBe("Tên Mới");
    // Đăng nhập thêm 1 thiết bị.
    expect((await post("/sign-in/email", { email: u.email, password: "matkhau123" })).status).toBe(200);
    const sessions = await db.select().from(session).where(eq(session.userId, u.id));
    expect(sessions.length).toBe(2);
    const keep = sessions[0]!.id;

    await expect(changePassword(u.id, keep, "sai-mat-khau", "matkhaumoi1")).rejects.toThrow(
      "Mật khẩu hiện tại không đúng.",
    );
    await expect(changePassword(u.id, keep, "matkhau123", "matkhau123")).rejects.toThrow("phải khác");
    await changePassword(u.id, keep, "matkhau123", "matkhaumoi1");
    expect((await db.select().from(session).where(eq(session.userId, u.id))).map((s) => s.id)).toEqual([keep]);
    expect(await verifyPassword(u.id, "matkhaumoi1")).toBe(true);
    expect((await post("/sign-in/email", { email: u.email, password: "matkhau123" })).status).toBe(401);
    const ok = await post("/sign-in/email", { email: u.email, password: "matkhaumoi1" });
    expect(ok.status).toBe(200);
    // Đăng nhập ghi lại thời điểm (hiện ở trang Quản trị).
    expect((await findUserByEmail(u.email))!.lastLoginAt).toBeInstanceOf(Date);
  });

  it("xoá tài khoản xoá sạch dữ liệu (cascade), gồm cả ảnh", async () => {
    const u = await signUp("del");
    await svc.createVocab(u.id, vocabInputSchema.parse({ hanzi: "水", pinyin: "shuǐ", meaningVi: "nước" }), {
      bytes: PNG,
      mime: "image/png",
      width: 2,
      height: 2,
    });
    expect(await verifyPassword(u.id, "sai")).toBe(false);
    await removeUser(u.id);
    expect(await findUserByEmail(u.email)).toBeNull();
    expect(await db.select().from(vocab).where(eq(vocab.userId, u.id))).toEqual([]);
    expect(await db.select().from(image).where(eq(image.userId, u.id))).toEqual([]);
  });
});

describe("xuất / nhập dữ liệu", () => {
  it("xuất đủ dữ liệu; nhập vào tài khoản khác gộp và bỏ qua bản ghi trùng", async () => {
    const A = await signUp("ex");
    const B = await signUp("im");
    await svc.createVocab(
      A.id,
      vocabInputSchema.parse({ hanzi: "你好", pinyin: "nǐ hǎo", meaningVi: "xin chào", tags: ["HSK1"] }),
      { bytes: PNG, mime: "image/png", width: 2, height: 2 },
    );
    await svc.createVocab(A.id, vocabInputSchema.parse({ hanzi: "水", pinyin: "shuǐ", meaningVi: "nước" }));
    await svc.createTag(A.id, "Tag trống");
    await g.createGrammar(
      A.id,
      grammarInputSchema.parse({
        title: "Câu hỏi với 吗",
        examples: [{ chinese: "你好吗？", pinyin: "Nǐ hǎo ma?" }],
        tags: ["Câu hỏi"],
        personalNote: "ghi chú riêng",
      }),
    );
    await createSentence(
      A.id,
      sentenceInputSchema.parse({ chinese: "我爱你。", vietnamese: "Tôi yêu bạn.", tags: ["Tình cảm"] }),
    );
    await setKnown(A.id, 85, true);
    const qs = getLesson("bai1")!.sections[1]!.questions;
    await recordSection(
      A.id,
      "bai1",
      "blending",
      qs.map((q) => q.answer),
    );

    const data = await exportData(A);
    expect(data).toMatchObject({ format: "lingyu-export", version: 1, radicalsKnown: [85] });
    expect(data.vocab.map((v) => v.hanzi)).toEqual(["你好", "水"]);
    expect(data.vocab[0]!.image?.data).toBe(PNG.toString("base64"));
    expect(data.vocab[0]!.srs).toMatchObject({ state: 0, reps: 0 });
    expect(data.vocabTags).toEqual(expect.arrayContaining(["HSK1", "Tag trống"]));
    expect(data.grammar[0]).toMatchObject({ personalNote: "ghi chú riêng", tags: ["Câu hỏi"] });
    expect(data.sentences[0]).toMatchObject({ chinese: "我爱你。", tags: ["Tình cảm"] });
    expect(data.lessonProgress[0]).toMatchObject({ lessonId: "bai1", section: "blending", bestScore: 20 });
    // File xuất chỉ chứa dữ liệu của A.
    expect(JSON.stringify(data)).not.toContain(B.email);

    // B đã có "水" → bỏ qua; kèm 1 bản ghi hỏng và 1 ảnh giả (không phải ảnh thật) → bỏ ảnh, vẫn nhập từ.
    await svc.createVocab(B.id, vocabInputSchema.parse({ hanzi: "水", pinyin: "shuǐ", meaningVi: "của B" }));
    const file = JSON.parse(JSON.stringify(data));
    file.vocab.push(
      { hanzi: "" },
      {
        hanzi: "假",
        pinyin: "jiǎ",
        meaningVi: "giả",
        image: { mime: "image/png", data: Buffer.from("<script>").toString("base64") },
      },
    );
    const r = await importData(B.id, file);
    expect(r).toEqual({
      vocab: { added: 2, skipped: 2 },
      grammar: { added: 1, skipped: 0 },
      sentences: { added: 1, skipped: 0 },
      radicals: 1,
      lessons: 1,
      images: 1,
    });
    const bv = await db.select().from(vocab).where(eq(vocab.userId, B.id));
    expect(bv.find((v) => v.hanzi === "水")!.meaningVi).toBe("của B");
    expect(bv.find((v) => v.hanzi === "假")!.imageId).toBeNull();
    expect(await db.select().from(srsCard).where(eq(srsCard.userId, B.id))).toHaveLength(3);
    const bg = await g.listGrammar(B.id, { q: "", tag: "", sort: "updated", view: "all" });
    expect(bg.items[0]!.title).toBe("Câu hỏi với 吗");
    expect((await g.getOwnGrammar(B.id, bg.items[0]!.id))!.personalNote).toBe("ghi chú riêng");

    // Nhập lại lần nữa: không thêm trùng.
    const again = await importData(B.id, file);
    expect(again.vocab.added).toBe(0);
    expect(again.grammar).toEqual({ added: 0, skipped: 1 });
    expect(again.sentences).toEqual({ added: 0, skipped: 1 });
  });

  it("từ chối file không đúng định dạng / phiên bản mới hơn", async () => {
    const u = await signUp("bad");
    await expect(importData(u.id, { hello: 1 })).rejects.toThrow(ImportError);
    await expect(importData(u.id, { format: "lingyu-export", version: 99 })).rejects.toThrow("phiên bản mới hơn");
  });
});

describe("quản trị", () => {
  it("danh sách người dùng: tìm theo email, số từ vựng", async () => {
    const u = await signUp("adm");
    await svc.createVocab(u.id, vocabInputSchema.parse({ hanzi: "一", pinyin: "yī", meaningVi: "một" }));
    const r = await listUsers({ q: u.email.toUpperCase() });
    expect(r.total).toBe(1);
    expect(r.items[0]).toMatchObject({ email: u.email, vocabCount: 1, role: "user", disabledAt: null });
    expect((await listUsers({ q: "khong-ai-co-email-nay" })).items).toEqual([]);
  });
});
