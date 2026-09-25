import { expect, test } from "@playwright/test";
import { resetRateLimit } from "./db";
import { register } from "./helpers";

test.beforeEach(() => resetRateLimit());

test("chia sẻ từ vựng: chọn nhiều từ → gửi email → người nhận chấp nhận từ chuông; người gửi được báo", async ({
  browser,
}) => {
  const desktop = { viewport: { width: 1280, height: 800 } };
  const b = await (await browser.newContext(desktop)).newPage();
  const emailB = await register(b, "Bạn Nhận", "vsb");

  const a = await (await browser.newContext(desktop)).newPage();
  await register(a, "Người Gửi", "vsa");
  await a.goto("/vocabulary");
  await a.getByRole("button", { name: "Dùng dữ liệu mẫu" }).click();
  await expect(a.getByText("24 từ vựng", { exact: true })).toBeVisible();
  await expect(a.getByRole("button", { name: "Chia sẻ", exact: true })).toBeDisabled();
  const table = a.locator("table");
  await table.getByRole("checkbox", { name: "Chọn 你", exact: true }).check();
  await table.getByRole("checkbox", { name: "Chọn 好", exact: true }).check();
  await a.getByRole("button", { name: "Chia sẻ", exact: true }).click();
  const dlg = a.getByRole("dialog", { name: "Chia sẻ 2 từ vựng" });
  await expect(dlg.getByRole("list", { name: "Từ vựng sẽ chia sẻ" }).getByRole("listitem")).toHaveCount(2);
  await dlg.getByLabel("Email người nhận").fill(`${emailB}, sai-email`);
  await dlg.getByRole("button", { name: "Gửi chia sẻ" }).click();
  await expect(dlg.getByText("— Đã gửi 2 từ.")).toBeVisible();
  await expect(dlg.getByText("— Email không đúng định dạng.")).toBeVisible();
  await expect(dlg.getByText("Đang chờ")).toBeVisible();
  await dlg.getByRole("button", { name: "Đóng" }).last().click();

  // Người nhận: lời mời ở đầu danh sách Từ vựng và trong chuông.
  await b.goto("/vocabulary");
  await expect(b.getByText(/Người Gửi đã chia sẻ 2 từ vựng với bạn/)).toBeVisible();
  await b.getByRole("button", { name: /Thông báo \(1 chưa đọc\)/ }).click();
  await b.getByRole("menu").getByRole("button", { name: "Xem & chấp nhận" }).click();
  const acc = b.getByRole("dialog", { name: "Người Gửi chia sẻ 2 từ vựng" });
  await expect(acc.getByRole("list", { name: "Từ vựng được chia sẻ" })).toContainText("你");
  await acc.getByRole("button", { name: "Chấp nhận" }).click();
  await expect(b.getByText("Đã thêm 2 từ vào danh sách Từ vựng của bạn.")).toBeVisible();
  await b.goto("/vocabulary");
  await expect(b.getByText("2 từ vựng", { exact: true })).toBeVisible();
  await expect(b.getByText(/đã chia sẻ 2 từ vựng với bạn/)).toHaveCount(0);

  await a.reload();
  await a.getByRole("button", { name: /Thông báo \(1 chưa đọc\)/ }).click();
  await expect(a.getByText("Bạn Nhận đã chấp nhận 2 từ vựng bạn chia sẻ.")).toBeVisible();
});
