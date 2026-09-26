/**
 * Nhập dữ liệu: thân request là nội dung file đã xuất (JSON, tối đa 30MB). Gộp vào dữ liệu hiện có, không ghi đè —
 * bản ghi trùng bị bỏ qua. → báo cáo số đã thêm / bỏ qua từng loại.
 */
import { api, ApiError, body } from "@/server/api";
import { importData, ImportError } from "@/features/account/transfer";

export const dynamic = "force-dynamic";
const MAX_BYTES = 30 * 1024 * 1024;

export const POST = api(async ({ user, req }) => {
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BYTES)
    throw new ApiError(413, "File quá lớn (tối đa 30MB).");
  try {
    return await importData(user.id, await body(req));
  } catch (e) {
    if (e instanceof ImportError) throw new ApiError(400, e.message);
    throw e;
  }
});
