/** Danh sách bài học (theo ngôn ngữ của người dùng) + tiến độ của mình: số phần đã làm, % hoàn thành. */
import { api } from "@/server/api";
import { LESSONS, localizeLesson } from "@/data/lessons";
import { progressOf, summarize } from "@/features/lessons/service";
import { getLocale } from "@/i18n/server";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user }) => {
  const [progress, locale] = await Promise.all([progressOf(user.id), getLocale()]);
  const s = summarize(progress);
  return {
    done: s.done,
    total: s.total,
    percent: s.percent,
    lessons: LESSONS.map((raw) => {
      const l = localizeLesson(raw, locale);
      return {
        id: l.id,
        number: l.number,
        badge: l.badge,
        title: l.title,
        subtitle: l.subtitle,
        sections: l.sections.map((sec) => ({
          id: sec.id,
          label: sec.label,
          title: sec.title,
          questionCount: sec.questions.length,
          progress: progress[l.id]?.[sec.id] ?? null,
        })),
      };
    }),
  };
});
