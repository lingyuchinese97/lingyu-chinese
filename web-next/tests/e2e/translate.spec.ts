import { expect, test } from "@playwright/test";
import { T_ITEMS } from "../../src/data/translation/items";
import { register } from "./helpers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data = async (r: { json: () => Promise<any> }) => (await r.json()).data;
/** Đáp án tiếng Trung của một đề Việt → Trung (tra trong kho câu mẫu). */
const zhOf = (vi: string) => T_ITEMS.find((i) => i.vi[0] === vi)!.zh;

test("Luyện dịch: tạo bài theo ngữ pháp → gợi ý → chấm + giải thích → lưu kho câu → tạm dừng → nộp → lịch sử, kho câu mẫu", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await register(page, "Người Dịch", "tr");
  await page.goto("/translate");
  await expect(page.getByRole("heading", { level: 1, name: "Luyện dịch" })).toBeVisible();

  await page.getByRole("radio", { name: /Theo ngữ pháp/ }).click();
  await expect(page.getByRole("button", { name: "Bắt đầu luyện dịch" })).toBeDisabled();
  await page.getByRole("checkbox", { name: /So sánh hơn với 比/ }).check();
  await expect(page.getByText("Đã chọn 1 điểm ngữ pháp")).toBeVisible();
  await page.getByRole("radio", { name: "5 câu", exact: true }).click();
  await page.getByRole("button", { name: "Bắt đầu luyện dịch" }).click();
  await expect(page).toHaveURL(/\/translate\/session$/);
  await expect(page.getByText("Câu 1 / 2")).toBeVisible();
  await expect(page.getByRole("timer")).toBeVisible();

  // Gợi ý 2 bước.
  await page.getByRole("button", { name: "Gợi ý (0/2)" }).click();
  await expect(page.getByText("Từ khoá", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Gợi ý thêm (1/2)" }).click();
  await expect(page.getByText("Cấu trúc gợi ý")).toBeVisible();

  await expect(page.getByText("Dịch sang tiếng Trung")).toBeVisible();
  const vi1 = (await page.locator("#tr-prompt-text").textContent())!;
  await page.getByLabel("Bản dịch của bạn").fill(zhOf(vi1).replace("。", ""));
  await page.getByRole("button", { name: "Kiểm tra" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Chính xác!" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Giải thích cấu trúc ngữ pháp" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Phân tích từ" })).toBeVisible();
  await page.getByRole("button", { name: "Lưu vào kho câu" }).click();
  await expect(page.getByText("Đã lưu vào Kho câu của tôi.").first()).toBeVisible();

  await page.getByRole("button", { name: "Câu tiếp theo" }).click();
  await expect(page.getByText("Câu 2 / 2")).toBeVisible();
  // Tạm dừng: ẩn đề, đồng hồ dừng.
  await page.getByRole("button", { name: "Tạm dừng" }).click();
  await expect(page.getByRole("heading", { name: "Đang tạm dừng" })).toBeVisible();
  await expect(page.getByLabel("Bản dịch của bạn")).toHaveCount(0);
  await page.getByRole("button", { name: "Tiếp tục" }).first().click();
  await page.getByLabel("Bản dịch của bạn").fill("我");
  await page.getByRole("button", { name: "Kiểm tra" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Chưa đúng" })).toBeVisible();
  await page.getByRole("button", { name: "Tính là đúng" }).click();
  await expect(page.getByText("Đã tính là đúng")).toBeVisible();

  // Tải lại vẫn giữ bài.
  await page.reload();
  await expect(page.getByText("Câu 2 / 2")).toBeVisible();
  await page.getByRole("button", { name: "Nộp bài" }).click();
  await expect(page).toHaveURL(/\/translate\/result\/[0-9a-f-]+$/);
  await expect(page.getByRole("heading", { level: 1, name: "Kết quả luyện dịch" })).toBeVisible();
  await expect(page.getByText("2/2 đúng").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Chi tiết từng câu" })).toBeVisible();

  // Lịch sử + Tiến độ học tập.
  await page.getByRole("link", { name: "Luyện bài mới" }).click();
  await expect(page.getByRole("region", { name: "Lịch sử luyện dịch" }).getByText(/2\/2 đúng/)).toBeVisible();
  await page.goto("/progress/history");
  await expect(page.getByText(/Luyện dịch/).first()).toBeVisible();

  // Câu đã lưu nằm trong Kho câu của tôi; menu vẫn chọn Luyện dịch.
  await page.goto("/sentences");
  await expect(page.getByText(zhOf(vi1)).filter({ visible: true }).first()).toBeVisible();

  // Kho câu mẫu: lọc + mở giải thích.
  await page.goto("/translate/bank");
  await expect(page.getByRole("heading", { level: 1, name: "Kho câu mẫu" })).toBeVisible();
  await page.getByPlaceholder("Tìm theo chữ Hán, pinyin hoặc nghĩa").fill("咖啡");
  await expect(page.getByText(/^\d+ câu$/)).toBeVisible();
  await page.getByRole("button", { name: /我不喜欢喝咖啡/ }).click();
  await expect(page.getByRole("heading", { name: "Giải thích cấu trúc ngữ pháp" })).toBeVisible();
});

test("API Luyện dịch: 401, tạo bài, không lộ đáp án, chấm, 404 với người khác, lưu kho câu (409 khi trùng)", async ({
  page,
  browser,
}, info) => {
  test.skip(info.project.name !== "desktop", "API chỉ cần chạy một lần");
  const anon = await browser.newContext();
  for (const [m, u] of [
    ["get", "/api/v1/translation"],
    ["get", "/api/v1/translation/bank"],
    ["post", "/api/v1/translation/sessions"],
    ["get", "/api/v1/translation/sessions/active"],
    ["get", "/api/v1/translation/history"],
    ["post", "/api/v1/translation/bank/s001/save"],
  ] as const)
    expect((await anon.request[m](u, m === "post" ? { data: {} } : undefined)).status(), u).toBe(401);
  await anon.close();

  await register(page, "Người Gọi API", "tr-api");
  const api = page.request;
  const info0 = await data(await api.get("/api/v1/translation"));
  expect(info0).toMatchObject({ level: 1, active: null, history: [] });
  expect((await data(await api.get("/api/v1/translation/bank?grammar=bi"))) as unknown[]).not.toHaveLength(0);
  expect((await api.get("/api/v1/translation/bank/nope")).status()).toBe(404);
  expect((await api.post("/api/v1/translation/sessions", { data: { source: "grammar" } })).status()).toBe(400);
  expect((await api.post("/api/v1/translation/sessions", { data: { source: "vocab" } })).status()).toBe(409);

  const created = await api.post("/api/v1/translation/sessions", {
    data: { direction: "to-zh", level: 1, count: 2 },
  });
  expect(created.status()).toBe(201);
  const s = (await data(created)) as { id: string; questions: { prompt: { text: string } }[] };
  const raw = JSON.stringify(s);
  const ans = zhOf(s.questions[0]!.prompt.text);
  expect(raw.includes(ans)).toBe(false);
  expect(raw.includes("reveal")).toBe(false);

  const base = `/api/v1/translation/sessions/${s.id}`;
  expect((await api.post(`${base}/complete`, { data: {} })).status()).toBe(400);
  const a1 = (await data(await api.post(`${base}/answer`, { data: { index: 0, answer: ans, elapsedSec: 10 } }))) as {
    questions: { result: string; reveal: { grammar: unknown[] } }[];
  };
  expect(a1.questions[0]).toMatchObject({ result: "correct" });
  expect(a1.questions[0]!.reveal.grammar.length).toBeGreaterThan(0);
  expect((await data(await api.post(`${base}/hint`, { data: { index: 1 } }))).questions[1].hints).toBe(1);
  expect((await api.post(`${base}/answer`, { data: { index: 9, answer: "x" } })).status()).toBe(400);

  // Người khác: không xem / không trả lời được bài của tôi.
  const other = await browser.newContext();
  await register(await other.newPage(), "Người Lạ", "tr-o");
  expect((await other.request.get(base)).status()).toBe(404);
  expect((await other.request.post(`${base}/answer`, { data: { index: 1, answer: "x" } })).status()).toBe(404);
  expect((await other.request.get("/api/v1/translation/sessions/not-a-uuid")).status()).toBe(404);
  expect(await data(await other.request.get("/api/v1/translation/history"))).toEqual([]);
  await other.close();

  await api.post(`${base}/skip`, { data: { index: 1 } });
  expect(await data(await api.post(`${base}/time`, { data: { elapsedSec: 5 } }))).toEqual({ elapsedSec: 10 });
  const done = await data(await api.post(`${base}/complete`, { data: { elapsedSec: 60 } }));
  expect(done).toMatchObject({ status: "completed", correctCount: 1, skippedCount: 1, elapsedSec: 60 });
  expect((await data(await api.get("/api/v1/translation/history"))) as unknown[]).toHaveLength(1);

  expect((await api.post("/api/v1/translation/bank/s019/save")).status()).toBe(201);
  expect((await api.post("/api/v1/translation/bank/s019/save")).status()).toBe(409);
});
