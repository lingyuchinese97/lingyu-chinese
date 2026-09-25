import { expect, test } from "@playwright/test";
import { resetRateLimit, sql } from "./db";
import { register } from "./helpers";

test.beforeEach(() => resetRateLimit());

test("quản trị: chỉ admin vào được; tìm người dùng, đặt lại mật khẩu (mật khẩu tạm dùng được), khoá / mở khoá", async ({
  browser,
}) => {
  const desktop = { viewport: { width: 1280, height: 800 } };
  const u = await (await browser.newContext(desktop)).newPage();
  const userEmail = await register(u, "Học Viên", "adu");
  // Người thường không vào được /admin.
  await u.goto("/admin");
  await expect(u).toHaveURL(/\/home$/);

  const a = await (await browser.newContext(desktop)).newPage();
  const adminEmail = await register(a, "Quản Trị", "ada");
  await sql(`update "user" set role = 'admin' where email = $1`, [adminEmail]);
  await a.goto("/admin");
  await expect(a.getByRole("heading", { level: 1, name: "Quản trị" })).toBeVisible();
  await a.getByPlaceholder("Tìm theo email hoặc tên...").fill(userEmail);
  await expect(a.getByText("1 người dùng")).toBeVisible();
  const row = a.getByRole("row", { name: new RegExp(userEmail) });
  await expect(row.getByText("Hoạt động")).toBeVisible();

  // Đặt lại mật khẩu → hiện mật khẩu tạm một lần.
  await row.getByRole("button", { name: `Đặt lại mật khẩu cho ${userEmail}` }).click();
  await a.getByRole("dialog").getByRole("button", { name: "Đặt lại" }).click();
  const temp = (await a.getByRole("dialog").locator("code").textContent())!.trim();
  expect(temp).toMatch(/^[A-Za-z2-9]{12}$/);
  await a.getByRole("button", { name: "Đã lưu, đóng" }).click();

  // Phiên cũ của người dùng bị đăng xuất; đăng nhập bằng mật khẩu tạm được.
  await u.goto("/home");
  await expect(u).toHaveURL(/\/login/);
  await u.getByLabel("Email").fill(userEmail);
  await u.getByLabel("Mật khẩu", { exact: true }).fill(temp);
  await u.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(u).toHaveURL(/\/home$/);

  // Khoá → bị đăng xuất, không đăng nhập được; mở khoá → đăng nhập lại được.
  await row.getByRole("button", { name: `Khoá ${userEmail}` }).click();
  await a.getByRole("dialog").getByRole("button", { name: "Khoá" }).click();
  await expect(row.getByText("Đã khoá")).toBeVisible();
  await u.goto("/home");
  await expect(u).toHaveURL(/\/login/);
  await u.getByLabel("Email").fill(userEmail);
  await u.getByLabel("Mật khẩu", { exact: true }).fill(temp);
  await u.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(u.getByText(/Tài khoản đã bị khoá/)).toBeVisible();

  await row.getByRole("button", { name: `Mở khoá ${userEmail}` }).click();
  await a.getByRole("dialog").getByRole("button", { name: "Mở khoá" }).click();
  await expect(row.getByText("Hoạt động")).toBeVisible();
  await u.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(u).toHaveURL(/\/home$/);

  // Admin không tự khoá / đặt lại mật khẩu cho chính mình.
  await a.getByPlaceholder("Tìm theo email hoặc tên...").fill(adminEmail);
  await expect(a.getByRole("row", { name: new RegExp(adminEmail) }).getByText("Tài khoản của bạn")).toBeVisible();
});
