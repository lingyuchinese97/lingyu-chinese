import { expect, test, type APIRequestContext } from "@playwright/test";
import { register } from "./helpers";

/**
 * REST API /api/v1/vocab và /api/v1/review (cho app khác): quyền truy cập, kiểm tra dữ liệu, luồng CRUD và ôn tập.
 * Chỉ chạy một lần (desktop) — API không phụ thuộc kích thước màn hình, và tránh chạm giới hạn đăng ký.
 */
test("REST API từ vựng + ôn tập: 401/404/415/400, CRUD, chia sẻ, làm bài đến hạn", async ({ page, browser }, info) => {
  test.skip(info.project.name !== "desktop", "API chỉ cần chạy một lần");

  const stranger = await browser.newContext();
  const sPage = await stranger.newPage();
  const strangerEmail = await register(sPage, "Người Lạ", "api-s");
  const other: APIRequestContext = stranger.request;

  await register(page, "Chủ Từ", "api");
  const api = page.request;

  // Chưa đăng nhập → 401 ở mọi route.
  const anon = await browser.newContext();
  for (const [method, url] of [
    ["get", "/api/v1/vocab"],
    ["post", "/api/v1/vocab"],
    ["get", "/api/v1/vocab/stats"],
    ["get", "/api/v1/review/due-count"],
    ["post", "/api/v1/review/sessions"],
    ["get", "/api/v1/review/sessions/active"],
  ] as const) {
    const r = await anon.request[method](url, method === "post" ? { data: {} } : undefined);
    expect(r.status(), `${method} ${url}`).toBe(401);
    expect((await r.json()).ok).toBe(false);
  }
  await anon.close();

  // Thân không phải JSON → 415; JSON hỏng → 400; sai dữ liệu → 400 + fieldErrors.
  expect((await api.post("/api/v1/vocab", { form: { hanzi: "他" } })).status()).toBe(415);
  const broken = await api.post("/api/v1/vocab", {
    data: "{oops",
    headers: { "content-type": "application/json" },
  });
  expect(broken.status()).toBe(400);
  const invalid = await api.post("/api/v1/vocab", { data: { hanzi: "abc", pinyin: "", meaningVi: "x" } });
  expect(invalid.status()).toBe(400);
  const inv = await invalid.json();
  expect(inv.fieldErrors.hanzi).toBe("Hán tự phải chứa ít nhất một chữ Hán.");
  expect(inv.fieldErrors.pinyin).toBe("Vui lòng nhập pinyin.");

  // CRUD.
  const created = await api.post("/api/v1/vocab", {
    data: { hanzi: "他", pinyin: "tā", meaningVi: "anh ấy", tags: ["HSK1"] },
  });
  expect(created.status()).toBe(201);
  const id: string = (await created.json()).data.id;
  const list = (await (await api.get("/api/v1/vocab?q=ta&pageSize=5")).json()).data;
  expect(list.total).toBe(1);
  expect(list.items[0].hanzi).toBe("他");
  expect((await (await api.get("/api/v1/vocab/tags")).json()).data).toEqual([
    expect.objectContaining({ name: "HSK1", count: 1 }),
  ]);
  const edited = await api.put(`/api/v1/vocab/${id}`, {
    data: { hanzi: "他", pinyin: "tā", meaningVi: "anh ấy", note: "đại từ", tags: ["HSK1", "người"] },
  });
  expect((await edited.json()).data).toMatchObject({ note: "đại từ", tags: ["HSK1", "người"] });
  expect((await (await api.post(`/api/v1/vocab/${id}/favorite`)).json()).data.isFavorite).toBe(true);
  expect((await (await api.get("/api/v1/vocab/stats")).json()).data.total).toBe(1);

  // Dữ liệu của người khác → 404 (không lộ là có tồn tại); id sai định dạng cũng 404.
  expect((await other.get(`/api/v1/vocab/${id}`)).status()).toBe(404);
  expect(
    (await other.put(`/api/v1/vocab/${id}`, { data: { hanzi: "你", pinyin: "nǐ", meaningVi: "bạn" } })).status(),
  ).toBe(404);
  expect((await other.delete(`/api/v1/vocab/${id}`)).status()).toBe(404);
  expect((await other.post(`/api/v1/vocab/${id}/favorite`)).status()).toBe(404);
  expect((await (await other.post("/api/v1/vocab/delete", { data: { ids: [id] } })).json()).data.removed).toBe(0);
  expect((await (await other.get("/api/v1/vocab")).json()).data.total).toBe(0);
  expect((await api.get("/api/v1/vocab/not-a-uuid")).status()).toBe(404);

  // Chia sẻ qua API: người nhận thấy lời mời, chấp nhận → có bản sao của riêng mình.
  const shared = await api.post("/api/v1/vocab/shares", { data: { ids: [id], emails: [strangerEmail] } });
  expect(shared.status()).toBe(200);
  const received = (await (await other.get("/api/v1/vocab/shares/received")).json()).data;
  expect(received).toHaveLength(1);
  expect((await api.post(`/api/v1/vocab/shares/${received[0].id}/accept`, { data: {} })).status()).toBe(404);
  expect((await other.post(`/api/v1/vocab/shares/${received[0].id}/accept`, { data: {} })).status()).toBe(200);
  expect((await (await other.get("/api/v1/vocab")).json()).data.total).toBe(1);

  // Ôn tập: tạo bài đến hạn (từ mới luôn đến hạn), đáp án câu chưa làm không bị lộ.
  expect((await (await api.get("/api/v1/review/due-count")).json()).data.count).toBe(1);
  expect((await (await api.get("/api/v1/review/pool?tags=HSK1")).json()).data.count).toBe(1);
  expect((await api.post("/api/v1/review/sessions", { data: { kind: "due", mode: "nope" } })).status()).toBe(400);
  const started = await api.post("/api/v1/review/sessions", { data: { kind: "due", mode: "meaning" } });
  expect(started.status()).toBe(201);
  const session = (await started.json()).data;
  expect(session).toMatchObject({ kind: "due", total: 1 });
  expect(session.questions[0].prompt).toEqual({ hanzi: "他", pinyin: "tā", imageId: null });
  expect(session.questions[0].reveal).toBeUndefined();
  expect((await (await api.get("/api/v1/review/sessions/active")).json()).data.id).toBe(session.id);

  // Người khác không làm/xem được bài của mình.
  expect((await (await other.get("/api/v1/review/sessions/active")).json()).data).toBeNull();
  expect(
    (
      await other.post(`/api/v1/review/sessions/${session.id}/answer`, { data: { index: 0, answer: "anh ấy" } })
    ).status(),
  ).toBe(404);
  expect((await other.post(`/api/v1/review/sessions/${session.id}/complete`)).status()).toBe(404);

  // Chưa làm hết → không nộp được.
  expect((await api.post(`/api/v1/review/sessions/${session.id}/complete`)).status()).toBe(400);
  const answered = (
    await (
      await api.post(`/api/v1/review/sessions/${session.id}/answer`, { data: { index: 0, answer: "anh ấy" } })
    ).json()
  ).data;
  expect(answered.questions[0]).toMatchObject({ isCorrect: true, reveal: { meaningVi: "anh ấy", rating: 3 } });
  const rated = await api.post(`/api/v1/review/sessions/${session.id}/rate`, { data: { index: 0, rating: 4 } });
  expect((await rated.json()).data.questions[0].reveal.rating).toBe(4);
  expect(
    (await (await api.post(`/api/v1/review/sessions/${session.id}/move`, { data: { index: 9 } })).json()).data,
  ).toEqual({
    index: 0,
  });
  const done = await api.post(`/api/v1/review/sessions/${session.id}/complete`);
  expect(done.status()).toBe(200);
  expect((await done.json()).data).toMatchObject({ status: "completed", correctCount: 1, wrongVocabIds: [] });
  expect((await (await api.get("/api/v1/review/sessions/active")).json()).data).toBeNull();
  expect((await (await api.get("/api/v1/review/due-count")).json()).data.count).toBe(0);
  expect((await api.post("/api/v1/review/sessions", { data: { kind: "due", mode: "meaning" } })).status()).toBe(409);

  // Ôn tự chọn rồi bỏ bài.
  const custom = await api.post("/api/v1/review/sessions", { data: { kind: "custom", count: 5, mode: "hanzi" } });
  expect(custom.status()).toBe(201);
  expect((await api.delete("/api/v1/review/sessions/active")).status()).toBe(200);
  expect((await (await api.get("/api/v1/review/last-config")).json()).data).toMatchObject({ mode: "hanzi" });

  // Xoá: của mình → 200, lần hai → 404.
  expect((await api.delete(`/api/v1/vocab/${id}`)).status()).toBe(200);
  expect((await api.delete(`/api/v1/vocab/${id}`)).status()).toBe(404);

  // Thông báo lỗi theo ngôn ngữ của người dùng.
  await api.put("/api/v1/me/locale", { data: { locale: "en" } });
  const en = await (await api.post("/api/v1/vocab", { data: { hanzi: "", pinyin: "a", meaningVi: "b" } })).json();
  expect(en.fieldErrors.hanzi).toBe("Please enter the Chinese characters.");
  await stranger.close();
});
