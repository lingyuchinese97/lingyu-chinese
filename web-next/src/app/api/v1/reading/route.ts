/** Đọc hiểu — tổng quan: trình độ ước lượng (HSK 1–4), bài đã lưu, lịch sử gần đây. */
import { api } from "@/server/api";
import { getLocale } from "@/i18n/server";
import { estimateLevel } from "@/features/translation/service";
import { listSaved, readingHistory } from "@/features/reading/service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user }) => {
  const l = await getLocale();
  const [level, saved, history] = await Promise.all([
    estimateLevel(user.id),
    listSaved(user.id, l),
    readingHistory(user.id, l, 10),
  ]);
  return { level, saved, history };
});
