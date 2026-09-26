/** Đánh dấu đã đọc: POST { ids? } — bỏ trống = tất cả. → { unread } (số còn chưa đọc). */
import { z } from "zod";
import { api, body } from "@/server/api";
import { markRead, unreadCount } from "@/features/notifications/service";

export const dynamic = "force-dynamic";

export const POST = api(async ({ user, req }) => {
  const { ids } = z.object({ ids: z.array(z.uuid()).max(100).optional() }).parse(await body(req));
  await markRead(user.id, ids);
  return { unread: await unreadCount(user.id) };
});
