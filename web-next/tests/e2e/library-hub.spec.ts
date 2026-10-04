import { expect, test } from "@playwright/test";
import { resetRateLimit } from "./db";
import { register } from "./helpers";

test.beforeEach(() => resetRateLimit());

const APPLE = encodeURIComponent("苹果");

test("Thư viện LingYu: trang chủ → Từ vựng → bộ Trái cây → đánh dấu đã học, yêu thích → chi tiết từ → luyện tập → lưu bộ", async ({
  page,
}, info) => {
  test.skip(info.project.name === "android", "Luồng dài — chạy trên iPhone + máy tính");
  test.setTimeout(120_000);
  await register(page, "Người Học Thư Viện", "libhub");

  await page.goto("/library");
  await expect(page.getByRole("heading", { level: 1, name: "Thư viện LingYu" })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Thư viện", exact: true })
    .getByRole("link", { name: /^Từ vựng/ })
    .click();
  await expect(page).toHaveURL(/\/library\/vocabulary$/);
  await expect(page.getByRole("heading", { level: 1, name: "Từ vựng" })).toBeVisible();

  // Tìm theo pinyin không dấu → chỉ còn bộ Trái cây.
  await page.getByPlaceholder(/Tìm kiếm bộ từ vựng/).fill("trai cay");
  await expect(page).toHaveURL(/q=trai/);
  const all = page.getByRole("region", { name: /Tất cả bộ từ vựng/ });
  await expect(all.getByRole("heading", { name: /\(1 bộ\)/ })).toBeVisible();
  await all.getByRole("link", { name: /2\. Trái cây/ }).click();

  await expect(page).toHaveURL(/\/library\/vocabulary\/trai-cay$/);
  await expect(page.getByRole("heading", { level: 1, name: /Trái cây/ })).toBeVisible();
  await page.getByRole("checkbox", { name: "Đánh dấu “苹果” đã học" }).check();
  await expect(page.getByText("Bạn đã học 1/15 từ trong bộ này.")).toBeVisible();
  await page.getByRole("button", { name: "Yêu thích “香蕉”" }).click();
  await expect(page.getByRole("button", { name: "Bỏ yêu thích “香蕉”" })).toBeVisible();

  // Chi tiết từ.
  await page.getByRole("link", { name: "苹果", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/library/vocabulary/trai-cay/${APPLE}$`));
  await expect(page.getByRole("heading", { level: 1, name: "苹果" })).toBeVisible();
  await expect(page.getByText("píng – Thanh 2 (đi lên)")).toBeVisible();
  await expect(page.getByRole("button", { name: "Đã học" })).toBeVisible();
  await page.getByRole("link", { name: /Từ tiếp/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "香蕉" })).toBeVisible();

  // Luyện tập: trả lời đúng câu đầu → từ đó được đánh dấu đã học.
  await page.goto("/library/vocabulary/trai-cay?tab=practice");
  await page.getByRole("button", { name: /Ghép từ với hình ảnh/ }).click();
  await expect(page.getByText(/Câu 1 \/ 10/)).toBeVisible();
  const answer = await page.locator("p.sr-only").first().textContent();
  await page
    .getByRole("button", { name: new RegExp(`^[A-D]`) })
    .first()
    .waitFor();
  const res = await page.request.get("/api/v1/library/sets/trai-cay");
  const words = (await res.json()).data.words as { zh: string; meaning: string }[];
  const zh = words.find((w) => w.meaning === answer)!.zh;
  await page.getByRole("button", { name: new RegExp(zh) }).click();
  await expect(page.getByRole("status").filter({ hasText: "Chính xác!" })).toBeVisible();
  await page.getByRole("tab", { name: /Danh sách từ vựng/ }).click();
  await expect(page.getByRole("checkbox", { name: `Bỏ đánh dấu đã học “${zh}”` })).toBeChecked();

  // Lưu cả bộ vào Từ vựng của tôi.
  await page.getByRole("button", { name: "Lưu bộ từ vựng" }).click();
  await expect(page.getByText(/^Đã lưu 15 từ vào Từ vựng của tôi/)).toBeVisible();
  const mine = (await (await page.request.get("/api/v1/vocab?tag=Trái cây")).json()).data;
  expect(mine.total).toBe(15);

  // Từ vựng HSK.
  await page.goto("/library/vocabulary/hsk");
  await expect(page.getByRole("heading", { level: 1, name: "Từ vựng HSK 1" })).toBeVisible();
  await page.getByRole("button", { name: "HSK 2" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Từ vựng HSK 2" })).toBeVisible();
});

test("API Thư viện (bộ từ vựng): 401 khi chưa đăng nhập; 404 bộ / từ không có; tiến độ không lộ sang người khác", async ({
  page,
  browser,
}, info) => {
  test.skip(info.project.name !== "desktop", "API chỉ cần chạy một lần");
  const anon = await browser.newContext();
  for (const url of [
    "/api/v1/library/home",
    "/api/v1/library/sets",
    "/api/v1/library/sets/trai-cay",
    "/api/v1/library/hsk/1",
  ])
    expect((await anon.request.get(url)).status(), url).toBe(401);
  expect((await anon.request.put(`/api/v1/library/sets/trai-cay/words/${APPLE}/learned`)).status()).toBe(401);
  await anon.close();

  await register(page, "Chủ Tiến Độ", "libhub-a");
  const api = page.request;
  expect((await api.get("/api/v1/library/sets/khong-co")).status()).toBe(404);
  expect((await api.get(`/api/v1/library/sets/trai-cay/words/${encodeURIComponent("咖啡")}`)).status()).toBe(404);
  expect((await api.put(`/api/v1/library/hsk/1/words/${encodeURIComponent("科技")}/learned`)).status()).toBe(404);
  const r = await api.put(`/api/v1/library/sets/trai-cay/words/${APPLE}/learned`);
  expect((await r.json()).data).toMatchObject({ learned: true, progress: { learned: 1 } });
  expect((await api.put("/api/v1/library/sets/trai-cay/favorite")).status()).toBe(200);
  const w = (await (await api.get(`/api/v1/library/sets/trai-cay/words/${APPLE}`)).json()).data;
  expect(w.word).toMatchObject({ zh: "苹果", learned: true });
  expect(w.next).toBe("香蕉");
  const list = (await (await api.get("/api/v1/library/sets?kind=favorite")).json()).data;
  expect(list.items.map((s: { id: string }) => s.id)).toEqual(["trai-cay"]);

  const other = await browser.newContext();
  const op = await other.newPage();
  await register(op, "Người Khác", "libhub-b");
  const s = (await (await op.request.get("/api/v1/library/sets/trai-cay")).json()).data;
  expect(s).toMatchObject({ learned: 0, favorite: false });
  expect(s.words.some((x: { learned: boolean }) => x.learned)).toBe(false);
  await other.close();
});
