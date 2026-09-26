/** Thống kê từ vựng của mình (tổng, đã thuộc...). GET. */
import { api } from "@/server/api";
import { vocabStats } from "@/features/vocabulary/service";

export const dynamic = "force-dynamic";
export const GET = api(async ({ user }) => vocabStats(user.id));
