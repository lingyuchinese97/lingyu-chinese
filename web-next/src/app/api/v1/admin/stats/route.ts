/** Số liệu tổng cho admin: tổng số người dùng, admin, bị khoá, mới / hoạt động 7 ngày, tổng nội dung. */
import { api } from "@/server/api";
import { adminStats } from "@/features/admin/service";
import { assertAdmin } from "../_guard";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user }) => {
  assertAdmin(user);
  return adminStats();
});
