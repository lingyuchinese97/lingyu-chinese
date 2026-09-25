import { expect, test, type Page } from "@playwright/test";
import { resetRateLimit } from "./db";
import { register } from "./helpers";

test.beforeEach(() => resetRateLimit());

const list = (page: Page, isMobile: boolean) =>
  isMobile ? page.locator("ul[aria-label='Danh sách câu']") : page.locator("table");

test("ôn dịch câu: thêm câu (tạo pinyin), dữ liệu mẫu, tìm kiếm, sửa, xoá", async ({ page, isMobile }) => {
  await register(page, "Người Học", "sn");
  await page.goto("/sentences");
  await expect(page.getByRole("heading", { level: 1, name: "Ôn dịch câu" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Chưa có câu nào" })).toBeVisible();

  await page.getByRole("link", { name: "Thêm câu" }).first().click();
  await expect(page).toHaveURL(/\/sentences\/new$/);
  await page.getByRole("button", { name: "Lưu câu" }).last().click();
  await expect(page.getByText("Vui lòng nhập câu tiếng Trung.")).toBeVisible();
  await page.getByLabel("Câu tiếng Trung").fill("我爱学习中文。");
  await page.getByRole("button", { name: "Tạo Pinyin" }).click();
  await expect(page.getByLabel("Pinyin")).toHaveValue("Wǒ ài xué xí zhōng wén.");
  await page.getByLabel("Câu tiếng Việt").fill("Tôi thích học tiếng Trung.");
  await page.getByLabel("Tag").fill("Sở thích");
  await page.getByLabel("Tag").press("Enter");
  await page.getByRole("button", { name: "Quy tắc Pinyin" }).click();
  await expect(page.getByRole("dialog", { name: "Quy tắc viết Pinyin" })).toBeVisible();
  await page.getByRole("button", { name: "Đã hiểu" }).click();
  await page.getByRole("button", { name: "Lưu câu" }).last().click();
  await expect(page.getByText("Đã thêm câu mới.")).toBeVisible();
  await expect(page).toHaveURL(/\/sentences$/);
  await expect(list(page, isMobile).getByText("我爱学习中文。")).toBeVisible();

  // Sửa.
  await page.getByRole("button", { name: "Thao tác khác cho 我爱学习中文。" }).locator("visible=true").click();
  await page.getByRole("menuitem", { name: "Sửa câu" }).click();
  await page.getByLabel("Câu tiếng Việt").fill("Tôi yêu học tiếng Trung.");
  await page.getByRole("button", { name: "Lưu câu" }).last().click();
  await expect(list(page, isMobile).getByText("Tôi yêu học tiếng Trung.")).toBeVisible();

  // Xoá.
  await page.getByRole("button", { name: "Thao tác khác cho 我爱学习中文。" }).locator("visible=true").click();
  await page.getByRole("menuitem", { name: "Xóa câu" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Xóa" }).click();
  await expect(page.getByText("Đã xóa 1 câu.")).toBeVisible();

  await page.getByRole("button", { name: "Dùng dữ liệu mẫu" }).click();
  await expect(page.getByText("12 câu", { exact: true })).toBeVisible();
  await page.getByPlaceholder(/Tìm kiếm câu/).fill("hoc tieng trung");
  await expect(page.getByText("1 câu", { exact: true })).toBeVisible();
  await page.getByPlaceholder(/Tìm kiếm câu/).fill("");
  await page
    .getByRole("group", { name: "Lọc theo tag" })
    .getByRole("button", { name: /^Gia đình/ })
    .click();
  await expect(page.getByText("2 câu", { exact: true })).toBeVisible();
});

test("ôn dịch câu: Việt → Trung, gợi ý, đúng / sai / bỏ qua, tính là đúng, kết quả, ôn lại câu sai", async ({
  page,
}) => {
  await register(page, "Người Học", "sr");
  await page.goto("/sentences");
  await page.getByRole("button", { name: "Dùng dữ liệu mẫu" }).click();
  await expect(page.getByText("12 câu", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Bắt đầu ôn" }).click();
  await expect(page.getByRole("heading", { name: "Bắt đầu ôn dịch câu" })).toBeVisible();
  await page.getByRole("radio", { name: /Việt → Trung/ }).click();
  await page.getByRole("radio", { name: "5", exact: true }).click();
  await page.getByLabel("Chọn tag").selectOption("Gia đình");
  await expect(page.getByText("Sẽ ôn 2 câu.")).toBeVisible();
  await page.getByRole("button", { name: "Bắt đầu ôn tập" }).click();
  await expect(page).toHaveURL(/\/sentences\/review\/session$/);
  await expect(page.getByRole("heading", { name: /\(1\/2\)/ })).toBeVisible();

  const answers: Record<string, string> = {
    "Đây là nhà của tôi.": "这是我的家",
    "Bố tôi là giáo viên.": "我爸爸是老师！",
  };
  // Câu 1: xem gợi ý rồi trả lời sai → "tính là đúng" → "Tôi chưa nhớ".
  const p1 = (await page.locator("p[lang='vi']").first().textContent())!.trim();
  await page.getByRole("button", { name: "Xem gợi ý" }).click();
  await expect(page.getByText("Gợi ý: bắt đầu bằng chữ")).toBeVisible();
  await page.getByLabel("Câu tiếng Trung của bạn").fill("错的");
  await page.getByRole("button", { name: "Kiểm tra" }).click();
  await expect(page.getByText("Chưa chính xác")).toBeVisible();
  await expect(page.getByText("Bạn đã trả lời: 错的")).toBeVisible();
  await page.getByRole("button", { name: /tính là đúng/ }).click();
  await expect(page.getByText("Đã tính là đúng")).toBeVisible();
  await page.getByRole("button", { name: "Câu tiếp theo" }).click();

  // Câu 2: trả lời đúng (có dấu câu khác) → "Tôi nhớ".
  await expect(page.getByRole("heading", { name: /\(2\/2\)/ })).toBeVisible();
  const p2 = (await page.locator("p[lang='vi']").first().textContent())!.trim();
  expect(Object.keys(answers)).toContain(p1);
  await page.getByLabel("Câu tiếng Trung của bạn").fill(answers[p2]!);
  await page.getByLabel("Câu tiếng Trung của bạn").press("Enter");
  await expect(page.getByText("Chính xác! 🎉")).toBeVisible();
  await page.getByRole("button", { name: "Tôi nhớ" }).click();
  await expect(page.getByRole("button", { name: "Đã nhớ" })).toBeVisible();
  await page.getByRole("button", { name: "Xem kết quả" }).click();

  await expect(page).toHaveURL(/\/sentences\/review\/result$/);
  await expect(page.getByRole("img", { name: "Đúng 2/2" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Ôn lại câu sai/ })).toBeDisabled();

  // Bài mới Trung → Việt, bỏ qua 1 câu → Ôn lại câu sai.
  await page.goto("/sentences/review/setup");
  await page.getByRole("radio", { name: /Trung → Việt/ }).click();
  await page.getByLabel("Chọn tag").selectOption("Du lịch");
  await page.getByRole("switch", { name: /Hiển thị Pinyin/ }).click();
  await page.getByRole("button", { name: "Bắt đầu ôn tập" }).click();
  await expect(page.getByText("Jīchǎng zài nǎr?")).toBeVisible();
  await page.getByRole("button", { name: "Bỏ qua" }).click();
  await expect(page.getByText("Đã bỏ qua")).toBeVisible();
  await expect(page.getByText("Sân bay ở đâu?")).toBeVisible();
  await page.getByRole("button", { name: "Xem kết quả" }).click();
  await expect(page.getByRole("img", { name: "Đúng 0/1" })).toBeVisible();
  await page.getByRole("button", { name: /Ôn lại câu sai \(1\)/ }).click();
  await expect(page).toHaveURL(/\/sentences\/review\/session$/);
  await page.getByLabel("Câu tiếng Việt của bạn").fill("san bay o dau");
  await page.getByRole("button", { name: "Kiểm tra" }).click();
  await expect(page.getByText("Chính xác! 🎉")).toBeVisible();
});
