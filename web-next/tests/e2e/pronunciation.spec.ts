import { expect, test } from "@playwright/test";
import { resetRateLimit } from "./db";
import { register } from "./helpers";

test.beforeEach(() => resetRateLimit());

test("Phát âm: tổng quan → thanh mẫu (ghi chú riêng) → vận mẫu (lọc) → thanh điệu → biến điệu → luyện tập → ghi chú", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await register(page, "Người Phát Âm", "pron");
  await page.goto("/pronunciation");
  await expect(page.getByRole("heading", { level: 1, name: "Phát âm & Biến điệu" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Tổng quan" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("21 thanh mẫu")).toBeVisible();
  await expect(page.getByText("36 vận mẫu")).toBeVisible();
  await expect(page.getByText("Chưa có ghi chú")).toBeVisible();

  // Thanh mẫu: chọn zh → chi tiết; thêm ghi chú riêng.
  await page.getByRole("link", { name: "Xem bài học Thanh mẫu" }).click();
  await expect(page).toHaveURL(/\/pronunciation\/initials/);
  await page.getByRole("button", { name: "Xem âm zh" }).click();
  await expect(page).toHaveURL(/s=zh/);
  const detail = page.getByRole("region", { name: "Chi tiết âm zh" });
  await expect(detail.getByText("Như “tr” tiếng Việt (không bật hơi)")).toBeVisible();
  await expect(detail.getByText("中国")).toBeVisible();
  await detail.getByRole("button", { name: "Ghi chú" }).click();
  const nd = page.getByRole("dialog", { name: "Ghi chú: Thanh mẫu zh" });
  await nd.getByLabel("Nội dung ghi chú").fill("zh cong lưỡi, không bật hơi");
  await nd.getByRole("button", { name: "Lưu ghi chú" }).click();
  await expect(nd).toBeHidden();
  await expect(detail.getByText("zh cong lưỡi, không bật hơi")).toBeVisible();
  // Tải lại: vẫn còn, mở đúng âm theo link.
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Chi tiết âm zh" }).getByText("zh cong lưỡi, không bật hơi"),
  ).toBeVisible();

  // Vận mẫu: lọc nhóm mũi.
  await page.getByRole("link", { name: "Vận mẫu", exact: true }).click();
  await expect(page.getByRole("button", { name: /Tất cả\s*36/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /Vận mẫu mũi\s*16/ }).click();
  await expect(page.getByRole("heading", { name: "Vận mẫu đơn" })).toHaveCount(0);
  await page.getByRole("button", { name: "Xem âm ang" }).click();
  await expect(page.getByRole("region", { name: "Chi tiết âm ang" }).getByText("忙")).toBeVisible();

  // Thanh điệu.
  await page.getByRole("link", { name: "Thanh điệu", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Thanh 3/ })).toBeVisible();
  await expect(page.getByRole("img", { name: "Biểu đồ so sánh đường thanh điệu của 4 thanh" })).toBeVisible();
  await expect(page.getByText("躺")).toBeVisible();

  // Biến điệu: quy tắc 不, ghi chú ví dụ, ghi chú chung, ghi chú tự do, luyện nhanh.
  await page.getByRole("link", { name: "Biến điệu", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Biến điệu là gì?" })).toBeVisible();
  await page.getByRole("button", { name: /Biến điệu của 不/ }).click();
  await expect(page).toHaveURL(/rule=bu/);
  await expect(page.getByText("不 bù + ˋ → bú + ˋ")).toBeVisible();
  await page.getByRole("button", { name: "Ghi chú: 不是" }).click();
  const ed = page.getByRole("dialog", { name: "Ghi chú: 不是" });
  await ed.getByLabel("Nội dung ghi chú").fill("bú shì, không phải bù shì");
  await ed.getByRole("button", { name: "Lưu ghi chú" }).click();
  await expect(page.getByText("bú shì, không phải bù shì").first()).toBeVisible();
  await page.getByRole("textbox", { name: "Ghi chú chung của bạn" }).fill("Nhìn thanh chữ phía sau.");
  await page
    .getByRole("region", { name: "Ghi chú chung của bạn" })
    .getByRole("button", { name: "Lưu ghi chú" })
    .click();
  await expect(page.getByText("Đã lưu ghi chú.").first()).toBeVisible();
  await page.getByRole("button", { name: "Thêm ghi chú" }).click();
  const add = page.getByRole("dialog", { name: "Thêm ghi chú" });
  await add.getByRole("button", { name: "Lưu ghi chú" }).click();
  await expect(add.getByText("Vui lòng nhập tiêu đề ghi chú.")).toBeVisible();
  await add.getByLabel(/Tiêu đề/).fill("Cặp z / zh");
  await add.getByLabel(/Nội dung/).fill("早 zǎo – 找 zhǎo");
  await add.getByRole("button", { name: "Lưu ghi chú" }).click();
  await expect(add).toBeHidden();
  const mine = page.getByRole("region", { name: "Ghi chú của tôi" });
  await expect(mine.getByText("Cặp z / zh")).toBeVisible();
  // Luyện nhanh: chọn một đáp án rồi kiểm tra.
  const quick = page.getByRole("region", { name: "Luyện tập nhanh" }).last();
  await expect(quick.getByText("Bài 1/5")).toBeVisible();
  await quick.getByRole("button", { name: "Kiểm tra đáp án" }).click();
  await expect(quick.getByText("Chọn một đáp án trước.")).toBeVisible();
  await quick.getByRole("radio").first().click();
  await quick.getByRole("button", { name: "Kiểm tra đáp án" }).click();
  await expect(quick.getByText(/Chính xác!|Chưa đúng\. Đáp án:/)).toBeVisible();

  // Luyện tập: nghe & chọn (đếm tiến độ), gõ pinyin bằng số thanh.
  await page.getByRole("link", { name: "Luyện tập", exact: true }).click();
  await expect(page.getByRole("link", { name: /Nghe & Chọn đáp án/ })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("Bài 1/10")).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(4);
  await page.getByRole("radio").nth(1).click();
  await page.getByRole("button", { name: "Kiểm tra đáp án" }).click();
  await expect(page.getByText(/Chính xác!|Chưa đúng\. Đáp án:/)).toBeVisible();
  const prog = page.getByRole("region", { name: "Tiến độ" });
  await expect(prog.getByText("Đã làm")).toBeVisible();
  await expect(prog.locator("dd").first()).toHaveText("1");
  await page.getByRole("button", { name: "Câu tiếp theo" }).click();
  await expect(page.getByText("Bài 2/10")).toBeVisible();

  await page.getByRole("link", { name: /Nghe & Gõ pinyin/ }).click();
  await expect(page).toHaveURL(/mode=listen-type/);
  const box = page.getByLabel("Pinyin bạn nghe được");
  await page.getByRole("button", { name: "Kiểm tra đáp án" }).click();
  await expect(page.getByText("Nhập pinyin trước.")).toBeVisible();
  await box.pressSequentially("ma3");
  await expect(box).toHaveValue("mǎ");
  await page.getByRole("button", { name: "Kiểm tra đáp án" }).click();
  await expect(page.getByText(/Chính xác!|Chưa đúng\. Đáp án:/)).toBeVisible();

  // Ghi chú của tôi: đủ 4 ghi chú; sửa, xoá; link mở lại bài học.
  await page.getByRole("link", { name: "Ghi chú của tôi", exact: true }).click();
  const list = page.getByRole("list", { name: "Danh sách ghi chú" });
  await expect(list.getByRole("listitem")).toHaveCount(4);
  await expect(list.getByText("Thanh mẫu zh")).toBeVisible();
  await page.getByRole("button", { name: "Sửa ghi chú “Cặp z / zh”" }).click();
  const edit = page.getByRole("dialog", { name: "Sửa ghi chú" });
  await edit.getByLabel(/Nội dung/).fill("z phẳng, zh cong");
  await edit.getByRole("button", { name: "Lưu ghi chú" }).click();
  await expect(list.getByText("z phẳng, zh cong")).toBeVisible();
  await page.getByRole("button", { name: "Xóa ghi chú “Cặp z / zh”" }).click();
  await page.getByRole("dialog", { name: "Xóa ghi chú?" }).getByRole("button", { name: "Xóa" }).click();
  await expect(list.getByRole("listitem")).toHaveCount(3);
  await list
    .getByRole("listitem")
    .filter({ hasText: "Thanh mẫu zh" })
    .getByRole("link", { name: "Mở bài học" })
    .click();
  await expect(page).toHaveURL(/\/pronunciation\/initials\?s=zh/);
});

test("API phát âm: 401, nội dung, bài luyện, ghi chú riêng (người khác → 404)", async ({ page, browser }, info) => {
  test.skip(info.project.name !== "desktop", "API chỉ cần chạy một lần");
  const anon = await browser.newContext();
  for (const [method, url] of [
    ["get", "/api/v1/pronunciation"],
    ["get", "/api/v1/pronunciation/practice?mode=pairs"],
    ["get", "/api/v1/pronunciation/notes"],
    ["post", "/api/v1/pronunciation/notes"],
  ] as const)
    expect((await anon.request[method](url, method === "post" ? { data: {} } : undefined)).status(), url).toBe(401);
  await anon.close();

  await register(page, "Chủ Ghi Chú", "apip");
  const api = page.request;
  const content = (await (await api.get("/api/v1/pronunciation")).json()).data;
  expect(content.initials.items).toHaveLength(21);
  expect(content.finals.items).toHaveLength(36);
  expect(content.sandhi.rules.map((r: { id: string }) => r.id)).toEqual(["third-two", "third-three", "yi", "bu"]);

  const pr = (await (await api.get("/api/v1/pronunciation/practice?mode=listen-choose&count=5")).json()).data;
  expect(pr.questions).toHaveLength(5);
  for (const q of pr.questions) expect(q.options).toContain(q.answer);
  expect((await api.get("/api/v1/pronunciation/practice?mode=hack")).status()).toBe(400);

  const bad = await api.post("/api/v1/pronunciation/notes", { data: { content: "" } });
  expect(bad.status()).toBe(400);
  expect((await bad.json()).fieldErrors).toMatchObject({ title: "Vui lòng nhập tiêu đề ghi chú." });
  expect((await api.post("/api/v1/pronunciation/notes", { data: { topic: "initial:w", content: "x" } })).status()).toBe(
    400,
  );
  const created = await api.post("/api/v1/pronunciation/notes", { data: { title: "Bí mật", content: "chỉ tôi" } });
  expect(created.status()).toBe(201);
  const note = (await created.json()).data;
  const topic = await api.post("/api/v1/pronunciation/notes", { data: { topic: "tone:3", content: "thanh 3 nửa" } });
  expect(topic.status()).toBe(200);
  expect((await topic.json()).data).toMatchObject({ topic: "tone:3", title: "Thanh 3" });
  expect((await (await api.get("/api/v1/pronunciation/notes")).json()).data).toHaveLength(2);
  const put = await api.put(`/api/v1/pronunciation/notes/${note.id}`, { data: { content: "đã sửa" } });
  expect((await put.json()).data.content).toBe("đã sửa");

  // Người khác: không thấy, không sửa / xoá được.
  const other = await browser.newContext();
  await register(await other.newPage(), "Người Lạ", "apip-s");
  expect((await (await other.request.get("/api/v1/pronunciation/notes")).json()).data).toEqual([]);
  for (const r of [
    await other.request.get(`/api/v1/pronunciation/notes/${note.id}`),
    await other.request.put(`/api/v1/pronunciation/notes/${note.id}`, { data: { content: "hack" } }),
    await other.request.delete(`/api/v1/pronunciation/notes/${note.id}`),
    await other.request.get("/api/v1/pronunciation/notes/not-a-uuid"),
  ])
    expect(r.status()).toBe(404);
  await other.close();
  expect((await (await api.get(`/api/v1/pronunciation/notes/${note.id}`)).json()).data.content).toBe("đã sửa");
  expect((await api.delete(`/api/v1/pronunciation/notes/${note.id}`)).status()).toBe(200);
  expect((await api.get(`/api/v1/pronunciation/notes/${note.id}`)).status()).toBe(404);
});
