import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { requireUser } from "@/server/session";
import { getLesson, localizeLesson, nextLesson } from "@/data/lessons";
import { getLocale, getT } from "@/i18n/server";
import { progressOf } from "@/features/lessons/service";
import { ProgressBar } from "@/features/lessons/components/progress-bar";

type P = Promise<{ lessonId: string }>;
export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("lessons.result.title") };
}

export default async function LessonResultPage({ params }: { params: P }) {
  const user = await requireUser();
  const raw = getLesson((await params).lessonId);
  if (!raw) notFound();
  const t = await getT();
  const lesson = localizeLesson(raw, await getLocale());
  const progress = (await progressOf(user.id))[lesson.id] ?? {};
  const next = nextLesson(lesson.id);
  const all = lesson.sections.every((s) => progress[s.id]);

  return (
    <>
      <Breadcrumb
        back={`/lessons/${lesson.id}`}
        section={t("lessons.lessonN", { n: lesson.number })}
        current={t("lessons.result.crumb")}
      />
      <section
        aria-labelledby="lr-title"
        className="flex flex-col items-center gap-2 rounded-[var(--radius-xl)] border border-border bg-white px-4 py-7 text-center shadow-card"
      >
        {all ? (
          <>
            <p className="hanzi text-[34px] text-red" lang="zh">
              恭喜你！
            </p>
            <p className="-mt-1 pinyin">Gōngxǐ nǐ!</p>
          </>
        ) : null}
        <h1 id="lr-title" className="text-2xl font-extrabold text-navy">
          {all ? t("lessons.result.congrats") : t("lessons.result.title")}
        </h1>
        <p className="text-text-2">
          {all ? t("lessons.result.completed", { n: lesson.number }) : t("lessons.result.doAll", { n: lesson.number })}
        </p>
        <Image
          src={all ? "/brand/lesson/mascot_celebrate.png" : "/brand/lingyu-mascot.png"}
          alt=""
          width={220}
          height={210}
          className="my-2 w-[180px] md:w-[220px]"
        />
        <div className="w-full max-w-[520px] rounded-2xl bg-[#EFF8FD] p-4 text-left">
          <h2 className="mb-3 text-[15px] font-extrabold text-navy">{t("lessons.result.yours")}</h2>
          <ul className="flex flex-col gap-3">
            {lesson.sections.map((s) => {
              const p = progress[s.id];
              return (
                <li key={s.id} className="flex flex-col gap-1.5">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-[13.5px] font-bold text-[#3E6FB8]">
                      {s.label}: {s.title}
                    </span>
                    <span className="text-xl font-extrabold text-navy">
                      {p ? `${p.lastScore} / ${p.total}` : t("lessons.notDone")}
                    </span>
                  </span>
                  <ProgressBar
                    value={p?.lastScore ?? 0}
                    max={s.questions.length}
                    label={t("lessons.result.sectionResult", { title: s.title })}
                  />
                  {p ? (
                    <span className="text-xs text-text-3">
                      {t("lessons.result.bestAttempts", { score: p.bestScore, total: p.total, attempts: p.attempts })}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="mt-3 grid w-full max-w-[520px] gap-2.5 md:grid-cols-2">
          <Button asChild variant="secondary" size="lg">
            <Link href={`/lessons/${lesson.id}/${lesson.sections[0]!.id}`}>
              <RotateCcw />
              {t("lessons.result.redo")}
            </Link>
          </Button>
          {next ? (
            <Button asChild variant="primary" size="lg">
              <Link href={`/lessons/${next.id}`}>
                {t("lessons.result.nextLesson", { n: next.number })}
                <ArrowRight />
              </Link>
            </Button>
          ) : (
            <Button variant="primary" size="lg" disabled title={t("lessons.result.comingTitle")}>
              {t("lessons.result.coming", { n: lesson.number + 1 })}
            </Button>
          )}
        </div>
      </section>
    </>
  );
}
