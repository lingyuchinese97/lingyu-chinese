/** Danh sách người dùng cho admin: `?q=` (tên / email) `&page=` (20 người / trang, mới nhất trước). */
import { z } from "zod";
import { api, query } from "@/server/api";
import { ADMIN_PAGE_SIZE, listUsers } from "@/features/admin/service";
import { assertAdmin } from "../_guard";

export const dynamic = "force-dynamic";

const schema = z.object({
  q: z.string().max(100).catch(""),
  page: z.coerce.number().int().min(1).max(100000).catch(1),
});

export const GET = api(async ({ user, req }) => {
  assertAdmin(user);
  const p = schema.parse(query(req));
  return { ...(await listUsers(p)), pageSize: ADMIN_PAGE_SIZE };
});
