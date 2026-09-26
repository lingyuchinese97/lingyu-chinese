import { defineConfig, devices } from "@playwright/test";
import { E2E_DOCS, e2eDbUrl } from "./tests/e2e/db";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;
const e2eDb = e2eDbUrl;

/**
 * E2E chạy trên bản build production (`next start`) với DB riêng (E2E_DATABASE_URL hoặc <db>_e2e).
 * Viewport: iPhone, Android, desktop — spec mục 2.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    locale: "vi-VN",
    // Môi trường không tải được trình duyệt của Playwright → trỏ tới Chromium có sẵn (vd /opt/pw-browsers/chromium-1194/chrome-linux/chrome).
    ...(process.env.PW_CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } } : {}),
  },
  projects: [
    { name: "iphone", use: { ...devices["iPhone 13"], browserName: "chromium" } },
    { name: "android", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    // Chạy migration lên DB e2e rồi mới start (biến ở đây ưu tiên hơn .env).
    command: `pnpm db:migrate && pnpm start -p ${PORT}`,
    env: {
      DATABASE_URL: e2eDb,
      BETTER_AUTH_URL: baseURL,
      NEXT_PUBLIC_APP_URL: baseURL,
      // Tài khoản riêng của trang tài liệu API (chỉ dùng cho test).
      API_DOCS_USER: E2E_DOCS.username,
      API_DOCS_PASSWORD: E2E_DOCS.password,
    },
    url: `${baseURL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
