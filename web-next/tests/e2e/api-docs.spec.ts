import { expect, test } from "@playwright/test";
import { E2E_DOCS } from "./db";

test("Swagger /api-docs cần tài khoản riêng: không có / sai mật khẩu → 401", async ({ browser }) => {
  const anon = await browser.newContext();
  const page = await anon.request.get("/api-docs");
  expect(page.status()).toBe(401);
  expect(page.headers()["www-authenticate"]).toContain("Basic");
  expect((await anon.request.get("/api/openapi.json")).status()).toBe(401);
  await anon.close();

  const wrong = await browser.newContext({
    httpCredentials: { username: E2E_DOCS.username, password: "sai-mat-khau-123" },
  });
  expect((await wrong.request.get("/api-docs")).status()).toBe(401);
  expect((await wrong.request.get("/api/openapi.json")).status()).toBe(401);
  await wrong.close();
});

test.describe("có tài khoản tài liệu", () => {
  test.use({ httpCredentials: E2E_DOCS });

  test("hiển thị tài liệu OpenAPI, gọi thử được (chưa đăng nhập LingYu → 401)", async ({ page, request }) => {
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

    // Gọi thử một route ngay trên trang: chưa đăng nhập LingYu nên nhận 401 (request đi được, không bị CSP chặn).
    await stats.locator(".opblock-summary").click();
    await stats.getByRole("button", { name: "Try it out" }).click();
    await stats.getByRole("button", { name: "Execute" }).click();
    await expect(stats.locator(".live-responses-table tbody .response-col_status").first()).toHaveText("401");
    expect(cspErrors).toEqual([]);
  });
});
