import { describe, expect, it } from "vitest";
import { ctcDecode, dbBoxes, detInput, joinLines, parseKeys, recInput, segments, type Box } from "@/lib/paddle-ocr";

const solid = (w: number, h: number, rgb: [number, number, number]) => {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) data.set([...rgb, 255], i * 4);
  return { data, width: w, height: h };
};
/** Đầu ra giả của mô hình nhận dạng: mỗi bước một lớp có xác suất 0.9. */
function logits(seq: number[], classes: number) {
  const out = new Float32Array(seq.length * classes).fill(0.01);
  seq.forEach((c, t) => (out[t * classes + c] = 0.9));
  return out;
}

describe("PaddleOCR — tiền xử lý", () => {
  it("ảnh phát hiện: cạnh dài ≤ 960, bội của 32, kênh B-G-R chuẩn hoá mean / std", () => {
    const t = detInput(solid(1621, 327, [255, 0, 0]));
    const [, c, h, w] = t.dims;
    expect([c, w % 32, h % 32]).toEqual([3, 0, 0]);
    expect(Math.max(w, h)).toBeLessThanOrEqual(960);
    // Đỏ thuần: kênh B = 0, kênh R (cuối) = 255.
    expect(t.data[0]).toBeCloseTo((0 - 0.485) / 0.229, 3);
    expect(t.data[2 * w * h]).toBeCloseTo((1 - 0.406) / 0.225, 3);
    expect(t.scaleX).toBeCloseTo(1621 / w, 5);
  });
  it("ảnh nhận dạng: cao 48, đệm tới ≥ 320, giá trị trong [-1, 1], phần đệm = 0", () => {
    const img = solid(200, 50, [255, 255, 255]);
    const r = recInput(img, { x0: 0, y0: 0, x1: 100, y1: 50, score: 1 });
    expect(r.dims).toEqual([1, 3, 48, 320]);
    expect(r.resizedW).toBe(96);
    expect(r.data[0]).toBeCloseTo(1, 5);
    expect(r.data[200]).toBe(0);
  });
});

describe("PaddleOCR — hậu xử lý", () => {
  it("DBNet: vùng liên thông đủ chắc → hình chữ nhật (nới rộng, theo toạ độ ảnh gốc); vùng mờ / quá nhỏ bị bỏ", () => {
    const w = 64;
    const h = 32;
    const prob = new Float32Array(w * h);
    for (let y = 10; y < 20; y++) for (let x = 5; x < 30; x++) prob[y * w + x] = 0.9; // chữ rõ
    for (let y = 10; y < 20; y++) for (let x = 40; x < 60; x++) prob[y * w + x] = 0.35; // vượt ngưỡng nhưng mờ
    prob[2 * w + 2] = 0.99; // 1 điểm nhiễu
    const boxes = dbBoxes(prob, w, h, { scaleX: 2, scaleY: 2, imgW: 128, imgH: 64 });
    expect(boxes).toHaveLength(1);
    const b = boxes[0]!;
    expect(b.x0).toBeLessThan(10);
    expect(b.x1).toBeGreaterThan(60);
    expect(b.y0).toBeLessThan(20);
    expect(b.y1).toBeGreaterThan(40);
    expect(b.score).toBeCloseTo(0.9, 5);
  });
  it("CTC: bỏ 'trống' và ký tự lặp liền nhau, giữ ký tự lặp cách nhau bởi 'trống'; dấu cách là lớp cuối", () => {
    const keys = parseKeys("你\n好\na\n");
    expect(keys).toEqual(["你", "好", "a", " "]);
    const C = keys.length + 1;
    const r = ctcDecode(logits([1, 1, 0, 2, 0, 2, 4, 3, 3], C), 9, C, keys, 72);
    expect(r.text).toBe("你好好 a");
    expect(r.chars.map((c) => c.t)).toEqual([0, 3, 5, 6, 7]);
    expect(r.score).toBeCloseTo(0.9, 5);
  });
  it("chia vùng thành đoạn chữ Hán / chữ Latin kèm toạ độ ngang; ranh giới lệch về phía chữ Latin", () => {
    const keys = parseKeys("公\n斤\nk\ng\n");
    const C = keys.length + 1;
    // 10 bước, ảnh resize rộng 80px (8px / bước) ↔ vùng gốc 0..160.
    const r = ctcDecode(logits([1, 0, 2, 0, 0, 0, 0, 3, 0, 4], C), 10, C, keys, 80);
    const box: Box = { x0: 0, y0: 0, x1: 160, y1: 30, score: 1 };
    const s = segments(r, box, 80);
    expect(s.map((x) => [x.kind, x.text])).toEqual([
      ["han", "公斤"],
      ["latin", "kg"],
    ]);
    expect(s[0]!.x0).toBe(0);
    expect(s[1]!.x1).toBe(160);
    expect(s[1]!.x0).toBe(s[0]!.x1);
    expect(s[1]!.x0).toBeGreaterThan(((2 + 7) / 2) * 16);
  });
  it("ghép vùng thành dòng: cùng hàng → trái sang phải, ngăn bằng ' | '; khác hàng → xuống dòng", () => {
    const b = (x0: number, y0: number, x1: number, y1: number): Box => ({ x0, y0, x1, y1, score: 1 });
    const text = joinLines([
      { box: b(400, 102, 500, 140), text: "公斤" },
      { box: b(10, 100, 120, 142), text: "公斤" },
      { box: b(10, 10, 200, 50), text: "你好 nǐ hǎo" },
      { box: b(10, 200, 100, 230), text: " " },
    ]);
    expect(text).toBe("你好 nǐ hǎo\n公斤 | 公斤");
  });
});
