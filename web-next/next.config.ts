import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Chạy được bằng `node server.js` trong Docker (VPS) — xem Dockerfile.
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Ảnh đã nén ≤ 1MB ở trình duyệt; chừa chỗ cho các trường khác trong form.
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
