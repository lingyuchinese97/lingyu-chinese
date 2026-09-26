import { expect, test } from "@playwright/test";
import { resetRateLimit } from "./db";
import { register } from "./helpers";

test.beforeEach(() => resetRateLimit());

test("tạo ngữ pháp (ví dụ, thẻ, ghi chú cá nhân), lưu, tìm kiếm, sửa, xoá", async ({ page }) => {
  await register(page, "Người Học", "gr");
  await page.goto("/grammar/new");
  await page.getByLabel(/Tiêu đề/).fill("Câu hỏi với 吗");
  await page.getByLabel("Ý nghĩa").fill("Tạo câu hỏi có/không");
  await page.getByLabel("Cấu trúc dòng 1", { exact: true }).fill("Chủ ngữ + động từ + 吗？");
  // Thêm 1–3 dòng cấu trúc (tối đa 4 dòng), xoá được.
  await page.getByRole("button", { name: /Thêm dòng cấu trúc/ }).click();
  await page.getByLabel("Cấu trúc dòng 2", { exact: true }).fill("Chủ ngữ + 不 + động từ + 吗？");
  await page.getByRole("button", { name: /Thêm dòng cấu trúc/ }).click();
  await page.getByRole("button", { name: /Thêm dòng cấu trúc/ }).click();
  await expect(page.getByRole("button", { name: /Thêm dòng cấu trúc/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Xoá cấu trúc dòng 4" }).click();
  await page.getByRole("button", { name: "Xoá cấu trúc dòng 3" }).click();
  await page.getByPlaceholder("你是学生吗？").fill("你好吗？");
  await page.getByPlaceholder("Ni3 shi4 xue2sheng5 ma5?").pressSequentially("ni3 hao3 ma5?");
  await expect(page.getByPlaceholder("Ni3 shi4 xue2sheng5 ma5?")).toHaveValue("nǐ hǎo ma?");
  await page.getByRole("button", { name: "Thêm ví dụ" }).click();
  await page.getByPlaceholder("你是学生吗？").nth(1).fill("你是学生吗？");
  await page.getByRole("button", { name: "Đưa ví dụ 2 lên" }).click();
  await page.getByLabel(/Ghi chú cá nhân/).fill("mẹo riêng của tôi");
  await page.getByLabel("Thẻ (Tags)").fill("HSK1");
  await page.getByLabel("Thẻ (Tags)").press("Enter");
  await page.getByRole("button", { name: "Lưu ngữ pháp" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Câu hỏi với 吗" })).toBeVisible();
  await expect(page.getByText("mẹo riêng của tôi")).toBeVisible();
  await expect(page.getByText("Chủ ngữ + 不 + động từ + 吗？")).toBeVisible();
  const ex = page.locator("ol li .hanzi");
  await expect(ex.first()).toHaveText("你是学生吗？");
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page.getByText("Đã lưu vào mục Đã lưu.")).toBeVisible();

  await page.goto("/grammar?view=saved");
  await expect(page.getByRole("link", { name: "Câu hỏi với 吗" })).toBeVisible();
  await page.goto("/grammar");
  await page.getByPlaceholder("Tìm kiếm ngữ pháp...").fill("cau hoi");
  await expect(page).toHaveURL(/q=cau/);
  await expect(
    page.getByRole("region", { name: "Danh sách ngữ pháp" }).getByText("1 ngữ pháp", { exact: true }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Câu hỏi với 吗" }).click();
  await page.getByRole("link", { name: "Chỉnh sửa" }).click();
  await page.getByLabel(/Tiêu đề/).fill("Câu hỏi với 吗 (đã sửa)");
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Câu hỏi với 吗 (đã sửa)" })).toBeVisible();
  await page.getByRole("button", { name: "Xóa" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Xóa" }).click();
  await expect(page).toHaveURL(/\/grammar$/);
  await expect(page.getByRole("heading", { name: "Chưa có ngữ pháp nào" })).toBeVisible();
});

test("chia sẻ ngữ pháp: người nhận xem trước (không thấy ghi chú cá nhân) → chấp nhận; người gửi được báo", async ({
  browser,
}) => {
  const b = await (await browser.newContext()).newPage();
  const emailB = await register(b, "Bạn Nhận", "gb");

  const a = await (await browser.newContext()).newPage();
  await register(a, "Người Gửi", "ga");
  await a.goto("/grammar");
  await a.getByRole("button", { name: "Dùng dữ liệu mẫu" }).click();
  await expect(a.getByText("Đã thêm 3 ngữ pháp mẫu.")).toBeVisible();
  await a.getByRole("link", { name: "Câu so sánh với 比" }).click();
  await a.getByRole("link", { name: "Chỉnh sửa" }).click();
  await a.getByLabel(/Ghi chú cá nhân/).fill("GHI CHÚ RIÊNG CỦA A");
  await a.getByRole("button", { name: "Lưu thay đổi" }).click();
  await a.getByRole("button", { name: "Chia sẻ", exact: true }).click();
  await a.getByLabel("Email người nhận").fill(`${emailB}, khongco@e2e.lingyu`);
  await a.getByRole("button", { name: "Gửi chia sẻ" }).click();
  await expect(a.getByText("— Đã gửi lời mời.")).toBeVisible();
  await expect(a.getByText("— Người dùng này chưa có tài khoản LingYu Chinese.")).toBeVisible();
  await a.getByRole("dialog").getByRole("button", { name: "Đóng" }).first().click();
  await expect(a.locator("#gd-sent").getByText("Đang chờ")).toBeVisible();

  await b.goto("/home");
  await expect(b.getByRole("button", { name: "Thông báo (1 chưa đọc)" })).toBeVisible();
  await b.getByRole("button", { name: "Thông báo (1 chưa đọc)" }).click();
  await expect(b.getByText("Người Gửi đã chia sẻ một ngữ pháp với bạn.")).toBeVisible();
  await b.getByRole("link", { name: "Xem" }).click();
  await expect(b.getByText("Người Gửi đã chia sẻ ngữ pháp này với bạn")).toBeVisible();
  await expect(b.getByRole("heading", { level: 1, name: "Câu so sánh với 比" })).toBeVisible();
  await expect(b.getByText("GHI CHÚ RIÊNG CỦA A")).toHaveCount(0);
  await expect(b.getByText("Ghi chú cá nhân")).toHaveCount(0);

  await b.getByRole("button", { name: "Chấp nhận" }).click();
  await b.getByLabel(/Thêm thẻ của tôi/).fill("Của tôi");
  await b.getByLabel(/Thêm thẻ của tôi/).press("Enter");
  await b.getByRole("dialog").getByRole("button", { name: "Chấp nhận" }).click();
  await expect(b.getByText("Đã thêm “Câu so sánh với 比” vào thư viện của bạn.")).toBeVisible();
  await expect(b.getByText(/Nhận từ Người Gửi/)).toBeVisible();
  await expect(b.getByText("Của tôi")).toBeVisible();
  await expect(b.getByText("GHI CHÚ RIÊNG CỦA A")).toHaveCount(0);

  await a.reload();
  await expect(a.locator("#gd-sent").getByText("Đã chấp nhận")).toBeVisible();
  await a.getByRole("button", { name: /Thông báo \(1 chưa đọc\)/ }).click();
  await expect(a.getByText("Bạn Nhận đã chấp nhận ngữ pháp bạn chia sẻ.")).toBeVisible();
});

test("người không được mời không xem được ngữ pháp của người khác", async ({ browser }) => {
  const a = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await register(a, "Chủ", "gx");
  await a.goto("/grammar");
  await a.getByRole("button", { name: "Dùng dữ liệu mẫu" }).click();
  await a.getByRole("link", { name: "Phủ định với 不" }).click();
  await expect(a).toHaveURL(/\/grammar\/[0-9a-f-]{36}$/);
  const url = a.url();

  const c = await (await browser.newContext()).newPage();
  await register(c, "Người lạ", "gy");
  await c.goto(url);
  await expect(c.getByRole("heading", { name: "Không có quyền xem" })).toBeVisible();
  const edit = await c.goto(`${url}/edit`);
  expect(edit?.status()).toBe(404);
});
