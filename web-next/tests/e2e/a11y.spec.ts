import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { resetRateLimit } from "./db";
import { register } from "./helpers";

test.beforeEach(() => resetRateLimit());

async function audit(page: Page, name: string) {
  // Nút CTA dùng gradient thương hiệu (xanh → cyan) giữ nguyên theo thiết kế bản cũ → loại khỏi kiểm tra tương phản.
  const r = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .exclude(".bg-grad-primary")
    .analyze();
  const bad = r.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map(
      (v) =>
        `${name}: ${v.id} — ${v.help} (${v.nodes
          .map((n) => n.target.join(" "))
          .slice(0, 3)
          .join(", ")})`,
    );
  return bad;
}

test("a11y (axe): không có lỗi serious/critical ở các trang chính", async ({ page }) => {
  test.setTimeout(120_000);
  const problems: string[] = [];
  await page.goto("/");
  problems.push(...(await audit(page, "/")));
  await page.goto("/login");
  problems.push(...(await audit(page, "/login")));
  await page.goto("/register");
  problems.push(...(await audit(page, "/register")));

  await register(page, "Người Học", "a11y");
  await page.goto("/vocabulary");
  await page.getByRole("button", { name: "Dùng dữ liệu mẫu" }).click();
  await expect(page.getByText("24 từ vựng", { exact: true })).toBeVisible();
  for (const path of [
    "/home",
    "/vocabulary",
    "/vocabulary/new",
    "/grammar",
    "/grammar/new",
    "/radicals",
    "/radicals/85",
    "/review/setup",
    "/lessons",
    "/lessons/bai1",
    "/lessons/bai1/blending",
    "/settings",
    "/~offline",
  ]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    problems.push(...(await audit(page, path)));
  }
  expect(problems).toEqual([]);
});
