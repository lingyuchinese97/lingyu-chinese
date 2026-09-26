/** Thông tin một người dùng (hồ sơ + số lượng nội dung, không có nội dung học) — chỉ admin. */
import { z } from "zod";
import { api, ApiError } from "@/server/api";
import { adminUserDetail } from "@/features/admin/service";
import { assertAdmin } from "../../_guard";

export const dynamic = "force-dynamic";

export const GET = api<{ id: string }>(async ({ user, params }) => {
  assertAdmin(user);
  const id = z.uuid().safeParse(params.id);
  const u = id.success ? await adminUserDetail(id.data) : null;
  if (!u) throw new ApiError(404, "Không tìm thấy người dùng.");
  return u;
});
