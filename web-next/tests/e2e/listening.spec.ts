import { expect, test, type Page } from "@playwright/test";
import { register } from "./helpers";

const editor = (page: Page) => page.getByRole("textbox", { name: "Nội dung chép chính tả" });
const result = (page: Page) => page.getByRole("region", { name: /Kết quả chép chính tả/ });

test("Luyện nghe: link → đáp án tự nhập → chép → so sánh → sửa → lưu bài → Bài làm của tôi → sửa, xoá", async ({
  page,
  baseURL,
}, info) => {
  test.setTimeout(120_000);
  await register(page, "Người Nghe", "listen");
  await page.goto("/listening");
  await expect(page.getByRole("heading", { level: 1, name: /Luyện nghe & Nói/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Luyện nghe từ các kênh" })).toHaveAttribute("aria-current", "page");

  // Link không hỗ trợ → báo lỗi; link file âm thanh → mở trình phát (không cần chọn "Nguồn").
  const url = page.getByRole("textbox", { name: "Link nội dung" });
  await url.fill("https://example.com/trang-web");
  await page.getByRole("button", { name: "Mở nội dung" }).click();
  await expect(page.getByText(/Link này chưa được hỗ trợ/)).toBeVisible();
  await url.fill(`${baseURL}/audio/bai1/blending/q05.mp3`);
  await page.getByRole("button", { name: "Mở nội dung" }).click();
  await expect(page.locator("audio")).toHaveCount(1);
  await expect(page.getByRole("combobox", { name: "Tốc độ nghe" })).toHaveValue("1");
  await page.getByRole("combobox", { name: "Tốc độ nghe" }).selectOption("0.75");

  // Chưa có đáp án tham khảo → không kiểm tra được; đáp án do người dùng tự nhập.
  const check = page.getByRole("button", { name: "Kiểm tra đáp án" });
  await expect(check).toBeDisabled();
  await page.getByRole("button", { name: "Thêm đáp án tham khảo" }).click();
  const refDialog = page.getByRole("dialog", { name: "Thêm đáp án tham khảo" });
  await refDialog.getByRole("button", { name: "Lưu đáp án" }).click();
  await expect(refDialog.getByText("Vui lòng nhập đáp án tham khảo.")).toBeVisible();
  await refDialog.getByLabel(/^Đáp án/).fill("你好，我是小雨。");
  await refDialog.getByLabel(/^Pinyin/).fill("Nǐ hǎo, wǒ shì Xiǎoyǔ.");
  await refDialog.getByRole("button", { name: "Lưu đáp án" }).click();
  await expect(refDialog).toBeHidden();
  // Đáp án được ẩn trong lúc chép.
  await expect(page.getByText(/Đã có đáp án \(8 ký tự\)/)).toBeVisible();
  await expect(page.getByText("你好，我是小雨。")).toHaveCount(0);

  // Chép chính tả (sai 1 chữ) → Kiểm tra → chữ sai tô đỏ, điểm.
  await editor(page).click();
  await page.keyboard.type("你好，我叫小雨。");
  await expect(page.getByText("8 / 2000")).toBeVisible();
  await check.click();
  await expect(result(page).getByText("Đúng 5/6 chữ (83%)")).toBeVisible();
  await expect(result(page).locator('mark[data-status="wrong"]')).toHaveText(/^叫/);
  await expect(result(page).getByText("你好，我是小雨。")).toBeVisible(); // đáp án hiện sau khi kiểm tra

  // Tự tô bút đỏ (định dạng người dùng, khác màu so sánh).
  await editor(page).click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.getByRole("button", { name: "Bút đỏ" }).click();
  await expect(editor(page).locator('[data-c="red"]')).toHaveText("你好，我叫小雨。");

  // Sửa cho đúng → so sánh chạy lại, hết đỏ.
  await editor(page).click();
  await page.keyboard.press("End");
  for (let i = 0; i < 4; i++) await page.keyboard.press("Backspace");
  await page.keyboard.type("是小雨。");
  await expect(result(page).getByText("Đúng 6/6 chữ (100%)")).toBeVisible();
  await expect(result(page).locator('mark[data-status="wrong"]')).toHaveCount(0);
  // Hoàn tác quay lại bản sai.
  await page.getByRole("button", { name: "Hoàn tác" }).click();
  await expect(result(page).getByText("Đúng 6/6 chữ (100%)")).toBeHidden();
  await page.getByRole("button", { name: "Làm lại" }).click();
  await expect(result(page).getByText("Đúng 6/6 chữ (100%)")).toBeVisible();

  await page.getByRole("textbox", { name: "Ghi chú" }).fill("Cần lưu ý 我是 và 我叫.");

  // Lưu bài làm: popup riêng, đáp án chỉ đọc, bài làm sửa được + so sánh tức thì.
  await page.getByRole("button", { name: "Lưu bài làm" }).click();
  const save = page.getByRole("dialog", { name: "Lưu bài làm" });
  await save.getByRole("button", { name: "Lưu bài làm" }).click();
  await expect(save.getByText("Vui lòng nhập tiêu đề bài làm.")).toBeVisible();
  await save.getByLabel("Tiêu đề bài làm").fill("Hội thoại chào hỏi – Bài 1");
  await save.getByRole("button", { name: /Thẻ/ }).click();
  await page.getByPlaceholder("Tạo tag mới (vd: Bài 3)").fill("HSK1");
  await page.getByRole("button", { name: "Thêm", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(save.getByText("HSK1")).toBeVisible();
  const edited = save.getByLabel(/Bài làm sau khi chỉnh sửa/);
  await expect(edited).toHaveValue("你好，我是小雨。");
  await edited.fill("你好，我叫小雨。");
  await expect(save.getByText("Đúng 5/6 chữ (83%)")).toBeVisible();
  await expect(save.getByLabel("Ghi chú")).toHaveValue("Cần lưu ý 我是 và 我叫.");
  await save.getByRole("button", { name: "Lưu bài làm" }).click();
  await expect(save).toBeHidden();
  await expect(page.getByText("Đã lưu bài làm “Hội thoại chào hỏi – Bài 1”.")).toBeVisible();

  // Bài làm của tôi: danh sách (tiêu đề, thẻ, điểm) + chi tiết.
  await page.getByRole("link", { name: "Mở Bài làm của tôi" }).click();
  await expect(page).toHaveURL(/\/listening\/exercises\?id=/);
  const item = page.getByRole("link", { name: "Mở bài “Hội thoại chào hỏi – Bài 1”" });
  await expect(item).toContainText("5/6");
  await expect(item).toContainText("83%");
  await expect(item).toContainText("HSK1");
  const detail = page.getByRole("region", { name: "Chi tiết bài làm" });
  await expect(detail.getByRole("heading", { name: "Hội thoại chào hỏi – Bài 1" })).toBeVisible();
  await expect(detail.getByText("Đúng 5/6 chữ (83%)")).toBeVisible();
  await expect(detail.locator('mark[data-status="wrong"]')).toHaveText(/^叫/);
  // Định dạng bút đỏ người dùng tô vẫn được giữ (phần chữ không đổi).
  await expect(detail.locator(".text-red", { hasText: "你好，我" }).first()).toBeVisible();
  await expect(detail.getByText("Cần lưu ý 我是 và 我叫.")).toBeVisible();

  // Sửa ghi chú.
  await detail.getByRole("button", { name: "Chỉnh sửa", exact: true }).last().click();
  await detail.getByRole("textbox", { name: "Ghi chú" }).fill("Ghi chú mới");
  await detail.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page.getByText("Đã lưu ghi chú.")).toBeVisible();
  await expect(detail.getByText("Ghi chú mới")).toBeVisible();

  // Chỉnh sửa & Lưu: sửa bài làm → chấm lại (không giữ điểm cũ).
  await detail.getByRole("button", { name: "Chỉnh sửa & Lưu" }).click();
  await detail.getByLabel(/Bài làm sau khi chỉnh sửa/).fill("你好，我是小雨。");
  await detail.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(page.getByText("Đã lưu thay đổi.")).toBeVisible();
  await expect(detail.getByText("Đúng 6/6 chữ (100%)")).toBeVisible();
  await expect(item).toContainText("100%");

  // Tìm + lọc.
  const search = page.getByRole("searchbox", { name: "Tìm bài làm" });
  await search.fill("chao hoi");
  await expect(page.getByText("1 bài làm")).toBeVisible();
  await search.fill("không-có-bài-này");
  await expect(page.getByText("Không có bài làm phù hợp.")).toBeVisible();
  await page.getByRole("button", { name: "Xóa bộ lọc" }).click();
  await expect(item).toBeVisible();

  // Xoá (có xác nhận).
  await page.getByRole("region", { name: "Chi tiết bài làm" }).getByRole("button", { name: "Xóa bài làm" }).click();
  await page.getByRole("dialog", { name: "Xóa bài làm?" }).getByRole("button", { name: "Xóa" }).click();
  await expect(page.getByText("Bạn chưa lưu bài làm nào.")).toBeVisible();

  if (info.project.name !== "desktop") return;
  // Lưu vào Từ vựng từ bài chép: dùng lại form Từ vựng, lưu vào kho chung.
  await page.goto("/listening");
  await editor(page).click();
  await page.keyboard.press("ControlOrMeta+a");
  await page
    .getByRole("toolbar", { name: "Công cụ soạn thảo" })
    .getByRole("button", { name: "Lưu vào Từ vựng" })
    .click();
  const vd = page.getByRole("dialog", { name: "Lưu vào Từ vựng" });
  await expect(vd.getByLabel(/Hán tự/)).toHaveValue("你好我叫小雨");
  await vd.getByLabel(/Hán tự/).fill("小雨");
  await vd.getByLabel(/^Pinyin/).fill("xiǎo yǔ");
  await vd.getByLabel(/Nghĩa tiếng Việt/).fill("mưa nhỏ");
  await vd.getByRole("button", { name: "Lưu từ vựng" }).click();
  await expect(page.getByText("Đã lưu “小雨” vào Từ vựng.")).toBeVisible();
  await expect(vd).toBeHidden();
  const vocab = await (await page.request.get("/api/v1/vocab?q=小雨")).json();
  expect(vocab.data.items.map((i: { hanzi: string }) => i.hanzi)).toEqual(["小雨"]);
});
