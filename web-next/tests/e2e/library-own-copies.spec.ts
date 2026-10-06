import { expect, test } from "@playwright/test";
import { resetRateLimit } from "./db";
import { register } from "./helpers";

test.beforeEach(() => resetRateLimit());

const BABA = encodeURIComponent("爸爸");

test("Phát âm nằm trong Thư viện LingYu; lưu từ ví dụ vào Từ vựng của tôi rồi sửa / thêm tag ở kho của mình", async ({
  page,
}, info) => {
  test.skip(info.project.name === "android", "Luồng dài — chạy trên iPhone + máy tính");
  test.setTimeout(120_000);
  await register(page, "Người Lưu Bản Sao", "own");

  // Link cũ /pronunciation vẫn mở được → chuyển vào Thư viện; breadcrumb Thư viện / Phát âm.
  await page.goto("/pronunciation/initials?s=b");
  await expect(page).toHaveURL(/\/library\/pronunciation\/initials\?s=b$/);
  await expect(
    page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Thư viện" }),
  ).toBeVisible();

  const detail = page.getByRole("region", { name: "Chi tiết âm b" });
  await detail.getByRole("button", { name: "Lưu “爸爸” vào Từ vựng của tôi" }).click();
  await expect(page.getByText(/Đã lưu 1 từ vào Từ vựng của tôi/)).toBeVisible();
  await expect(detail.getByRole("link", { name: "“爸爸” đã có trong Từ vựng của tôi" })).toBeVisible();
  await detail.getByRole("button", { name: "Lưu cả âm vào Từ vựng" }).click();
  await expect(detail.getByRole("button", { name: "Đã lưu vào Từ vựng" })).toBeDisabled();

  // Bản sao nằm trong Từ vựng của tôi với tag Phát âm + Thanh mẫu b; sửa được, nội dung Thư viện không đổi.
  const mine = (await (await page.request.get("/api/v1/vocab?tag=Thanh mẫu b")).json()).data;
  expect(mine.items.map((w: { hanzi: string }) => w.hanzi).sort()).toEqual(["八", "爸爸"]);
  const w = mine.items.find((x: { hanzi: string }) => x.hanzi === "爸爸");
  expect(w.tags).toEqual(expect.arrayContaining(["Phát âm", "Thanh mẫu b"]));
  const put = await page.request.put(`/api/v1/vocab/${w.id}`, {
    data: { hanzi: "爸爸", pinyin: "bàba", meaningVi: "bố (ba)", tags: [...w.tags, "Gia đình"] },
  });
  expect(put.ok()).toBe(true);
  await page.reload();
  await expect(page.getByRole("region", { name: "Chi tiết âm b" }).getByText("bố", { exact: true })).toBeVisible();

  // Kho trống không còn "Dùng dữ liệu mẫu" — dẫn sang Thư viện LingYu.
  await page.goto("/grammar");
  await expect(page.getByRole("link", { name: "Lấy từ Thư viện LingYu" })).toHaveAttribute("href", "/library/grammar");
});

test("API lưu từ ví dụ phát âm: 401 khi chưa đăng nhập; 404 âm / từ không có; chỉ vào kho người gọi", async ({
  page,
  browser,
}, info) => {
  test.skip(info.project.name !== "desktop", "API chỉ cần chạy một lần");
  const anon = await browser.newContext();
  expect((await anon.request.post("/api/v1/pronunciation/sounds/initials/b/save")).status()).toBe(401);
  await anon.close();

  await register(page, "Chủ Kho", "own-a");
  const api = page.request;
  expect((await api.post("/api/v1/pronunciation/sounds/initials/xx/save")).status()).toBe(404);
  expect((await api.post("/api/v1/pronunciation/sounds/finals/ang/save", { data: { hanzi: "咖啡" } })).status()).toBe(
    404,
  );
  const r = await api.post("/api/v1/pronunciation/sounds/initials/b/save", { data: { hanzi: "爸爸" } });
  expect((await r.json()).data).toEqual({ added: 1, skipped: 0 });
  expect((await (await api.post("/api/v1/pronunciation/sounds/initials/b/save")).json()).data).toEqual({
    added: 1,
    skipped: 1,
  });

  const other = await browser.newContext();
  const op = await other.newPage();
  await register(op, "Người Khác", "own-b");
  expect((await (await op.request.get(`/api/v1/vocab?q=${BABA}`)).json()).data.total).toBe(0);
  await other.close();
});
