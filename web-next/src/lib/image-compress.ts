"use client";
import { IMAGE } from "@/lib/limits";

export class ImageError extends Error {}

/**
 * Nén ảnh ở trình duyệt: WebP, cạnh dài ≤ 1024px, chất lượng ~0.8, hạ dần tới khi ≤ 300KB.
 * Vẫn > 1MB sau khi nén → từ chối.
 */
export async function compressImage(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new ImageError("Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.");
  if (file.size > IMAGE.MAX_INPUT_BYTES) throw new ImageError("Ảnh vượt quá 5MB. Hãy chọn ảnh nhỏ hơn.");
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file);
  } catch {
    throw new ImageError("Tệp ảnh bị lỗi hoặc không đúng định dạng.");
  }
  const scale = Math.min(1, IMAGE.MAX_EDGE / Math.max(bmp.width, bmp.height));
  const width = Math.max(1, Math.round(bmp.width * scale));
  const height = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, width, height);
  bmp.close();
  const toBlob = (q: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/webp", q));
  let quality: number = IMAGE.QUALITY;
  let blob = await toBlob(quality);
  while (blob && blob.size > IMAGE.TARGET_BYTES && quality > 0.4) {
    quality -= 0.1;
    blob = await toBlob(quality);
  }
  // Trình duyệt không hỗ trợ xuất WebP (Safari cũ) → canvas trả PNG; thử JPEG.
  if (blob && blob.type !== "image/webp") blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.8));
  if (!blob) throw new ImageError("Không xử lý được ảnh này. Hãy chọn ảnh khác.");
  if (blob.size > IMAGE.MAX_BYTES) throw new ImageError("Ảnh vẫn lớn hơn 1MB sau khi nén. Hãy chọn ảnh khác.");
  return { blob, width, height };
}
