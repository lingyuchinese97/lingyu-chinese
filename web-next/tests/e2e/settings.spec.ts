import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { resetRateLimit } from "./db";
import { register } from "./helpers";

test.beforeEach(() => resetRateLimit());

test("cài đặt: đổi tên, đổi mật khẩu, xuất / nhập dữ liệu, xoá tài khoản", async ({ page }) => {
  const email = await register(page, "Người Học", "st");
  await page.goto("/vocabulary");
  await page.getByRole("button", { name: "Dùng dữ liệu mẫu" }).click();
  await expect(page.getByText("24 từ vựng", { exact: true })).toBeVisible();

  await page.goto("/settings");
  await expect(page.getByRole("heading", { level: 1, name: "Cài đặt" })).toBeVisible();
  await page.getByLabel("Họ và tên").fill("Tên Mới");
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page.getByText("Đã lưu tên hiển thị.")).toBeVisible();
  await expect(page.getByRole("region", { name: "Tài khoản" }).getByText("Tên Mới", { exact: true })).toBeVisible();

  // Đổi mật khẩu: sai mật khẩu hiện tại → báo lỗi.
  await page.getByLabel("Mật khẩu hiện tại").fill("sai-mat-khau");
  await page.getByLabel("Mật khẩu mới", { exact: true }).fill("matkhaumoi1");
  await page.getByLabel("Nhập lại mật khẩu mới").fill("matkhaumoi1");
  await page.getByRole("button", { name: "Đổi mật khẩu" }).click();
  await expect(page.getByText("Mật khẩu hiện tại không đúng.")).toBeVisible();
  await page.getByLabel("Mật khẩu hiện tại").fill("matkhau123");
  await page.getByRole("button", { name: "Đổi mật khẩu" }).click();
  await expect(page.getByText(/Đã đổi mật khẩu/)).toBeVisible();

  // Xuất dữ liệu.
  const dl = page.waitForEvent("download");
  await page.getByRole("link", { name: "Xuất dữ liệu" }).click();
  const file = await (await dl).path();
  const data = JSON.parse(readFileSync(file, "utf8"));
  expect(data.format).toBe("lingyu-export");
  expect(data.vocab).toHaveLength(24);

  // Nhập lại chính file đó: mọi từ đã có → bỏ qua.
  await page.locator("#import-file").setInputFiles(file);
  await expect(page.getByRole("status").filter({ hasText: "Đã nhập xong" })).toContainText(
    "Từ vựng: thêm 0, bỏ qua 24",
  );

  // Đăng xuất rồi đăng nhập bằng mật khẩu mới.
  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("matkhaumoi1");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/home$/);

  // Xoá tài khoản (cần mật khẩu) → không đăng nhập lại được.
  await page.goto("/settings");
  await page.getByRole("button", { name: "Xóa tài khoản" }).click();
  const dlg = page.getByRole("dialog", { name: "Xóa tài khoản?" });
  await dlg.getByLabel("Mật khẩu", { exact: true }).fill("sai");
  await dlg.getByRole("button", { name: "Xóa vĩnh viễn" }).click();
  await expect(dlg.getByText("Mật khẩu không đúng.")).toBeVisible();
  await dlg.getByLabel("Mật khẩu", { exact: true }).fill("matkhaumoi1");
  await dlg.getByRole("button", { name: "Xóa vĩnh viễn" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/home");
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("matkhaumoi1");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByText("Email hoặc mật khẩu không đúng")).toBeVisible();
});

test("xuất / nhập dữ liệu yêu cầu đăng nhập và chặn gửi từ trang khác", async ({ request }) => {
  expect((await request.get("/api/account/export")).status()).toBe(401);
  const r = await request.post("/api/account/import", {
    headers: { origin: "https://evil.example" },
    multipart: { file: { name: "x.json", mimeType: "application/json", buffer: Buffer.from("{}") } },
  });
  expect(r.status()).toBe(403);
});

test("nhập file CSV tải từ bản LingYu cũ", async ({ page }) => {
  await register(page, "Người Học", "csv");
  await page.goto("/settings");
  const csv =
    '﻿"Hán tự","Pinyin","Nghĩa tiếng Việt","Ghi chú","Tag"\r\n"你好","nǐ hǎo","xin chào","","HSK1, Giao tiếp"\r\n"谢谢","xièxie","cảm ơn","",""';
  await page
    .locator("#import-file")
    .setInputFiles({ name: "lingyu-tu-vung.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
  await expect(page.getByRole("status").filter({ hasText: "Đã nhập xong" })).toContainText("Từ vựng: thêm 2, bỏ qua 0");
  await page.goto("/vocabulary?tag=Giao%20ti%E1%BA%BFp");
  await expect(page.getByText("1 từ vựng", { exact: true })).toBeVisible();
});
