/**
 * Phần tính toán của PaddleOCR (PP-OCRv4, mô hình ONNX) — không phụ thuộc trình duyệt để test được trên Node.
 *   1. Phát hiện vùng chữ (DBNet): ảnh → bản đồ xác suất → các vùng chữ (hình chữ nhật).
 *   2. Nhận dạng từng vùng (CRNN + CTC): vùng ảnh cao 48px → chuỗi ký tự, kèm vị trí ngang của từng ký tự.
 *   3. Ghép các vùng thành dòng (theo toạ độ) để bộ tách từ (`ocr-parse.ts`) xử lý như văn bản thường.
 * Ảnh vào là RGBA (như ImageData). Mô hình được huấn luyện với ảnh BGR (OpenCV) nên kênh màu được xếp B, G, R.
 */

export type Pixels = { data: Uint8ClampedArray | Uint8Array; width: number; height: number };
export type Box = { x0: number; y0: number; x1: number; y1: number; score: number };
export type Tensor = { data: Float32Array; dims: [number, number, number, number] };
export type RecChar = { ch: string; t: number };
export type RecResult = { text: string; score: number; chars: RecChar[]; steps: number; width: number };

const DET_MEAN = [0.485, 0.456, 0.406];
const DET_STD = [0.229, 0.224, 0.225];
export const REC_H = 48;
const REC_MIN_W = 320;
const REC_MAX_W = 2400;

/** Lấy mẫu song tuyến một vùng (sx, sy, sw, sh) của ảnh về kích thước w × h; trả về kênh B, G, R (0–255). */
function sample(img: Pixels, sx: number, sy: number, sw: number, sh: number, w: number, h: number) {
  const out = new Float32Array(3 * w * h);
  const { data, width: W, height: H } = img;
  const plane = w * h;
  for (let y = 0; y < h; y++) {
    const fy = Math.min(H - 1, Math.max(0, sy + ((y + 0.5) * sh) / h - 0.5));
    const y0 = Math.floor(fy);
    const y1 = Math.min(H - 1, y0 + 1);
    const dy = fy - y0;
    for (let x = 0; x < w; x++) {
      const fx = Math.min(W - 1, Math.max(0, sx + ((x + 0.5) * sw) / w - 0.5));
      const x0 = Math.floor(fx);
      const x1 = Math.min(W - 1, x0 + 1);
      const dx = fx - x0;
      const a = (y0 * W + x0) * 4;
      const b = (y0 * W + x1) * 4;
      const c = (y1 * W + x0) * 4;
      const d = (y1 * W + x1) * 4;
      const i = y * w + x;
      for (let k = 0; k < 3; k++) {
        const v =
          (data[a + k]! * (1 - dx) + data[b + k]! * dx) * (1 - dy) + (data[c + k]! * (1 - dx) + data[d + k]! * dx) * dy;
        out[(2 - k) * plane + i] = v; // RGBA → B, G, R
      }
    }
  }
  return out;
}

/** Đầu vào mô hình phát hiện: cạnh dài ≤ `maxSide`, hai cạnh là bội của 32, chuẩn hoá mean / std. */
export function detInput(img: Pixels, maxSide = 960): Tensor & { scaleX: number; scaleY: number } {
  const k = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(32, Math.round((img.width * k) / 32) * 32);
  const h = Math.max(32, Math.round((img.height * k) / 32) * 32);
  const bgr = sample(img, 0, 0, img.width, img.height, w, h);
  const plane = w * h;
  for (let c = 0; c < 3; c++) {
    // Kênh c ở đây là B, G, R; PaddleOCR áp mean / std theo đúng thứ tự kênh của ảnh BGR.
    const m = DET_MEAN[c]!;
    const s = DET_STD[c]!;
    for (let i = 0; i < plane; i++) bgr[c * plane + i] = (bgr[c * plane + i]! / 255 - m) / s;
  }
  return { data: bgr, dims: [1, 3, h, w], scaleX: img.width / w, scaleY: img.height / h };
}

/**
 * Hậu xử lý DBNet: ngưỡng `thresh` → các vùng liên thông → hình chữ nhật bao, điểm = xác suất trung bình của vùng,
 * nới rộng theo tỉ lệ `unclip` (như PaddleOCR: d = diện tích × tỉ lệ / chu vi). Toạ độ theo ảnh gốc.
 */
export function dbBoxes(
  prob: Float32Array,
  w: number,
  h: number,
  opts: {
    scaleX: number;
    scaleY: number;
    imgW: number;
    imgH: number;
    thresh?: number;
    boxThresh?: number;
    unclip?: number;
  },
): Box[] {
  const thresh = opts.thresh ?? 0.3;
  const boxThresh = opts.boxThresh ?? 0.5;
  const unclip = opts.unclip ?? 1.6;
  const seen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  const boxes: Box[] = [];
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || prob[start]! <= thresh) continue;
    let top = 0;
    stack[top++] = start;
    seen[start] = 1;
    let x0 = w;
    let y0 = h;
    let x1 = -1;
    let y1 = -1;
    let sum = 0;
    let n = 0;
    while (top) {
      const p = stack[--top]!;
      const x = p % w;
      const y = (p - x) / w;
      sum += prob[p]!;
      n++;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      const nb = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
      for (const q of nb) {
        if (q < 0 || seen[q] || prob[q]! <= thresh) continue;
        seen[q] = 1;
        stack[top++] = q;
      }
    }
    const bw = x1 - x0 + 1;
    const bh = y1 - y0 + 1;
    if (Math.min(bw, bh) < 3 || n < 10) continue;
    const score = sum / n;
    if (score < boxThresh) continue;
    const d = (bw * bh * unclip) / (2 * (bw + bh));
    const bx0 = Math.max(0, (x0 - d) * opts.scaleX);
    const by0 = Math.max(0, (y0 - d) * opts.scaleY);
    const bx1 = Math.min(opts.imgW, (x1 + 1 + d) * opts.scaleX);
    const by1 = Math.min(opts.imgH, (y1 + 1 + d) * opts.scaleY);
    if (bx1 - bx0 < 4 || by1 - by0 < 4) continue;
    boxes.push({ x0: bx0, y0: by0, x1: bx1, y1: by1, score });
  }
  return boxes;
}

/** Đầu vào mô hình nhận dạng: vùng `box` cao 48px giữ tỉ lệ, đệm phải tới ≥ 320px, chuẩn hoá về [-1, 1]. */
export function recInput(img: Pixels, box: Box): Tensor & { resizedW: number } {
  const bw = box.x1 - box.x0;
  const bh = box.y1 - box.y0;
  const resizedW = Math.min(REC_MAX_W, Math.max(1, Math.ceil((REC_H * bw) / bh)));
  const width = Math.max(REC_MIN_W, resizedW);
  const part = sample(img, box.x0, box.y0, bw, bh, resizedW, REC_H);
  const out = new Float32Array(3 * REC_H * width); // phần đệm = 0 (xám giữa sau chuẩn hoá), như PaddleOCR
  for (let c = 0; c < 3; c++)
    for (let y = 0; y < REC_H; y++)
      for (let x = 0; x < resizedW; x++)
        out[c * REC_H * width + y * width + x] = part[c * REC_H * resizedW + y * resizedW + x]! / 127.5 - 1;
  return { data: out, dims: [1, 3, REC_H, width], resizedW };
}

/** Bộ ký tự của mô hình: dòng trong ppocr_keys_v1.txt; chỉ số 0 = "trống" (CTC), cuối cùng = dấu cách. */
export const parseKeys = (txt: string) => [
  ...txt
    .replace(/\r/g, "")
    .split("\n")
    .filter((l, i, a) => l || i < a.length - 1),
  " ",
];

/** Giải mã CTC tham lam: lấy ký tự xác suất cao nhất mỗi bước, bỏ "trống" và ký tự lặp liền nhau. */
export function ctcDecode(out: Float32Array, steps: number, classes: number, keys: string[], width = 0): RecResult {
  const chars: RecChar[] = [];
  let prev = -1;
  let sum = 0;
  for (let t = 0; t < steps; t++) {
    let best = 0;
    let bp = -Infinity;
    for (let c = 0; c < classes; c++) {
      const v = out[t * classes + c]!;
      if (v > bp) {
        bp = v;
        best = c;
      }
    }
    if (best !== 0 && best !== prev) {
      chars.push({ ch: keys[best - 1] ?? "", t });
      sum += bp;
    }
    prev = best;
  }
  return { text: chars.map((c) => c.ch).join(""), score: chars.length ? sum / chars.length : 0, chars, steps, width };
}

const HAN = /\p{Script=Han}/u;
export type Segment = { kind: "han" | "latin"; text: string; x0: number; x1: number };

/**
 * Chia kết quả một vùng thành đoạn chữ Hán / đoạn chữ Latin, kèm khoảng toạ độ ngang trên ảnh gốc (từ vị trí bước CTC).
 * Đoạn Latin được đọc lại bằng Tesseract tiếng Việt (mô hình Paddle không có dấu tiếng Việt).
 */
export function segments(r: RecResult, box: Box, resizedW: number): Segment[] {
  const groups: { kind: Segment["kind"]; text: string; t0: number; t1: number }[] = [];
  for (const c of r.chars) {
    const kind = HAN.test(c.ch) ? "han" : "latin";
    const last = groups[groups.length - 1];
    if (last && last.kind === kind) {
      last.text += c.ch;
      last.t1 = c.t;
    } else groups.push({ kind, text: c.ch, t0: c.t, t1: c.t });
  }
  const step = r.width / r.steps; // số px (ảnh đã resize) mỗi bước CTC
  const toX = (t: number) => box.x0 + (Math.min((t + 0.5) * step, resizedW) / resizedW) * (box.x1 - box.x0);
  // Ranh giới giữa hai đoạn: chữ Hán rộng hơn chữ Latin nên lệch về phía đoạn Latin (tránh cắt phải mép chữ Hán).
  const cut = (a: (typeof groups)[number], b: (typeof groups)[number]) => {
    const lo = a.t1;
    const hi = b.t0;
    return toX(a.kind === "han" ? lo + (hi - lo) * 0.75 : lo + (hi - lo) * 0.25);
  };
  return groups.map((g, i) => ({
    kind: g.kind,
    text: g.text,
    x0: i ? cut(groups[i - 1]!, g) : box.x0,
    x1: i < groups.length - 1 ? cut(g, groups[i + 1]!) : box.x1,
  }));
}

/** Một vùng đã nhận dạng: `text` = bản đọc tốt nhất (phần Latin có dấu), `alt` = bản gốc của Paddle (không dấu). */
export type RecItem = { box: Box; text: string; alt?: string };
export type LineCell = { text: string; alt: string; x0: number; x1: number };

/**
 * Ghép các vùng đã nhận dạng thành dòng: cùng dòng nếu tâm theo chiều dọc gần nhau (≤ nửa chiều cao), trái → phải.
 * Giữ toạ độ ngang để bộ tách từ nhận ra cột (pinyin, nghĩa) ở ảnh dạng bảng.
 */
export function groupLines(items: RecItem[]): LineCell[][] {
  const sorted = items
    .filter((i) => i.text.trim() || i.alt?.trim())
    .map((i) => ({ ...i, cy: (i.box.y0 + i.box.y1) / 2, h: i.box.y1 - i.box.y0 }))
    .sort((a, b) => a.cy - b.cy);
  const lines: (typeof sorted)[] = [];
  for (const it of sorted) {
    const line = lines[lines.length - 1];
    const ref = line?.[0];
    if (line && ref && Math.abs(it.cy - ref.cy) <= Math.min(it.h, ref.h) / 2) line.push(it);
    else lines.push([it]);
  }
  return lines.map((l) =>
    l
      .sort((a, b) => a.box.x0 - b.box.x0)
      .map((i) => ({ text: i.text.trim(), alt: (i.alt ?? i.text).trim(), x0: i.box.x0, x1: i.box.x1 })),
  );
}

/** Văn bản nhiều dòng; các vùng trên cùng dòng ngăn bằng " | " (để xem / gỡ lỗi). */
export const joinLines = (items: RecItem[]) =>
  groupLines(items)
    .map((l) => l.map((c) => c.text).join(" | "))
    .join("\n");
