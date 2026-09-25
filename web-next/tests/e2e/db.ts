import pg from "pg";

/** Kết nối thẳng DB e2e (cùng URL mà playwright.config truyền cho server). */
export const e2eDbUrl =
  process.env.E2E_DATABASE_URL ??
  (process.env.DATABASE_URL ?? "postgres://lingyu:lingyu@localhost:5432/lingyu").replace(
    /\/([^/?]+)(\?|$)/,
    "/$1_e2e$2",
  );

/** Xoá bộ đếm rate limit để các test đăng nhập/đăng ký không chặn nhau (mọi request đều từ cùng IP). */
export async function resetRateLimit() {
  const client = new pg.Client({ connectionString: e2eDbUrl });
  await client.connect();
  try {
    await client.query("delete from rate_limit");
  } finally {
    await client.end();
  }
}
