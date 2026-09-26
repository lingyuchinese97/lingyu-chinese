/**
 * Khoá trang tài liệu API (/api-docs, /api/openapi.json) bằng tài khoản riêng (HTTP Basic), tách khỏi tài khoản LingYu.
 * Tên + mật khẩu đặt ở biến môi trường API_DOCS_USER / API_DOCS_PASSWORD (Vercel → Settings → Environment Variables).
 * Chưa đặt (hoặc mật khẩu < 12 ký tự) → tài liệu tắt (404), để không bao giờ lộ ra khi quên cấu hình.
 */
export const DOCS_PATHS = ["/api-docs", "/api/openapi.json"];
export const DOCS_MIN_PASSWORD = 12;

export type DocsAuthResult = "ok" | "disabled" | "unauthorized";

const enc = new TextEncoder();
async function digest(s: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(s)));
}
/** So sánh thời gian không đổi (băm trước để độ dài luôn bằng nhau). */
async function safeEqual(a: string, b: string) {
  const [x, y] = await Promise.all([digest(a), digest(b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i]! ^ y[i]!;
  return diff === 0;
}

function decodeBasic(header: string | null): { user: string; pass: string } | null {
  const m = /^Basic\s+([A-Za-z0-9+/=]+)\s*$/i.exec(header ?? "");
  if (!m) return null;
  let raw: string;
  try {
    raw = new TextDecoder().decode(Uint8Array.from(atob(m[1]!), (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
  const i = raw.indexOf(":");
  return i < 0 ? null : { user: raw.slice(0, i), pass: raw.slice(i + 1) };
}

export async function checkDocsAuth(
  authorization: string | null,
  expected: { user?: string; password?: string } = {
    user: process.env.API_DOCS_USER,
    password: process.env.API_DOCS_PASSWORD,
  },
): Promise<DocsAuthResult> {
  const { user, password } = expected;
  if (!user || !password || password.length < DOCS_MIN_PASSWORD) return "disabled";
  const got = decodeBasic(authorization);
  if (!got) return "unauthorized";
  const [u, p] = await Promise.all([safeEqual(got.user, user), safeEqual(got.pass, password)]);
  return u && p ? "ok" : "unauthorized";
}
