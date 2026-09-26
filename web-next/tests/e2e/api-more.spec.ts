import { expect, test } from "@playwright/test";
import { resetRateLimit } from "./db";
import { register } from "./helpers";

/**
 * REST API Ngữ pháp, Ôn dịch câu, Bộ thủ, Bài học, Thông báo, Tài khoản, Trang chủ:
 * 401 khi chưa đăng nhập, dữ liệu người khác → 404, ghi chú cá nhân không lộ, server tự chấm điểm.
 */
test.beforeEach(() => resetRateLimit());

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dữ liệu JSON trả về từ API
const data = async (r: { json: () => Promise<any> }) => (await r.json()).data;

test("API: 401 khi chưa đăng nhập", async ({ browser }, info) => {
  test.skip(info.project.name !== "desktop", "API chỉ cần chạy một lần");
  const anon = await browser.newContext();
  for (const [method, url] of [
    ["get", "/api/v1/grammar"],
    ["post", "/api/v1/grammar"],
    ["get", "/api/v1/grammar/tags"],
    ["get", "/api/v1/grammar/shares/received"],
    ["get", "/api/v1/sentences"],
    ["post", "/api/v1/sentences/review/sessions"],
    ["get", "/api/v1/radicals"],
    ["get", "/api/v1/lessons"],
    ["post", "/api/v1/lessons/bai1/sections/blending"],
    ["get", "/api/v1/notifications"],
    ["get", "/api/v1/me"],
    ["post", "/api/v1/me/password"],
    ["get", "/api/v1/me/export"],
    ["get", "/api/v1/home"],
  ] as const)
    expect((await anon.request[method](url, method === "post" ? { data: {} } : undefined)).status(), url).toBe(401);
  await anon.close();
});

test("API ngữ pháp: thêm, sửa, ghi chú riêng, thẻ, chia sẻ → người nhận xem trước (không có ghi chú) → chấp nhận", async ({
  page,
  browser,
}, info) => {
  test.skip(info.project.name !== "desktop", "API chỉ cần chạy một lần");
  await register(page, "Chủ Ngữ Pháp", "apig");
  const api = page.request;
  const otherCtx = await browser.newContext();
  const otherPage = await otherCtx.newPage();
  const otherEmail = await register(otherPage, "Người Nhận", "apig-r");
  const other = otherCtx.request;

  // Kiểm tra dữ liệu.
  const bad = await api.post("/api/v1/grammar", { data: { title: "" } });
  expect(bad.status()).toBe(400);
  expect((await bad.json()).fieldErrors.title).toBe("Vui lòng nhập tiêu đề ngữ pháp.");

  const created = await api.post("/api/v1/grammar", {
    data: {
      title: "Câu hỏi với 吗",
      structure: "Câu trần thuật + 吗？\nPhủ định: 不 + động từ + 吗？",
      examples: [{ chinese: "你好吗？", pinyin: "Nǐ hǎo ma?", vietnamese: "Bạn khỏe không?" }],
      personalNote: "BÍ MẬT của chủ",
      tags: ["HSK1"],
    },
  });
  expect(created.status()).toBe(201);
  const g = (await created.json()).data;
  expect(g).toMatchObject({ title: "Câu hỏi với 吗", personalNote: "BÍ MẬT của chủ", tags: [{ name: "HSK1" }] });

  const list = await data(await api.get("/api/v1/grammar?q=cau hoi"));
  expect(list.items.map((x: { id: string }) => x.id)).toEqual([g.id]);
  expect((await data(await api.put(`/api/v1/grammar/${g.id}/bookmark`, { data: { saved: true } }))).saved).toBe(true);
  expect((await data(await api.get("/api/v1/grammar?view=saved"))).items).toHaveLength(1);
  expect(
    (await data(await api.put(`/api/v1/grammar/${g.id}/note`, { data: { content: "Ghi chú mới (riêng)" } })))
      .personalNote,
  ).toBe("Ghi chú mới (riêng)");

  // Thẻ: tạo, trùng → 409, đổi tên, xoá.
  const tag = await api.post("/api/v1/grammar/tags", { data: { name: "Câu hỏi" } });
  expect(tag.status()).toBe(201);
  expect((await api.post("/api/v1/grammar/tags", { data: { name: "câu hỏi" } })).status()).toBe(409);
  const tagId = (await tag.json()).data.id;
  expect((await api.put(`/api/v1/grammar/tags/${tagId}`, { data: { name: "Hỏi đáp" } })).status()).toBe(200);
  expect((await api.delete(`/api/v1/grammar/tags/${tagId}`)).status()).toBe(200);

  // Người khác (chưa được chia sẻ): không xem / sửa / xoá được → 404.
  for (const r of [
    await other.get(`/api/v1/grammar/${g.id}`),
    await other.put(`/api/v1/grammar/${g.id}`, { data: { title: "Hack" } }),
    await other.delete(`/api/v1/grammar/${g.id}`),
    await other.put(`/api/v1/grammar/${g.id}/note`, { data: { content: "x" } }),
    await other.get(`/api/v1/grammar/${g.id}/shares`),
    await other.get("/api/v1/grammar/not-a-uuid"),
  ])
    expect(r.status()).toBe(404);

  // Chia sẻ → người nhận thấy lời mời, xem trước KHÔNG có ghi chú cá nhân, chấp nhận → bản riêng.
  const share = await data(await api.post(`/api/v1/grammar/${g.id}/shares`, { data: { emails: [otherEmail] } }));
  expect(share.sent).toBe(1);
  expect(await data(await api.get(`/api/v1/grammar/${g.id}/shares`))).toHaveLength(1);
  const received = await data(await other.get("/api/v1/grammar/shares/received"));
  expect(received).toHaveLength(1);
  const preview = await other.get(`/api/v1/grammar/${g.id}?share=${received[0].id}`);
  expect(preview.status()).toBe(200);
  const pv = (await preview.json()).data;
  expect(pv.mode).toBe("preview");
  expect(pv.grammar.personalNote).toBe("");
  expect(JSON.stringify(pv)).not.toContain("Ghi chú mới (riêng)");
  expect(await data(await other.get(`/api/v1/grammar/shares/${received[0].id}/tags`))).toEqual(["HSK1"]);
  const accepted = await data(
    await other.post(`/api/v1/grammar/shares/${received[0].id}/accept`, { data: { keepTags: false } }),
  );
  expect(accepted.title).toBe("Câu hỏi với 吗");
  expect((await other.post(`/api/v1/grammar/shares/${received[0].id}/reject`)).status()).toBe(409);
  const copy = await data(await other.get(`/api/v1/grammar/${accepted.id}`));
  expect(copy).toMatchObject({ mode: "owner", grammar: { personalNote: "", tags: [] } });

  // Thông báo cho người gửi; đánh dấu đã đọc.
  const bell = await data(await api.get("/api/v1/notifications"));
  expect(bell.unread).toBeGreaterThan(0);
  expect(bell.items[0].type).toBe("grammar_share_accepted");
  expect((await data(await api.post("/api/v1/notifications/read", { data: {} }))).unread).toBe(0);

  expect((await api.delete(`/api/v1/grammar/${g.id}`)).status()).toBe(200);
  expect((await api.get(`/api/v1/grammar/${g.id}`)).status()).toBe(404);
  await otherCtx.close();
});

test("API ôn dịch câu: kho câu + bài ôn (tạo, trả lời, bỏ qua, nhớ, nộp); người khác → 404", async ({
  page,
  browser,
}, info) => {
  test.skip(info.project.name !== "desktop", "API chỉ cần chạy một lần");
  await register(page, "Người Ôn Câu", "apis");
  const api = page.request;

  // Chưa có câu → không tạo được bài ôn (409).
  expect(
    (await api.post("/api/v1/sentences/review/sessions", { data: { direction: "vi-zh", count: 5 } })).status(),
  ).toBe(409);
  const created = await api.post("/api/v1/sentences", {
    data: { chinese: "我爱你。", pinyin: "Wǒ ài nǐ.", vietnamese: "Tôi yêu bạn.", tags: ["Tình cảm"] },
  });
  expect(created.status()).toBe(201);
  const s = (await created.json()).data;
  await api.post("/api/v1/sentences", { data: { chinese: "谢谢。", vietnamese: "Cảm ơn." } });
  expect((await data(await api.get("/api/v1/sentences?q=yeu"))).items.map((x: { id: string }) => x.id)).toEqual([s.id]);
  expect((await data(await api.post(`/api/v1/sentences/${s.id}/favorite`))).isFavorite).toBe(true);
  expect((await data(await api.get("/api/v1/sentences?tag=__fav"))).total).toBe(1);
  expect(await data(await api.get("/api/v1/sentences/tags"))).toEqual([
    expect.objectContaining({ name: "Tình cảm", count: 1 }),
  ]);
  expect((await data(await api.get("/api/v1/sentences/review/pool?tags=Tình cảm"))).count).toBe(1);

  // Bài ôn 2 câu.
  const sess = await api.post("/api/v1/sentences/review/sessions", {
    data: { direction: "zh-vi", count: 2, showHint: false },
  });
  expect(sess.status()).toBe(201);
  const session = (await sess.json()).data;
  expect(session.total).toBe(2);
  const r0 = await data(
    await api.post(`/api/v1/sentences/review/sessions/${session.id}/answer`, {
      data: { index: 0, answer: "sai hoàn toàn" },
    }),
  );
  expect(r0.questions[0].result).toBe("wrong");
  expect(
    (await data(await api.post(`/api/v1/sentences/review/sessions/${session.id}/override`, { data: { index: 0 } })))
      .questions[0].result,
  ).toBe("correct");
  // Chưa làm hết → không nộp được.
  expect((await api.post(`/api/v1/sentences/review/sessions/${session.id}/complete`)).status()).toBe(400);
  await api.post(`/api/v1/sentences/review/sessions/${session.id}/skip`, { data: { index: 1 } });
  await api.post(`/api/v1/sentences/review/sessions/${session.id}/remember`, { data: { index: 0, remembered: true } });
  const result = await data(await api.post(`/api/v1/sentences/review/sessions/${session.id}/complete`));
  expect(result.wrongIds).toHaveLength(1);
  expect(await data(await api.get("/api/v1/sentences/review/sessions/active"))).toBeNull();
  expect(await data(await api.get("/api/v1/sentences/review/last-config"))).toMatchObject({ direction: "zh-vi" });

  // Người khác.
  const otherCtx = await browser.newContext();
  await register(await otherCtx.newPage(), "Người Lạ", "apis-s");
  const other = otherCtx.request;
  for (const r of [
    await other.get(`/api/v1/sentences/${s.id}`),
    await other.put(`/api/v1/sentences/${s.id}`, { data: { chinese: "黑", vietnamese: "hack" } }),
    await other.delete(`/api/v1/sentences/${s.id}`),
    await other.post(`/api/v1/sentences/${s.id}/favorite`),
    await other.post(`/api/v1/sentences/review/sessions/${session.id}/answer`, { data: { index: 0, answer: "x" } }),
  ])
    expect(r.status()).toBe(404);
  expect((await data(await other.post("/api/v1/sentences/delete", { data: { ids: [s.id] } }))).removed).toBe(0);
  await otherCtx.close();
  expect((await data(await api.get(`/api/v1/sentences/${s.id}`))).chinese).toBe("我爱你。");
});

test("API bộ thủ, bài học (server chấm), tài khoản, trang chủ", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "API chỉ cần chạy một lần");
  const email = await register(page, "Người Học", "apir");
  const api = page.request;

  // Bộ thủ.
  const rad = await data(await api.get("/api/v1/radicals?q=thủy"));
  expect(rad.items[0]).toMatchObject({ num: 85, char: "水", known: false });
  expect((await data(await api.put("/api/v1/radicals/85/known", { data: { known: true } }))).known).toBe(true);
  expect(await data(await api.get("/api/v1/radicals/85"))).toMatchObject({ num: 85, known: true });
  expect((await data(await api.get("/api/v1/radicals"))).knownCount).toBe(1);
  expect((await api.get("/api/v1/radicals/999")).status()).toBe(404);
  expect((await api.put("/api/v1/radicals/abc/known", { data: { known: true } })).status()).toBe(404);

  // Bài học: nội dung + nộp — server chấm theo đáp án thật.
  const lessons = await data(await api.get("/api/v1/lessons"));
  expect(lessons.lessons[0].id).toBe("bai1");
  const bai1 = await data(await api.get("/api/v1/lessons/bai1"));
  const sec = bai1.sections[1];
  const answers = sec.questions.map((q: { answer: number }) => q.answer);
  expect(await data(await api.post(`/api/v1/lessons/bai1/sections/${sec.id}`, { data: { answers } }))).toEqual({
    score: answers.length,
    total: answers.length,
  });
  const wrong = answers.map((a: number) => (a + 1) % 2);
  expect(
    (await data(await api.post(`/api/v1/lessons/bai1/sections/${sec.id}`, { data: { answers: wrong } }))).score,
  ).toBeLessThan(answers.length);
  expect((await api.post(`/api/v1/lessons/bai1/sections/${sec.id}`, { data: { answers: [0] } })).status()).toBe(400);
  expect((await api.post("/api/v1/lessons/khong-co/sections/x", { data: { answers: [] } })).status()).toBe(404);
  expect((await data(await api.get("/api/v1/lessons/bai1"))).progress[sec.id]).toMatchObject({
    bestScore: answers.length,
    attempts: 2,
  });

  // Trang chủ.
  const home = await data(await api.get("/api/v1/home"));
  expect(home).toMatchObject({ vocab: { total: 0 }, dueCount: 0, activeReview: null, unreadNotifications: 0 });
  expect(home.lessons.done).toBe(1);

  // Tài khoản: hồ sơ, đổi tên, đổi mật khẩu, xuất dữ liệu, xoá tài khoản.
  expect(await data(await api.get("/api/v1/me"))).toMatchObject({ name: "Người Học", email, role: "user" });
  expect((await api.put("/api/v1/me", { data: { name: "" } })).status()).toBe(400);
  expect((await data(await api.put("/api/v1/me", { data: { name: "Tên Mới" } }))).name).toBe("Tên Mới");
  const wrongPw = await api.post("/api/v1/me/password", { data: { current: "sai-mat-khau", password: "matkhau456" } });
  expect(wrongPw.status()).toBe(400);
  expect((await wrongPw.json()).fieldErrors).toMatchObject({ current: "Mật khẩu hiện tại không đúng." });
  expect(
    (await api.post("/api/v1/me/password", { data: { current: "matkhau123", password: "matkhau456" } })).status(),
  ).toBe(200);
  const exp = await data(await api.get("/api/v1/me/export"));
  expect(exp).toMatchObject({ format: "lingyu-export", radicalsKnown: [85], profile: { name: "Tên Mới" } });
  const imp = await data(await api.post("/api/v1/me/import", { data: exp }));
  expect(imp.lessons).toBe(1);
  expect((await api.post("/api/v1/me/import", { data: { hello: 1 } })).status()).toBe(400);
  expect((await api.delete("/api/v1/me", { data: { password: "matkhau123" } })).status()).toBe(400);
  expect((await api.delete("/api/v1/me", { data: { password: "matkhau456" } })).status()).toBe(200);
  expect((await api.get("/api/v1/me")).status()).toBe(401);
});
