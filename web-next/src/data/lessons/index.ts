/** Danh sách bài học. Thêm Bài 2: tạo `data/lessons/bai2/index.ts`, thêm audio vào `public/audio/bai2/`, rồi thêm vào mảng dưới. */
import { lessonSchema, type Lesson } from "./schema";
import { bai1 } from "./bai1";

export const LESSONS: Lesson[] = [bai1].map((l) => lessonSchema.parse(l));

export const getLesson = (id: string) => LESSONS.find((l) => l.id === id) ?? null;
export const nextLesson = (id: string) => {
  const i = LESSONS.findIndex((l) => l.id === id);
  return i >= 0 ? (LESSONS[i + 1] ?? null) : null;
};
