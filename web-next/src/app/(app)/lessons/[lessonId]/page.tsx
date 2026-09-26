import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, AudioLines, Check, CheckCircle2, Headphones, MousePointerClick, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { getLesson, localizeLesson } from "@/data/lessons";
import { getLocale, getT } from "@/i18n/server";
import { progressOf } from "@/features/lessons/service";

type P = Promise<{ lessonId: string }>;

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const raw = getLesson((await params).lessonId);
  const t = await getT();
  const l = raw ? localizeLesson(raw, await getLocale()) : null;
  return { title: l ? t("lessons.metaTitle", { n: l.number, title: l.title }) : t("lessons.notFound") };
}

const TONE = {
  red: { text: "text-red", tag: "bg-red-50 text-red", icon: Mic },
  blue: { text: "text-blue-600", tag: "bg-[#E4F3FF] text-blue-600", icon: AudioLines },
  green: { text: "text-green-700", tag: "bg-[#DFF6E8] text-[#1F6E47]", icon: Check },
};

export default async function LessonPage({ params }: { params: P }) {
  const user = await requireUser();
  const raw = getLesson((await params).lessonId);
  if (!raw) notFound();
  const t = await getT();
  const lesson = localizeLesson(raw, await getLocale());
  const progress = (await progressOf(user.id))[lesson.id] ?? {};
  const first = lesson.sections[0]!;

  return (
    <>
      <Breadcrumb back="/lessons" section={t("lessons.title")} current={t("lessons.lessonN", { n: lesson.number })} />
      <section
        aria-labelledby="lh-title"
        className="relative flex min-h-[190px] items-start overflow-hidden rounded-[22px] border border-[#DDEBF8] bg-[linear-gradient(100deg,#F4F9FF_0%,#E9F3FE_60%,#E1EFFD_100%)] px-5 py-6 md:px-8"
      >
        <div className="relative z-[1] max-w-[60%]">
          <span className="inline-block rounded-full bg-[#FDECA6] px-4 py-1.5 text-[13px] font-extrabold text-[#7A5A22]">
            {lesson.badge}
          </span>
          <h1 id="lh-title" className="mt-2.5 text-[26px] leading-tight font-extrabold text-navy md:text-[34px]">
            {lesson.title}
          </h1>
          <p className="mt-1.5 font-semibold text-text-2">{lesson.subtitle}</p>
        </div>
        <div aria-hidden="true" className="absolute top-0 right-0 bottom-0 w-[44%] max-w-[260px]">
          <Image
            src="/brand/lingyu-mascot.png"
            alt=""
            fill
            priority
            sizes="260px"
            className="object-contain object-right-bottom"
          />
        </div>
      </section>

      {lesson.highlights.length ? (
        <section aria-labelledby="lh-content" className="rounded-[20px] bg-white p-4 shadow-card md:p-5">
          <h2
            id="lh-content"
            className="inline-block rounded-full bg-[#DFF6E8] px-3.5 py-1.5 text-[13px] font-extrabold text-[#1F6E47]"
          >
            {t("lessons.content")}
          </h2>
          <ul className="mt-3 grid grid-cols-3 gap-2 md:gap-4">
            {lesson.highlights.map((h) => {
              const tone = TONE[h.tone];
              const Icon = tone.icon;
              return (
                <li
                  key={h.label}
                  className="flex flex-col items-center gap-1 rounded-2xl bg-[#EFF7FD] px-1 py-3 text-center"
                >
                  <Icon className={cn("size-6", tone.text)} aria-hidden="true" />
                  <span className={cn("text-2xl font-extrabold", tone.text)}>{h.value}</span>
                  <span className="text-[13px] font-semibold text-text-2">{h.label}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", tone.tag)}>{h.sample}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="lh-guide" className="rounded-[20px] bg-[#EFF8FD] p-4 md:p-5">
        <h2 id="lh-guide" className="text-[15px] font-extrabold text-navy">
          {t("lessons.guide")}
        </h2>
        <ol className="mt-3.5 grid grid-cols-3 gap-2 text-center">
          {[
            {
              icon: Headphones,
              color: "bg-[#3A88EE]",
              title: t("lessons.guideListen"),
              sub: t("lessons.guideListenSub"),
            },
            {
              icon: MousePointerClick,
              color: "bg-[#16CE8A]",
              title: t("lessons.guideChoose"),
              sub: t("lessons.guideChooseSub"),
            },
            { icon: Check, color: "bg-[#FEB23A]", title: t("lessons.guideCheck"), sub: t("lessons.guideCheckSub") },
          ].map((s, i) => (
            <li key={s.title} className="flex flex-col items-center gap-1">
              <span className={cn("flex size-11 items-center justify-center rounded-full text-white", s.color)}>
                <s.icon className="size-5" aria-hidden="true" />
              </span>
              <span className="text-[13.5px] font-bold text-navy">
                {i + 1}. {s.title}
              </span>
              <span className="text-xs text-text-2">{s.sub}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="lh-sections" className="rounded-[20px] bg-white p-4 shadow-card md:p-5">
        <h2 id="lh-sections" className="text-[15px] font-extrabold text-navy">
          {t("lessons.parts")}
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          {lesson.sections.map((s) => {
            const p = progress[s.id];
            return (
              <li key={s.id}>
                <Link
                  href={`/lessons/${lesson.id}/${s.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 hover:border-[#A9D3F8] hover:bg-blue-50"
                >
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-text-3">{s.label}</span>
                    <span className="block font-bold text-text">{s.title}</span>
                    <span className="block text-sm text-text-2">
                      {t("lessons.questions", { count: s.questions.length })}
                    </span>
                  </span>
                  {p ? (
                    <span className="flex flex-col items-end text-sm">
                      <span className="inline-flex items-center gap-1 font-bold text-green-700">
                        <CheckCircle2 className="size-4" />
                        {t("lessons.best", { score: p.bestScore, total: p.total })}
                      </span>
                      <span className="text-text-3">{t("lessons.last", { score: p.lastScore, total: p.total })}</span>
                    </span>
                  ) : (
                    <span className="text-sm text-text-3">{t("lessons.notDone")}</span>
                  )}
                  <ArrowRight className="size-5 text-blue-600" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <Button asChild variant="primary" size="lg" className="w-full md:w-auto md:self-start">
        <Link href={`/lessons/${lesson.id}/${first.id}`}>
          {t("lessons.startReview")}
          <ArrowRight />
        </Link>
      </Button>
    </>
  );
}
