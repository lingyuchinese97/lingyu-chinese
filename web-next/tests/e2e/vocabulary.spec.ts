import { expect, test, type Page } from "@playwright/test";
import { resetRateLimit } from "./db";
import { register, seedSample } from "./helpers";

test.beforeEach(() => resetRateLimit());

/** Vùng hiển thị theo kích thước: bảng (desktop) hoặc thẻ (điện thoại). */
const results = (page: Page, isMobile: boolean) =>
  isMobile ? page.locator("ul[aria-label^='Danh sách từ vựng']") : page.locator("table");

test("dữ liệu mẫu, tìm kiếm bỏ dấu, lọc tag, phân trang", async ({ page, isMobile }) => {
  await register(page, "Người Học", "vl");
  await page.goto("/vocabulary");
  await expect(page.getByRole("heading", { name: "Chưa có từ vựng nào" })).toBeVisible();
  await seedSample(page, "vocab");
  await expect(page.getByText("24 từ vựng", { exact: true })).toBeVisible();
  // Từ mới chưa từng ôn → "Chưa ôn".
  await expect(results(page, isMobile).getByText("Chưa ôn").first()).toBeVisible();

  await page.getByPlaceholder(/Tìm kiếm từ vựng/).fill("nihao");
  await expect(page).toHaveURL(/q=nihao/);
  await expect(page.getByText("1 từ vựng", { exact: true })).toBeVisible();
  await expect(results(page, isMobile).getByText("你好", { exact: true })).toBeVisible();
  // Nút con mắt: xem chi tiết (ô 米字格, nghĩa, cách viết).
  await results(page, isMobile).getByRole("button", { name: "Xem chi tiết 你好" }).click();
  const detail = page.getByRole("dialog", { name: "Chi tiết: 你好" });
  await expect(detail.getByText("xin chào")).toBeVisible();
  await expect(detail.getByRole("heading", { name: "Cách viết (thứ tự nét)" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(detail).toBeHidden();

  await page.getByPlaceholder(/Tìm kiếm từ vựng/).fill("");
  // Lọc tag: nút "Tag" mở danh sách tag.
  await page.getByRole("button", { name: "Lọc theo tag" }).click();
  await page.getByRole("menuitem", { name: /^Du lịch/ }).click();
  await expect(page.getByText("2 từ vựng", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Lọc theo tag" }).click();
  await page.getByRole("menuitem", { name: "Tất cả tag" }).click();
  await page.getByRole("navigation", { name: "Phân trang" }).getByRole("button", { name: "Trang 3" }).click();
  await expect(page).toHaveURL(/page=3/);
});

test("tag: tạo, đổi tên, xoá tag (giữ từ) từ nút Tag; lọc HSK / trạng thái; hiển thị x–y", async ({ page }) => {
  await register(page, "Người Học", "vtag");
  await page.goto("/vocabulary");
  await seedSample(page, "vocab");
  await expect(page.getByRole("heading", { name: "Từ vựng của tôi (24)" })).toBeVisible();
  await expect(page.getByText("Hiển thị 1–8 trong")).toBeVisible();
  const tagBtn = page.getByRole("button", { name: "Lọc theo tag" });
  // Menu mở khoá cuộn trang → đưa nút lên gần đỉnh màn hình trước khi mở (điện thoại: bìa cao).
  const openTags = async () => {
    await tagBtn.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 90));
    await tagBtn.click();
  };

  await openTags();
  await page.getByRole("menuitem", { name: "Tạo tag mới" }).click();
  await page.getByRole("dialog").getByLabel("Tên tag").fill("Ôn thi");
  await page.getByRole("dialog").getByRole("button", { name: "Tạo tag" }).click();
  await expect(page.getByText("Đã tạo tag “Ôn thi”.")).toBeVisible();
  await openTags();
  await expect(page.getByRole("menuitem", { name: /^Ôn thi\s*0$/ })).toBeVisible();
  await page.getByRole("menuitem", { name: /^Du lịch/ }).click();
  await expect(page.getByText("2 từ vựng", { exact: true })).toBeVisible();

  await openTags();
  await page.getByRole("menuitem", { name: "Đổi tên tag “Du lịch”" }).click();
  await page.getByRole("dialog").getByLabel("Tên tag").fill("Đi chơi");
  await page.getByRole("dialog").getByRole("button", { name: "Lưu" }).click();
  await expect(page.getByText("Đã đổi tên tag thành “Đi chơi”.")).toBeVisible();
  await expect(page).toHaveURL(/tag=%C4%90i/);
  await expect(page.getByText("2 từ vựng", { exact: true })).toBeVisible();

  await openTags();
  await page.getByRole("menuitem", { name: "Xóa tag “Đi chơi”" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Xóa" }).click();
  await expect(page.getByText("Đã xóa tag “Đi chơi”.")).toBeVisible();
  await expect(page.getByText("24 từ vựng", { exact: true })).toBeVisible();
  await openTags();
  await expect(page.getByRole("menuitem", { name: /^Đi chơi/ })).toHaveCount(0);
  await page.keyboard.press("Escape");

  // Lọc HSK / trạng thái bằng nút dạng viên thuốc.
  await page.getByRole("button", { name: "Lọc theo cấp HSK" }).click();
  await page.getByRole("menuitem", { name: /^HSK 1/ }).click();
  await expect(page).toHaveURL(/hsk=1/);
  await page.getByRole("button", { name: "Lọc theo trạng thái" }).click();
  await page.getByRole("menuitem", { name: "Đã thuộc" }).click();
  await expect(page).toHaveURL(/status=learned/);
});

test("thêm từ (pinyin tự thêm dấu, không còn phần ảnh), sửa, xoá", async ({ page, isMobile }) => {
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
  // Chức năng ảnh đã bỏ: form không còn ô tải ảnh.
  await expect(page.locator("input[type=file]")).toHaveCount(0);
  await expect(page.getByText("Hình ảnh")).toHaveCount(0);
  await page.getByRole("button", { name: "Lưu từ vựng" }).click();

  await expect(page).toHaveURL(/\/vocabulary$/);
  await expect(page.getByText("Đã thêm “海水” vào danh sách.")).toBeVisible();
  const list = results(page, isMobile);
  await expect(list.getByText("海水", { exact: true })).toBeVisible();
  await expect(list.locator("img[src^='/api/images/']")).toHaveCount(0);

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

test("người khác không xem được từ vựng của mình; API ảnh cũ vẫn chặn người lạ", async ({ browser }) => {
  // Chủ dùng màn desktop (bảng có link "Sửa") — context mới kế thừa viewport của project nên phải ghi rõ.
  const a = await (
    await browser.newContext({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false })
  ).newPage();
  await register(a, "Chủ", "va");
  await a.goto("/vocabulary/new");
  await a.getByLabel("Hán tự").fill("秘密");
  await a.getByLabel("Pinyin").fill("mìmì");
  await a.getByLabel("Nghĩa tiếng Việt").fill("bí mật");
  await a.getByRole("button", { name: "Lưu từ vựng" }).click();
  await expect(a).toHaveURL(/\/vocabulary$/);
  await expect(a.getByText("Đã thêm “秘密” vào danh sách.")).toBeVisible();
  // Sửa nằm trong hộp chi tiết (nút con mắt) và menu "…" của dòng.
  await a.getByRole("button", { name: "Xem chi tiết 秘密" }).click();
  const editLink = a.getByRole("dialog").getByRole("link", { name: "Sửa 秘密" });
  await expect(editLink).toBeVisible();
  const editHref = await editLink.getAttribute("href");
  // Ảnh cũ (tạo trước khi bỏ chức năng) vẫn được bảo vệ: id bất kỳ → người khác 404, chưa đăng nhập 401.
  const img = "/api/images/00000000-0000-4000-8000-000000000000";
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
