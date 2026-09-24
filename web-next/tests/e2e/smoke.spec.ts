import { expect, test } from "@playwright/test";

test("healthcheck + trang đầu hiển thị", async ({ page, request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "LingYu Chinese" })).toBeVisible();
});
