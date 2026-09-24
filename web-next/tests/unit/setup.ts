// Nạp biến môi trường cho test: dùng DB riêng `lingyu_test` (TEST_DATABASE_URL) để không đụng dữ liệu dev.
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), false);
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? (process.env.DATABASE_URL ?? "").replace(/\/([^/?]+)(\?|$)/, "/$1_test$2");
