import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Layers, Music, NotebookPen, Target, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/session";
import { getT } from "@/i18n/server";
import { cn } from "@/lib/utils";
import { FINALS, INITIALS, SANDHI_RULES, TONES } from "@/data/pronunciation";
import { listNotes } from "@/features/pronunciation/service";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("pronunciation.title") };
}
export const dynamic = "force-dynamic";

export default async function PronunciationPage() {
  const user = await requireUser();
  const t = await getT();
  const notes = await listNotes(user.id);
  const cards = [
    {
      key: "initials",
      href: "/pronunciation/initials",
      icon: BookOpen,
      tone: "bg-blue-50 text-blue-600",
      chip: "bg-blue-50 text-blue-700",
      count: t("pronunciation.overview.initialsCount", { count: INITIALS.length }),
      desc: t("pronunciation.overview.initialsDesc"),
      samples: ["b", "p", "m", "f", "zh", "ch", "sh", "r"],
    },
    {
      key: "finals",
      href: "/pronunciation/finals",
      icon: Layers,
      tone: "bg-green-50 text-green-700",
      chip: "bg-green-50 text-green-700",
      count: t("pronunciation.overview.finalsCount", { count: FINALS.length }),
      desc: t("pronunciation.overview.finalsDesc"),
      samples: ["a", "o", "e", "ai", "ao", "an", "ang", "ü"],
    },
    {
      key: "tones",
      href: "/pronunciation/tones",
      icon: Music,
      tone: "bg-amber-50 text-amber",
      chip: "bg-amber-50 text-[#8A5300]",
      count: t("pronunciation.overview.tonesCount"),
      desc: t("pronunciation.overview.tonesDesc"),
      samples: TONES.filter((x) => x.tone !== 5).map((x) => x.example.pinyin),
    },
    {
      key: "sandhi",
      href: "/pronunciation/sandhi",
      icon: Waves,
      tone: "bg-red-50 text-red",
      chip: "bg-red-50 text-red",
      count: t("pronunciation.overview.sandhiCount", { count: SANDHI_RULES.length }),
      desc: t("pronunciation.overview.sandhiDesc"),
      samples: ["你好", "很好", "一个", "不是"],
    },
  ] as const;
  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {cards.map((c) => (
          <li key={c.key}>
            <section
              aria-labelledby={`po-${c.key}`}
              className="flex h-full flex-col gap-3 rounded-[var(--radius-xl)] border border-border bg-white/95 p-5 shadow-card"
            >
              <div className="flex items-center gap-3">
                <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-full", c.tone)}>
                  <c.icon className="size-6" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 id={`po-${c.key}`} className="text-[19px] font-extrabold text-navy-900">
                    {t(`pronunciation.tabs.${c.key}`)}
                  </h2>
                  <p className="text-[14px] font-semibold text-text-2">{c.count}</p>
                </div>
              </div>
              <p className="text-[14.5px] text-text-2">{c.desc}</p>
              <ul className="flex flex-wrap gap-1.5" aria-hidden="true">
                {c.samples.map((s) => (
                  <li key={s} className={cn("rounded-[10px] px-2.5 py-1 text-[15px] font-bold", c.chip)} lang="zh">
                    {s}
                  </li>
                ))}
              </ul>
              <Button asChild variant="secondary" size="sm" className="mt-auto self-start">
                <Link
                  href={c.href}
                  aria-label={t("pronunciation.overview.openLabel", { name: t(`pronunciation.tabs.${c.key}`) })}
                >
                  {t("pronunciation.overview.open")}
                  <ArrowRight />
                </Link>
              </Button>
            </section>
          </li>
        ))}
      </ul>
      <section
        aria-labelledby="po-practice"
        className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-[#DDEBF8] bg-[linear-gradient(100deg,#FFFFFF_0%,#F1F8FF_100%)] p-5 shadow-card md:flex-row md:items-center"
      >
        <span className="hidden size-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 md:flex">
          <Target className="size-7" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="po-practice" className="text-[19px] font-extrabold text-navy-900">
            {t("pronunciation.overview.practiceTitle")}
          </h2>
          <p className="mt-1 text-[14.5px] text-text-2">{t("pronunciation.overview.practiceDesc")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/pronunciation/practice">
              <Target />
              {t("pronunciation.overview.startPractice")}
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/pronunciation/notes">
              <NotebookPen />
              {t("pronunciation.overview.openNotes")}
              <span className="rounded-full bg-blue-50 px-2 text-[13px]">
                {t("pronunciation.overview.notesCount", { count: notes.length })}
              </span>
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
