import { expect, test } from "@playwright/test";
import { resetRateLimit } from "./db";
import { register } from "./helpers";

test.beforeEach(() => resetRateLimit());

test("Phát âm: bài của LingYu ở Thư viện; mục Phát âm & Biến điệu là kho của tôi — lưu từ Thư viện, tự thêm, sửa, thêm tag", async ({
  page,
}, info) => {
  test.skip(info.project.name === "android", "Luồng dài — chạy trên iPhone + máy tính");
  test.setTimeout(120_000);
  await register(page, "Người Lưu Bản Sao", "own");

  // Link cũ của bài học → Thư viện; breadcrumb Thư viện / Phát âm.
  await page.goto("/pronunciation/initials?s=b");
  await expect(page).toHaveURL(/\/library\/pronunciation\/initials\?s=b$/);
  await expect(
    page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Thư viện" }),
  ).toBeVisible();

  // Lưu từ ví dụ vào Phát âm của tôi.
  const detail = page.getByRole("region", { name: "Chi tiết âm b" });
  await detail.getByRole("button", { name: "Lưu “爸爸” vào Phát âm của tôi" }).click();
  await expect(page.getByText(/Đã lưu 1 từ vào Phát âm của tôi/)).toBeVisible();
  await expect(detail.getByRole("link", { name: "“爸爸” đã có trong Phát âm của tôi" })).toBeVisible();
  await detail.getByRole("button", { name: "Lưu cả âm vào Phát âm của tôi" }).click();
  await expect(detail.getByRole("button", { name: "Đã lưu vào Phát âm của tôi" })).toBeDisabled();

  // Thanh bên vẫn có Phát âm & Biến điệu → kho của tôi.
  await page.goto("/home");
  await page.getByRole("link", { name: "Phát âm & Biến điệu" }).first().click();
  await expect(page).toHaveURL(/\/pronunciation$/);
  await expect(page.getByRole("heading", { level: 1, name: /Phát âm & Biến điệu của tôi/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Từ & âm của tôi \(2\)/ })).toBeVisible();
  await expect(page.getByRole("region", { name: "爸爸" }).getByRole("link", { name: "Thanh mẫu b" })).toBeVisible();

  // Sửa bản sao: thêm tag.
  await page.getByRole("button", { name: "Sửa “爸爸”" }).click();
  const dlg = page.getByRole("dialog", { name: "Sửa “爸爸”" });
  await dlg.getByLabel("Nghĩa").fill("bố (ba)");
  await dlg.getByLabel("Tag", { exact: true }).fill("Gia đình");
  await dlg.getByLabel("Tag", { exact: true }).press("Enter");
  await dlg.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page.getByText("Đã lưu thay đổi.")).toBeVisible();
  await expect(page.getByRole("region", { name: "爸爸" }).getByText("bố (ba)")).toBeVisible();
  await page
    .getByRole("group", { name: "Lọc theo tag" })
    .getByRole("button", { name: /Gia đình/ })
    .click();
  await expect(page.getByRole("heading", { name: /Từ & âm của tôi \(1\)/ })).toBeVisible();

  // Tự thêm (pinyin tự điền).
  await page.goto("/pronunciation");
  await page.getByRole("button", { name: "Thêm từ / âm" }).click();
  const add = page.getByRole("dialog", { name: "Thêm từ / âm" });
  await add.getByLabel("Chữ Hán / âm tiết").fill("四十");
  await add.getByLabel("Ghi chú").fill("s – sh dễ nhầm");
  await add.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page.getByRole("region", { name: "四十" }).getByText("sì shí")).toBeVisible();

  // Nội dung Thư viện không đổi.
  await page.goto("/library/pronunciation/initials?s=b");
  await expect(page.getByRole("region", { name: "Chi tiết âm b" }).getByText("bố", { exact: true })).toBeVisible();

  // Kho trống không còn "Dùng dữ liệu mẫu" — dẫn sang Thư viện LingYu.
  await page.goto("/grammar");
  await expect(page.getByRole("link", { name: "Lấy từ Thư viện LingYu" })).toHaveAttribute("href", "/library/grammar");
});

test("API Phát âm của tôi: 401; 404 / 409; lưu từ Thư viện; không lộ sang người khác", async ({
  page,
  browser,
}, info) => {
  test.skip(info.project.name !== "desktop", "API chỉ cần chạy một lần");
  const anon = await browser.newContext();
  expect((await anon.request.get("/api/v1/pronunciation/items")).status()).toBe(401);
  expect(
    (await anon.request.post("/api/v1/pronunciation/items/from-library", { data: { topic: "initial:b" } })).status(),
  ).toBe(401);
  await anon.close();

  await register(page, "Chủ Kho", "own-a");
  const api = page.request;
  expect((await api.post("/api/v1/pronunciation/items/from-library", { data: { topic: "initial:xx" } })).status()).toBe(
    404,
  );
  const r = await api.post("/api/v1/pronunciation/items/from-library", { data: { topic: "initial:b", hanzi: "爸爸" } });
  expect((await r.json()).data).toEqual({ added: 1, skipped: 0 });
  const created = await api.post("/api/v1/pronunciation/items", { data: { hanzi: "四十", tags: ["Khó"] } });
  expect(created.status()).toBe(201);
  const item = (await created.json()).data;
  expect(item.pinyin).toBe("sì shí");
  expect((await api.post("/api/v1/pronunciation/items", { data: { hanzi: "四十", pinyin: "sì shí" } })).status()).toBe(
    409,
  );
  const put = await api.put(`/api/v1/pronunciation/items/${item.id}`, {
    data: { hanzi: "四十", pinyin: "sì shí", tags: ["Khó", "Số"] },
  });
  expect((await put.json()).data.tags).toEqual(["Khó", "Số"]);
  const list = (await (await api.get("/api/v1/pronunciation/items?from=library")).json()).data;
  expect(list.items.map((x: { hanzi: string }) => x.hanzi)).toEqual(["爸爸"]);

  const other = await browser.newContext();
  const op = await other.newPage();
  await register(op, "Người Khác", "own-b");
  expect((await (await op.request.get("/api/v1/pronunciation/items")).json()).data.total).toBe(0);
  expect((await op.request.get(`/api/v1/pronunciation/items/${item.id}`)).status()).toBe(404);
  expect(
    (await op.request.put(`/api/v1/pronunciation/items/${item.id}`, { data: { hanzi: "x", pinyin: "x" } })).status(),
  ).toBe(404);
  expect((await op.request.delete(`/api/v1/pronunciation/items/${item.id}`)).status()).toBe(404);
  await other.close();
  expect((await api.delete(`/api/v1/pronunciation/items/${item.id}`)).status()).toBe(200);
});
