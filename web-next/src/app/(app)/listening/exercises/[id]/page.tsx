import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/server/session";
import { getT } from "@/i18n/server";
import { getExercise, listListeningTags, ListeningError } from "@/features/listening/service";
import { ListeningHeader, Panel } from "@/features/listening/components/listening-header";
import { ExerciseDetail } from "@/features/listening/components/exercise-detail";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("listening.detail.label") };
}

/** Chi tiết một bài làm (chỉ của chính mình; của người khác / không có → 404). */
export default async function ExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const t = await getT();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  let ex;
  try {
    ex = await getExercise(user.id, id.data);
  } catch (e) {
    if (e instanceof ListeningError) notFound();
    throw e;
  }
  const tags = await listListeningTags(user.id);
  return (
    <>
      <ListeningHeader tab="mine" />
      <Link
        href="/listening/exercises"
        className="inline-flex min-h-10 items-center gap-2 self-start rounded-full px-3 font-semibold text-blue-700 hover:bg-blue-50"
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
        {t("listening.mine.backToList")}
      </Link>
      <Panel role="region" aria-label={t("listening.detail.label")} className="min-w-0">
        <ExerciseDetail key={ex.id} initial={ex} allTags={tags.map((x) => x.name)} />
      </Panel>
    </>
  );
}
