import { expect, test } from "@playwright/test";

test("Swagger /api-docs: hiển thị tài liệu OpenAPI, gọi thử được (chưa đăng nhập → 401)", async ({ page, request }) => {
  const spec = await request.get("/api/openapi.json");
  expect(spec.status()).toBe(200);
  const doc = await spec.json();
  expect(doc.openapi).toBe("3.1.0");
  expect(doc.paths["/api/v1/vocab"]).toBeTruthy();

  const cspErrors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" && /Content Security Policy/i.test(m.text())) cspErrors.push(m.text());
  });
  await page.goto("/api-docs");
  await expect(page.getByRole("heading", { level: 1, name: /Tài liệu API/ })).toBeVisible();
  await expect(page.getByText("LingYu Chinese API")).toBeVisible();
  const stats = page.locator("#operations-Từ_vựng-get_vocab_stats");
  await expect(stats).toBeVisible();

  // Gọi thử một route ngay trên trang: chưa đăng nhập nên nhận 401 (request đi được, không bị CSP chặn).
  await stats.locator(".opblock-summary").click();
  await stats.getByRole("button", { name: "Try it out" }).click();
  await stats.getByRole("button", { name: "Execute" }).click();
  await expect(stats.locator(".live-responses-table tbody .response-col_status").first()).toHaveText("401");
  expect(cspErrors).toEqual([]);
});
