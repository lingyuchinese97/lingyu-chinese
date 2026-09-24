import { z } from "zod";

/**
 * Biến môi trường — kiểm tra bằng Zod ngay khi import (build/khởi động fail nếu thiếu).
 * Chỉ import file này ở server; phía client chỉ dùng NEXT_PUBLIC_* qua `publicEnv`.
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url({ message: "DATABASE_URL phải là URL Postgres, vd postgres://user:pass@host:5432/db" }),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET cần ≥ 32 ký tự — tạo bằng: openssl rand -base64 32"),
  BETTER_AUTH_URL: z.url(),
  NEXT_PUBLIC_APP_URL: z.url(),
  ADMIN_EMAILS: z
    .string()
    .default("")
    .transform((s) =>
      s
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});

function load() {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Thiếu hoặc sai biến môi trường:\n${lines}\nXem .env.example.`);
  }
  return parsed.data;
}

export const env = load();
export type Env = typeof env;
