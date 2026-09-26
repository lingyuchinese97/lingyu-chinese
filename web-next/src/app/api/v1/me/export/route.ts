/** Toàn bộ dữ liệu học tập của tôi (cùng dạng file “Xuất dữ liệu” ở Cài đặt), trả JSON trong `data`. */
import { api } from "@/server/api";
import { exportData } from "@/features/account/transfer";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user }) => exportData(user));
