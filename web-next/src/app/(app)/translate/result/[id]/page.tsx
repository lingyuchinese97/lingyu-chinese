import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Clock3, Lightbulb, RotateCcw, Target } from "lucide-react";
import { z } from "zod";
import { requireUser } from "@/server/session";
import { getT } from "@/i18n/server";
import { Button } from "@/components/ui/button";
import { getTranslationSession, TranslationError } from "@/features/translation/service";
import { ResultDetails } from "@/features/translation/components/result-details";
import { formatDuration } from "@/features/translation/components/format";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("translate.resultTitle") };
}
export const dynamic = "force-dynamic";

export default async function TranslateResultPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const t = await getT();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const s = await getTranslationSession(user.id, id).catch((e) => {
    if (e instanceof TranslationError) notFound();
    throw e;
  });
  if (s.status !== "completed") redirect("/translate/session");
  const acc = Math.round((s.correctCount / s.total) * 100);
  const hints = s.questions.reduce((n, q) => n + q.hints, 0);
  const stats = [
    {
      icon: CheckCircle2,
      label: t("translate.score", { correct: s.correctCount, total: s.total }),
      c: "text-green-700 bg-green-50",
    },
    { icon: Target, label: `${t("translate.accuracy")}: ${acc}%`, c: "text-blue-700 bg-blue-50" },
    {
      icon: Clock3,
      label: `${t("translate.time")}: ${formatDuration(s.elapsedSec)}`,
      c: "text-[#6B46C1] bg-[#F3EEFF]",
    },
    { icon: Lightbulb, label: `${t("translate.hintsUsed")}: ${hints}`, c: "text-[#8A5300] bg-[#FFF3D2]" },
  ];
  return (
    <div className="flex flex-col gap-4">
      <section
        aria-labelledby="tr-result"
        className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-white p-5 shadow-card md:p-6"
      >
        <h1 id="tr-result" className="text-[26px] font-extrabold text-navy-900">
          {t("translate.resultTitle")}
        </h1>
        <p className="text-[16px] text-text">
          {t(acc === 100 ? "translate.perfect" : acc >= 60 ? "translate.good" : "translate.keep")}
        </p>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((x) => (
            <li key={x.label} className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 font-bold ${x.c}`}>
              <x.icon className="size-6" aria-hidden="true" />
              {x.label}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="primary">
            <Link href="/translate">
              <RotateCcw />
              {t("translate.again")}
            </Link>
          </Button>
        </div>
      </section>
      <ResultDetails session={s} />
    </div>
  );
}
