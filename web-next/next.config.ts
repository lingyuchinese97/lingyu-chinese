import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const isDev = process.env.NODE_ENV !== "production";
const isHttps = (process.env.BETTER_AUTH_URL ?? "").startsWith("https://");

/**
 * CSP: chỉ tải tài nguyên từ chính app (font, audio, dữ liệu nét chữ đều tự host).
 * `'unsafe-inline'` cho script vì Next nhúng dữ liệu RSC bằng script inline (không dùng nonce để trang vẫn cache tĩnh được);
 * `'unsafe-eval'` chỉ bật khi dev (React Refresh).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "media-src 'self' blob:",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  ...(isHttps ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }] : []),
];

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
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Service worker luôn lấy bản mới nhất.
      { source: "/serwist/:path*", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] },
    ];
  },
};

export default withSerwist(nextConfig);
