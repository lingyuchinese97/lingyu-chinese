/** Tải file JSON dữ liệu học tập của CHÍNH người đang đăng nhập. */
import { getSession } from "@/server/session";
import { exportData } from "@/features/account/transfer";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (!s) return Response.json({ message: "Phiên đăng nhập đã hết hạn." }, { status: 401 });
  const data = await exportData(s.user);
  const day = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="lingyu-du-lieu-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
