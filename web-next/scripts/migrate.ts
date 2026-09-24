/**
 * Chạy migration (drizzle/*.sql) rồi thoát. Dùng ở:
 * - Vercel: build command `pnpm db:migrate && pnpm build`
 * - Docker: entrypoint chạy `node migrate.mjs` (bản bundle bằng esbuild) trước `node server.js`
 * Chỉ cần DATABASE_URL (không import env.ts để chạy được khi build chưa có đủ biến).
 */
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Thiếu DATABASE_URL");
  const pool = new Pool({ connectionString: url, max: 1 });
  const folder = process.env.MIGRATIONS_DIR ?? path.join(process.cwd(), "drizzle");
  const started = Date.now();
  await migrate(drizzle(pool), { migrationsFolder: folder });
  await pool.end();
  console.log(JSON.stringify({ level: "info", msg: "migrations applied", folder, ms: Date.now() - started }));
}

main().catch((err) => {
  console.error(JSON.stringify({ level: "error", msg: "migration failed", err: String(err?.message ?? err) }));
  process.exit(1);
});
