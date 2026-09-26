import type { Metadata } from "next";
import { CalendarClock } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { requireUser } from "@/server/session";
import { dueCount, getLastCustomConfig } from "@/features/review/service";
import { DueStart } from "@/features/review/components/due-start";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("review.due.title") };
}
export const dynamic = "force-dynamic";

export default async function ReviewDuePage() {
  const user = await requireUser();
  const t = await getT();
  const [due, last] = await Promise.all([dueCount(user.id), getLastCustomConfig(user.id)]);
  return (
    <>
      <Breadcrumb back="/review/setup" section={t("review.title")} current={t("review.due.title")} />
      <section className="mx-auto flex w-full max-w-[640px] flex-col gap-5 rounded-[var(--radius-xl)] border border-border bg-white/92 p-5 shadow-card md:p-8">
        <div className="flex items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#FFE9C2] text-[#C97A06]">
            <CalendarClock className="size-7" />
          </span>
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight text-navy md:text-[30px]">
              {t("review.due.title")}
            </h1>
            <p className="mt-1 text-text-2">{t("review.due.desc")}</p>
          </div>
        </div>
        <div className="rounded-[16px] bg-[#FFF7E8] px-5 py-4">
          <div className="text-[34px] leading-tight font-bold text-navy tabular-nums">{due}</div>
          <div className="text-text-2">
            {t("review.due.dueToday")}
            {due > 50 ? t("review.due.max") : ""}
          </div>
        </div>
        <DueStart due={due} defaultMode={last?.mode ?? "meaning"} />
      </section>
    </>
  );
}
