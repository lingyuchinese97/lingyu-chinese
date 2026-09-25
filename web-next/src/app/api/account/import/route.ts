/** Nhập file JSON đã xuất (gộp, không ghi đè) vào tài khoản đang đăng nhập. */
import { getSession } from "@/server/session";
import { log } from "@/server/log";
import { importData, ImportError } from "@/features/account/transfer";

export const dynamic = "force-dynamic";
const MAX_BYTES = 30 * 1024 * 1024;

export async function POST(req: Request) {
  // Chặn gửi từ trang khác (cookie sameSite=lax đã chặn phần lớn, đây là lớp thứ hai).
  const origin = req.headers.get("origin");
  if (!origin || new URL(origin).host !== req.headers.get("host"))
    return Response.json({ message: "Yêu cầu không hợp lệ." }, { status: 403 });
  const s = await getSession();
  if (!s) return Response.json({ message: "Phiên đăng nhập đã hết hạn." }, { status: 401 });
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_BYTES) return Response.json({ message: "File quá lớn (tối đa 30MB)." }, { status: 413 });

  let json: unknown;
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.size)
      return Response.json({ message: "Vui lòng chọn file." }, { status: 400 });
    if (file.size > MAX_BYTES) return Response.json({ message: "File quá lớn (tối đa 30MB)." }, { status: 413 });
    json = JSON.parse(await file.text());
  } catch {
    return Response.json(
      { message: "Không đọc được file. Hãy chọn file .json đã xuất từ LingYu Chinese." },
      { status: 400 },
    );
  }
  try {
    const report = await importData(s.user.id, json);
    return Response.json({ report });
  } catch (e) {
    if (e instanceof ImportError) return Response.json({ message: e.message }, { status: 400 });
    log.error({ err: e instanceof Error ? e.message : String(e) }, "import failed");
    return Response.json({ message: "Không nhập được dữ liệu. Vui lòng thử lại." }, { status: 500 });
  }
}
