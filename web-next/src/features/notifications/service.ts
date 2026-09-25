/** Thông báo trong app (chuông). Mọi hàm lọc theo userId của session. */
import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/server/db/client";
import { notification } from "@/server/db/schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type NotificationType =
  | "grammar_share"
  | "grammar_share_accepted"
  | "grammar_share_rejected"
  | "vocab_share"
  | "vocab_share_accepted"
  | "vocab_share_rejected";

export type NotificationPayload = {
  actorName: string;
  title: string;
  shareId?: string;
  grammarId?: string;
  count?: number;
};

export async function notify(
  exec: typeof db | Tx,
  userId: string,
  type: NotificationType,
  payload: NotificationPayload,
) {
  await exec.insert(notification).values({ userId, type, payload });
}

export async function listNotifications(userId: string, limit = 20) {
  const rows = await db
    .select()
    .from(notification)
    .where(eq(notification.userId, userId))
    .orderBy(desc(notification.createdAt))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    type: r.type as NotificationType,
    payload: r.payload as NotificationPayload,
    readAt: r.readAt,
    createdAt: r.createdAt,
  }));
}
export type NotificationItem = Awaited<ReturnType<typeof listNotifications>>[number];

export async function unreadCount(userId: string) {
  const [r] = await db
    .select({ n: count() })
    .from(notification)
    .where(and(eq(notification.userId, userId), isNull(notification.readAt)));
  return r?.n ?? 0;
}

/** Đánh dấu đã đọc (ids rỗng = tất cả). */
export async function markRead(userId: string, ids?: string[]) {
  await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notification.userId, userId),
        isNull(notification.readAt),
        ...(ids?.length ? [inArray(notification.id, ids)] : []),
      ),
    );
}
