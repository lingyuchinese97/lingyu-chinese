/** Tiến độ bài học (bảng lesson_progress). Nội dung bài học là tĩnh (data/lessons). */
import { eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { lessonProgress } from "@/server/db/schema";
import { getLesson, LESSONS } from "@/data/lessons";

export class LessonError extends Error {}

export type SectionProgress = {
  bestScore: number;
  lastScore: number;
  total: number;
  attempts: number;
  lastAttemptAt: Date;
};
/** lessonId → sectionId → tiến độ */
export type ProgressMap = Record<string, Record<string, SectionProgress>>;

export async function progressOf(userId: string): Promise<ProgressMap> {
  const rows = await db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId));
  const map: ProgressMap = {};
  for (const r of rows) {
    (map[r.lessonId] ??= {})[r.section] = {
      bestScore: r.bestScore,
      lastScore: r.lastScore,
      total: r.total,
      attempts: r.attempts,
      lastAttemptAt: r.lastAttemptAt,
    };
  }
  return map;
}

/** Chấm lại ở server theo nội dung bài (không tin điểm client gửi) rồi lưu: điểm cao nhất, lần gần nhất, số lần làm. */
export async function recordSection(userId: string, lessonId: string, sectionId: string, answers: (number | null)[]) {
  const lesson = getLesson(lessonId);
  const section = lesson?.sections.find((s) => s.id === sectionId);
  if (!lesson || !section) throw new LessonError("Không tìm thấy bài học này.");
  if (answers.length !== section.questions.length) throw new LessonError("Bài làm chưa đầy đủ.");
  const score = section.questions.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0);
  const total = section.questions.length;
  await db
    .insert(lessonProgress)
    .values({ userId, lessonId, section: sectionId, bestScore: score, lastScore: score, total, attempts: 1 })
    .onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId, lessonProgress.section],
      set: {
        bestScore: sql`greatest(${lessonProgress.bestScore}, ${score})`,
        lastScore: score,
        total,
        attempts: sql`${lessonProgress.attempts} + 1`,
        lastAttemptAt: new Date(),
      },
    });
  return { score, total };
}

/** Tiến độ cho Trang chủ / danh sách: % số phần đã làm của các bài. */
export function summarize(map: ProgressMap) {
  const lessons = LESSONS.map((l) => {
    const done = l.sections.filter((s) => map[l.id]?.[s.id]).length;
    return { id: l.id, number: l.number, title: l.title, done, total: l.sections.length };
  });
  const done = lessons.reduce((n, l) => n + l.done, 0);
  const total = lessons.reduce((n, l) => n + l.total, 0);
  return { lessons, done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}
