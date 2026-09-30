import path from "node:path";
import { expect, test } from "@playwright/test";
import { resetRateLimit } from "./db";
import { register } from "./helpers";

test.beforeEach(() => resetRateLimit());

const IMG = path.join(__dirname, "fixtures", "ocr-words.png");

test("thêm từ từ ảnh: nhận dạng trên máy → bảng kết quả → sửa → thêm vào danh sách (bỏ qua từ đã có)", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "desktop", "Nhận dạng chữ tốn thời gian — chạy một lần");
  test.setTimeout(120_000);
  await register(page, "Người Chụp", "ocr");
  // Đã có sẵn 你好 → dòng này phải hiện “Đã có” và mặc định không được chọn.
  await page.request.post("/api/v1/vocab", { data: { hanzi: "你好", pinyin: "nǐ hǎo", meaningVi: "xin chào" } });

  await page.goto("/vocabulary/new");
  const tabs = page.getByRole("navigation", { name: "Cách thêm từ vựng" });
  await expect(tabs.getByRole("link", { name: "Nhập thủ công" })).toHaveAttribute("aria-current", "page");
  await tabs.getByRole("link", { name: "Tải ảnh lên" }).click();
  await expect(page).toHaveURL(/mode=upload/);

  const uploads: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST" && r.postDataBuffer()?.includes(Buffer.from("PNG"))) uploads.push(r.url());
  });
  await page.getByTestId("ocr-file-input").setInputFiles(IMG);
  const table = page.getByRole("table", { name: "Kết quả nhận dạng" });
  await expect(table).toBeVisible({ timeout: 90_000 });
  for (const w of ["谢谢", "苹果", "老师"]) await expect(table.getByText(w, { exact: true })).toBeVisible();
  const hello = table.getByRole("row").filter({ hasText: "你好" });
  await expect(hello.getByText("Đã có")).toBeVisible();
  await expect(hello.getByRole("checkbox")).not.toBeChecked();
  await expect(table.getByRole("row").filter({ hasText: "谢谢" }).getByRole("checkbox")).toBeChecked();

  // Sửa một dòng trong khung chỉnh sửa.
  await table.getByRole("button", { name: "Sửa 苹果" }).click();
  await page.getByLabel("Nghĩa tiếng Việt").fill("quả táo (từ ảnh)");
  await page.getByLabel("Note").fill("ghi chú riêng");
  await expect(table.getByText("quả táo (từ ảnh)")).toBeVisible();

  const add = page.getByRole("button", { name: /^Thêm vào danh sách \(\d+\)$/ });
  await add.click();
  await expect(page).toHaveURL(/\/vocabulary$/);
  await expect(page.getByText(/^Đã thêm \d+ từ vựng\.$/)).toBeVisible();
  const mine = (await (await page.request.get("/api/v1/vocab?q=苹果")).json()).data.items;
  expect(mine[0]).toMatchObject({ hanzi: "苹果", meaningVi: "quả táo (từ ảnh)", note: "ghi chú riêng" });
  // Ảnh không bao giờ gửi lên server.
  expect(uploads).toEqual([]);
});

test("API gợi ý / thêm nhiều: 401 khi chưa đăng nhập; 'đã có' chỉ theo kho của chính mình", async ({
  page,
  browser,
}, info) => {
  test.skip(info.project.name !== "desktop", "API chỉ cần chạy một lần");
  const anon = await browser.newContext();
  expect((await anon.request.post("/api/v1/vocab/suggest", { data: { words: ["你好"] } })).status()).toBe(401);
  expect((await anon.request.post("/api/v1/vocab/bulk", { data: { items: [] } })).status()).toBe(401);
  await anon.close();

  const other = await browser.newContext();
  await register(await other.newPage(), "Người Khác", "ocr-o");
  await other.request.post("/api/v1/vocab", { data: { hanzi: "秘密", pinyin: "mìmì", meaningVi: "bí mật riêng" } });

  await register(page, "Chủ", "ocr-a");
  const api = page.request;
  expect((await api.post("/api/v1/vocab/suggest", { data: { words: [] } })).status()).toBe(400);
  const s = (await (await api.post("/api/v1/vocab/suggest", { data: { words: ["秘密", "你好"] } })).json()).data;
  expect(s[0]).toMatchObject({ hanzi: "秘密", exists: false });
  expect(JSON.stringify(s)).not.toContain("bí mật riêng");
  expect(s[1]).toMatchObject({ hanzi: "你好", pinyin: "nǐ hǎo", meaningVi: "xin chào", hskLevel: 1 });

  const bad = await api.post("/api/v1/vocab/bulk", { data: { items: [{ hanzi: "你好", pinyin: "", meaningVi: "" }] } });
  expect(bad.status()).toBe(400);
  const r = await api.post("/api/v1/vocab/bulk", {
    data: {
      items: [
        { hanzi: "你好", pinyin: "nǐ hǎo", meaningVi: "xin chào" },
        { hanzi: "秘密", pinyin: "mìmì", meaningVi: "bí mật" },
        { hanzi: "你好", pinyin: "nǐ hǎo", meaningVi: "lặp" },
      ],
    },
  });
  expect((await r.json()).data).toEqual({ added: ["你好", "秘密"], skipped: ["你好"] });
  expect((await (await other.request.get("/api/v1/vocab")).json()).data.total).toBe(1);
  await other.close();
});
