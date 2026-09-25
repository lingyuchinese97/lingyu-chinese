import { expect, test, type Page } from "@playwright/test";
import { resetRateLimit } from "./db";
import { PNG_2x2, register } from "./helpers";

test.beforeEach(() => resetRateLimit());

/** Vùng hiển thị theo kích thước: bảng (desktop) hoặc thẻ (điện thoại). */
const results = (page: Page, isMobile: boolean) =>
  isMobile ? page.locator("ul[aria-label^='Danh sách từ vựng']") : page.locator("table");

test("dữ liệu mẫu, tìm kiếm bỏ dấu, lọc tag, phân trang", async ({ page, isMobile }) => {
  await register(page, "Người Học", "vl");
  await page.goto("/vocabulary");
  await expect(page.getByRole("heading", { name: "Chưa có từ vựng nào" })).toBeVisible();
  await page.getByRole("button", { name: "Dùng dữ liệu mẫu" }).click();
  await expect(page.getByText("24 từ vựng", { exact: true })).toBeVisible();

  await page.getByPlaceholder(/Tìm kiếm từ vựng/).fill("nihao");
  await expect(page).toHaveURL(/q=nihao/);
  await expect(page.getByText("1 từ vựng", { exact: true })).toBeVisible();
  await expect(results(page, isMobile).getByText("你好", { exact: true })).toBeVisible();

  await page.getByPlaceholder(/Tìm kiếm từ vựng/).fill("");
  await page
    .getByRole("group", { name: "Lọc nhanh theo tag" })
    .getByRole("button", { name: /^Du lịch/ })
    .click();
  await expect(page.getByText("2 từ vựng", { exact: true })).toBeVisible();

  await page
    .getByRole("group", { name: "Lọc nhanh theo tag" })
    .getByRole("button", { name: /^Tất cả/ })
    .click();
  await page.getByRole("navigation", { name: "Phân trang" }).getByRole("button", { name: "Trang 3" }).click();
  await expect(page).toHaveURL(/page=3/);
});

test("thêm từ (pinyin tự thêm dấu, ảnh), sửa, xoá", async ({ page, isMobile }) => {
  await register(page, "Người Học", "vf");
  await page.goto("/vocabulary/new");
  // Màn tập trung: không có tab bar dưới đáy.
  await expect(page.getByRole("navigation", { name: "Điều hướng nhanh" })).toHaveCount(0);

  await page.getByLabel("Hán tự").fill("海水");
  await page.getByLabel("Pinyin").pressSequentially("hai3 shui3");
  await expect(page.getByLabel("Pinyin")).toHaveValue("hǎi shuǐ");
  await page.getByLabel("Nghĩa tiếng Việt").fill("nước biển");
  await page.locator("#radical-input").fill("nuoc");
  await page.getByRole("option", { name: /Thủy/ }).click();
  await page
    .locator("input[type=file]:not([capture])")
    .setInputFiles({ name: "a.png", mimeType: "image/png", buffer: PNG_2x2 });
  await expect(page.getByAltText("Ảnh minh họa cho từ vựng")).toBeVisible();
  await page.getByRole("button", { name: "Lưu từ vựng" }).click();

  await expect(page).toHaveURL(/\/vocabulary$/);
  await expect(page.getByText("Đã thêm “海水” vào danh sách.")).toBeVisible();
  const list = results(page, isMobile);
  await expect(list.getByText("海水", { exact: true })).toBeVisible();
  await expect(list.locator("img[src^='/api/images/']")).toHaveCount(1);

  // Sửa qua menu "…"
  await list.getByRole("button", { name: "Thao tác khác cho 海水" }).click();
  await page.getByRole("menuitem", { name: "Sửa từ vựng" }).click();
  await expect(page.getByLabel("Nghĩa tiếng Việt")).toHaveValue("nước biển");
  await page.getByLabel("Nghĩa tiếng Việt").fill("nước biển, biển cả");
  await page.getByRole("button", { name: "Lưu từ vựng" }).click();
  await expect(page.getByText("Đã cập nhật “海水”.")).toBeVisible();
  await expect(list.getByText("nước biển, biển cả")).toBeVisible();

  // Xoá (có hỏi xác nhận)
  await list.getByRole("button", { name: "Thao tác khác cho 海水" }).click();
  await page.getByRole("menuitem", { name: "Xóa từ vựng" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Xóa" }).click();
  await expect(page.getByText("Đã xóa 1 từ vựng.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Chưa có từ vựng nào" })).toBeVisible();
});

test("form báo lỗi khi thiếu trường bắt buộc", async ({ page }) => {
  await register(page, "Người Học", "ve");
  await page.goto("/vocabulary/new");
  await page.getByLabel("Hán tự").fill("abc");
  await page.getByRole("button", { name: "Lưu từ vựng" }).click();
  await expect(page.getByText("Hán tự phải chứa ít nhất một chữ Hán.")).toBeVisible();
  await expect(page.getByText("Vui lòng nhập pinyin.")).toBeVisible();
  await expect(page.getByText("Vui lòng nhập nghĩa tiếng Việt.")).toBeVisible();
  await expect(page).toHaveURL(/\/vocabulary\/new$/);
});

test("người khác không xem được từ vựng và ảnh của mình", async ({ browser }) => {
  // Chủ dùng màn desktop (bảng có link "Sửa") — context mới kế thừa viewport của project nên phải ghi rõ.
  const a = await (
    await browser.newContext({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false })
  ).newPage();
  await register(a, "Chủ", "va");
  await a.goto("/vocabulary/new");
  await a.getByLabel("Hán tự").fill("秘密");
  await a.getByLabel("Pinyin").fill("mìmì");
  await a.getByLabel("Nghĩa tiếng Việt").fill("bí mật");
  await a
    .locator("input[type=file]:not([capture])")
    .setInputFiles({ name: "a.png", mimeType: "image/png", buffer: PNG_2x2 });
  await expect(a.getByAltText("Ảnh minh họa cho từ vựng")).toBeVisible();
  await a.getByRole("button", { name: "Lưu từ vựng" }).click();
  await expect(a).toHaveURL(/\/vocabulary$/);
  await expect(a.getByText("Đã thêm “秘密” vào danh sách.")).toBeVisible();
  const editLink = a.getByRole("link", { name: "Sửa 秘密" });
  await expect(editLink).toBeVisible();
  const thumb = a.locator("table img[src^='/api/images/']");
  await expect(thumb).toHaveCount(1);
  const img = await thumb.getAttribute("src");
  const editHref = await editLink.getAttribute("href");
  expect(img).toBeTruthy();
  expect(editHref).toMatch(/\/vocabulary\/.+\/edit$/);

  const b = await (await browser.newContext()).newPage();
  await register(b, "Người lạ", "vb");
  await b.goto("/vocabulary?q=bi+mat");
  await expect(b.getByRole("heading", { name: "Chưa có từ vựng nào" })).toBeVisible();
  const edit = await b.goto(editHref!);
  expect(edit?.status()).toBe(404);
  const res = await b.request.get(img!);
  expect(res.status()).toBe(404);
  // Chưa đăng nhập cũng không lấy được ảnh.
  const anon = await (await browser.newContext()).request.get(new URL(img!, a.url()).toString());
  expect(anon.status()).toBe(401);
});
