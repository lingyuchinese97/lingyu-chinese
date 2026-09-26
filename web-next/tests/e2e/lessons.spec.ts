import { expect, test, type Page } from "@playwright/test";
import { resetRateLimit } from "./db";
import { register } from "./helpers";

test.beforeEach(() => resetRateLimit());

/** Làm hết một phần, luôn chọn đáp án A. */
async function answerAll(page: Page, n: number) {
  for (let i = 1; i <= n; i++) {
    await expect(page.getByText(`Câu ${i} / ${n}`)).toBeVisible();
    const next = page.getByRole("button", { name: /Câu tiếp theo|Tiếp tục|Xem kết quả/ });
    await expect(next).toBeDisabled();
    await page.getByRole("radio").first().click();
    await expect(page.getByRole("status").filter({ hasText: /Chính xác|Chưa đúng/ })).toBeVisible();
    // Đã khoá: bấm đáp án khác không đổi được.
    await page.getByRole("radio").nth(1).click({ force: true });
    await expect(page.getByRole("radio").first()).toHaveAttribute("aria-checked", "true");
    await next.click();
  }
}

test("bài học: làm Bài 1 (nghe → ghép âm) → kết quả → lưu tiến độ, trang chủ hiện tiến độ", async ({ page }) => {
  test.setTimeout(120_000);
  await register(page, "Người Học", "ls");
  await expect(page.getByText("Hoàn thành 0/2 phần bài học")).toBeVisible();
  await page.goto("/lessons");
  await page.getByRole("link", { name: /Nghe ghép âm/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Nghe ghép âm" })).toBeVisible();
  await page.getByRole("link", { name: "Bắt đầu ôn tập" }).click();
  await expect(page).toHaveURL(/\/lessons\/bai1\/listening$/);

  // Phần 1 chưa có audio → nút nghe bị vô hiệu kèm ghi chú.
  await expect(page.getByRole("button", { name: "Chưa có audio cho câu này" })).toBeDisabled();
  await expect(page.getByText(/Câu này chưa có audio/)).toBeVisible();
  // Làm dở, tải lại trang vẫn giữ.
  await page.getByRole("radio").first().click();
  await page.getByRole("button", { name: "Câu tiếp theo" }).click();
  await expect(page.getByText("Câu 2 / 16")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Câu 2 / 16")).toBeVisible();
  await page.goto("/lessons/bai1/listening");
  // Bắt đầu lại từ đầu phần để đếm đơn giản: xoá bài dở.
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await answerAll(page, 16);

  await expect(page).toHaveURL(/\/lessons\/bai1\/blending$/);
  await expect(page.getByText("b + a")).toBeVisible();
  await expect(page.getByRole("button", { name: "Nghe âm thanh" })).toBeEnabled();
  expect((await page.request.get("/audio/bai1/blending/q01.mp3")).status()).toBe(200);
  await answerAll(page, 20);

  await expect(page).toHaveURL(/\/lessons\/bai1\/result$/);
  await expect(page.getByRole("heading", { name: "Chúc mừng bạn!" })).toBeVisible();
  await expect(page.getByText("Bạn đã hoàn thành Bài 1")).toBeVisible();
  // Luôn chọn A: Phần 1 đúng 2 câu (câu 1, 5), Phần 2 đúng 8 câu.
  await expect(page.getByText("2 / 16", { exact: true })).toBeVisible();
  await expect(page.getByText("8 / 20", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Bài 2 sắp ra mắt" })).toBeDisabled();

  await page.goto("/home");
  await expect(page.getByText("Hoàn thành 2/2 phần bài học")).toBeVisible();
  await page.goto("/lessons/bai1");
  await expect(page.getByText("Cao nhất 8/20")).toBeVisible();
  expect((await page.goto("/lessons/bai9"))?.status()).toBe(404);
});
