import { expect, test } from "@playwright/test";
import { resetRateLimit } from "./db";

test.beforeEach(() => resetRateLimit());

const uniqueEmail = (tag: string) => `e2e-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@e2e.lingyu`;

test("chưa đăng nhập vào /home bị chuyển tới /login", async ({ page }) => {
  await page.goto("/home");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Đăng nhập" })).toBeVisible();
});

test("đăng ký → vào app → đăng xuất → đăng nhập lại", async ({ page }, info) => {
  const email = uniqueEmail(info.project.name);
  await page.goto("/register");
  await page.getByLabel("Họ và tên").fill("Học viên E2E");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("matkhau123");
  await page.getByLabel("Nhập lại mật khẩu").fill("matkhau123");
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole("heading", { name: /Xin chào, Học viên E2E/ })).toBeVisible();

  // Đã đăng nhập thì /login chuyển thẳng về /home.
  await page.goto("/login");
  await expect(page).toHaveURL(/\/home$/);

  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("sai-mat-khau");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Email hoặc mật khẩu không đúng" })).toBeVisible();

  await page.getByLabel("Mật khẩu", { exact: true }).fill("matkhau123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/home$/);
});

test("form đăng ký báo lỗi khi mật khẩu xác nhận không khớp", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Họ và tên").fill("A");
  await page.getByLabel("Email").fill(uniqueEmail("x"));
  await page.getByLabel("Mật khẩu", { exact: true }).fill("matkhau123");
  await page.getByLabel("Nhập lại mật khẩu").fill("matkhau999");
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await expect(page.getByText("Mật khẩu xác nhận không khớp.")).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
});

test("Quên mật khẩu hiện hướng dẫn liên hệ quản trị viên", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Quên mật khẩu?" }).click();
  await expect(page.getByText("Liên hệ quản trị viên để đặt lại mật khẩu")).toBeVisible();
});

test("đăng nhập sai quá 5 lần/phút bị chặn (rate limit lưu trong DB)", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(uniqueEmail("rl"));
  await page.getByLabel("Mật khẩu", { exact: true }).fill("sai-mat-khau");
  const submit = page.getByRole("button", { name: "Đăng nhập" });
  for (let i = 0; i < 5; i++) {
    await submit.click();
    await expect(page.getByRole("alert").filter({ hasText: "Email hoặc mật khẩu không đúng" })).toBeVisible();
  }
  await submit.click();
  await expect(page.getByRole("alert").filter({ hasText: "Bạn thử quá nhiều lần" })).toBeVisible();
});
