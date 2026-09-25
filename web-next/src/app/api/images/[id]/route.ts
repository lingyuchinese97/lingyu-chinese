import { z } from "zod";
import { getSession } from "@/server/session";
import { storage } from "@/server/storage";

export const dynamic = "force-dynamic";

/** Ảnh từ vựng: chỉ chủ sở hữu xem được. Ảnh không bao giờ đổi nội dung (đổi ảnh = id mới) → cache lâu. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return new Response("Unauthorized", { status: 401 });
  const id = z.uuid().safeParse((await ctx.params).id);
  if (!id.success) return new Response("Not found", { status: 404 });
  const img = await storage.get(s.user.id, id.data);
  // Ảnh của người khác cũng trả 404 (không tiết lộ là có tồn tại).
  if (!img) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(img.data), {
    headers: {
      "Content-Type": img.mime,
      "Content-Length": String(img.size),
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
