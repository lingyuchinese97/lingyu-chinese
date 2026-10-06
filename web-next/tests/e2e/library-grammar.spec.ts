import { expect, test } from "@playwright/test";
import { resetRateLimit } from "./db";
import { register } from "./helpers";

test.beforeEach(() => resetRateLimit());

test("Thư viện LingYu: Ngữ pháp → HSK 2 → 是 … 的 → bài tập nhanh → đã học → lưu vào Ngữ pháp của tôi", async ({
  page,
}, info) => {
  test.skip(info.project.name === "android", "Luồng dài — chạy trên iPhone + máy tính");
  test.setTimeout(120_000);
  await register(page, "Người Học Ngữ Pháp", "libgram");

  await page.goto("/library");
  await page
    .getByRole("navigation", { name: "Thư viện", exact: true })
    .getByRole("link", { name: /^Ngữ pháp/ })
    .click();
  await expect(page).toHaveURL(/\/library\/grammar$/);
  await expect(page.getByRole("heading", { level: 1, name: "Ngữ pháp" })).toBeVisible();

  await page.getByRole("navigation", { name: "Cấp HSK" }).getByRole("button", { name: "HSK 2" }).click();
  await expect(page).toHaveURL(/hsk=2/);
  const all = page.getByRole("region", { name: /Tất cả bài ngữ pháp/ });
  await expect(all.getByRole("heading", { name: /6 bài/ })).toBeVisible();
  await all.getByRole("link", { name: /是 … 的/ }).click();

  await expect(page).toHaveURL(/\/library\/grammar\/shi-de$/);
  await expect(page.getByRole("heading", { level: 1, name: /是 … 的/ })).toBeVisible();
  await expect(page.getByRole("region", { name: "Cấu trúc" })).toContainText("的");
  await expect(page.getByText("我是坐地铁去的。")).toBeVisible();

  // Bài tập nhanh: một câu đúng, một câu sai.
  const quiz = page.getByRole("region", { name: "Bài tập nhanh" });
  await quiz.getByRole("radio", { name: "去的", exact: true }).check();
  await quiz.getByRole("radio", { name: "我是坐飞机来了。" }).check();
  await quiz.getByRole("button", { name: "Kiểm tra" }).click();
  await expect(quiz.getByText("Bạn làm đúng 1/2 câu.")).toBeVisible();
  await expect(quiz.getByText(/Chưa đúng\. Đáp án: 我是坐飞机来的。/)).toBeVisible();

  await page.getByRole("button", { name: "Đánh dấu đã học" }).click();
  await expect(page.getByText("Đã học 1/6 bài")).toBeVisible();
  await page.getByRole("button", { name: "Yêu thích" }).click();
  await expect(page.getByRole("button", { name: "Đã yêu thích" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Lưu vào Ngữ pháp của tôi" }).click();
  await expect(page.getByText("Đã lưu vào Ngữ pháp của tôi.")).toBeVisible();
  // Đã lưu → nút thành lối tắt sửa / thêm tag bản sao trong Ngữ pháp của tôi.
  await expect(page.getByRole("link", { name: "Đã lưu · Sửa / thêm tag" })).toHaveAttribute(
    "href",
    /^\/grammar\/[0-9a-f-]{36}\/edit$/,
  );

  // Danh sách: lọc Đã học chỉ còn bài này; bài nằm trong Ngữ pháp của tôi.
  await page.goto("/library/grammar?status=learned");
  await expect(
    page.getByRole("region", { name: /Tất cả bài ngữ pháp/ }).getByRole("heading", { name: /1 bài/ }),
  ).toBeVisible();
  const mine = (await (await page.request.get("/api/v1/grammar")).json()).data;
  expect(JSON.stringify(mine)).toContain("是 … 的 – (chính) là … (mà)");
});

test("API Thư viện (ngữ pháp): 401 khi chưa đăng nhập; 404 bài không có; đã học / yêu thích / đã lưu không lộ sang người khác", async ({
  page,
  browser,
}, info) => {
  test.skip(info.project.name !== "desktop", "API chỉ cần chạy một lần");
  const anon = await browser.newContext();
  for (const url of ["/api/v1/library/grammar", "/api/v1/library/grammar/shi-de"])
    expect((await anon.request.get(url)).status(), url).toBe(401);
  expect((await anon.request.put("/api/v1/library/grammar/shi-de/learned")).status()).toBe(401);
  expect((await anon.request.post("/api/v1/library/grammar/shi-de/save")).status()).toBe(401);
  await anon.close();

  await register(page, "Chủ Ngữ Pháp", "libgram-a");
  const api = page.request;
  expect((await api.get("/api/v1/library/grammar/khong-co")).status()).toBe(404);
  expect((await api.put("/api/v1/library/grammar/khong-co/learned")).status()).toBe(404);
  expect((await api.post("/api/v1/library/grammar/khong-co/save")).status()).toBe(404);
  const r = await api.put("/api/v1/library/grammar/bi/learned");
  expect((await r.json()).data).toMatchObject({ learned: true, progress: { learned: 1 } });
  expect((await api.put("/api/v1/library/grammar/bi/favorite")).status()).toBe(200);
  const saved = (await (await api.post("/api/v1/library/grammar/bi/save")).json()).data;
  expect(saved.added).toBe(true);
  expect((await (await api.post("/api/v1/library/grammar/bi/save")).json()).data).toEqual({
    added: false,
    id: saved.id,
  });
  expect((await (await api.get("/api/v1/library/grammar/bi")).json()).data.savedId).toBe(saved.id);
  const list = (await (await api.get("/api/v1/library/grammar?status=favorite")).json()).data;
  expect(list.items.map((g: { id: string }) => g.id)).toEqual(["bi"]);

  const other = await browser.newContext();
  const op = await other.newPage();
  await register(op, "Người Khác", "libgram-b");
  const g = (await (await op.request.get("/api/v1/library/grammar/bi")).json()).data;
  expect(g).toMatchObject({ learned: false, favorite: false, saved: false, progress: { learned: 0 } });
  expect((await (await op.request.get("/api/v1/grammar")).json()).data.total).toBe(0);
  await other.close();
});
