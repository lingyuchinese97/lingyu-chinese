/** Số liệu Trang chủ (hôm nay, hoạt động gần đây, chuỗi ngày học…): từ vựng / câu (tổng, đã thuộc), ngữ pháp, từ mới hôm nay, bài ôn hôm nay, thẻ đến hạn, bài ôn đang dở, tiến độ bài học, thông báo chưa đọc. */
import { api } from "@/server/api";
import { homeStats } from "@/features/home/service";
import { dueCount, getActiveSession } from "@/features/review/service";
import { progressOf, summarize } from "@/features/lessons/service";
import { unreadCount } from "@/features/notifications/service";
import { history, streak, today } from "@/features/progress/service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user }) => {
  const [stats, due, active, progress, unread, todayStats, recent, st] = await Promise.all([
    homeStats(user.id),
    dueCount(user.id),
    getActiveSession(user.id),
    progressOf(user.id),
    unreadCount(user.id),
    today(user.id),
    history(user.id, { limit: 4 }),
    streak(user.id),
  ]);
  const s = summarize(progress);
  return {
    ...stats,
    dueCount: due,
    activeReview: active ? { id: active.id, total: active.total, currentIndex: active.currentIndex } : null,
    lessons: { done: s.done, total: s.total, percent: s.percent },
    unreadNotifications: unread,
    today: todayStats,
    streak: st.current,
    recent,
  };
});
