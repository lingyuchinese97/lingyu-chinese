import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { pool } from "@/server/db/pool";
import { srsCard, srsReviewLog, vocab } from "@/server/db/schema";
import * as vsvc from "@/features/vocabulary/service";
import * as rsvc from "@/features/review/service";
import { vocabInputSchema } from "@/features/vocabulary/schema";
import { Rating } from "@/lib/srs";
import { cleanupUsers, makeUser } from "./helpers";

let A: string;
let B: string;
const ids: Record<string, string> = {};
beforeAll(async () => {
  await cleanupUsers();
  A = await makeUser("ra");
  B = await makeUser("rb");
  for (const [hanzi, pinyin, meaningVi, tags] of [
    ["你好", "nǐ hǎo", "xin chào", ["HSK1"]],
    ["谢谢", "xièxie", "cảm ơn", ["HSK1"]],
    ["海", "hǎi", "biển", ["Tự thêm"]],
  ] as const) {
    ids[hanzi] = await vsvc.createVocab(A, vocabInputSchema.parse({ hanzi, pinyin, meaningVi, tags }));
  }
});
afterAll(async () => {
  await cleanupUsers();
  await pool.end();
});

describe("ôn tự chọn", () => {
  it("lọc theo tag, không lộ đáp án trước khi trả lời", async () => {
    expect(await rsvc.countPool(A, ["hsk1"])).toBe(2);
    const id = await rsvc.createCustomSession(A, { tags: ["HSK1"], count: 10, mode: "meaning", showImage: true });
    const s = (await rsvc.getActiveSession(A))!;
    expect(s.id).toBe(id);
    expect(s.total).toBe(2);
    for (const q of s.questions) {
      expect(q.prompt.meaningVi).toBeUndefined(); // câu hỏi nghĩa → không gửi nghĩa
      expect(q.reveal).toBeUndefined();
      expect(JSON.stringify(q)).not.toMatch(/xin chào|cảm ơn/);
    }
  });

  it("chấm ở server: đúng/sai, đếm, sai → Cần ôn; không cho nhảy cóc", async () => {
    const s = (await rsvc.getActiveSession(A))!;
    await expect(rsvc.checkAnswer(A, s.id, 1, "x")).rejects.toThrow(rsvc.ReviewError);
    const first = s.questions[0]!.prompt.hanzi!;
    const right = first === "你好" ? "Xin chào" : "cảm ơn";
    let r = await rsvc.checkAnswer(A, s.id, 0, right);
    expect(r.questions[0]).toMatchObject({ answered: true, isCorrect: true });
    expect(r.questions[0]!.reveal?.meaningVi).toBeTruthy();
    r = await rsvc.checkAnswer(A, s.id, 1, "sai bét");
    expect(r).toMatchObject({ correctCount: 1, wrongCount: 1 });
    // Bấm 2 lần không cộng thêm.
    r = await rsvc.checkAnswer(A, s.id, 1, "sai bét");
    expect(r.wrongCount).toBe(1);
    const wrongHanzi = r.questions[1]!.prompt.hanzi!;
    const [v] = await db.select({ status: vocab.status }).from(vocab).where(eq(vocab.id, ids[wrongHanzi]!));
    expect(v!.status).toBe("review");
    // Ôn tự chọn không đổi lịch FSRS.
    expect(await db.select().from(srsReviewLog).where(eq(srsReviewLog.userId, A))).toHaveLength(0);
    await rsvc.completeSession(A, s.id);
    expect(await rsvc.getActiveSession(A)).toBeNull();
    const last = (await rsvc.getLastResult(A))!;
    expect(last.wrongVocabIds).toEqual([ids[wrongHanzi]]);
  });

  it("câu sai hiện từ khác khớp với câu trả lời", async () => {
    await rsvc.createCustomSession(A, {
      tags: [],
      count: 1,
      mode: "meaning",
      showImage: false,
      vocabIds: [ids["海"]!],
    });
    const s = (await rsvc.getActiveSession(A))!;
    const r = await rsvc.checkAnswer(A, s.id, 0, "cảm ơn");
    expect(r.questions[0]!.reveal?.matched?.hanzi).toBe("谢谢");
  });

  it("tạo bài mới thì bỏ bài cũ; hoàn thành khi chưa làm hết bị từ chối", async () => {
    const old = (await rsvc.getActiveSession(A))!;
    await rsvc.createCustomSession(A, { tags: [], count: 3, mode: "mixed", showImage: true });
    const s = (await rsvc.getActiveSession(A))!;
    expect(s.id).not.toBe(old.id);
    expect(new Set(s.questions.map((q) => q.promptType)).size).toBe(3);
    await expect(rsvc.completeSession(A, s.id)).rejects.toThrow("Bạn chưa làm hết các câu.");
  });
});

describe("ôn đến hạn (FSRS)", () => {
  it("đúng → Good, đổi sang Dễ tính lại từ trạng thái cũ; sai → Again", async () => {
    await rsvc.abandonSession(A);
    const before = await rsvc.dueCount(A);
    expect(before).toBe(3);
    await rsvc.createDueSession(A, { mode: "hanzi", showImage: true });
    const s = (await rsvc.getActiveSession(A))!;
    expect(s.kind).toBe("due");
    const q0 = s.questions[0]!;
    expect(q0.prompt.hanzi).toBeUndefined(); // câu hỏi chữ Hán → không gửi chữ Hán
    // Tìm chữ Hán đúng theo nghĩa.
    const byMeaning: Record<string, string> = { "xin chào": "你好", "cảm ơn": "谢谢", biển: "海" };
    const answer = byMeaning[q0.prompt.meaningVi!]!;
    let r = await rsvc.checkAnswer(A, s.id, 0, answer);
    expect(r.questions[0]!.reveal?.rating).toBe(Rating.Good);
    const [good] = await db.select().from(srsCard).where(eq(srsCard.vocabId, ids[answer]!));
    r = await rsvc.rateAnswer(A, s.id, 0, Rating.Easy);
    expect(r.questions[0]!.reveal?.rating).toBe(Rating.Easy);
    const [easy] = await db.select().from(srsCard).where(eq(srsCard.vocabId, ids[answer]!));
    expect(easy!.due.getTime()).toBeGreaterThan(good!.due.getTime());
    expect(easy!.reps).toBe(1); // tính lại, không cộng dồn
    const logs = await db.select().from(srsReviewLog).where(eq(srsReviewLog.cardId, easy!.id));
    expect(logs).toHaveLength(1);
    expect(logs[0]!.rating).toBe(Rating.Easy);

    r = await rsvc.checkAnswer(A, s.id, 1, "sai");
    expect(r.questions[1]!.reveal?.rating).toBe(Rating.Again);
    await expect(rsvc.rateAnswer(A, s.id, 1, Rating.Easy)).rejects.toThrow(rsvc.ReviewError);
    expect(await rsvc.dueCount(A)).toBeLessThan(before);
  });

  it("hết thẻ đến hạn thì báo", async () => {
    await expect(rsvc.createDueSession(B, { mode: "meaning", showImage: true })).rejects.toThrow("không còn thẻ");
  });
});

describe("không lộ phiên ôn tập giữa hai người dùng", () => {
  it("B không đọc / chấm / chuyển câu / hoàn thành được phiên của A, không ôn được từ của A", async () => {
    const s = (await rsvc.getActiveSession(A))!;
    expect(await rsvc.getActiveSession(B)).toBeNull();
    await expect(rsvc.checkAnswer(B, s.id, 2, "x")).rejects.toThrow(rsvc.ReviewError);
    await expect(rsvc.moveTo(B, s.id, 0)).rejects.toThrow(rsvc.ReviewError);
    await expect(rsvc.completeSession(B, s.id)).rejects.toThrow(rsvc.ReviewError);
    await expect(
      rsvc.createCustomSession(B, { tags: [], count: 5, mode: "meaning", showImage: true, vocabIds: [ids["你好"]!] }),
    ).rejects.toThrow("Không có từ vựng");
    expect(await rsvc.countPool(B, [])).toBe(0);
  });
});
