import type { Metadata } from "next";
import { BookOpen, Flame, GraduationCap, TrendingUp, Clock3 } from "lucide-react";
import { GrammarIcon } from "@/components/layout/icons";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { dailyMinutes, summary } from "@/features/progress/service";
import { DailyChart } from "@/features/progress/components/daily-chart";
import { GoalsCard } from "@/features/progress/components/goals-card";
import { getIntlTag, getT } from "@/i18n/server";
import type { T } from "@/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("progress.title") };
}
export const dynamic = "force-dynamic";

function duration(t: T, seconds: number) {
  const m = Math.round(Math.abs(seconds) / 60);
  return m >= 60 ? t("progress.hoursMinutes", { h: Math.floor(m / 60), m: m % 60 }) : t("progress.minutesOnly", { m });
}

function Bar({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div
      className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#EEF4FB]"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label={label}
    >
      <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
    </div>
  );
}

export default async function ProgressPage() {
  const user = await requireUser();
  const t = await getT();
  const tag = await getIntlTag();
  const [s, daily] = await Promise.all([summary(user.id), dailyMinutes(user.id, 7)]);
  const days = t("progress.weekdays").split(",");
  const delta =
    s.weekSecondsDelta === 0
      ? t("progress.deltaSame")
      : t(s.weekSecondsDelta > 0 ? "progress.deltaUp" : "progress.deltaDown", {
          time: duration(t, s.weekSecondsDelta),
        });
  const started = s.totalSeconds > 0 || s.streak.current > 0;
  const cards = [
    {
      key: "lessonsDone",
      icon: GraduationCap,
      c: "bg-red-50 text-rose",
      bar: "bg-blue",
      v: s.lessons,
    },
    { key: "vocabLearned", icon: BookOpen, c: "bg-green-50 text-green-700", bar: "bg-green", v: s.vocab },
    {
      key: "grammarLearned",
      icon: GrammarIcon,
      c: "bg-[#F1ECFF] text-[#5B3CC4]",
      bar: "bg-blue",
      v: { done: s.grammar.learned, total: s.grammar.total, percent: s.grammar.percent },
    },
  ] as const;
  const skills = [
    { key: "vocab", color: "bg-green", icon: BookOpen },
    { key: "grammar", color: "bg-blue", icon: GrammarIcon },
    { key: "reading", color: "bg-[#5AAEF2]", icon: BookOpen },
    { key: "translation", color: "bg-[#F5A524]", icon: TrendingUp },
    { key: "review", color: "bg-[#2BC0B4]", icon: TrendingUp },
  ] as const;

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <p className="flex items-center rounded-[18px] border border-[#DDEBF8] bg-white px-5 py-4 text-[15px] font-semibold text-blue-700 shadow-soft">
          {started ? t("progress.cheer1") : t("progress.cheerStart1")}
          <br className="hidden sm:block" /> {started ? t("progress.cheer2") : t("progress.cheerStart2")}
        </p>
        <section
          aria-labelledby="pg-streak"
          className="flex flex-wrap items-center gap-4 rounded-[18px] border border-[#FBE3B5] bg-[linear-gradient(135deg,#FFF9EA,#FFF3D2)] px-5 py-4"
        >
          <Flame className="size-11 shrink-0 text-[#F07A1A]" aria-hidden="true" />
          <div className="min-w-0">
            <h2 id="pg-streak" className="text-[14px] font-semibold text-text">
              {t("progress.streakTitle")}
            </h2>
            <p className="text-[26px] leading-tight font-extrabold text-[#E0580B]">
              {t("progress.streakDays", { count: s.streak.current })}
            </p>
            <p className="text-[13px] text-[#8A5300]">
              {s.streak.current ? t("progress.streakGood") : t("progress.streakStart")}
            </p>
          </div>
          <table className="ml-auto border-separate border-spacing-1.5 text-center text-[12px]">
            <thead>
              <tr>
                {days.map((d) => (
                  <th key={d} scope="col" className="font-semibold text-text-2">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.streak.weeks.map((w, wi) => (
                <tr key={wi}>
                  {w.map((d, i) => {
                    const label = new Date(`${d.day}T00:00:00Z`).toLocaleDateString(tag, {
                      day: "2-digit",
                      month: "2-digit",
                      timeZone: "UTC",
                    });
                    return (
                      <td key={d.day}>
                        <span
                          role="img"
                          aria-label={t(d.studied ? "progress.studiedDay" : "progress.notStudiedDay", {
                            day: `${days[i]} ${label}`,
                          })}
                          className={cn(
                            "mx-auto flex size-6 items-center justify-center rounded-full text-[12px] font-bold",
                            d.studied ? "bg-green text-white" : d.future ? "bg-white/60" : "bg-[#E6ECF3]",
                          )}
                        >
                          {d.studied ? "✓" : ""}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <li className="flex items-start gap-3 rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-blue-50 text-blue-600">
            <Clock3 className="size-7" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-text-2">{t("progress.totalTime")}</p>
            <p className="text-[24px] leading-tight font-extrabold text-navy-900">{duration(t, s.totalSeconds)}</p>
            <p className={cn("text-[13px] font-semibold", s.weekSecondsDelta >= 0 ? "text-green-700" : "text-rose")}>
              {delta}
            </p>
          </div>
        </li>
        {cards.map((c) => (
          <li
            key={c.key}
            className="flex items-start gap-3 rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card"
          >
            <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-[14px]", c.c)}>
              <c.icon className="size-7" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-text-2">{t(`progress.${c.key}`)}</p>
              <p className="text-[24px] leading-tight font-extrabold text-navy-900 tabular-nums">
                {t("progress.ofTotal", {
                  done: "done" in c.v ? c.v.done : c.v.learned,
                  total: c.v.total,
                })}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <Bar value={c.v.percent} label={t(`progress.${c.key}`)} color={c.bar} />
                <span className="text-[13px] font-semibold text-text-2 tabular-nums">{c.v.percent}%</span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <DailyChart initial={daily} />
        <section
          aria-labelledby="pg-skills"
          className="rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card md:p-5"
        >
          <h2 id="pg-skills" className="mb-3 flex items-center gap-2 text-[18px] font-bold text-navy-900">
            <TrendingUp className="size-6 text-blue-600" aria-hidden="true" />
            {t("progress.skills")}
          </h2>
          <ul className="flex flex-col gap-3.5">
            {skills.map((k) => (
              <li key={k.key} className="flex items-center gap-3">
                <span className="w-[92px] shrink-0 text-[14.5px] font-semibold text-text">
                  {t(`progress.skill.${k.key}`)}
                </span>
                <Bar value={s.skills[k.key]} label={t(`progress.skill.${k.key}`)} color={k.color} />
                <span className="w-10 text-right text-[13.5px] font-semibold text-text-2 tabular-nums">
                  {s.skills[k.key]}%
                </span>
              </li>
            ))}
          </ul>
        </section>
        <GoalsCard goals={s.goals} />
      </div>
    </>
  );
}
