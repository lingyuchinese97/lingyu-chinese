import path from "node:path";
import { expect, test } from "@playwright/test";
import { resetRateLimit, sql } from "./db";
import { register } from "./helpers";

test.beforeEach(() => resetRateLimit());

const PNG = path.join(__dirname, "fixtures", "ocr-words.png");

test("Thư viện LingYu: admin phân tích → lưu nháp (người học không thấy) → ảnh → public → người học xem, lưu vào Từ vựng của tôi", async ({
  browser,
}, info) => {
  test.skip(info.project.name !== "desktop", "Dữ liệu thư viện dùng chung — chạy một lần");
  test.setTimeout(120_000);
  await sql(`delete from library_word where hanzi = any($1)`, [["学", "学校"]]);
  const desktop = { viewport: { width: 1440, height: 900 } };
  const a = await (await browser.newContext(desktop)).newPage();
  const adminEmail = await register(a, "Quản Trị", "liba");
  await sql(`update "user" set role = 'admin' where email = $1`, [adminEmail]);
  const u = await (await browser.newContext(desktop)).newPage();
  await register(u, "Học Viên", "libu");

  // Người thường không vào được màn admin; API admin → 403.
  await u.goto("/admin/library");
  await expect(u).toHaveURL(/\/home$/);
  expect((await u.request.post("/api/v1/admin/library/analyze", { data: { input: "学" } })).status()).toBe(403);
  expect((await u.request.get("/api/v1/admin/library/suggest?q=xue")).status()).toBe(403);
  expect((await u.request.get("/api/v1/admin/library/image-suggestions?q=学")).status()).toBe(403);

  // Admin: gõ tiếng Việt → chọn từ trong danh sách gợi ý → tự điền + tự tìm ảnh gợi ý.
  await a.goto("/admin/library");
  await a.getByRole("navigation", { name: "Mục quản trị" }).getByRole("link", { name: "Thư viện LingYu" }).click();
  await a.getByRole("link", { name: "Thêm từ vựng" }).click();
  await a.getByLabel("Nhập chữ Hán, pinyin hoặc từ tiếng Việt").fill("học");
  await a
    .getByRole("listbox", { name: "Gợi ý từ" })
    .getByRole("option", { name: /^学\s*xué\s*học/ })
    .click();
  await expect(a.getByLabel("Pinyin", { exact: true })).toHaveValue("xué");
  await expect(a.getByLabel("Nghĩa tiếng Việt")).toHaveValue("học");
  await expect(a.getByLabel("Cấp HSK")).toHaveValue("1");
  await a.getByLabel("Từ loại").selectOption({ label: "Động từ" });
  await a.getByLabel("Ghi chú").fill("chỉ hoạt động học tập, học hỏi");
  await a.getByLabel("Cách nhớ").fill("Một đứa trẻ (子) đang học dưới mái nhà (冖) → học.");
  const preview = a.getByRole("region", { name: "3. Xem trước" });
  await expect(preview.getByText("Động từ")).toBeVisible();
  await expect(preview.getByText("chỉ hoạt động học tập, học hỏi")).toBeVisible();
  // Chọn ảnh gợi ý trước khi lưu → lưu cùng từ, kèm ghi công.
  const pics = a.getByRole("region", { name: "Hình ảnh gợi ý" });
  await pics.getByRole("button", { name: /^Chọn ảnh gợi ý 1:/ }).click();
  await expect(a.getByText("Đã chọn ảnh — ảnh sẽ được lưu cùng từ.")).toBeVisible();
  await expect(preview.getByText("Ảnh mẫu 1 · CC0 · Wikimedia Commons")).toBeVisible();

  await a.getByRole("button", { name: "Lưu nháp" }).click();
  await expect(a.getByText("Đã lưu nháp.")).toBeVisible();
  await expect(a).toHaveURL(/\/admin\/library\/[0-9a-f-]{36}$/);
  const id = a.url().split("/").pop()!;

  // Nháp: người học không thấy (trang + API).
  const ids = async () =>
    ((await (await u.request.get("/api/v1/library/words?hsk=0")).json()).data.items as { id: string }[]).map(
      (x) => x.id,
    );
  expect(await ids()).not.toContain(id);
  expect((await u.request.get(`/api/v1/library/words/${id}`)).status()).toBe(404);
  // Link cũ /library/vocabulary?w= chuyển sang /library/words.
  await u.goto(`/library/vocabulary?w=${id}`);
  await expect(u).toHaveURL(/\/library\/words\?w=/);
  await expect(u.getByRole("article", { name: "学" })).toHaveCount(0);

  // Ảnh gợi ý đã được lưu; tự tải ảnh lên thay được; chọn lại ảnh gợi ý khác rồi public.
  await expect(preview.getByText("LingYu mẫu 1 · CC0 · Wikimedia Commons")).toBeVisible();
  expect((await u.request.get(`/api/v1/library/words/${id}/image`)).status()).toBe(404);
  await a.getByTestId("lib-image-input").setInputFiles(PNG);
  await expect(a.getByText("Đã lưu ảnh.").first()).toBeVisible();
  await expect(preview.getByText("LingYu mẫu 1 · CC0 · Wikimedia Commons")).toHaveCount(0);
  await pics.getByRole("button", { name: "Tìm ảnh" }).click();
  await pics.getByRole("button", { name: /^Chọn ảnh gợi ý 2:/ }).click();
  await expect(preview.getByText("LingYu mẫu 2 · CC0 · Wikimedia Commons")).toBeVisible();
  await a.getByRole("button", { name: "Lưu và Public" }).click();
  await expect(a.getByText("Đã lưu và public.")).toBeVisible();

  // Người học: Thư viện LingYu → Từ vựng → HSK 1 → chi tiết, lưu vào kho.
  await u.goto("/home");
  await u
    .getByRole("complementary", { name: "Điều hướng chính" })
    .getByRole("link", { name: "Thư viện LingYu" })
    .click();
  await expect(u).toHaveURL(/\/library$/);
  await expect(u.getByRole("heading", { level: 1, name: "Thư viện LingYu" })).toBeVisible();
  // Từ admin đăng nằm ở mục "Từ vựng LingYu mới đăng" (/library/words).
  await u.getByRole("link", { name: /Từ vựng LingYu mới đăng/ }).click();
  await expect(u).toHaveURL(/\/library\/words/);
  await expect(u.getByRole("heading", { level: 1, name: "Từ vựng" })).toBeVisible();
  await expect(u.getByText(/^HSK 1 \(\d+ từ vựng\)$/)).toBeVisible();
  await u.getByRole("link", { name: /^\d+\s*学\s*xué/ }).click();
  const detail = u.getByRole("article", { name: "学" });
  await expect(detail.getByText("xué", { exact: true })).toBeVisible();
  await expect(detail.getByText("学校")).toBeVisible();
  await expect(detail.getByText("Mẹo ghi nhớ")).toBeVisible();
  await expect(detail.getByText("Một đứa trẻ (子) đang học dưới mái nhà (冖) → học.")).toBeVisible();
  expect((await u.request.get(`/api/v1/library/words/${id}/image`)).status()).toBe(200);
  await expect(detail.getByText("Ảnh: LingYu mẫu 2 · CC0 · Wikimedia Commons")).toBeVisible();
  await detail.getByRole("button", { name: "Lưu “学” vào Từ vựng của tôi" }).click();
  await expect(u.getByText("Đã lưu “学” vào Từ vựng của tôi.")).toBeVisible();
  const mine = (await (await u.request.get("/api/v1/vocab?q=学")).json()).data.items;
  expect(mine[0]).toMatchObject({ hanzi: "学", pinyin: "xué", meaningVi: "học" });
  await u.getByRole("button", { name: "HSK 2" }).click();
  await expect(u.getByRole("link", { name: /^\d+\s*学\s*xué/ })).toHaveCount(0);

  // Về nháp → biến mất.
  await a.goto("/admin/library");
  await a.getByRole("row", { name: /学/ }).getByRole("button", { name: "Về nháp" }).click();
  await expect(a.getByText("Đã chuyển “学” về nháp.")).toBeVisible();
  expect((await u.request.get(`/api/v1/library/words/${id}`)).status()).toBe(404);
});

test("API Thư viện LingYu: 401 / 403, trùng Hán tự 409, public cần pinyin + nghĩa", async ({ page, browser }, info) => {
  test.skip(info.project.name !== "desktop", "API chỉ cần chạy một lần");
  await sql(`delete from library_word where hanzi = any($1)`, [["学校"]]);
  const anon = await browser.newContext();
  expect((await anon.request.get("/api/v1/library/words")).status()).toBe(401);
  expect((await anon.request.post("/api/v1/admin/library/words", { data: {} })).status()).toBe(401);
  expect((await anon.request.get("/api/v1/admin/library/image-suggestions?q=学")).status()).toBe(401);
  await anon.close();

  const email = await register(page, "Quản Trị API", "libapi");
  const api = page.request;
  expect((await api.get("/api/v1/admin/library/words")).status()).toBe(403);
  await sql(`update "user" set role = 'admin' where email = $1`, [email]);

  const bad = await api.post("/api/v1/admin/library/words", { data: { word: { hanzi: "学校" }, publish: true } });
  expect(bad.status()).toBe(400);
  expect((await bad.json()).message).toBe("Cần nhập pinyin và nghĩa tiếng Việt trước khi public.");
  const a = (await (await api.post("/api/v1/admin/library/analyze", { data: { input: "学校" } })).json()).data.analysis;
  const made = await api.post("/api/v1/admin/library/words", { data: { word: a, publish: true } });
  expect(made.status()).toBe(201);
  const { id } = (await made.json()).data;
  expect((await api.post("/api/v1/admin/library/words", { data: { word: a } })).status()).toBe(409);
  const sug = (await (await api.get("/api/v1/admin/library/suggest?q=学")).json()).data.candidates;
  expect(sug.map((c: { hanzi: string }) => c.hanzi)).toContain("学校");
  const imgs = (await (await api.get("/api/v1/admin/library/image-suggestions?q=学校")).json()).data.items;
  expect(imgs.length).toBeGreaterThan(0);
  const bogus = await api.put(`/api/v1/admin/library/words/${id}/image/suggested`, {
    data: { title: "https://x/y.png" },
  });
  expect(bogus.status()).toBe(400);
  const set = await api.put(`/api/v1/admin/library/words/${id}/image/suggested`, { data: { title: imgs[0].title } });
  expect((await set.json()).data).toMatchObject({ hasImage: true, credit: expect.stringContaining("Wikimedia") });
  const list = (await (await api.get("/api/v1/library/words?hsk=0&q=xuexiao")).json()).data;
  expect(list.items.map((x: { id: string }) => x.id)).toContain(id);
  expect(JSON.stringify(list)).not.toContain('"status"');
  expect((await api.delete(`/api/v1/admin/library/words/${id}`)).status()).toBe(200);
  expect((await api.get(`/api/v1/library/words/${id}`)).status()).toBe(404);
});
