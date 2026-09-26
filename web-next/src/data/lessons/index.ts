/** Danh sách bài học. Thêm Bài 2: tạo `data/lessons/bai2/index.ts`, thêm audio vào `public/audio/bai2/`, rồi thêm vào mảng dưới. */
import { lessonSchema, type Lesson } from "./schema";
import { bai1 } from "./bai1";
import type { Locale } from "@/i18n/config";

export const LESSONS: Lesson[] = [bai1].map((l) => lessonSchema.parse(l));

export const getLesson = (id: string) => LESSONS.find((l) => l.id === id) ?? null;
/** Áp bản dịch (nếu có) theo ngôn ngữ giao diện; tiếng Việt giữ nguyên. */
export function localizeLesson(l: Lesson, locale: Locale): Lesson {
  if (locale === "vi") return l;
  return {
    ...l,
    badge: l.en?.badge ?? l.badge,
    title: l.en?.title ?? l.title,
    subtitle: l.en?.subtitle ?? l.subtitle,
    highlights: l.highlights.map((h) => ({ ...h, label: h.labelEn ?? h.label })),
    sections: l.sections.map((s) => ({
      ...s,
      label: s.en?.label ?? s.label,
      title: s.en?.title ?? s.title,
      instruction: s.en?.instruction ?? s.instruction,
      questions: s.questions.map((q) => ({
        ...q,
        explanation: q.explanationEn ?? q.explanation,
        ...(q.type === "choice-audio" ? { prompt: q.promptEn ?? q.prompt } : {}),
      })),
    })),
  };
}

export const nextLesson = (id: string) => {
  const i = LESSONS.findIndex((l) => l.id === id);
  return i >= 0 ? (LESSONS[i + 1] ?? null) : null;
};
