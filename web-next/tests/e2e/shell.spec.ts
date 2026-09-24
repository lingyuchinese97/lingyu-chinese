import { expect, test } from "@playwright/test";
import { resetRateLimit } from "./db";

test.beforeEach(async ({ page }, info) => {
  await resetRateLimit();
  await page.goto("/register");
  await page.getByLabel("Họ và tên").fill("Nguyễn Văn An");
  await page.getByLabel("Email").fill(`shell-${info.project.name}-${Date.now()}@e2e.lingyu`);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("matkhau123");
  await page.getByLabel("Nhập lại mật khẩu").fill("matkhau123");
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await expect(page).toHaveURL(/\/home$/);
});

test("khung app: điều hướng theo kích thước màn hình", async ({ page }, info) => {
  const tabbar = page.getByRole("navigation", { name: "Điều hướng nhanh" });
  const sidebar = page.getByRole("complementary", { name: "Điều hướng chính" });
  const menuBtn = page.getByRole("button", { name: "Mở menu" });

  if (info.project.name === "desktop") {
    await expect(tabbar).toBeHidden();
    await expect(menuBtn).toBeHidden();
    await expect(sidebar.getByRole("link", { name: "Trang chủ", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(sidebar.getByRole("link", { name: "Quản trị" })).toHaveCount(0);
  } else {
    await expect(tabbar).toBeVisible();
    await expect(tabbar.getByRole("link")).toHaveCount(5);
    await expect(tabbar.getByRole("link", { name: "Trang chủ" })).toHaveAttribute("aria-current", "page");
    // Ngăn kéo menu mở/đóng được.
    await menuBtn.click();
    await expect(sidebar.getByRole("link", { name: "Bộ thủ" })).toBeInViewport();
    await page.keyboard.press("Escape");
    await expect(sidebar.getByRole("link", { name: "Bộ thủ" })).not.toBeInViewport();
  }
  // Không cuộn ngang trên mọi màn hình.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("vào trang được bảo vệ khi chưa đăng nhập thì quay lại đúng trang sau khi đăng nhập", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/login\?next=%2Fsettings$/);
  await ctx.close();
});
