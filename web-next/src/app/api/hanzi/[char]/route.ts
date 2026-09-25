/**
 * Dữ liệu nét viết cho hanzi-writer, đọc từ gói `hanzi-writer-data` (tự host, không dùng CDN).
 * Dữ liệu công khai (không phải của user) → cache dài hạn.
 */
import { existsSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Thư mục dữ liệu: `node_modules/hanzi-writer-data` (dev), hoặc trong `node_modules/.pnpm/hanzi-writer-data@*` —
 * bản standalone (Docker/Vercel) chỉ chép thư mục thật của pnpm, không có symlink ở gốc node_modules.
 */
function findDataDir() {
  const root = path.join(process.cwd(), "node_modules");
  const direct = path.join(root, "hanzi-writer-data");
  if (existsSync(path.join(direct, "package.json"))) return direct;
  const store = path.join(root, ".pnpm");
  const hit = existsSync(store) ? readdirSync(store).find((d) => d.startsWith("hanzi-writer-data@")) : undefined;
  return hit ? path.join(store, hit, "node_modules", "hanzi-writer-data") : direct;
}
let DIR: string | null = null;

export async function GET(_req: Request, ctx: { params: Promise<{ char: string }> }) {
  const { char } = await ctx.params;
  const ch = decodeURIComponent(char).replace(/\.json$/, "");
  // Đúng 1 chữ Hán → tên file an toàn (không có "/" hay "..").
  if ([...ch].length !== 1 || !/^\p{Script=Han}$/u.test(ch)) return new Response("Not found", { status: 404 });
  try {
    DIR ??= findDataDir();
    const data = await readFile(path.join(DIR, `${ch}.json`));
    return new Response(data, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
