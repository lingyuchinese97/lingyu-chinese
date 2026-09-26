import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { requireUser } from "@/server/session";
import { getLesson, localizeLesson } from "@/data/lessons";
import { getLocale, getT } from "@/i18n/server";
import { ExerciseRunner } from "@/features/lessons/components/exercise-runner";

type P = Promise<{ lessonId: string; sectionId: string }>;

async function load(params: P) {
  const { lessonId, sectionId } = await params;
  const raw = getLesson(lessonId);
  const lesson = raw ? localizeLesson(raw, await getLocale()) : null;
  const i = lesson?.sections.findIndex((s) => s.id === sectionId) ?? -1;
  return lesson && i >= 0 ? { lesson, section: lesson.sections[i]!, next: lesson.sections[i + 1] } : null;
}

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const x = await load(params);
  const t = await getT();
  return {
    title: x ? t("lessons.sectionMetaTitle", { n: x.lesson.number, title: x.section.title }) : t("lessons.notFound"),
  };
}

export default async function SectionPage({ params }: { params: P }) {
  await requireUser();
  const x = await load(params);
  if (!x) notFound();
  const { lesson, section, next } = x;
  const t = await getT();
  return (
    <>
      <Breadcrumb
        back={`/lessons/${lesson.id}`}
        section={t("lessons.lessonN", { n: lesson.number })}
        current={section.title}
      />
      <ExerciseRunner
        key={section.id}
        lessonId={lesson.id}
        section={section}
        nextHref={next ? `/lessons/${lesson.id}/${next.id}` : `/lessons/${lesson.id}/result`}
      />
    </>
  );
}
