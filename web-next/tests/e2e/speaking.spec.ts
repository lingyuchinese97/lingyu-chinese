import { expect, test } from "@playwright/test";
import { resetRateLimit } from "./db";
import { register } from "./helpers";

test.beforeEach(() => resetRateLimit());

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dữ liệu JSON trả về từ API
const data = async (r: { json: () => Promise<any> }) => (await r.json()).data;

test("Luyện giao tiếp: tạo nhiều câu (pinyin + nghĩa tự sinh) → lọc / tìm → luyện trên vở ô ly → kiểm tra → chuyển câu không mất dữ liệu → sửa → xóa", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await register(page, "Người Nói", "sp");
  await page.goto("/speaking");
  await expect(page.getByRole("heading", { level: 1, name: "Luyện giao tiếp" })).toBeVisible();
  await expect(page.getByText("Chưa có câu hỏi nào.", { exact: false })).toBeVisible();

  // Tạo 2 câu hỏi một lần.
  await page.getByRole("link", { name: "Tạo câu hỏi" }).click();
  await expect(page).toHaveURL(/\/speaking\/new$/);
  const q1 = page.getByRole("group", { name: "Câu hỏi 1" });
  await q1.getByLabel("Câu hỏi (tiếng Trung)").fill("你周末喜欢做什么？");
  await q1.getByRole("button", { name: "Tự sinh pinyin + nghĩa" }).click();
  await expect(q1.getByLabel("Pinyin")).toHaveValue(/zhōu\s*mò/);
  await expect(q1.getByLabel("Nghĩa tiếng Việt")).not.toHaveValue("");
  await q1.getByLabel("Nghĩa tiếng Việt").fill("Cuối tuần bạn thích làm gì?");
  await q1.getByLabel("HSK").selectOption("1");
  await q1.getByLabel("Tag", { exact: true }).fill("Sở thích");
  await q1.getByLabel("Tag", { exact: true }).press("Enter");
  await q1.getByLabel("Tag", { exact: true }).fill("Cuối tuần");
  await q1.getByLabel("Tag", { exact: true }).press("Enter");
  await expect(q1.getByRole("button", { name: "Bỏ tag “Cuối tuần”" })).toBeVisible();

  await page.getByRole("button", { name: "Thêm câu hỏi" }).click();
  const q2 = page.getByRole("group", { name: "Câu hỏi 2" });
  await q2.getByLabel("Câu hỏi (tiếng Trung)").fill("你家有几口人？");
  await q2.getByLabel("HSK").selectOption("2");
  // Câu mới mang sẵn tag của câu trước — bỏ đi.
  await q2.getByRole("button", { name: "Bỏ tag “Sở thích”" }).click();
  await q2.getByRole("button", { name: "Bỏ tag “Cuối tuần”" }).click();
  await q2.getByLabel("Tag", { exact: true }).fill("Gia đình");
  await q2.getByLabel("Tag", { exact: true }).press("Enter");
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page).toHaveURL(/\/speaking(\?.*)?$/);
  await expect(page.getByText("Đã lưu 2 câu hỏi.")).toBeVisible();

  // Lọc theo HSK / tag và tìm kiếm.
  const list = page.getByRole("list", { name: "Danh sách câu hỏi" });
  const row1 = list.getByRole("link", { name: "Luyện câu “你周末喜欢做什么？”" });
  const row2 = list.getByRole("link", { name: "Luyện câu “你家有几口人？”" });
  await expect(row1).toBeVisible();
  await expect(row2).toBeVisible();
  const filters = page.getByRole("navigation", { name: "Lọc theo HSK / tag" });
  await filters.getByRole("button", { name: /^HSK2/ }).click();
  await expect(row1).toHaveCount(0);
  await expect(row2).toBeVisible();
  await expect(page).toHaveURL(/hsk=2/);
  await filters.getByRole("button", { name: /^Tất cả/ }).click();
  await expect(page).toHaveURL(/\/speaking$/);
  await filters.getByRole("button", { name: /^Sở thích/ }).click();
  await expect(page).toHaveURL(/tag=/);
  await expect(row2).toHaveCount(0);
  await expect(row1).toBeVisible();
  await filters.getByRole("button", { name: /^Tất cả/ }).click();
  await expect(page).toHaveURL(/\/speaking$/);
  await page.getByPlaceholder("Tìm câu hỏi", { exact: false }).fill("几口");
  await expect(row1).toHaveCount(0);
  await expect(row2).toBeVisible();
  await page.getByPlaceholder("Tìm câu hỏi", { exact: false }).fill("");
  await expect(row1).toBeVisible();

  // Mở màn luyện tập của câu 1.
  await row1.click();
  await expect(page).toHaveURL(/\/speaking\/[0-9a-f-]+$/);
  const firstUrl = page.url();
  await expect(page.getByRole("progressbar", { name: "Câu 1 / 2" })).toBeVisible();
  const qcard = page.locator("section[aria-labelledby=sp-q]");
  await expect(qcard.getByText("Cuối tuần bạn thích làm gì?")).toBeVisible();

  // Trả lời trên vở ô ly → pinyin + nghĩa của câu trả lời tự sinh, (loa chỉ hiện khi máy có giọng tiếng Trung).
  const answer = page.getByLabel("Câu trả lời (tiếng Trung)");
  await expect(answer).toHaveClass(/paper-lines/);
  await answer.fill("我周末喜欢看书。");
  await expect(page.getByLabel("Pinyin của câu trả lời")).toHaveValue(/kàn\s*shū/);
  await expect(page.getByLabel("Nghĩa tiếng Việt của câu trả lời")).not.toHaveValue("");
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page.getByText("Đã lưu câu trả lời.")).toBeVisible();

  // Mọi phần đều sửa được: nghĩa của câu trả lời (sửa tay → giữ sau khi tải lại), câu hỏi ngay trên thẻ, bỏ HSK.
  await page.getByLabel("Nghĩa tiếng Việt của câu trả lời").fill("Cuối tuần tôi thích đọc sách.");
  await expect(page.getByText("(đã sửa)")).toBeVisible();
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page.getByText("Đã lưu câu trả lời.").first()).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Nghĩa tiếng Việt của câu trả lời")).toHaveValue("Cuối tuần tôi thích đọc sách.");
  await expect(page.getByLabel("Pinyin của câu trả lời")).toHaveValue(/kàn\s*shū/);
  await qcard.getByRole("button", { name: "Sửa câu hỏi" }).click();
  await qcard.getByLabel("Nghĩa tiếng Việt").fill("Cuối tuần bạn hay làm gì?");
  await qcard.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page.getByText("Đã lưu câu hỏi.")).toBeVisible();
  await expect(qcard.getByText("Cuối tuần bạn hay làm gì?")).toBeVisible();
  await page.getByRole("button", { name: "Bỏ mức HSK1" }).click();
  await expect(page.getByRole("button", { name: "Bỏ mức HSK1" })).toHaveCount(0);

  // Gợi ý + kiểm tra (không có đáp án mẫu).
  await page.getByRole("button", { name: "Gợi ý" }).click();
  await expect(page.getByText("Gợi ý trả lời")).toBeVisible();
  await page.getByRole("button", { name: "Kiểm tra câu trả lời" }).click();
  await expect(page.getByRole("region", { name: /Nhận xét/ })).toBeVisible();

  // Thêm tag ngay trên màn luyện tập.
  await page.getByRole("button", { name: "Thêm tag" }).click();
  await page.getByLabel("Thêm tag").fill("Ôn lại");
  await page.getByLabel("Thêm tag").press("Enter");
  await expect(page.getByRole("button", { name: "Bỏ tag “Ôn lại”" })).toBeVisible();

  // Sang câu 2 rồi quay lại: câu trả lời (chưa bấm Lưu) vẫn còn.
  await page.getByRole("button", { name: "Câu tiếp theo" }).last().click();
  await expect(page.getByRole("progressbar", { name: "Câu 2 / 2" })).toBeVisible();
  await page.getByLabel("Câu trả lời (tiếng Trung)").fill("我家有三口人。");
  await page.getByRole("button", { name: "Câu trước" }).click();
  await expect(page).toHaveURL(firstUrl);
  await expect(page.getByLabel("Câu trả lời (tiếng Trung)")).toHaveValue("我周末喜欢看书。");
  await page.getByRole("button", { name: "Câu tiếp theo" }).last().click();
  await expect(page.getByLabel("Câu trả lời (tiếng Trung)")).toHaveValue("我家有三口人。");

  // Làm lại → xoá câu trả lời.
  await page.getByRole("button", { name: "Làm lại" }).click();
  await expect(page.getByLabel("Câu trả lời (tiếng Trung)")).toHaveValue("");

  // Sửa câu hỏi rồi xoá.
  await page.goto("/speaking");
  await list.getByRole("link", { name: "Sửa câu “你家有几口人？”" }).click();
  await expect(page).toHaveURL(/\/edit$/);
  await page.getByLabel("Nghĩa tiếng Việt").fill("Nhà bạn có mấy người?");
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page.getByText("Đã lưu câu hỏi.")).toBeVisible();
  await expect(list.getByText("Nhà bạn có mấy người?")).toBeVisible();
  await list.getByRole("button", { name: "Xóa câu “你家有几口人？”" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Xóa" }).click();
  await expect(page.getByText("Đã xóa câu hỏi.")).toBeVisible();
  await expect(row2).toHaveCount(0);
  await expect(row1).toBeVisible();
});

test("API Luyện giao tiếp: người lạ 401, người khác 404 / không thấy câu hỏi", async ({ browser, page }) => {
  await register(page, "Chủ Câu Hỏi", "spa");
  const r = await page.request.post("/api/v1/speaking/questions", {
    data: { questions: [{ zh: "你好吗？", meaning: "Bạn khỏe không?", hsk: 1, tags: ["Chào hỏi"] }] },
  });
  expect(r.status()).toBe(201);
  const q = { id: (await data(r)).ids[0] as string };
  const put = await page.request.put(`/api/v1/speaking/questions/${q.id}/answer`, { data: { answer: "我很好。" } });
  expect(put.ok()).toBe(true);
  expect((await data(put)).answerPinyin).toMatch(/hěn/);
  // Sửa tay pinyin / nghĩa của câu trả lời qua API.
  const edit = await page.request.put(`/api/v1/speaking/questions/${q.id}/answer`, {
    data: { answer: "我很好。", answerMeaning: "Tôi rất khỏe." },
  });
  expect((await data(edit)).answerMeaning).toBe("Tôi rất khỏe.");

  const anon = await browser.newContext();
  expect((await anon.request.get("/api/v1/speaking/questions")).status()).toBe(401);
  expect((await anon.request.get(`/api/v1/speaking/questions/${q.id}`)).status()).toBe(401);
  await anon.close();

  const other = await (await browser.newContext()).newPage();
  await register(other, "Người Khác", "spb");
  expect((await other.request.get(`/api/v1/speaking/questions/${q.id}`)).status()).toBe(404);
  expect(
    (await other.request.put(`/api/v1/speaking/questions/${q.id}/answer`, { data: { answer: "我" } })).status(),
  ).toBe(404);
  expect((await other.request.delete(`/api/v1/speaking/questions/${q.id}`)).status()).toBe(404);
  expect((await data(await other.request.get("/api/v1/speaking/questions"))).total).toBe(0);
  await other.goto(`/speaking/${q.id}`);
  await expect(other.getByText("我很好。")).toHaveCount(0);

  // Chủ vẫn còn câu hỏi + câu trả lời.
  const mine = await data(await page.request.get(`/api/v1/speaking/questions/${q.id}`));
  expect(mine.answer).toBe("我很好。");
});

test("Luyện giao tiếp trên màn rộng: danh sách bên trái, luyện tập bên phải", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await register(page, "Màn Rộng", "spw");
  const r = await page.request.post("/api/v1/speaking/questions", {
    data: {
      questions: [
        { zh: "你好吗？", hsk: 1 },
        { zh: "你叫什么名字？", hsk: 1 },
      ],
    },
  });
  const ids = (await data(r)).ids as string[];
  await page.goto("/speaking");
  const list = page.getByRole("list", { name: "Danh sách câu hỏi" });
  // Cột phải: câu đầu trang (mới nhất) đang được luyện.
  await expect(list.getByRole("link", { name: "Luyện câu “你叫什么名字？”" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByLabel("Câu trả lời (tiếng Trung)")).toBeVisible();
  await list.getByRole("link", { name: "Luyện câu “你好吗？”" }).click();
  await expect(page).toHaveURL(new RegExp(`/speaking/${ids[0]}$`));
  await expect(list).toBeVisible();
  await expect(list.getByRole("link", { name: "Luyện câu “你好吗？”" })).toHaveAttribute("aria-current", "page");
  await expect(page.locator("section[aria-labelledby=sp-q]").getByRole("heading", { name: "你好吗？" })).toBeVisible();
  await page.getByLabel("Câu trả lời (tiếng Trung)").fill("我很好。");
  await expect(page.getByLabel("Pinyin của câu trả lời")).toHaveValue(/hěn/);
});
