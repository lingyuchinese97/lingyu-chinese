import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool } from "@/server/db/pool";
import { exerciseInputSchema, exerciseListSchema } from "@/features/listening/schema";
import * as svc from "@/features/listening/service";
import { parseMediaUrl, parseTime, formatTime } from "@/lib/media-url";
import { cleanupUsers, makeUser } from "./helpers";

const input = (p: Record<string, unknown> = {}) =>
  exerciseInputSchema.parse({
    title: "Hội thoại chào hỏi – Bài 1",
    referenceAnswer: "你好，我是小雨。",
    userAnswer: "你好，我叫小雨。",
    ...p,
  });
const params = (p: Record<string, unknown> = {}) => exerciseListSchema.parse(p);
let A: string;
let B: string;
beforeAll(async () => {
  await cleanupUsers();
  [A, B] = [await makeUser("la"), await makeUser("lb")];
});
afterAll(async () => {
  await cleanupUsers();
  await pool.end();
});

describe("nhận diện link", () => {
  it("YouTube các dạng → id video; link file âm thanh / video; còn lại không hỗ trợ", () => {
    for (const u of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10",
      "youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQ?si=x",
      "https://m.youtube.com/shorts/dQw4w9WgXcQ",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    ])
      expect(parseMediaUrl(u)).toEqual({
        kind: "youtube",
        videoId: "dQw4w9WgXcQ",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      });
    expect(parseMediaUrl("https://cdn.example.com/podcast/ep1.mp3?x=1")).toMatchObject({ kind: "audio" });
    expect(parseMediaUrl("https://cdn.example.com/a.mp4")).toMatchObject({ kind: "video" });
    for (const u of [
      "",
      "abc",
      "javascript:alert(1)",
      "https://example.com/page",
      "https://youtube.com/watch?v=short",
      "ftp://x/a.mp3",
    ])
      expect(parseMediaUrl(u), u).toBeNull();
  });
  it("thời gian", () => {
    expect(formatTime(75.4)).toBe("01:15");
    expect(formatTime(3723)).toBe("1:02:03");
    expect(parseTime("01:15")).toBe(75);
    expect(parseTime("1:02:03")).toBe(3723);
    expect(parseTime("1:2x")).toBeNull();
  });
});

describe("kiểm tra dữ liệu bài làm", () => {
  it("bắt buộc tiêu đề + đáp án; giới hạn 100 / 2000 ký tự; link phải được hỗ trợ; đoạn hợp lệ", () => {
    const bad = exerciseInputSchema.safeParse({ title: " ", referenceAnswer: "" });
    expect(bad.success).toBe(false);
    const msgs = bad.error!.issues.map((i) => i.message);
    expect(msgs).toContain("Vui lòng nhập tiêu đề bài làm.");
    expect(msgs).toContain("Vui lòng nhập đáp án tham khảo.");
    expect(exerciseInputSchema.safeParse({ ...input(), title: "x".repeat(101) }).success).toBe(false);
    expect(exerciseInputSchema.safeParse({ ...input(), userAnswer: "字".repeat(2001) }).success).toBe(false);
    expect(exerciseInputSchema.safeParse({ ...input(), notes: "a".repeat(2001) }).success).toBe(false);
    expect(exerciseInputSchema.safeParse({ ...input(), contentUrl: "https://example.com/page" }).success).toBe(false);
    expect(exerciseInputSchema.safeParse({ ...input(), segmentStart: 30, segmentEnd: 10 }).success).toBe(false);
    expect(exerciseInputSchema.safeParse({ ...input(), playbackSpeed: 3 }).success).toBe(false);
  });
});

describe("bài làm luyện nghe", () => {
  it("lưu: server tự so sánh + chấm điểm, giữ định dạng tô màu tách khỏi kết quả so sánh", async () => {
    const id = await svc.createExercise(
      A,
      input({
        tags: ["HSK1", "Hội thoại", "hsk1"],
        contentUrl: "https://youtu.be/dQw4w9WgXcQ",
        segmentStart: 12,
        segmentEnd: 45,
        playbackSpeed: 0.75,
        referencePinyin: "Nǐ hǎo, wǒ shì Xiǎoyǔ.",
        formattedUserAnswer: [{ text: "你好，" }, { text: "我叫", color: "red" }, { text: "小雨。", highlight: true }],
        notes: "Cần lưu ý 我是 / 我叫",
      }),
    );
    const e = await svc.getExercise(A, id);
    expect(e).toMatchObject({
      tags: ["HSK1", "Hội thoại"],
      contentUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      media: { kind: "youtube", videoId: "dQw4w9WgXcQ" },
      segmentStart: 12,
      segmentEnd: 45,
      playbackSpeed: 0.75,
      scoreCorrect: 5,
      scoreTotal: 6,
      scorePercent: 83,
    });
    expect(e.formattedUserAnswer).toEqual([
      { text: "你好，" },
      { text: "我叫", color: "red" },
      { text: "小雨。", highlight: true },
    ]);
    expect(e.comparisonResult.parts.find((p) => p.kind === "text" && p.status === "wrong")).toMatchObject({
      text: "叫",
      expected: "是",
    });
  });

  it("định dạng client gửi lệch với bài chép → căn lại theo bài chép", async () => {
    const id = await svc.createExercise(
      A,
      input({ userAnswer: "你好", formattedUserAnswer: [{ text: "别的", color: "red" }] }),
    );
    expect((await svc.getExercise(A, id)).formattedUserAnswer).toEqual([{ text: "你好" }]);
    await svc.deleteExercise(A, id);
  });

  it("sửa bài chép / đáp án → chấm lại (không giữ điểm cũ)", async () => {
    const id = await svc.createExercise(A, input({ title: "Sửa lại" }));
    await svc.updateExercise(A, id, input({ title: "Sửa lại", userAnswer: "你好，我是小雨。", tags: ["Mới"] }));
    const e = await svc.getExercise(A, id);
    expect(e).toMatchObject({ scorePercent: 100, scoreCorrect: 6, tags: ["Mới"] });
    await svc.updateExercise(
      A,
      id,
      input({ title: "Sửa lại", referenceAnswer: "你好，我叫小雨。", userAnswer: "你好，我是小雨。" }),
    );
    expect((await svc.getExercise(A, id)).scorePercent).toBe(83);
  });

  it("tìm theo tiêu đề (không dấu), bài chép, đáp án, ghi chú, thẻ; lọc thẻ; sắp xếp", async () => {
    await svc.createExercise(
      A,
      input({ title: "Mua đồ ở cửa hàng", referenceAnswer: "多少钱？", userAnswer: "多少钱", tags: ["Mua sắm"] }),
    );
    const titles = async (p: Record<string, unknown>) =>
      (await svc.listExercises(A, params(p))).items.map((i) => i.title);
    expect(await titles({ q: "cua hang" })).toEqual(["Mua đồ ở cửa hàng"]);
    expect(await titles({ q: "多少" })).toEqual(["Mua đồ ở cửa hàng"]);
    expect(await titles({ q: "我叫" })).toContain("Hội thoại chào hỏi – Bài 1");
    expect(await titles({ q: "lưu ý" })).toEqual(["Hội thoại chào hỏi – Bài 1"]);
    expect(await titles({ q: "mua sam" })).toEqual(["Mua đồ ở cửa hàng"]);
    expect(await titles({ tag: "hsk1" })).toEqual(["Hội thoại chào hỏi – Bài 1"]);
    expect(await titles({ tag: "không có" })).toEqual([]);
    const newest = await titles({});
    expect(newest[0]).toBe("Mua đồ ở cửa hàng");
    expect(await titles({ sort: "oldest" })).toEqual([...newest].reverse());
    expect((await svc.listListeningTags(A)).map((t) => t.name)).toEqual(expect.arrayContaining(["HSK1", "Mua sắm"]));
  });

  it("dữ liệu người khác: không thấy, không sửa / xoá được", async () => {
    const [mine] = (await svc.listExercises(A, params())).items;
    expect((await svc.listExercises(B, params())).total).toBe(0);
    expect(await svc.listListeningTags(B)).toEqual([]);
    await expect(svc.getExercise(B, mine!.id)).rejects.toMatchObject({ code: "not-found" });
    await expect(svc.updateExercise(B, mine!.id, input())).rejects.toMatchObject({ code: "not-found" });
    await expect(svc.deleteExercise(B, mine!.id)).rejects.toMatchObject({ code: "not-found" });
    expect((await svc.getExercise(A, mine!.id)).id).toBe(mine!.id);
  });
});
