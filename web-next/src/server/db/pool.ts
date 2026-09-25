import { Pool } from "pg";
import { env } from "@/env";

/**
 * Một pool `pg` dùng chung cho cả process (Drizzle + Better Auth + healthcheck).
 * Trên Vercel dùng connection string **pooled** của Neon; trên VPS là Postgres trong Docker.
 * Giữ qua globalThis để hot reload khi dev không mở thêm pool.
 */
const g = globalThis as unknown as { __lingyuPool?: Pool };

export const pool =
  g.__lingyuPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: env.DATABASE_POOL_MAX,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

if (env.NODE_ENV !== "production") g.__lingyuPool = pool;
