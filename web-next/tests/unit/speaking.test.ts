import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool } from "@/server/db/pool";
import * as sp from "@/features/speaking/service";
import { questionBatchSchema, questionInputSchema, questionListSchema } from "@/features/speaking/schema";
import { cleanupUsers, makeUser } from "./helpers";

const L = (x: Record<string, unknown> = {}) => questionListSchema.parse(x);
const Q = (x: Record<string, unknown>) => questionInputSchema.parse(x);
let A: string;
let B: string;
beforeAll(async () => {
  delete process.env.ANTHROPIC_API_KEY; // test chạy cách dự phòng (không gọi AI)
  await cleanupUsers();
  [A, B] = [await makeUser("spa"), await makeUser("spb")];
});
afterAll(async () => {
  await cleanupUsers();
  await pool.end();
});

describe("Luyện giao tiếp: câu hỏi", () => {
  it("tạo nhiều câu; tự sinh pinyin + nghĩa ghép theo từ; lọc tag / HSK / tìm; số thứ tự theo thứ tự tạo", async () => {
    const { ids } = await sp.createQuestions(
      A,
      questionBatchSchema.parse({
        questions: [
          { zh: "你周末喜欢做什么？", hsk: 1, tags: ["Sở thích"] },
          { zh: "你家有几口人？", meaning: "Nhà bạn có mấy người?", hsk: 1, tags: ["Gia đình", "sở thích"] },
          { zh: "你在哪儿工作？", hsk: 2, tags: ["Công việc"] },
        ],
      }).questions,
    );
    expect(ids).toHaveLength(3);
    const q1 = await sp.getQuestion(A, ids[0]!);
    expect(q1.pinyin.toLowerCase().replace(/\s/g, "")).toContain("zhōumò");
    expect(q1.nav).toEqual({ index: 1, total: 3, prev: null, next: ids[1] });
    expect((await sp.getQuestion(A, ids[1]!)).meaning).toBe("Nhà bạn có mấy người?");

    const all = await sp.listQuestions(A, L());
    expect(all.items.map((x) => x.no)).toEqual([3, 2, 1]);
    expect(all.hskCounts.find((h) => h.hsk === 1)?.count).toBe(2);
    expect(all.tags.find((t) => t.name.toLowerCase() === "sở thích")?.count).toBe(2);
    expect((await sp.listQuestions(A, L({ tag: "GIA ĐÌNH" }))).total).toBe(1);
    expect((await sp.listQuestions(A, L({ hsk: "2" }))).items[0]?.zh).toBe("你在哪儿工作？");
    expect((await sp.listQuestions(A, L({ q: "zhoumo" }))).total).toBe(1);
    expect((await sp.listQuestions(A, L({ q: "mấy người" }))).total).toBe(1);

    await sp.setStarred(A, ids[2]!, true);
    expect((await sp.listQuestions(A, L({ starred: "1" }))).items.map((x) => x.id)).toEqual([ids[2]]);

    const u = await sp.updateQuestion(A, ids[2]!, Q({ zh: "你做什么工作？", hsk: 2, tags: ["Công việc"] }));
    expect(u.zh).toBe("你做什么工作？");
    expect(u.pinyin).not.toBe("");
  });

  it("câu trả lời: lưu, tự sinh pinyin + nghĩa; kiểm tra (không có AI → kiểm tra cơ bản); chuyển câu không mất bài", async () => {
    const { ids } = await sp.createQuestions(B, [Q({ zh: "你喜欢吃什么水果？" })]);
    const id = ids[0]!;
    const s = await sp.saveAnswer(B, id, "我喜欢吃苹果。");
    expect(s.changed).toBe(true);
    expect(s.answerPinyin.toLowerCase()).toContain("píng");
    expect((await sp.getQuestion(B, id)).answer).toBe("我喜欢吃苹果。");
    expect((await sp.saveAnswer(B, id, "我喜欢吃苹果。")).changed).toBe(false);
    // Sửa tay nghĩa (câu trả lời không đổi) → lưu đúng bản sửa, pinyin giữ nguyên.
    const m = await sp.saveAnswer(B, id, "我喜欢吃苹果。", { answerMeaning: "Tôi thích ăn táo." });
    expect(m.answerMeaning).toBe("Tôi thích ăn táo.");
    expect(m.answerPinyin).toBe(s.answerPinyin);
    expect((await sp.getQuestion(B, id)).answerMeaning).toBe("Tôi thích ăn táo.");

    const c = await sp.checkAnswer(B, id, "苹果");
    expect(c.feedback.ai).toBe(false);
    expect(c.feedback.issues.length).toBeGreaterThan(0);
    expect((await sp.getQuestion(B, id)).feedback?.issues.length).toBeGreaterThan(0);
    await expect(sp.checkAnswer(B, id, "")).rejects.toMatchObject({ code: "validation" });
  });

  it("dữ liệu riêng từng người: người khác không thấy / sửa / xoá được", async () => {
    const { ids } = await sp.createQuestions(A, [Q({ zh: "你好吗？" })]);
    const id = ids[0]!;
    expect((await sp.listQuestions(B, L({ q: "你好吗" }))).total).toBe(0);
    for (const f of [
      () => sp.getQuestion(B, id),
      () => sp.updateQuestion(B, id, Q({ zh: "改了" })),
      () => sp.saveAnswer(B, id, "我很好。"),
      () => sp.setStarred(B, id, true),
      () => sp.deleteQuestion(B, id),
    ])
      await expect(f()).rejects.toMatchObject({ code: "not-found" });
    expect((await sp.deleteQuestions(B, [id])).deleted).toBe(0);
    expect((await sp.deleteQuestion(A, id)).deleted).toBe(true);
  });

  it("kiểm tra dữ liệu vào", () => {
    expect(questionInputSchema.safeParse({ zh: "hello" }).success).toBe(false);
    expect(questionInputSchema.safeParse({ zh: "你好", hsk: 7 }).success).toBe(false);
    expect(Q({ zh: "你好", tags: ["A", "a", " B "] }).tags).toEqual(["A", "B"]);
  });
});
