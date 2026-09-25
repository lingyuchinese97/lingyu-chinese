import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { requireUser } from "@/server/session";
import { getLesson } from "@/data/lessons";
import { ExerciseRunner } from "@/features/lessons/components/exercise-runner";

type P = Promise<{ lessonId: string; sectionId: string }>;

async function load(params: P) {
  const { lessonId, sectionId } = await params;
  const lesson = getLesson(lessonId);
  const i = lesson?.sections.findIndex((s) => s.id === sectionId) ?? -1;
  return lesson && i >= 0 ? { lesson, section: lesson.sections[i]!, next: lesson.sections[i + 1] } : null;
}

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const x = await load(params);
  return { title: x ? `Bài ${x.lesson.number} · ${x.section.title}` : "Không tìm thấy bài học" };
}

export default async function SectionPage({ params }: { params: P }) {
  await requireUser();
  const x = await load(params);
  if (!x) notFound();
  const { lesson, section, next } = x;
  return (
    <>
      <Breadcrumb back={`/lessons/${lesson.id}`} section={`Bài ${lesson.number}`} current={section.title} />
      <ExerciseRunner
        key={section.id}
        lessonId={lesson.id}
        section={section}
        nextHref={next ? `/lessons/${lesson.id}/${next.id}` : `/lessons/${lesson.id}/result`}
      />
    </>
  );
}
