import { expect, test } from "@playwright/test";
import { resetRateLimit, sql } from "./db";
import { register } from "./helpers";

/** REST API Luyện nghe + Quản trị: quyền truy cập, kiểm tra dữ liệu, server tự chấm điểm, dữ liệu người khác không lộ. */
test.beforeEach(() => resetRateLimit());

test("API luyện nghe + quản trị: 401/403/404, server chấm lại điểm, admin xem tổng số người dùng", async ({
  page,
  browser,
}, info) => {
  test.skip(info.project.name !== "desktop", "API chỉ cần chạy một lần");
  const stranger = await browser.newContext();
  await register(await stranger.newPage(), "Người Lạ", "apil-s");
  const other = stranger.request;
  const email = await register(page, "Chủ Bài", "apil");
  const api = page.request;

  const anon = await browser.newContext();
  for (const [method, url] of [
    ["get", "/api/v1/listening/exercises"],
    ["post", "/api/v1/listening/exercises"],
    ["post", "/api/v1/listening/compare"],
    ["get", "/api/v1/listening/tags"],
    ["get", "/api/v1/admin/stats"],
    ["get", "/api/v1/admin/users"],
  ] as const)
    expect((await anon.request[method](url, method === "post" ? { data: {} } : undefined)).status(), url).toBe(401);
  await anon.close();

  // So sánh không lưu.
  const cmp = await (
    await api.post("/api/v1/listening/compare", {
      data: { referenceAnswer: "你好，我是小雨。", userAnswer: "你好，我叫小雨。" },
    })
  ).json();
  expect(cmp.data).toMatchObject({ correct: 5, wrong: 1, total: 6, percent: 83 });

  // Kiểm tra dữ liệu.
  const bad = await api.post("/api/v1/listening/exercises", { data: { title: "", referenceAnswer: "" } });
  expect(bad.status()).toBe(400);
  expect((await bad.json()).fieldErrors).toMatchObject({
    title: "Vui lòng nhập tiêu đề bài làm.",
    referenceAnswer: "Vui lòng nhập đáp án tham khảo.",
  });
  expect(
    (
      await api.post("/api/v1/listening/exercises", {
        data: { title: "x", referenceAnswer: "你", contentUrl: "https://example.com/page" },
      })
    ).status(),
  ).toBe(400);

  // Lưu: điểm do server tính (bỏ qua điểm client tự gửi).
  const created = await api.post("/api/v1/listening/exercises", {
    data: {
      title: "Hội thoại chào hỏi – Bài 1",
      tags: ["HSK1"],
      contentUrl: "https://youtu.be/dQw4w9WgXcQ",
      segmentStart: 12,
      segmentEnd: 45,
      referenceAnswer: "你好，我是小雨。",
      userAnswer: "你好，我叫小雨。",
      scorePercent: 100,
      notes: "ghi chú riêng",
    },
  });
  expect(created.status()).toBe(201);
  const ex = (await created.json()).data;
  expect(ex).toMatchObject({ scoreCorrect: 5, scoreTotal: 6, scorePercent: 83, media: { kind: "youtube" } });
  expect((await (await api.get("/api/v1/listening/exercises?q=chao")).json()).data.total).toBe(1);
  expect((await (await api.get("/api/v1/listening/tags")).json()).data).toEqual([
    expect.objectContaining({ name: "HSK1", count: 1 }),
  ]);

  // Người khác: không thấy, không sửa / xoá được.
  expect((await other.get(`/api/v1/listening/exercises/${ex.id}`)).status()).toBe(404);
  expect(
    (await other.put(`/api/v1/listening/exercises/${ex.id}`, { data: { title: "x", referenceAnswer: "你" } })).status(),
  ).toBe(404);
  expect((await other.delete(`/api/v1/listening/exercises/${ex.id}`)).status()).toBe(404);
  expect((await (await other.get("/api/v1/listening/exercises")).json()).data.total).toBe(0);
  expect((await api.get("/api/v1/listening/exercises/not-a-uuid")).status()).toBe(404);

  // Sửa → chấm lại.
  const upd = await api.put(`/api/v1/listening/exercises/${ex.id}`, {
    data: { title: "Hội thoại chào hỏi – Bài 1", referenceAnswer: "你好，我是小雨。", userAnswer: "你好，我是小雨。" },
  });
  expect((await upd.json()).data).toMatchObject({ scorePercent: 100, tags: [] });

  // Quản trị: người thường → 403; admin xem tổng số người dùng + thông tin (không có nội dung học).
  expect((await api.get("/api/v1/admin/stats")).status()).toBe(403);
  expect((await api.get("/api/v1/admin/users")).status()).toBe(403);
  await sql(`update "user" set role = 'admin' where email = $1`, [email]);
  const stats = (await (await api.get("/api/v1/admin/stats")).json()).data;
  expect(stats.totalUsers).toBeGreaterThanOrEqual(2);
  expect(stats.admins).toBeGreaterThanOrEqual(1);
  expect(stats.content.listening).toBeGreaterThanOrEqual(1);
  const users = (await (await api.get(`/api/v1/admin/users?q=${encodeURIComponent(email)}`)).json()).data;
  expect(users.total).toBe(1);
  expect(users.items[0]).toMatchObject({ email, role: "admin" });
  expect(users.items[0].password).toBeUndefined();
  const detail = (await (await api.get(`/api/v1/admin/users/${users.items[0].id}`)).json()).data;
  expect(detail).toMatchObject({ email, counts: { listening: 1, vocab: 0 } });
  expect(JSON.stringify(detail)).not.toContain("ghi chú riêng");
  expect((await api.get("/api/v1/admin/users/00000000-0000-4000-8000-000000000000")).status()).toBe(404);

  expect((await api.delete(`/api/v1/listening/exercises/${ex.id}`)).status()).toBe(200);
  expect((await api.delete(`/api/v1/listening/exercises/${ex.id}`)).status()).toBe(404);
  await stranger.close();
});
