/**
 * Chép file nhận dạng chữ (OCR) từ node_modules vào public/ocr để tự host — không gọi CDN / dịch vụ ngoài.
 * Chạy trước `next dev` / `next build`. Trình duyệt chỉ tải khi người dùng mở chức năng "Thêm từ ảnh".
 *   public/ocr/paddle/*.onnx + ppocr_keys_v1.txt (PaddleOCR PP-OCRv4 — nhận dạng chữ Hán, @gutenye/ocr-models)
 *   public/ocr/ort/ort-wasm-simd-threaded.wasm   (onnxruntime-web — chạy mô hình ONNX)
 *   public/ocr/worker.min.js        (tesseract.js — chỉ đọc phần chữ Latin: pinyin, nghĩa tiếng Việt)
 *   public/ocr/core/*.wasm.js       (tesseract.js-core — trình duyệt tự chọn bản hợp máy)
 *   public/ocr/lang/vie.traineddata.gz (bản 4.0.0_best_int)
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const out = path.join(process.cwd(), "public", "ocr");
const dirOf = (pkg, from) => path.dirname(createRequire(from ?? import.meta.url).resolve(`${pkg}/package.json`));

const tjs = dirOf("tesseract.js");
const core = dirOf("tesseract.js-core", path.join(tjs, "package.json"));
const jobs = [
  [path.join(tjs, "dist", "worker.min.js"), path.join(out, "worker.min.js")],
  ...readdirSync(core)
    .filter((f) => f.endsWith("-lstm.wasm.js"))
    .map((f) => [path.join(core, f), path.join(out, "core", f)]),
  ...["ch_PP-OCRv4_det_infer.onnx", "ch_PP-OCRv4_rec_infer.onnx", "ppocr_keys_v1.txt"].map((f) => [
    path.join(path.join(process.cwd(), "node_modules", "@gutenye", "ocr-models"), "assets", f),
    path.join(out, "paddle", f),
  ]),
  [
    path.join(path.join(process.cwd(), "node_modules", "onnxruntime-web"), "dist", "ort-wasm-simd-threaded.wasm"),
    path.join(out, "ort", "ort-wasm-simd-threaded.wasm"),
  ],
  ...["vie"].map((l) => [
    path.join(dirOf(`@tesseract.js-data/${l}`), "4.0.0_best_int", `${l}.traineddata.gz`),
    path.join(out, "lang", `${l}.traineddata.gz`),
  ]),
];
// Bản cũ dùng Tesseract cho cả chữ Hán — không còn cần dữ liệu chi_sim.
rmSync(path.join(out, "lang", "chi_sim.traineddata.gz"), { force: true });
let copied = 0;
for (const [src, dst] of jobs) {
  if (existsSync(dst) && statSync(dst).size === statSync(src).size) continue;
  mkdirSync(path.dirname(dst), { recursive: true });
  copyFileSync(src, dst);
  copied++;
}
console.log(`ocr assets: ${copied} copied, ${jobs.length - copied} up to date`);
