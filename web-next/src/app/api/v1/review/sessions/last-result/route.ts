/** Kết quả bài ôn đã hoàn thành gần nhất (null nếu chưa có). */
import { api } from "@/server/api";
import { getLastResult } from "@/features/review/service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user }) => getLastResult(user.id));
