import { expect, test } from "@playwright/test";
import { register } from "./helpers";
test("switch language", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Please enter your email.")).toBeVisible();
  await page.getByRole("button", { name: "Tiếng Việt" }).click();
  await expect(page.getByRole("heading", { name: "Đăng nhập" })).toBeVisible();
  await register(page, "Người Học", "i18n");
  await page.getByRole("button", { name: /Tài khoản/ }).click();
  await page.getByRole("menuitemradio", { name: "English" }).click();
  await expect(page.getByRole("link", { name: "Vocabulary" }).first()).toBeVisible();
  await page.screenshot({ path: "/tmp/claude-0/shots/i18n-home.png" });
});
