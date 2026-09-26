import { describe, expect, it } from "vitest";
import { compareDictation, normalizeSpans, plainOf, reformat, summarize, tokenize } from "@/lib/dictation-compare";

const view = (ref: string, ans: string) =>
  compareDictation(ref, ans)
    .parts.map((p) =>
      p.kind === "missing" ? `[-${p.text}]` : p.status === "neutral" ? p.text : `${p.status[0]}:${p.text}`,
    )
    .join("|");

describe("tách chữ", () => {
  it("chữ Hán từng chữ, chữ Latin theo từ, bỏ dấu câu / khoảng trắng", () => {
    expect(tokenize("你好，Nǐ hǎo!").map((t) => t.key)).toEqual(["你", "好", "nǐ", "hǎo"]);
  });
});

describe("so sánh bài chép chính tả", () => {
  it("khớp hoàn toàn (bỏ qua dấu câu full-width / half-width và khoảng trắng)", () => {
    const c = compareDictation("你好，我是小雨。", "你好, 我是小雨");
    expect(summarize(c)).toEqual({ correct: 6, wrong: 0, missing: 0, extra: 0, total: 6, percent: 100 });
  });

  it("sai: 我叫 thay vì 我是 → 叫 đỏ, biết chữ đúng là 是", () => {
    const c = compareDictation("你好，我是小雨。", "你好，我叫小雨。");
    expect(summarize(c)).toMatchObject({ correct: 5, wrong: 1, missing: 0, extra: 0, total: 6, percent: 83 });
    expect(view("你好，我是小雨。", "你好，我叫小雨。")).toBe("c:你好|，|c:我|w:叫|c:小雨|。");
    const w = c.parts.find((p) => p.kind === "text" && p.status === "wrong");
    expect(w).toMatchObject({ text: "叫", expected: "是", start: 4, end: 5 });
  });

  it("thiếu và thừa", () => {
    expect(view("我是小雨", "我小雨")).toBe("c:我|[-是]|c:小雨");
    expect(summarize(compareDictation("我是小雨", "我小雨"))).toMatchObject({ correct: 3, missing: 1, percent: 75 });
    expect(view("我是小雨", "我是是小雨")).toBe("c:我是|e:是|c:小雨");
    expect(view("你好。", "你")).toBe("c:你|[-好]");
    expect(view("你好", "")).toBe("[-你好]");
  });

  it("sửa lại cho đúng → hết đỏ (so sánh chạy lại trên nội dung mới)", () => {
    expect(
      compareDictation("你好，我是小雨。", "你好，我是小雨。").parts.every(
        (p) => p.kind === "text" && p.status !== "wrong",
      ),
    ).toBe(true);
  });

  it("pinyin: theo từ, không phân biệt hoa/thường nhưng phân biệt dấu thanh", () => {
    expect(view("Nǐ hǎo, wǒ shì Xiǎoyǔ.", "ni hǎo, wǒ jiào xiǎoyǔ.")).toBe(
      "w:ni| |c:hǎo|, |c:wǒ| |w:jiào| |c:xiǎoyǔ|.",
    );
  });

  it("vị trí (start/end) khớp văn bản gốc để tô trong ô soạn", () => {
    const ans = "你好，我叫小雨。";
    for (const p of compareDictation("你好，我是小雨。", ans).parts)
      if (p.kind === "text") expect(ans.slice(p.start, p.end)).toBe(p.text);
  });

  it("đáp án rỗng → 0%", () => {
    expect(summarize(compareDictation("", "abc"))).toMatchObject({ total: 0, percent: 0, extra: 1 });
  });

  it("bài dài 2000 chữ vẫn nhanh", () => {
    const ref = "我是小雨你好".repeat(333);
    const ans = ref.slice(0, 1000) + "叫" + ref.slice(1001);
    const t = performance.now();
    expect(compareDictation(ref, ans).wrong).toBe(1);
    const shuffled = [...ref].reverse().join("");
    compareDictation(ref, shuffled);
    expect(performance.now() - t).toBeLessThan(1500);
  });
});

describe("định dạng người dùng tự tô", () => {
  const spans = [{ text: "你好，" }, { text: "我叫", color: "red" as const }, { text: "小雨", highlight: true }];

  it("gộp đoạn cùng định dạng, bỏ thuộc tính mặc định", () => {
    expect(
      normalizeSpans([{ text: "a", color: "black" }, { text: "b" }, { text: "" }, { text: "c", color: "red" }]),
    ).toEqual([{ text: "ab" }, { text: "c", color: "red" }]);
  });

  it("sửa chữ: giữ định dạng của chữ còn lại, chữ mới mặc định", () => {
    const next = reformat(spans, "你好，我是小雨！");
    expect(plainOf(next)).toBe("你好，我是小雨！");
    expect(next).toEqual([
      { text: "你好，" },
      { text: "我", color: "red" },
      { text: "是" },
      { text: "小雨", highlight: true },
      { text: "！" },
    ]);
  });

  it("không đổi chữ → giữ nguyên", () => {
    expect(reformat(spans, "你好，我叫小雨")).toEqual(normalizeSpans(spans));
  });
});
