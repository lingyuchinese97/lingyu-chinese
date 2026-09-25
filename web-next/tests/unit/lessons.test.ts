import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool } from "@/server/db/pool";
import { bai1 } from "@/data/lessons/bai1";
import { LESSONS, getLesson } from "@/data/lessons";
import { lessonSchema } from "@/data/lessons/schema";
import { progressOf, recordSection, summarize } from "@/features/lessons/service";
import { cleanupUsers, makeUser } from "./helpers";

const PUBLIC = path.join(process.cwd(), "public");

describe("nội dung bài học", () => {
  it("mọi bài hợp lệ theo schema và có id không trùng", () => {
    const dirs = readdirSync(path.join(process.cwd(), "src/data/lessons"), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    // Mọi thư mục bài học đều được đăng ký.
    expect(LESSONS.map((l) => l.id).sort()).toEqual(dirs);
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
    for (const l of LESSONS) expect(lessonSchema.safeParse(l).success).toBe(true);
  });

  it("mọi audio được khai báo đều tồn tại trong public/", () => {
    const missing = LESSONS.flatMap((l) =>
      l.sections.flatMap((s) => s.questions.filter((q) => q.audio && !existsSync(path.join(PUBLIC, q.audio!)))),
    ).map((q) => q.audio);
    expect(missing).toEqual([]);
  });

  it("Bài 1: 16 câu nghe (chưa có audio) + 20 câu ghép âm có audio", () => {
    const l = getLesson("bai1")!;
    expect(l.sections.map((s) => [s.id, s.questions.length])).toEqual([
      ["listening", 16],
      ["blending", 20],
    ]);
    expect(l.sections[1]!.questions.every((q) => q.audio)).toBe(true);
    expect(l.sections[1]!.questions[0]).toMatchObject({ type: "blend", parts: "b + a", answer: 0 });
  });

  it("schema bắt lỗi: đáp án ngoài 0–3, không đủ 4 lựa chọn, audio sai thư mục, id trùng", () => {
    const bad = structuredClone(bai1);
    bad.sections[1]!.questions[0]!.answer = 4;
    expect(lessonSchema.safeParse(bad).success).toBe(false);
    const bad2 = structuredClone(bai1);
    bad2.sections[0]!.questions[0]!.options = ["a", "b", "c"];
    expect(lessonSchema.safeParse(bad2).success).toBe(false);
    const bad3 = structuredClone(bai1);
    bad3.sections[1]!.questions[0]!.audio = "/audio/bai2/x.mp3";
    expect(lessonSchema.safeParse(bad3).success).toBe(false);
    const bad4 = structuredClone(bai1);
    bad4.sections[1]!.id = "listening";
    expect(lessonSchema.safeParse(bad4).success).toBe(false);
  });
});

describe("tiến độ bài học", () => {
  let u: string;
  beforeAll(async () => {
    await cleanupUsers();
    u = await makeUser("ls");
  });
  afterAll(async () => {
    await cleanupUsers();
    await pool.end();
  });

  it("server tự chấm theo đáp án trong bài; lưu điểm cao nhất, lần gần nhất, số lần làm", async () => {
    const qs = getLesson("bai1")!.sections[1]!.questions;
    const all = qs.map((q) => q.answer);
    const half = qs.map((q, i) => (i < 10 ? q.answer : (q.answer + 1) % 4));
    expect(await recordSection(u, "bai1", "blending", all)).toEqual({ score: 20, total: 20 });
    expect(await recordSection(u, "bai1", "blending", half)).toEqual({ score: 10, total: 20 });
    const p = await progressOf(u);
    expect(p.bai1!.blending).toMatchObject({ bestScore: 20, lastScore: 10, total: 20, attempts: 2 });
    expect(summarize(p)).toMatchObject({ done: 1, total: 2, percent: 50 });
  });

  it("từ chối bài/phần không tồn tại và bài làm thiếu câu", async () => {
    await expect(recordSection(u, "bai9", "x", [])).rejects.toThrow("Không tìm thấy bài học này.");
    await expect(recordSection(u, "bai1", "listening", [0, 1])).rejects.toThrow("Bài làm chưa đầy đủ.");
  });
});
