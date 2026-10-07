import { expect, test } from "@playwright/test";
import { R_PASSAGE_BY_ID } from "../../src/data/reading/passages";
import { resetRateLimit } from "./db";
import { register } from "./helpers";

test.beforeEach(() => resetRateLimit());

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dữ liệu JSON trả về từ API
const data = async (r: { json: () => Promise<any> }) => (await r.json()).data;

test("Đọc hiểu: chọn bài → pinyin / bản dịch → xem từ, lưu từ → lưu bài → làm câu hỏi → kết quả → lưu tất cả → lịch sử", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await register(page, "Người Đọc", "rd");
  await page.goto("/reading");
  await expect(page.getByRole("heading", { level: 1, name: "Đọc hiểu" })).toBeVisible();
  await page.getByRole("radio", { name: "HSK 1", exact: true }).click();
  await page.getByRole("radio", { name: "Hội thoại" }).click();
  await page.getByRole("button", { name: "Bắt đầu đọc" }).click();
  await expect(page).toHaveURL(/\/reading\/r102$/);
  const p = R_PASSAGE_BY_ID.get("r102")!;
  await expect(page.getByRole("heading", { level: 1, name: p.title.zh })).toBeVisible();

  // Giấy ô vuông: mặc định chưa có pinyin / bản dịch; bật trong ô "Hiển thị…", tắt lại được.
  await expect(page.getByRole("group", { name: "Bài đọc trên giấy ô vuông" })).toBeVisible();
  await expect(page.locator("[data-pinyin-line]")).toHaveCount(0);
  await expect(page.getByText(p.lines[1]!.vi)).toHaveCount(0);
  await page.getByLabel("Hiển thị pinyin").check();
  await expect(page.locator("[data-pinyin-line]").first()).toBeVisible();
  await page.getByLabel("Hiển thị bản dịch").check();
  await expect(page.getByText(p.lines[1]!.vi).first()).toBeVisible();
  await page.getByLabel("Hiển thị pinyin").uncheck();
  await expect(page.locator("[data-pinyin-line]")).toHaveCount(0);
  await page.getByLabel("Hiển thị pinyin").check();

  // Bút highlight: chọn màu xanh lá → tô 2 nét → Hoàn tác 1 nét → Xóa toàn bộ.
  const clear = page.getByRole("button", { name: "Xóa toàn bộ highlight trên bài đọc" });
  const undo = page.getByRole("button", { name: "Hoàn tác nét highlight vừa tô" });
  await expect(clear).toBeDisabled();
  await page.getByRole("radio", { name: "Highlight màu xanh lá" }).click();
  await expect(page.getByRole("radio", { name: "Highlight màu xanh lá" })).toHaveAttribute("aria-checked", "true");
  const hl = page.getByRole("button", { name: "Bút highlight", exact: true });
  await expect(hl).toHaveAttribute("aria-pressed", "true");
  const ink = page.locator("canvas[data-ink]");
  const box = (await ink.boundingBox())!;
  for (const y of [40, 90]) {
    await page.mouse.move(box.x + 30, box.y + y);
    await page.mouse.down();
    await page.mouse.move(box.x + 160, box.y + y, { steps: 6 });
    await page.mouse.up();
  }
  await undo.click();
  await expect(clear).toBeEnabled();
  await clear.click();
  await expect(clear).toBeDisabled();
  await expect(undo).toBeDisabled();
  await hl.click();

  // Câu hỏi có pinyin + nghĩa phương án; thanh tiến độ đếm câu đã trả lời.
  await expect(page.getByRole("progressbar", { name: "Số câu đã trả lời" })).toHaveAttribute("aria-valuenow", "0");

  // Bấm từ khoá → nghĩa → lưu vào Từ vựng.
  await page.getByRole("button", { name: "Từ “苹果”" }).click();
  const card = page.getByRole("dialog", { name: "Từ “苹果”" });
  await expect(card.getByText("táo", { exact: true })).toBeVisible();
  await card.getByRole("button", { name: "Lưu vào từ vựng" }).click();
  await expect(page.getByText("Đã lưu “苹果” vào Từ vựng.")).toBeVisible();
  await card.getByRole("button", { name: "Đóng" }).click();

  // Lưu bài.
  await page.getByRole("button", { name: "Lưu bài" }).click();
  await expect(page.getByText("Đã lưu bài đọc.")).toBeVisible();

  // Làm câu hỏi: 2 câu đúng, câu điền từ sai.
  const qs = page.getByRole("region", { name: "Câu hỏi" });
  await qs.getByRole("radiogroup").nth(0).getByRole("radio", { name: /五块/ }).click();
  await qs.getByRole("radiogroup").nth(1).getByRole("radio", { name: /两斤/ }).click();
  await expect(page.getByRole("progressbar", { name: "Số câu đã trả lời" })).toHaveAttribute("aria-valuenow", "2");
  await expect(qs.getByRole("radiogroup").nth(0).getByRole("radio", { name: /五块/ })).toContainText("wǔ kuài");
  await qs.getByLabel("Đáp án câu 3").fill("大");
  await qs.getByRole("button", { name: "Kiểm tra kết quả" }).click();
  const result = page.getByRole("region", { name: "Kết quả" });
  await expect(result.getByText(/2\/3 câu đúng/)).toBeVisible();
  await expect(qs.getByText(/Đáp án đúng: 贵/)).toBeVisible();
  await expect(result.getByRole("heading", { name: "Ngữ pháp trong bài" })).toBeVisible();
  await result.getByRole("button", { name: "Lưu tất cả" }).click();
  await expect(page.getByText(/Đã lưu \d+ từ vào Từ vựng \(1 từ đã có\)\./)).toBeVisible();

  // Trang Đọc hiểu: bài đã lưu + lịch sử.
  await page.goto("/reading");
  await expect(page.getByRole("region", { name: "Bài đã lưu" }).getByText(p.title.zh)).toBeVisible();
  await expect(page.getByRole("region", { name: "Lịch sử đọc" }).getByText(/2\/3 đúng/)).toBeVisible();
});

test("API Đọc hiểu: 401, không lộ đáp án, chấm, lưu bài / từ, dữ liệu riêng từng người", async ({
  page,
  browser,
}, info) => {
  test.skip(info.project.name !== "desktop", "API chỉ cần chạy một lần");
  const anon = await browser.newContext();
  for (const [m, u] of [
    ["get", "/api/v1/reading"],
    ["get", "/api/v1/reading/passages"],
    ["get", "/api/v1/reading/pick"],
    ["get", "/api/v1/reading/passages/r101"],
    ["post", "/api/v1/reading/passages/r101/submit"],
    ["put", "/api/v1/reading/passages/r101/saved"],
    ["post", "/api/v1/reading/passages/r101/words"],
    ["get", "/api/v1/reading/history"],
  ] as const)
    expect((await anon.request[m](u, m === "get" ? undefined : { data: {} })).status(), u).toBe(401);
  await anon.close();

  await register(page, "Người Gọi", "rd-api");
  const api = page.request;
  expect(await data(await api.get("/api/v1/reading"))).toMatchObject({ level: 1, saved: [], history: [] });
  expect(
    ((await data(await api.get("/api/v1/reading/passages?level=3"))) as { level: number }[]).every(
      (x) => x.level === 3,
    ),
  ).toBe(true);
  const pick = await data(await api.get("/api/v1/reading/pick?level=2&type=article"));
  expect(pick.id).toBe("r204");
  const pass = await api.get("/api/v1/reading/passages/r204");
  expect(JSON.stringify(await pass.json())).not.toContain('"answer"');
  expect((await api.get("/api/v1/reading/passages/zzz")).status()).toBe(404);
  expect((await api.post("/api/v1/reading/passages/r204/submit", { data: { answers: "x" } })).status()).toBe(400);
  const res = await data(
    await api.post("/api/v1/reading/passages/r204/submit", { data: { answers: [1, 1, "好"], durationSec: 60 } }),
  );
  expect(res).toMatchObject({ correct: 3, total: 3, percent: 100 });
  expect(await data(await api.put("/api/v1/reading/passages/r204/saved", { data: { saved: true } }))).toEqual({
    saved: true,
  });
  const words = await data(await api.post("/api/v1/reading/passages/r204/words", { data: { words: ["公司"] } }));
  expect(words).toEqual({ added: ["公司"], skipped: [] });
  expect((await data(await api.get("/api/v1/reading/history"))) as unknown[]).toHaveLength(1);

  const other = await browser.newContext();
  await register(await other.newPage(), "Người Lạ", "rd-o");
  expect(await data(await other.request.get("/api/v1/reading"))).toMatchObject({ saved: [], history: [] });
  expect((await data(await other.request.get("/api/v1/reading/passages/r204"))).saved).toBe(false);
  await other.close();
});
