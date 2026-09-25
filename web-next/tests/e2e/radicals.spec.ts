import { expect, test } from "@playwright/test";
import { resetRateLimit } from "./db";
import { register } from "./helpers";

test.beforeEach(() => resetRateLimit());

test("bộ thủ: tìm kiếm, lọc số nét, đánh dấu đã thuộc, chi tiết có nét viết và từ vựng của mình", async ({ page }) => {
  await register(page, "Người Học", "rd");
  await page.goto("/vocabulary");
  await page.getByRole("button", { name: "Dùng dữ liệu mẫu" }).click();
  await expect(page.getByText("24 từ vựng", { exact: true })).toBeVisible();

  await page.goto("/radicals");
  await expect(page.getByRole("heading", { level: 1, name: "Bộ thủ" })).toBeVisible();
  await expect(page.getByText("214 bộ thủ", { exact: true })).toBeVisible();

  // Gõ 1 chữ Hán → ra bộ của chữ đó.
  await page.getByPlaceholder(/Tìm theo tên/).fill("河");
  await expect(page.getByText("thuộc bộ:")).toBeVisible();
  await expect(page.getByRole("link", { name: /^Bộ Thủy/ })).toBeVisible();
  // Tìm theo nghĩa, bỏ dấu.
  await page.getByPlaceholder(/Tìm theo tên/).fill("nuoc");
  await expect(page).toHaveURL(/q=nuoc/);
  await expect(page.getByRole("link", { name: /^Bộ Thủy/ })).toBeVisible();

  await page.getByRole("button", { name: "Đánh dấu đã thuộc bộ Thủy" }).click();
  await expect(page.getByText("Đã đánh dấu thuộc bộ Thủy.")).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Tiến độ học bộ thủ" })).toHaveAttribute("aria-valuenow", "1");

  await page.getByPlaceholder(/Tìm theo tên/).fill("");
  await page.getByLabel("Trạng thái").selectOption("known");
  await expect(page.getByText("1 bộ thủ", { exact: true })).toBeVisible();
  await page.getByLabel("Trạng thái").selectOption("");
  await page
    .getByRole("group", { name: "Lọc theo số nét" })
    .getByRole("button", { name: "1 nét", exact: true })
    .click();
  await expect(page.getByText("6 bộ thủ", { exact: true })).toBeVisible();

  await page.goto("/radicals/85");
  await expect(page.getByRole("heading", { level: 1, name: /Bộ Thủy/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Đã thuộc" })).toHaveAttribute("aria-pressed", "true");
  // Nét viết tải từ /api/hanzi (tự host) → nút xem nét viết bật.
  await expect(page.getByRole("button", { name: "Xem nét viết" })).toBeEnabled();
  await expect(page.getByRole("img", { name: "Chữ 水" }).locator("svg")).toBeVisible();
  await page.getByRole("button", { name: "Xem nét viết" }).click();
  await page.getByRole("button", { name: "Xem cách viết chữ 河" }).click();
  await expect(page.getByRole("img", { name: "Chữ 河" })).toBeVisible();
  // Từ vựng của mình có bộ Thủy.
  await expect(page.getByRole("link", { name: /喝水/ })).toBeVisible();
  await page.getByRole("link", { name: /Xem \d+ từ trong danh sách Từ vựng/ }).click();
  await expect(page).toHaveURL(/\/vocabulary\?radical=85/);

  await page.goto("/radicals/85");
  await page.getByRole("button", { name: "Đã thuộc" }).click();
  await expect(page.getByRole("button", { name: "Đánh dấu đã thuộc" })).toBeVisible();
  await page.getByRole("navigation", { name: "Bộ thủ trước / sau" }).getByRole("link").last().click();
  await expect(page).toHaveURL(/\/radicals\/86$/);

  expect((await page.request.get("/api/hanzi/%E6%B0%B4")).status()).toBe(200);
  expect((await page.request.get("/api/hanzi/..%2Fpackage")).status()).toBe(404);
  expect((await page.goto("/radicals/999"))?.status()).toBe(404);
});
