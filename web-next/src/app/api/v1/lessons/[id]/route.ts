/** Nội dung một bài học (các phần, câu hỏi, đáp án, file âm thanh) theo ngôn ngữ của người dùng + tiến độ từng phần. */
import { api } from "@/server/api";
import { getLesson, localizeLesson } from "@/data/lessons";
import { LessonError, progressOf } from "@/features/lessons/service";
import { getLocale } from "@/i18n/server";

export const dynamic = "force-dynamic";

export const GET = api<{ id: string }>(async ({ user, params }) => {
  const lesson = getLesson(params.id);
  if (!lesson) throw new LessonError("Không tìm thấy bài học này.", "not-found");
  const [progress, locale] = await Promise.all([progressOf(user.id), getLocale()]);
  return { ...localizeLesson(lesson, locale), progress: progress[lesson.id] ?? {} };
});
