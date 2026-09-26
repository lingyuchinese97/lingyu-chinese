import { expect, test, type Page } from "@playwright/test";
import { resetRateLimit } from "./db";
import { register } from "./helpers";
import { FINALS, INITIALS, SANDHI_RULES } from "@/data/pronunciation";

/**
 * Âm thanh phát ra khớp chữ hiển thị: giả lập Web Speech API (có cả giọng Quảng Đông zh-HK lẫn Phổ thông zh-CN) và ghi lại
 * mỗi câu máy đọc — chữ gì, tốc độ, giọng nào — rồi so với giao diện.
 */
type Spoken = { text: string; rate: number; voice: string | null };

async function fakeSpeech(page: Page, voices: { lang: string; name: string }[]) {
  await page.addInitScript((vs) => {
    const w = window as unknown as Record<string, unknown>;
    w.__spoken = [];
    class Utterance {
      text: string;
      rate = 1;
      lang = "";
      voice: { lang: string } | null = null;
      onend: unknown = null;
      onerror: unknown = null;
      constructor(t: string) {
        this.text = t;
      }
    }
    w.SpeechSynthesisUtterance = Utterance;
    const synth = {
      getVoices: () => vs,
      speak: (u: Utterance) =>
        (w.__spoken as Spoken[]).push({ text: u.text, rate: u.rate, voice: u.voice ? u.voice.lang : null }),
      cancel: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
  }, voices);
}
/** Cùng công thức với `rateFor` (tốc độ đang chọn × hệ số của chế độ, làm tròn 2 chữ số). */
const r = (speed: number, factor: number) => Math.max(0.1, Math.round(speed * factor * 100) / 100);
const spoken = (page: Page) => page.evaluate(() => (window as unknown as { __spoken: Spoken[] }).__spoken.splice(0));

test.beforeEach(() => resetRateLimit());

test("âm thanh: đọc đúng chữ hiển thị, giọng Phổ thông (không Quảng Đông), tốc độ chậm 0,3 và chỉnh được", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "desktop", "Kiểm tra âm thanh chỉ cần chạy một lần");
  test.setTimeout(180_000);
  await fakeSpeech(page, [
    { lang: "zh-HK", name: "Sin-ji (Cantonese)" },
    { lang: "zh-CN", name: "Ting-Ting" },
  ]);
  await register(page, "Người Nghe Âm", "praud");

  // Mọi thanh mẫu + vận mẫu: nút Nghe hiện đúng chữ + pinyin của dữ liệu, và máy đọc đúng chữ đó.
  for (const [path, items] of [
    ["/pronunciation/initials", INITIALS],
    ["/pronunciation/finals", FINALS],
  ] as const) {
    await page.goto(path);
    for (const x of items) {
      const tile = page.getByRole("button", { name: `Xem âm ${x.symbol}`, exact: true });
      // Ô của âm hiện đúng âm tiết mà nút Nghe sẽ đọc.
      await expect(tile, x.symbol).toContainText(`${x.speak} ${x.speakPinyin}`);
      await tile.click();
      const detail = page.getByRole("region", { name: `Chi tiết âm ${x.symbol}` });
      const btn = detail.getByRole("button", { name: new RegExp(`^Nghe\\s*${x.speak}\\s*${x.speakPinyin}$`) });
      await expect(btn, x.symbol).toBeVisible();
      await btn.click();
      expect(await spoken(page), x.symbol).toEqual([{ text: x.speak, rate: 0.3, voice: "zh-CN" }]);
      // Ví dụ: đọc đúng từ đang hiển thị.
      const ex = x.examples[0]!;
      await detail
        .getByRole("button", { name: `Nghe: ${ex.hanzi}`, exact: true })
        .first()
        .click();
      expect(await spoken(page), `${x.symbol} ${ex.hanzi}`).toEqual([{ text: ex.hanzi, rate: 0.3, voice: "zh-CN" }]);
    }
  }

  // Đổi tốc độ → áp dụng ngay và được nhớ khi tải lại trang.
  const speed = page.getByLabel("Tốc độ đọc");
  await expect(speed).toHaveValue("0.3");
  await speed.selectOption("0.6");
  await page.reload();
  await expect(page.getByLabel("Tốc độ đọc")).toHaveValue("0.6");
  await page
    .getByRole("region", { name: /Chi tiết âm/ })
    .getByRole("button", { name: /^Nghe/ })
    .first()
    .click();
  expect((await spoken(page))[0]!.rate).toBe(0.6);
  await page.getByLabel("Tốc độ đọc").selectOption("0.3");

  // Thanh điệu: đọc đúng chữ của thẻ.
  await page.goto("/pronunciation/tones");
  await page
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name: /^Thanh 3/ }) })
    .getByRole("button", { name: "Nghe", exact: true })
    .click();
  expect(await spoken(page)).toEqual([{ text: "马", rate: 0.3, voice: "zh-CN" }]);

  // Biến điệu: trước = đọc từng chữ tách rời (chậm hơn), sau = đọc cả từ.
  await page.goto("/pronunciation/sandhi");
  const first = SANDHI_RULES[0]!.examples[0]!;
  await page.getByRole("button", { name: "Nghe từng chữ (trước biến điệu)" }).click();
  expect(await spoken(page)).toEqual([...first.hanzi].map((c) => ({ text: c, rate: r(0.3, 0.85), voice: "zh-CN" })));
  await page.getByRole("button", { name: "Nghe cả từ (sau biến điệu)" }).click();
  expect(await spoken(page)).toEqual([{ text: first.hanzi, rate: 0.3, voice: "zh-CN" }]);

  // Luyện tập: nút Nghe + Nghe chậm; sau khi trả lời, chữ hiện ra đúng là chữ vừa đọc.
  await page.goto("/pronunciation/practice");
  await page.getByRole("button", { name: "Nghe câu 1" }).click();
  const [played] = await spoken(page);
  expect(played).toMatchObject({ rate: 0.3, voice: "zh-CN" });
  await page.getByRole("button", { name: "Nghe chậm" }).click();
  expect(await spoken(page)).toEqual([{ text: played!.text, rate: r(0.3, 0.65), voice: "zh-CN" }]);
  await page.getByRole("radio").first().click();
  await page.getByRole("button", { name: "Kiểm tra đáp án" }).click();
  await expect(page.locator(".hanzi", { hasText: played!.text }).first()).toBeVisible();
});

test("âm thanh: máy chỉ có giọng Quảng Đông → ẩn nút Nghe (không đọc sai)", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Kiểm tra âm thanh chỉ cần chạy một lần");
  await fakeSpeech(page, [{ lang: "zh-HK", name: "Sin-ji" }]);
  await register(page, "Người Nghe HK", "praud-hk");
  await page.goto("/pronunciation/initials");
  await expect(page.getByRole("region", { name: "Chi tiết âm b" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Nghe\s*波/ })).toHaveCount(0);
  await page.goto("/pronunciation/practice");
  await expect(page.getByText("Thiết bị chưa có giọng đọc tiếng Trung")).toBeVisible();
  expect(await spoken(page)).toEqual([]);
});
