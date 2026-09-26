/** Tổng quan Tiến độ học tập: thời gian học, bài học, từ vựng, ngữ pháp, kỹ năng, chuỗi ngày học, mục tiêu, hôm nay. */
import { api } from "@/server/api";
import { summary, today } from "@/features/progress/service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user }) => {
  const [s, t] = await Promise.all([summary(user.id), today(user.id)]);
  return { ...s, today: t };
});
