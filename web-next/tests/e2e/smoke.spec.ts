import { expect, test } from "@playwright/test";

test("healthcheck + landing hiển thị nút Đăng nhập/Đăng ký", async ({ page, request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /LingYu Chinese/ })).toBeVisible();
  await page.getByRole("link", { name: "Đăng ký miễn phí" }).click();
  await expect(page).toHaveURL(/\/register$/);
});

test("trang không tồn tại hiện 404 tiếng Việt", async ({ page }) => {
  const res = await page.goto("/khong-co-trang-nay");
  expect(res?.status()).toBe(404);
  await expect(page.getByText(/không tìm thấy/i).first()).toBeVisible();
});
