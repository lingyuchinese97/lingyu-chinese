/**
 * Nhận dạng chữ trong ảnh ngay trên trình duyệt — ảnh không rời máy người dùng, không gọi dịch vụ ngoài.
 *   - Chữ Hán: PaddleOCR PP-OCRv4 (mô hình ONNX, chạy bằng onnxruntime-web / WebAssembly) — đọc tốt cả chữ viết tay,
 *     ảnh vở ô li, chữ nhỏ; Tesseract đọc sai hẳn loại ảnh này.
 *   - Phần chữ Latin (pinyin, nghĩa tiếng Việt) trong mỗi vùng: cắt riêng và đọc bằng Tesseract tiếng Việt
 *     (mô hình Paddle không có dấu thanh / dấu tiếng Việt). Không tải được Tesseract → dùng kết quả Paddle.
 * Mọi file (mô hình, WASM, dữ liệu ngôn ngữ) tự host ở /ocr. Nạp lười: chỉ tải khi nhận dạng ảnh đầu tiên.
 */
import type { InferenceSession } from "onnxruntime-web";
import type { Worker } from "tesseract.js";
import {
  ctcDecode,
  dbBoxes,
  detInput,
  groupLines,
  parseKeys,
  recInput,
  segments,
  type Box,
  type LineCell,
  type Pixels,
  type RecItem,
} from "@/lib/paddle-ocr";

type Progress = (p: { stage: "load" | "recognize"; value: number }) => void;
type Paddle = { ort: typeof import("onnxruntime-web"); det: InferenceSession; rec: InferenceSession; keys: string[] };

const BASE = "/ocr/paddle/";
/** Kích thước xấp xỉ (byte) để báo tiến độ tải khi máy chủ không gửi Content-Length. */
const FILES = [
  ["ch_PP-OCRv4_det_infer.onnx", 4_745_517],
  ["ch_PP-OCRv4_rec_infer.onnx", 10_822_323],
] as const;
/** Tối đa số vùng chữ xử lý mỗi ảnh (ảnh danh sách từ vựng hiếm khi vượt quá). */
const MAX_BOXES = 150;

let listener: Progress | null = null;
let paddleP: Promise<Paddle> | null = null;
let tessP: Promise<Worker | null> | null = null;

async function fetchAll(onBytes: (n: number) => void): Promise<ArrayBuffer[]> {
  return Promise.all(
    FILES.map(async ([name]) => {
      const r = await fetch(BASE + name);
      if (!r.ok || !r.body) throw new Error(`OCR model ${name}: HTTP ${r.status}`);
      const reader = r.body.getReader();
      const parts: Uint8Array[] = [];
      let size = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        parts.push(value);
        size += value.length;
        onBytes(value.length);
      }
      const out = new Uint8Array(size);
      let o = 0;
      for (const p of parts) {
        out.set(p, o);
        o += p.length;
      }
      return out.buffer;
    }),
  );
}

function getPaddle() {
  paddleP ??= (async () => {
    const ort = await import("onnxruntime-web/wasm");
    ort.env.wasm.wasmPaths = { wasm: "/ocr/ort/ort-wasm-simd-threaded.wasm" };
    // Không bật đa luồng: cần cross-origin isolation (COEP), app không bật để giữ YouTube / ảnh ngoài.
    ort.env.wasm.numThreads = 1;
    const total = FILES.reduce((s, [, n]) => s + n, 0);
    let got = 0;
    const [detBuf, recBuf] = await fetchAll((n) => {
      got += n;
      listener?.({ stage: "load", value: Math.min(0.95, got / total) });
    });
    const keysTxt = await (await fetch(BASE + "ppocr_keys_v1.txt")).text();
    const opts = { executionProviders: ["wasm"], graphOptimizationLevel: "all" } as const;
    const det = await ort.InferenceSession.create(new Uint8Array(detBuf!), opts);
    const rec = await ort.InferenceSession.create(new Uint8Array(recBuf!), opts);
    return { ort, det, rec, keys: parseKeys(keysTxt) };
  })().catch((e) => {
    paddleP = null;
    throw e;
  });
  return paddleP;
}

/** Tesseract tiếng Việt, đọc một dòng — chỉ dùng cho phần chữ Latin. Lỗi → null (dùng kết quả Paddle). */
function getTesseract() {
  tessP ??= import("tesseract.js")
    .then(async ({ createWorker, OEM, PSM }) => {
      const w = await createWorker(["vie"], OEM.LSTM_ONLY, {
        workerPath: "/ocr/worker.min.js",
        corePath: "/ocr/core",
        langPath: "/ocr/lang",
        workerBlobURL: false,
      });
      await w.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_LINE });
      return w;
    })
    .catch((e: unknown) => {
      console.warn("[ocr] tesseract:", e);
      tessP = null;
      return null;
    });
  return tessP;
}

/** Ảnh → điểm ảnh RGBA; ảnh quá lớn thu nhỏ cạnh dài về 2400px (đủ nét, nhanh hơn nhiều). */
async function toPixels(img: Blob): Promise<{ px: Pixels; canvas: HTMLCanvasElement }> {
  const bmp = await createImageBitmap(img);
  const k = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(bmp.width * k));
  c.height = Math.max(1, Math.round(bmp.height * k));
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
  return { px: { data, width, height }, canvas: c };
}

function crop(src: HTMLCanvasElement, x0: number, y0: number, x1: number, y1: number) {
  const pad = 2;
  const sx = Math.max(0, Math.floor(x0) - pad);
  const sy = Math.max(0, Math.floor(y0) - pad);
  const w = Math.min(src.width - sx, Math.ceil(x1 - x0) + 2 * pad);
  const h = Math.min(src.height - sy, Math.ceil(y1 - y0) + 2 * pad);
  const c = document.createElement("canvas");
  c.width = Math.max(1, w);
  c.height = Math.max(1, h);
  c.getContext("2d")!.drawImage(src, sx, sy, w, h, 0, 0, w, h);
  return c;
}

/** Bỏ ký tự rác ở hai đầu do cắt sát mép chữ bên cạnh ("_xièxie", ": píngguǒ"). */
const trimJunk = (s: string) => s.replace(/^[^\p{L}\p{N}(“"]+|[^\p{L}\p{N})”".]+$/gu, "").replace(/\s+/g, " ");

/**
 * Chọn chữ cho một đoạn Latin: Tesseract đủ chắc (≥ 60) → dùng (giữ dấu); không thì dùng bản của Paddle nếu vùng đó
 * nhận dạng rất chắc (không dấu); còn lại (thường là chữ viết tay) → bỏ trống để server gợi ý pinyin / nghĩa từ từ điển.
 */
function latinText(d: { text: string; confidence: number } | null, paddle: string, paddleScore: number) {
  const read = d ? trimJunk(d.text) : "";
  if (read && d!.confidence >= 60) return read;
  return paddleScore >= 0.85 ? trimJunk(paddle) : "";
}

/** Giữ ngoặc ở đầu / cuối đoạn theo bản Paddle khi bản Tesseract làm mất: "）shuiguo" → ") shuǐguǒ". */
function keepBrackets(paddle: string, read: string) {
  if (!read) return read;
  const lead = /^[\s(（)）]*/u.exec(paddle)![0].replace(/\s/g, "");
  const tail = /[\s(（)）]*$/u.exec(paddle)![0].replace(/\s/g, "");
  return `${lead && !/^[(（)）]/u.test(read) ? `${lead} ` : ""}${read}${tail && !/[(（)）]$/u.test(read) ? ` ${tail}` : ""}`;
}

/** Nhận dạng ảnh → các dòng, mỗi dòng gồm các ô (vùng chữ) trái → phải, kèm toạ độ ngang. */
export async function recognizeImage(img: Blob, onProgress?: Progress): Promise<LineCell[][]> {
  listener = onProgress ?? null;
  try {
    listener?.({ stage: "load", value: 0 });
    const [{ px, canvas }, p] = await Promise.all([toPixels(img), getPaddle()]);
    const { ort, det, rec, keys } = p;
    listener?.({ stage: "recognize", value: 0 });

    const di = detInput(px);
    const dout = await det.run({ [det.inputNames[0]!]: new ort.Tensor("float32", di.data, di.dims) });
    const map = dout[det.outputNames[0]!]!;
    const [, , mh, mw] = map.dims as number[];
    const boxes: Box[] = dbBoxes(map.data as Float32Array, mw!, mh!, {
      scaleX: di.scaleX,
      scaleY: di.scaleY,
      imgW: px.width,
      imgH: px.height,
    }).slice(0, MAX_BOXES);

    const items: RecItem[] = [];
    let tess: Worker | null | undefined;
    for (const [i, box] of boxes.entries()) {
      const ri = recInput(px, box);
      const out = (await rec.run({ [rec.inputNames[0]!]: new ort.Tensor("float32", ri.data, ri.dims) }))[
        rec.outputNames[0]!
      ]!;
      const [, steps, classes] = out.dims as number[];
      const r = ctcDecode(out.data as Float32Array, steps!, classes!, keys, ri.dims[3]);
      if (r.score < 0.5 || !r.text.trim()) continue;
      let text = "";
      for (const sg of segments(r, box, ri.resizedW)) {
        // Chữ Hán, hoặc đoạn chỉ có dấu câu / ngoặc / số ("（", "1."): giữ nguyên bản Paddle (Tesseract hay bỏ ngoặc,
        // mà ngoặc cần để nhận ra nhãn từ loại "（动）").
        if (sg.kind === "han" || !/\p{L}/u.test(sg.text) || sg.x1 - sg.x0 < 6) {
          text += sg.kind === "han" ? sg.text : ` ${sg.text} `;
          continue;
        }
        tess ??= await getTesseract();
        const d = tess ? (await tess.recognize(crop(canvas, sg.x0, box.y0, sg.x1, box.y1))).data : null;
        text += ` ${keepBrackets(sg.text, latinText(d, sg.text, r.score))} `;
      }
      items.push({ box, text: text.replace(/\s+/g, " ").trim(), alt: r.text });
      listener?.({ stage: "recognize", value: (i + 1) / boxes.length });
    }
    return groupLines(items);
  } finally {
    listener = null;
  }
}
