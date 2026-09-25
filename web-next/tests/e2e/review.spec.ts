import { expect, test, type Page } from "@playwright/test";
import { SAMPLE_VOCABULARY } from "../../src/data/sample-vocab";
import { resetRateLimit } from "./db";
import { register } from "./helpers";

test.beforeEach(() => resetRateLimit());

const byHanzi = new Map(SAMPLE_VOCABULARY.map((w) => [w.hanzi, w]));
const byMeaning = new Map(SAMPLE_VOCABULARY.map((w) => [w.meaningVi, w]));

async function withSample(page: Page) {
  await register(page, "Người Ôn", "rv");
  await page.goto("/vocabulary");
  await page.getByRole("button", { name: "Dùng dữ liệu mẫu" }).click();
  await expect(page.getByText("24 từ vựng", { exact: true })).toBeVisible();
}

/** Đọc đề bài đang hiện, trả về đáp án đúng. */
async function correctAnswer(page: Page, mode: "meaning" | "hanzi") {
  const prompt = page.locator("section[aria-labelledby=qs-title]");
  if (mode === "meaning") {
    const hz = (await prompt.locator(".hanzi").first().textContent())!.trim();
    return byHanzi.get(hz)!.meaningVi.split(",")[0]!;
  }
  const vi = (await prompt.locator("div.text-2xl, div.md\\:text-\\[28px\\]").first().textContent())!.trim();
  return byMeaning.get(vi)!.hanzi;
}

test("ôn tự chọn: thiết lập → làm bài (đúng/sai, chấm ở server) → kết quả", async ({ page }) => {
  await withSample(page);
  await page.goto("/review/setup");
  await page.getByRole("button", { name: "Du lịch", exact: true }).click();
  await expect(page.getByText("hiện có 2 từ phù hợp")).toBeVisible();
  await page.getByRole("radio", { name: "Nhập nghĩa tiếng Việt" }).click();
  await page.getByRole("button", { name: "Bắt đầu ôn tập" }).click();
  await expect(page).toHaveURL(/\/review\/session$/);
  // Màn tập trung: không có tab bar.
  await expect(page.getByRole("navigation", { name: "Điều hướng nhanh" })).toHaveCount(0);

  await page.getByLabel(/Nhập nghĩa tiếng Việt của từ này/).fill(await correctAnswer(page, "meaning"));
  await page.keyboard.press("Enter");
  await expect(page.getByText("Chính xác!")).toBeVisible();
  await page.getByRole("button", { name: "Câu tiếp" }).click();

  await page.getByLabel(/Nhập nghĩa tiếng Việt của từ này/).fill("không biết");
  await page.getByRole("button", { name: "Kiểm tra đáp án" }).click();
  await expect(page.getByText("Chưa đúng!")).toBeVisible();

  // Refresh giữa chừng vẫn giữ tiến độ.
  await page.reload();
  await expect(page.getByText("Chưa đúng!")).toBeVisible();
  await page.getByRole("button", { name: "Xem kết quả" }).click();

  await expect(page).toHaveURL(/\/review\/result$/);
  await expect(page.getByRole("heading", { name: "Hoàn thành bài ôn tập!" })).toBeVisible();
  await expect(page.getByText("50%")).toBeVisible();
  await expect(page.getByText("Xem lại 1 từ bạn trả lời sai")).toBeVisible();
  await page.getByRole("button", { name: /Ôn lại các từ đã sai/ }).click();
  await expect(page).toHaveURL(/\/review\/session$/);
  await expect(page.getByText("Câu 1").first()).toBeVisible();
});

test("ôn đến hạn (FSRS): đúng → chọn Dễ; trang chủ hiện số thẻ đến hạn", async ({ page }) => {
  await withSample(page);
  await page.goto("/home");
  await expect(page.getByRole("link", { name: "Ôn ngay (24)" })).toBeVisible();
  await page.getByRole("link", { name: "Ôn ngay (24)" }).click();
  await expect(page).toHaveURL(/\/review\/due$/);
  await page.getByRole("radio", { name: "Nhập tiếng Trung" }).click();
  await page.getByRole("button", { name: /Ôn ngay 24 thẻ/ }).click();
  await expect(page).toHaveURL(/\/review\/session$/);
  await expect(page.getByRole("heading", { name: "Ôn thẻ đến hạn" })).toBeVisible();

  await page.getByLabel(/Nhập chữ Hán/).fill(await correctAnswer(page, "hanzi"));
  await page.keyboard.press("Enter");
  await expect(page.getByText("Chính xác!")).toBeVisible();
  await expect(page.getByRole("radio", { name: "Được" })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("radio", { name: "Dễ" }).click();
  await expect(page.getByRole("radio", { name: "Dễ" })).toHaveAttribute("aria-checked", "true");

  await page.getByRole("button", { name: "Kết thúc bài" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Kết thúc" }).click();
  await expect(page).toHaveURL(/\/review\/setup$/);
  await expect(page.getByText("Ôn thẻ đến hạn hôm nay: 23")).toBeVisible();
});

test("ôn các từ đã chọn từ danh sách từ vựng", async ({ page, isMobile }) => {
  await withSample(page);
  const scope = isMobile ? page.locator("ul[aria-label^='Danh sách từ vựng']") : page.locator("table");
  await scope.getByRole("checkbox", { name: "Chọn 你", exact: true }).check();
  await scope.getByRole("checkbox", { name: "Chọn 好", exact: true }).check();
  await page.getByRole("toolbar").getByRole("button", { name: "Ôn tập" }).click();
  await expect(page).toHaveURL(/\/review\/session$/);
  await expect(page.getByText("/ 2").first()).toBeVisible();
});
