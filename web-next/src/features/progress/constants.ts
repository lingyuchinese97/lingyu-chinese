/** Hằng số Tiến độ học tập (dùng được cả ở client). */

/** Loại hoạt động. `*_add` được gộp theo ngày. */
export const ACTIVITY_KINDS = [
  "vocab_review",
  "grammar_review",
  "sentence_review",
  "translation",
  "reading",
  "lesson",
  "listening",
  "pronunciation",
  "vocab_add",
  "grammar_add",
] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];
/** Người dùng / app được tự báo cáo (bài tự luyện không có phiên ở server). */
export const CLIENT_KINDS = ["pronunciation"] as const;

export const GOAL_KINDS = ["minutes_day", "lessons_week", "vocab_month"] as const;
export type GoalKind = (typeof GOAL_KINDS)[number];
export const GOAL_DEFAULTS: Record<GoalKind, number> = { minutes_day: 30, lessons_week: 2, vocab_month: 50 };
export const GOAL_LIMITS: Record<GoalKind, [number, number]> = {
  minutes_day: [5, 600],
  lessons_week: [1, 50],
  vocab_month: [1, 2000],
};
