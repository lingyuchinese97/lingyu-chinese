import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Chạy được bằng `node server.js` trong Docker (VPS) — xem Dockerfile.
  output: "standalone",
  poweredByHeader: false,
  // Dữ liệu nét hanzi-writer đọc bằng fs trong /api/hanzi/[char] → phải chép vào bản standalone.
  outputFileTracingIncludes: {
    "/api/hanzi/[char]": ["./node_modules/hanzi-writer-data/*.json"],
  },
  experimental: {
    serverActions: {
      // Ảnh đã nén ≤ 1MB ở trình duyệt; chừa chỗ cho các trường khác trong form.
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
