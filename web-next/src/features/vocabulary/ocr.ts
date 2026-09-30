/**
 * Nhận dạng chữ trong ảnh ngay trên trình duyệt (tesseract.js, tiếng Trung giản thể + tiếng Việt).
 * Mọi file (worker, WASM, dữ liệu ngôn ngữ) tự host ở /ocr — ảnh không rời máy người dùng, không gọi dịch vụ ngoài.
 * Nạp lười: chỉ tải khi người dùng nhận dạng ảnh đầu tiên; các lần sau dùng lại worker.
 */
import type { Worker } from "tesseract.js";

type Progress = (p: { stage: "load" | "recognize"; value: number }) => void;
let listener: Progress | null = null;
let workerP: Promise<Worker> | null = null;

function getWorker() {
  workerP ??= import("tesseract.js")
    .then(({ createWorker, OEM }) =>
      createWorker(["chi_sim", "vie"], OEM.LSTM_ONLY, {
        workerPath: "/ocr/worker.min.js",
        corePath: "/ocr/core",
        langPath: "/ocr/lang",
        workerBlobURL: false,
        logger: (m: { status: string; progress: number }) =>
          listener?.({ stage: m.status === "recognizing text" ? "recognize" : "load", value: m.progress ?? 0 }),
      }),
    )
    .catch((e) => {
      workerP = null;
      throw e;
    });
  return workerP;
}

/** Ảnh quá lớn → thu nhỏ cạnh dài về tối đa 2400px (đủ nét cho OCR, nhanh hơn nhiều). */
async function shrink(img: Blob): Promise<Blob | HTMLCanvasElement> {
  const bmp = await createImageBitmap(img).catch(() => null);
  if (!bmp) return img;
  const max = 2400;
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  if (k === 1) {
    bmp.close();
    return img;
  }
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return c;
}

export async function recognizeImage(img: Blob, onProgress?: Progress): Promise<string> {
  listener = onProgress ?? null;
  try {
    const w = await getWorker();
    const { data } = await w.recognize(await shrink(img));
    return data.text ?? "";
  } finally {
    listener = null;
  }
}
