/** Chỉ cho phép quay lại đường dẫn nội bộ (chặn open redirect kiểu `//evil.com` hoặc `https://...`). */
export function safeNext(value: unknown, fallback = "/home"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\"))
    return fallback;
  if (value.startsWith("/login") || value.startsWith("/register") || value.startsWith("/api/")) return fallback;
  return value.slice(0, 512);
}
