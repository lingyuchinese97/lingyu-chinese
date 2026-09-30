import { z } from "zod";
import { getSession } from "@/server/session";
import { wordImage } from "@/features/library/service";

export const dynamic = "force-dynamic";

/** Ảnh minh hoạ của từ thư viện: cần đăng nhập; chỉ từ đã public (admin xem được cả bản nháp). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return new Response("Unauthorized", { status: 401 });
  const id = z.uuid().safeParse((await ctx.params).id);
  if (!id.success) return new Response("Not found", { status: 404 });
  const img = await wordImage(id.data, s.user.role === "admin");
  if (!img) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(img.data), {
    headers: {
      "Content-Type": img.mime,
      "Content-Length": String(img.size),
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
