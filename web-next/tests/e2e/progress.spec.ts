import { expect, test } from "@playwright/test";
import { resetRateLimit } from "./db";
import { register } from "./helpers";

test.beforeEach(() => resetRateLimit());

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dữ liệu JSON trả về từ API
const data = async (r: { json: () => Promise<any> }) => (await r.json()).data;

test("Trang chủ mới → Tìm kiếm → Tiến độ học tập (mục tiêu, biểu đồ, lịch sử, HSK)", async ({ page }, info) => {
  test.setTimeout(120_000);
  await register(page, "Nguyễn Văn An", "prog");
  const api = page.request;

  // Trang chủ: lời chào, 5 chức năng, học tập hôm nay.
  await expect(page.getByRole("heading", { level: 1, name: "Xin chào, Văn An!" })).toBeVisible();
  for (const name of ["Từ vựng", "Ngữ pháp", "Luyện dịch", "Đọc hiểu", "Ôn tập"])
    await expect(page.getByRole("link", { name: `Mở ${name}` })).toBeVisible();
  await expect(page.getByText("Chưa có hoạt động nào. Bắt đầu học để thấy ở đây nhé!")).toBeVisible();

  // Có hoạt động → hiện ở Trang chủ và số liệu hôm nay.
  await api.post("/api/v1/vocab", { data: { hanzi: "你好", pinyin: "nǐ hǎo", meaningVi: "xin chào" } });
  const l = await data(await api.get("/api/v1/lessons/bai1"));
  const sec = l.sections[1];
  await api.post(`/api/v1/lessons/bai1/sections/${sec.id}`, {
    data: { answers: sec.questions.map((q: { answer: number }) => q.answer) },
  });
  await page.reload();
  const recent = page.getByRole("region", { name: "Bài học gần đây" });
  await expect(recent.getByText(/Bài học · \d+\/\d+ đúng/)).toBeVisible();
  await expect(recent.getByText("Thêm 1 từ mới")).toBeVisible();
  await expect(page.getByRole("region", { name: "Học tập hôm nay" }).getByText("Từ vựng đã học")).toBeVisible();

  // Tìm kiếm chung.
  if (info.project.name === "desktop") {
    await page.getByRole("searchbox", { name: "Tìm kiếm" }).first().fill("xin chao");
    await page.keyboard.press("Enter");
  } else {
    await page.getByRole("link", { name: "Tìm kiếm" }).click();
    await page.getByRole("searchbox", { name: "Tìm kiếm" }).fill("xin chao");
    await page.getByRole("button", { name: "Tìm kiếm" }).click();
  }
  await expect(page).toHaveURL(/\/search\?q=xin/);
  await expect(page.getByRole("region", { name: "Từ vựng" }).getByText("你好")).toBeVisible();

  // Tiến độ học tập.
  await page.goto("/progress");
  await expect(page.getByRole("heading", { level: 1, name: "Tiến độ học tập" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Chuỗi ngày học liên tiếp" }).getByText("1 ngày")).toBeVisible();
  await page.getByRole("button", { name: "30 ngày" }).click();
  await expect(page.getByRole("button", { name: "30 ngày" })).toHaveAttribute("aria-pressed", "true");
  const goals = page.getByRole("region", { name: "Mục tiêu học tập" });
  await goals.getByRole("button", { name: "Chỉnh sửa" }).click();
  const dlg = page.getByRole("dialog", { name: "Chỉnh mục tiêu học tập" });
  await dlg.getByLabel("Số phút học mỗi ngày").fill("45");
  await dlg.getByRole("button", { name: "Lưu mục tiêu" }).click();
  await expect(goals.getByText("Học 45 phút mỗi ngày")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("region", { name: "Mục tiêu học tập" }).getByText("Học 45 phút mỗi ngày")).toBeVisible();

  // Từ vựng theo HSK: 你好 là từ HSK 1 trong kho.
  const tabs = page.getByRole("navigation", { name: "Mục tiến độ" });
  await tabs.getByRole("link", { name: "Từ vựng" }).click();
  await expect(page).toHaveURL(/\/progress\/vocab$/);
  await expect(page.getByText("1 từ trong kho").first()).toBeVisible();

  // Lịch sử: lọc theo loại.
  await tabs.getByRole("link", { name: "Lịch sử học tập" }).click();
  await expect(page.getByText(/Bài học · \d+\/\d+ đúng/)).toBeVisible();
  await page.getByLabel("Loại hoạt động").selectOption("reading");
  await expect(page).toHaveURL(/kind=reading/);
  await expect(page.getByText("Chưa có hoạt động nào trong khoảng thời gian này.")).toBeVisible();
});

test("API tiến độ + tìm kiếm: 401, ping, mục tiêu, hoạt động, dữ liệu riêng từng người", async ({
  page,
  browser,
}, info) => {
  test.skip(info.project.name !== "desktop", "API chỉ cần chạy một lần");
  const anon = await browser.newContext();
  for (const [m, u] of [
    ["get", "/api/v1/progress"],
    ["get", "/api/v1/progress/daily"],
    ["get", "/api/v1/progress/history"],
    ["get", "/api/v1/progress/vocab"],
    ["get", "/api/v1/progress/grammar"],
    ["get", "/api/v1/progress/goals"],
    ["post", "/api/v1/progress/ping"],
    ["post", "/api/v1/progress/activity"],
    ["get", "/api/v1/search?q=a"],
  ] as const)
    expect((await anon.request[m](u, m === "post" ? { data: {} } : undefined)).status(), u).toBe(401);
  await anon.close();

  await register(page, "Người Theo Dõi", "prog-api");
  const api = page.request;
  expect(await data(await api.post("/api/v1/progress/ping"))).toMatchObject({ seconds: 0 });
  expect((await data(await api.get("/api/v1/progress/daily?days=30"))).length).toBe(30);
  expect((await api.put("/api/v1/progress/goals", { data: { minutes_day: 1 } })).status()).toBe(400);
  expect(await data(await api.put("/api/v1/progress/goals", { data: { vocab_month: 80 } }))).toMatchObject({
    vocab_month: 80,
  });
  expect(
    (await api.post("/api/v1/progress/activity", { data: { kind: "reading", correct: 1, total: 1 } })).status(),
  ).toBe(400);
  expect(
    (await api.post("/api/v1/progress/activity", { data: { kind: "pronunciation", correct: 5, total: 3 } })).status(),
  ).toBe(400);
  expect(
    (
      await api.post("/api/v1/progress/activity", {
        data: { kind: "pronunciation", title: "Luyện", correct: 7, total: 10 },
      })
    ).status(),
  ).toBe(201);
  const hist = await data(await api.get("/api/v1/progress/history?kind=pronunciation"));
  expect(hist).toHaveLength(1);
  expect(hist[0]).toMatchObject({ kind: "pronunciation", correct: 7, total: 10 });
  const sum = await data(await api.get("/api/v1/progress"));
  expect(sum.goals.vocab_month.target).toBe(80);
  expect(sum.skills.review).toBe(0);
  expect((await data(await api.get("/api/v1/progress/vocab"))).hsk).toHaveLength(7);
  await api.post("/api/v1/vocab", { data: { hanzi: "秘密", pinyin: "mìmì", meaningVi: "bí mật của tôi" } });
  expect((await data(await api.get("/api/v1/search?q=bi mat"))).vocab.map((v: { hanzi: string }) => v.hanzi)).toEqual([
    "秘密",
  ]);

  // Người khác không thấy hoạt động / từ của tôi.
  const other = await browser.newContext();
  await register(await other.newPage(), "Người Lạ", "prog-s");
  expect(await data(await other.request.get("/api/v1/progress/history?days=365"))).toEqual([]);
  expect((await data(await other.request.get("/api/v1/search?q=bi mat"))).total).toBe(0);
  expect((await data(await other.request.get("/api/v1/progress/goals"))).vocab_month).toBe(50);
  await other.close();
});
