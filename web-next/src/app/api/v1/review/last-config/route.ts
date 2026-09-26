/** Thiết lập ôn tự chọn gần nhất (null nếu chưa có). */
import { api } from "@/server/api";
import { getLastCustomConfig } from "@/features/review/service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user }) => getLastCustomConfig(user.id));
