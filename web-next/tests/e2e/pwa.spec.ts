import { expect, test } from "@playwright/test";
import { resetRateLimit } from "./db";
import { register } from "./helpers";

test.beforeEach(() => resetRateLimit());

test("header bảo mật + manifest + service worker", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("default-src 'self'");
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["permissions-policy"]).toContain("camera=()");
  expect(h["x-powered-by"]).toBeUndefined();

  const m = await (await request.get("/manifest.webmanifest")).json();
  expect(m).toMatchObject({ name: "LingYu Chinese", display: "standalone", start_url: "/home", lang: "vi" });
  const sw = await request.get("/serwist/sw.js");
  expect(sw.status()).toBe(200);
  const body = await sw.text();
  expect(body).toContain("/~offline");
  expect(body).toContain("/audio/bai1/blending/q01.mp3");
  // Không precache trang có dữ liệu người dùng.
  expect(body).not.toMatch(/"url":\s*"\/(home|vocabulary|grammar|settings|admin)"/);
});

test("mất mạng → hiện trang 'Bạn đang offline'; không lộ trang đã xem", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "service worker test chạy trên Chromium");
  await register(page, "Người Học", "pwa");
  await page.goto("/vocabulary");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // Đợi service worker điều khiển trang (clientsClaim).
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await context.setOffline(true);
  await page.goto("/vocabulary").catch(() => undefined);
  await expect(page.getByRole("heading", { name: "Bạn đang offline" })).toBeVisible();
  await context.setOffline(false);
});
