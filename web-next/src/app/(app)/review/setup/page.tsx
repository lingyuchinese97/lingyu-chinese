import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CalendarClock, ChevronRight, Plus } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/session";
import { listTags, vocabStats } from "@/features/vocabulary/service";
import { dueCount, getActiveSession, getLastCustomConfig } from "@/features/review/service";
import { ReviewSetup } from "@/features/review/components/review-setup";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("review.setup.pageTitle") };
}

export default async function ReviewSetupPage() {
  const user = await requireUser();
  const t = await getT();
  const [tags, stats, active, last, due] = await Promise.all([
    listTags(user.id),
    vocabStats(user.id),
    getActiveSession(user.id),
    getLastCustomConfig(user.id),
    dueCount(user.id),
  ]);

  return (
    <>
      <Breadcrumb back="/home" section={t("review.title")} current={t("review.setup.crumb")} />
      {stats.total === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-[var(--radius-xl)] border border-border bg-white/92 px-5 py-12 text-center shadow-card">
          <span className="flex size-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <BookOpen className="size-7" />
          </span>
          <h1 className="text-xl font-bold text-navy">{t("review.setup.noVocab")}</h1>
          <p className="max-w-[420px] text-text-2">{t("review.setup.noVocabDesc")}</p>
          <Button asChild variant="solid">
            <Link href="/vocabulary/new">
              <Plus />
              {t("vocab.add")}
            </Link>
          </Button>
        </section>
      ) : (
        <>
          <Link
            href="/review/due"
            className="flex items-center gap-4 rounded-[18px] border border-[#FBE3B4] bg-[#FFF7E8] px-4 py-3.5 hover:bg-[#FFF1D6]"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#FFE9C2] text-[#C97A06]">
              <CalendarClock className="size-6" />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-navy">{t("review.setup.dueToday", { count: due })}</strong>
              <span className="text-sm text-text-2">{t("review.setup.dueDesc")}</span>
            </span>
            <ChevronRight className="size-5 text-text-3" />
          </Link>
          <ReviewSetup
            tags={tags.filter((x) => x.count > 0).map((x) => ({ name: x.name, count: x.count }))}
            total={stats.total}
            last={last}
            active={
              active ? { answered: active.questions.filter((q) => q.answered).length, total: active.total } : null
            }
          />
          {/* Chừa chỗ cho nút "Bắt đầu" dính đáy trên điện thoại. */}
          <div aria-hidden="true" className="h-16 lg:hidden" />
        </>
      )}
    </>
  );
}
