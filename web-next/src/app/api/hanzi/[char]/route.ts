/**
 * Dữ liệu nét viết cho hanzi-writer, đọc từ gói `hanzi-writer-data` (tự host, không dùng CDN).
 * Dữ liệu công khai (không phải của user) → cache dài hạn.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

const DIR = path.join(process.cwd(), "node_modules", "hanzi-writer-data");

export async function GET(_req: Request, ctx: { params: Promise<{ char: string }> }) {
  const { char } = await ctx.params;
  const ch = decodeURIComponent(char).replace(/\.json$/, "");
  // Đúng 1 chữ Hán → tên file an toàn (không có "/" hay "..").
  if ([...ch].length !== 1 || !/^\p{Script=Han}$/u.test(ch)) return new Response("Not found", { status: 404 });
  try {
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
