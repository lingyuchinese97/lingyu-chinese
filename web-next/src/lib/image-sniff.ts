/** Nhận dạng ảnh bằng magic bytes (không tin phần mở rộng hay Content-Type client gửi). */
export type ImageMime = "image/webp" | "image/jpeg" | "image/png";

export function sniffImage(bytes: Uint8Array): ImageMime | null {
  const b = bytes;
  if (
    b.length >= 12 &&
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  )
    return "image/webp"; // "RIFF....WEBP"
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (
    b.length >= 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  )
    return "image/png";
  return null;
}

/** Đọc kích thước ảnh từ header (đủ cho webp VP8/VP8L/VP8X, png, jpeg). Không đọc được → null. */
export function imageSize(bytes: Uint8Array, mime: ImageMime): { width: number; height: number } | null {
  const b = bytes;
  const u16be = (i: number) => (b[i]! << 8) | b[i + 1]!;
  const u32be = (i: number) => ((b[i]! << 24) | (b[i + 1]! << 16) | (b[i + 2]! << 8) | b[i + 3]!) >>> 0;
  const u24le = (i: number) => b[i]! | (b[i + 1]! << 8) | (b[i + 2]! << 16);
  try {
    if (mime === "image/png" && b.length >= 24) return { width: u32be(16), height: u32be(20) };
    if (mime === "image/webp" && b.length >= 30) {
      const chunk = String.fromCharCode(b[12]!, b[13]!, b[14]!, b[15]!);
      if (chunk === "VP8X") return { width: u24le(24) + 1, height: u24le(27) + 1 };
      if (chunk === "VP8 ")
        return { width: (b[26]! | (b[27]! << 8)) & 0x3fff, height: (b[28]! | (b[29]! << 8)) & 0x3fff };
      if (chunk === "VP8L") {
        const bits = b[21]! | (b[22]! << 8) | (b[23]! << 16) | (b[24]! << 24);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
      }
    }
    if (mime === "image/jpeg") {
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) return null;
        const marker = b[i + 1]!;
        const len = u16be(i + 2);
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc)
          return { width: u16be(i + 7), height: u16be(i + 5) };
        i += 2 + len;
      }
    }
  } catch {
    return null;
  }
  return null;
}
