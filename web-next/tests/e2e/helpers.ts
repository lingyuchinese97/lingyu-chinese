import { expect, type Page } from "@playwright/test";

export const uniqueEmail = (tag: string) =>
  `e2e-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@e2e.lingyu`;

/** Đăng ký tài khoản mới và vào /home. */
export async function register(page: Page, name: string, tag = "u") {
  const email = uniqueEmail(tag);
  await page.goto("/register");
  await page.getByLabel("Họ và tên").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("matkhau123");
  await page.getByLabel("Nhập lại mật khẩu").fill("matkhau123");
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await expect(page).toHaveURL(/\/home$/);
  return email;
}

/** PNG 2x2 hợp lệ (trình duyệt đọc được) để thử tải ảnh. */
export const PNG_2x2 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==",
  "base64",
);

/**
 * Nạp dữ liệu thử vào kho của người đang đăng nhập (qua API — màn hình không còn nút "Dùng dữ liệu mẫu",
 * nội dung LingYu nằm ở Thư viện) rồi tải lại trang hiện tại.
 */
export async function seedSample(page: Page, kind: "vocab" | "grammar" | "sentences") {
  const r = await page.request.post(`/api/v1/${kind}/sample`);
  expect(r.ok()).toBe(true);
  await page.reload();
}
