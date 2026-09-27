/** Số phút học mỗi ngày: `?days=7|30|90` (mặc định 7). */
import { api, query } from "@/server/api";
import { dailyMinutes } from "@/features/progress/service";
import { dailyQuerySchema } from "@/features/progress/schema";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user, req }) => dailyMinutes(user.id, dailyQuerySchema.parse(query(req)).days));
