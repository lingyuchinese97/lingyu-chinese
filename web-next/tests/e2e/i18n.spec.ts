import { expect, test } from "@playwright/test";
import { register } from "./helpers";

test("đổi ngôn ngữ: đăng nhập (cookie) → trong app (lưu tài khoản) → đăng nhập lại vẫn giữ; API /api/v1/me/locale", async ({
  page,
}) => {
  // Chưa đăng nhập: đổi ở trang đăng nhập, lỗi kiểm tra form cũng theo ngôn ngữ.
  await page.goto("/login");
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Please enter your email.")).toBeVisible();
  await page.getByRole("button", { name: "Tiếng Việt" }).click();
  await expect(page.getByRole("heading", { name: "Đăng nhập" })).toBeVisible();

  // Trong app: đổi qua menu tài khoản → menu, trang chủ, thông báo từ server đều tiếng Anh.
  const email = await register(page, "Người Học", "i18n");
  await page.getByRole("button", { name: /Tài khoản/ }).click();
  await page.getByRole("menuitemradio", { name: "English" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /Welcome back/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Vocabulary" }).first()).toBeVisible();

  await page.goto("/vocabulary/new");
  await page.getByRole("button", { name: "Save word" }).click();
  await expect(page.getByText("Please enter the Chinese characters.")).toBeVisible();

  // Lựa chọn được lưu vào tài khoản: xoá cookie, đăng nhập lại vẫn là tiếng Anh.
  await page.context().clearCookies();
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Đăng nhập" })).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("matkhau123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole("heading", { level: 1, name: /Welcome back/ })).toBeVisible();

  // Đổi lại tiếng Việt trong Cài đặt.
  await page.goto("/settings");
  await page.getByRole("group", { name: "Change language" }).getByRole("button", { name: "Tiếng Việt" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /Cài đặt/ })).toBeVisible();

  // API (cho app khác): cần đăng nhập, kiểm tra dữ liệu, lưu ngôn ngữ vào tài khoản.
  const anon = await page.context().browser()!.newContext();
  expect((await anon.request.get("/api/v1/me/locale")).status()).toBe(401);
  expect((await anon.request.put("/api/v1/me/locale", { data: { locale: "en" } })).status()).toBe(401);
  await anon.close();
  const api = page.request;
  expect((await (await api.get("/api/v1/me/locale")).json()).data.locale).toBe("vi");
  expect((await api.put("/api/v1/me/locale", { data: { locale: "fr" } })).status()).toBe(400);
  const ok = await api.put("/api/v1/me/locale", { data: { locale: "en" } });
  expect(ok.status()).toBe(200);
  expect((await ok.json()).data.locale).toBe("en");
  await page.goto("/home");
  await expect(page.getByRole("heading", { level: 1, name: /Welcome back/ })).toBeVisible();
});
