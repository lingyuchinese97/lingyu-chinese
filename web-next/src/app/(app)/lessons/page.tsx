import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { requireUser } from "@/server/session";
import { LESSONS, localizeLesson } from "@/data/lessons";
import { getLocale, getT } from "@/i18n/server";
import { progressOf } from "@/features/lessons/service";
import { ProgressBar } from "@/features/lessons/components/progress-bar";
import { FeatureHero } from "@/components/feature-hero";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("lessons.title") };
}

export default async function LessonsPage() {
  const user = await requireUser();
  const progress = await progressOf(user.id);
  const t = await getT();
  const locale = await getLocale();
  return (
    <>
      <FeatureHero id="ls-title" title={t("lessons.title")} description={t("lessons.subtitle")} />
      <ul className="grid gap-4 md:grid-cols-2">
        {LESSONS.map((raw) => {
          const l = localizeLesson(raw, locale);
          const done = l.sections.filter((s) => progress[l.id]?.[s.id]).length;
          return (
            <li key={l.id}>
              <Link
                href={`/lessons/${l.id}`}
                className="flex h-full flex-col gap-3 rounded-[var(--radius-xl)] border border-border bg-white p-5 shadow-card outline-none hover:border-[#A9D3F8] focus-visible:[box-shadow:var(--focus-ring)]"
              >
                <span className="w-fit rounded-full bg-[#FDECA6] px-3.5 py-1 text-[13px] font-extrabold text-[#7A5A22]">
                  {t("lessons.lessonBadge", { n: l.number })}
                </span>
                <span className="text-xl font-extrabold text-navy">{l.title}</span>
                <span className="text-[15px] text-text-2">
                  {l.sections.map((s) => `${s.label}: ${s.title}`).join(" · ")}
                </span>
                <ProgressBar
                  value={done}
                  max={l.sections.length}
                  label={t("lessons.lessonProgress", { n: l.number })}
                />
                <span className="flex items-center justify-between text-sm text-text-2">
                  <span className="inline-flex items-center gap-1.5">
                    {done === l.sections.length ? <CheckCircle2 className="size-4 text-green-700" /> : null}
                    {t("lessons.partsDone", { done, total: l.sections.length })}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
                    {done ? t("lessons.continue") : t("lessons.start")}
                    <ArrowRight className="size-4" />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
