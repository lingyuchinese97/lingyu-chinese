import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool } from "@/server/db/pool";
import { db } from "@/server/db/client";
import * as p from "@/features/progress/service";
import { goalsSchema } from "@/features/progress/schema";
import { hskCounts, hskLevelOf, hskWords } from "@/lib/hsk";
import { createVocab, setStatus } from "@/features/vocabulary/service";
import { vocabInputSchema } from "@/features/vocabulary/schema";
import { recordSection } from "@/features/lessons/service";
import { getLesson } from "@/data/lessons";
import { search } from "@/features/search/service";
import { cleanupUsers, makeUser } from "./helpers";

let A: string;
let B: string;
beforeAll(async () => {
  await cleanupUsers();
  [A, B] = [await makeUser("pga"), await makeUser("pgb")];
});
afterAll(async () => {
  await cleanupUsers();
  await pool.end();
});

describe("HSK", () => {
  it("tra cấp HSK, lấy cấp thấp nhất, đếm theo cấp", () => {
    expect(hskLevelOf("爱")).toBe(1);
    expect(hskLevelOf("爸爸")).toBe(1);
    expect(hskLevelOf("không-có")).toBeNull();
    const c = hskCounts();
    expect(c[1]).toBeGreaterThan(250);
    expect(hskWords(1)).toContain("八");
    expect(new Set(hskWords(1)).size).toBe(hskWords(1).length);
  });
});

describe("ngày giờ Việt Nam", () => {
  it("dayVN theo UTC+7", () => {
    expect(p.dayVN(new Date("2026-09-26T16:59:00Z"))).toBe("2026-09-26");
    expect(p.dayVN(new Date("2026-09-26T17:00:00Z"))).toBe("2026-09-27");
  });
});

describe("thời gian học (ping)", () => {
  it("cộng thời gian giữa các nhịp, tối đa 60 giây; bỏ qua gửi dồn và khoảng nghỉ dài", async () => {
    const t0 = new Date("2026-09-20T02:00:00Z");
    const at = (s: number) => new Date(t0.getTime() + s * 1000);
    expect((await p.ping(A, t0)).seconds).toBe(0); // nhịp đầu chỉ bắt đầu đếm
    expect((await p.ping(A, at(60))).seconds).toBe(60);
    expect((await p.ping(A, at(65))).seconds).toBe(60); // < 20 giây → bỏ qua
    expect((await p.ping(A, at(150))).seconds).toBe(120); // 90 giây → tối đa 60
    expect((await p.ping(A, at(1000))).seconds).toBe(120); // nghỉ lâu → không cộng
    expect((await p.ping(A, at(1045))).seconds).toBe(165);
    const days = await p.dailyMinutes(A, 7, new Date("2026-09-21T02:00:00Z"));
    expect(days).toHaveLength(7);
    expect(days.find((d) => d.day === "2026-09-20")?.minutes).toBe(3);
    expect(days.at(-1)?.day).toBe("2026-09-21");
  });
});

describe("hoạt động, hôm nay, chuỗi ngày, lịch sử", () => {
  it("ghi hoạt động (trùng refId không đếm hai lần), gộp thêm từ theo ngày, số liệu hôm nay", async () => {
    const now = new Date();
    await p.recordActivity(db, A, { kind: "vocab_review", title: "HSK1", refId: "s1", correct: 8, total: 10 }, now);
    await p.recordActivity(db, A, { kind: "vocab_review", title: "HSK1", refId: "s1", correct: 8, total: 10 }, now);
    await p.recordActivity(db, A, { kind: "reading", title: "我的朋友", correct: 4, total: 5 }, now);
    await p.bumpDaily(db, A, "vocab_add", 1, now);
    await p.bumpDaily(db, A, "vocab_add", 2, now);
    const t = await p.today(A, now);
    expect(t).toMatchObject({ vocab: 13, reading: 1, translation: 0 });
    const h = await p.history(A, { days: 1 });
    expect(h.filter((x) => x.kind === "vocab_review")).toHaveLength(1);
    expect(h.find((x) => x.kind === "vocab_add")?.total).toBe(3);
    expect((await p.history(A, { kind: "reading", days: 1 })).map((x) => x.title)).toEqual(["我的朋友"]);
  });

  it("chuỗi ngày học liên tiếp tính cả hôm qua khi hôm nay chưa học", async () => {
    const U = await makeUser("pgs");
    const now = new Date("2026-09-24T05:00:00Z");
    for (const d of ["2026-09-21", "2026-09-22", "2026-09-23"])
      await p.recordActivity(db, U, { kind: "lesson", title: "x" }, new Date(`${d}T03:00:00Z`));
    const s = await p.streak(U, now);
    expect(s.current).toBe(3);
    expect(s.weeks[1]!.map((d) => d.studied)).toEqual([true, true, true, false, false, false, false]);
    expect(s.weeks[1]![0]!.day).toBe("2026-09-21"); // Thứ Hai
    expect((await p.streak(U, new Date("2026-09-26T05:00:00Z"))).current).toBe(0);
  });

  it("người khác không thấy lịch sử / thời gian học của tôi", async () => {
    expect(await p.history(B, { days: 365 })).toEqual([]);
    expect((await p.today(B)).vocab).toBe(0);
    expect((await p.dailyMinutes(B, 30)).every((d) => d.minutes === 0)).toBe(true);
  });
});

describe("mục tiêu, tổng quan, HSK", () => {
  it("mục tiêu mặc định, đổi, kiểm tra giới hạn", async () => {
    expect(await p.getGoals(B)).toEqual({ minutes_day: 30, lessons_week: 2, vocab_month: 50 });
    expect(await p.setGoals(B, goalsSchema.parse({ minutes_day: 45 }))).toMatchObject({
      minutes_day: 45,
      vocab_month: 50,
    });
    expect(() => goalsSchema.parse({ minutes_day: 1 })).toThrow("Mục tiêu tối thiểu 5.");
    expect(() => goalsSchema.parse({ hack: 1 })).toThrow();
  });

  it("tổng quan: từ vựng đã thuộc, bài học, mục tiêu; tiến độ HSK theo từ trong kho", async () => {
    const U = await makeUser("pgt");
    const id1 = await createVocab(U, vocabInputSchema.parse({ hanzi: "爱", pinyin: "ài", meaningVi: "yêu" }));
    await createVocab(U, vocabInputSchema.parse({ hanzi: "八", pinyin: "bā", meaningVi: "tám" }));
    await createVocab(U, vocabInputSchema.parse({ hanzi: "电脑游戏机", pinyin: "x", meaningVi: "không phải từ HSK" }));
    await setStatus(U, [id1], "learned");
    const sec = getLesson("bai1")!.sections[0]!;
    await recordSection(
      U,
      "bai1",
      sec.id,
      sec.questions.map((q) => q.answer),
    );
    const s = await p.summary(U);
    expect(s.vocab).toMatchObject({ learned: 1, total: 3 });
    expect(s.lessons.done).toBe(1);
    expect(s.goals.vocab_month.value).toBe(3);
    expect(s.goals.lessons_week.value).toBe(1);
    const hsk = await p.vocabByHsk(U);
    expect(hsk[0]).toMatchObject({ level: 1, learned: 1, inBank: 2 });
    // Hoạt động bài học + thêm từ đã được ghi.
    const kinds = (await p.history(U, { days: 1 })).map((x) => x.kind);
    expect(kinds).toEqual(expect.arrayContaining(["lesson", "vocab_add"]));
    // Tìm kiếm chung: chỉ dữ liệu của mình.
    expect((await search(U, "爱")).vocab.map((v) => v.hanzi)).toEqual(["爱"]);
    expect((await search(B, "爱")).vocab).toEqual([]);
    expect((await search(U, "")).total).toBe(0);
  });
});
