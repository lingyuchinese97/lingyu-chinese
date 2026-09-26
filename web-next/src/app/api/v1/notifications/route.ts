/**
 * Thông báo (chuông) của tôi: 20 thông báo mới nhất, số chưa đọc, và id các lời mời còn chờ
 * (`pendingGrammar`: id lời mời ngữ pháp, `pendingVocab`: lời mời từ vựng) để biết thông báo nào còn nút Chấp nhận / Từ chối.
 */
import { api } from "@/server/api";
import { listNotifications, unreadCount } from "@/features/notifications/service";
import { listReceived } from "@/features/grammar/service";
import { listReceivedVocab } from "@/features/vocabulary/share-service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user }) => {
  const [items, unread, grammar, vocab] = await Promise.all([
    listNotifications(user.id),
    unreadCount(user.id),
    listReceived(user.id),
    listReceivedVocab(user.id),
  ]);
  return { items, unread, pendingGrammar: grammar.map((p) => p.id), pendingVocab: vocab };
});
