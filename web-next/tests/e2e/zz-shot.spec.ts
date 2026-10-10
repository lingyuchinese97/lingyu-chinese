import { test } from "@playwright/test";
import { register } from "./helpers";
test("heroes", async ({ page }) => {
  test.setTimeout(180000);
  await register(page, "Lê Linh", "shot");
  for (const w of [1024, 1600, 2400]) {
    await page.setViewportSize({ width: w, height: 900 });
    for (const p of ["/home", "/library/grammar"]) {
      await page.goto(p);
      await page.waitForLoadState("networkidle");
      await page.locator("main section").first().screenshot({ path: "/tmp/claude-0/-home-user-lingyu-chinese/1cf51945-66c4-5a27-bd7e-acfefd8dfbe4/scratchpad/h-" + w + p.replace(/\//g, "_") + ".png" });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vocabulary");
  await page.locator("main section").first().screenshot({ path: "/tmp/claude-0/-home-user-lingyu-chinese/1cf51945-66c4-5a27-bd7e-acfefd8dfbe4/scratchpad/h-m.png" });
});
