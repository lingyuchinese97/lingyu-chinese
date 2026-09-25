import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { pool } from "@/server/db/pool";
import { sentence } from "@/server/db/schema";
import { firstHanzi, gradeSentence, normalizeChinese } from "@/lib/sentence-grading";
import { sentenceInputSchema, sentenceListSchema, FAV_TAG } from "@/features/sentences/schema";
import * as svc from "@/features/sentences/service";
import * as rv from "@/features/sentences/review-service";
import { cleanupUsers, makeUser } from "./helpers";

const input = (p: Record<string, unknown>) => sentenceInputSchema.parse(p);
const params = (p: Record<string, unknown> = {}) => sentenceListSchema.parse(p);
let A: string;
let B: string;
beforeAll(async () => {
  await cleanupUsers();
  [A, B] = [await makeUser("sa"), await makeUser("sb")];
});
afterAll(async () => {
  await cleanupUsers();
  await pool.end();
});

describe("chấm câu dịch", () => {
  const s = { chinese: "我每天学习中文。", vietnamese: "Tôi học tiếng Trung mỗi ngày." };
  it("Việt → Trung: bỏ khoảng trắng, dấu câu (cả full-width)", () => {
    expect(gradeSentence("vi-zh", s, "我每天学习中文")).toBe(true);
    expect(gradeSentence("vi-zh", s, " 我 每天 学习 中文 ！")).toBe(true);
    expect(gradeSentence("vi-zh", s, "我每天学中文")).toBe(false);
    expect(gradeSentence("vi-zh", s, "")).toBe(false);
    expect(normalizeChinese("你好，世界！")).toBe("你好世界");
    expect(firstHanzi("“你好！”")).toBe("你");
  });
  it("Trung → Việt: không phân biệt hoa/thường, dấu thanh, dấu câu; nhiều cách dịch", () => {
    expect(gradeSentence("zh-vi", s, "tôi học tiếng trung mỗi ngày")).toBe(true);
    expect(gradeSentence("zh-vi", s, "Toi hoc tieng Trung moi ngay!")).toBe(true);
    expect(gradeSentence("zh-vi", s, "Tôi học tiếng Anh mỗi ngày")).toBe(false);
    expect(gradeSentence("zh-vi", { chinese: "x", vietnamese: "Xin chào / Chào bạn" }, "chào bạn")).toBe(true);
  });
});

describe("kho câu", () => {
  it("kiểm tra đầu vào", () => {
    expect(sentenceInputSchema.safeParse({ chinese: "", vietnamese: "x" }).error?.issues[0]?.message).toBe(
      "Vui lòng nhập câu tiếng Trung.",
    );
    expect(sentenceInputSchema.safeParse({ chinese: "hello", vietnamese: "x" }).error?.issues[0]?.message).toBe(
      "Câu tiếng Trung cần có ít nhất một chữ Hán.",
    );
    expect(
      sentenceInputSchema.safeParse({ chinese: "你", vietnamese: "x", tags: ["a", "b", "c", "d", "e", "f"] }).error
        ?.issues[0]?.message,
    ).toBe("Tối đa 5 tag cho một câu.");
    expect(input({ chinese: "你", vietnamese: "x", tags: ["HSK1", "hsk1"] }).tags).toEqual(["HSK1"]);
  });

  it("thêm, tìm (bỏ dấu, chữ Hán, tag), yêu thích, sửa, xoá; người khác không đụng được", async () => {
    expect(await svc.importSampleSentences(A)).toBe(12);
    expect(await svc.importSampleSentences(A)).toBe(0);
    const all = await svc.listSentences(A, params());
    expect(all.totalAll).toBe(12);
    expect((await svc.listSentences(A, params({ q: "hoc tieng trung" }))).items.map((s) => s.chinese)).toEqual([
      "我每天学习中文。",
    ]);
    expect((await svc.listSentences(A, params({ q: "咖啡" }))).total).toBe(1);
    expect((await svc.listSentences(A, params({ tag: "gia đình" }))).total).toBe(2);
    const id = await svc.createSentence(
      A,
      input({ chinese: "我爱你。", vietnamese: "Anh yêu em.", tags: ["Tình cảm"] }),
    );
    expect(await svc.toggleSentenceFavorite(A, id)).toBe(true);
    expect((await svc.listSentences(A, params({ tag: FAV_TAG }))).items.map((s) => s.id)).toEqual([id]);
    await svc.updateSentence(A, id, input({ chinese: "我爱你！", vietnamese: "Tôi yêu bạn.", tags: [] }));
    expect(await svc.getSentence(A, id)).toMatchObject({ chinese: "我爱你！", tags: [] });

    await expect(svc.getSentence(B, id)).rejects.toThrow(svc.SentenceError);
    await expect(svc.updateSentence(B, id, input({ chinese: "你", vietnamese: "x" }))).rejects.toThrow();
    expect(await svc.deleteSentences(B, [id])).toBe(0);
    expect((await svc.listSentences(B, params())).totalAll).toBe(0);
    expect(await svc.deleteSentences(A, [id])).toBe(1);
  });
});

describe("phiên ôn dịch câu", () => {
  it("đáp án không gửi trước khi trả lời; chấm, bỏ qua, tính là đúng, nhớ/chưa nhớ, kết quả", async () => {
    const sid = await rv.createSentenceSession(A, {
      direction: "vi-zh",
      count: 3,
      tags: ["Gia đình", "Du lịch"],
      showPinyin: false,
      showHint: false,
    });
    let s = (await rv.getActiveSentenceSession(A))!;
    expect(s.id).toBe(sid);
    expect(s.total).toBe(3);
    const raw = JSON.stringify(s);
    // Không có câu tiếng Trung nào trong dữ liệu gửi cho client khi chưa trả lời.
    expect(raw).not.toMatch(/[家场爸]/);
    expect(s.questions[0]!.hint).toBeUndefined();

    // Gợi ý chữ đầu tiên.
    s = await rv.hintSentence(A, sid, 0);
    expect(s.questions[0]!.hint).toMatch(/\p{Script=Han}/u);
    // Câu 1: trả lời sai → "tính là đúng".
    s = await rv.answerSentence(A, sid, 0, "sai rồi");
    expect(s.questions[0]).toMatchObject({ result: "wrong", answered: true });
    expect(s.questions[0]!.reveal?.chinese).toBeTruthy();
    s = await rv.overrideSentence(A, sid, 0);
    expect(s).toMatchObject({ correctCount: 1, wrongCount: 0 });
    // Câu 2: trả lời đúng (lấy từ DB), "Tôi nhớ" → Đã thuộc.
    const second = await db.select().from(sentence).where(eq(sentence.userId, A));
    const all = new Map(second.map((r) => [r.vietnamese, r]));
    const target = all.get(s.questions[1]!.prompt.text)!;
    s = await rv.answerSentence(A, sid, 1, target.chinese.replace("。", ""));
    expect(s.questions[1]!.result).toBe("correct");
    s = await rv.rememberSentence(A, sid, 1, true);
    expect((await svc.getSentence(A, target.id)).status).toBe("learned");
    // Không nhảy cóc, không chấm lại.
    await expect(rv.answerSentence(A, sid, 2 + 1, "x")).rejects.toThrow();
    s = await rv.answerSentence(A, sid, 1, "khác");
    expect(s.questions[1]!.result).toBe("correct");
    // Câu 3: bỏ qua.
    s = await rv.skipSentence(A, sid, 2);
    expect(s).toMatchObject({ correctCount: 2, wrongCount: 0, skippedCount: 1 });
    // Người khác không thao tác được phiên của A.
    await expect(rv.answerSentence(B, sid, 0, "x")).rejects.toThrow("Bài ôn không còn tồn tại");

    await rv.completeSentenceSession(A, sid);
    const r = (await rv.getLastSentenceResult(A))!;
    expect(r).toMatchObject({ correctCount: 2, skippedCount: 1 });
    expect(r.wrongIds).toHaveLength(1);
    expect(await rv.getActiveSentenceSession(A)).toBeNull();
    expect((await rv.getLastSentenceConfig(A))?.direction).toBe("vi-zh");
  });

  it("Trung → Việt hiện pinyin khi bật; kho rỗng báo lỗi", async () => {
    await rv.createSentenceSession(A, { direction: "zh-vi", count: 2, tags: [], showPinyin: true, showHint: false });
    const s = (await rv.getActiveSentenceSession(A))!;
    expect(s.questions[0]!.prompt.pinyin).toBeTruthy();
    expect(s.questions[0]!.prompt.text).toMatch(/\p{Script=Han}/u);
    await expect(
      rv.createSentenceSession(B, { direction: "mixed", count: 5, tags: [], showPinyin: false, showHint: false }),
    ).rejects.toThrow("Không có câu nào phù hợp để ôn.");
  });
});
