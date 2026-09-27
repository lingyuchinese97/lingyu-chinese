import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BookOpenText,
  CalendarDays,
  ChevronRight,
  Flame,
  GraduationCap,
  Languages,
  RefreshCw,
  Target,
} from "lucide-react";
import { GrammarIcon, LeafDecor } from "@/components/layout/icons";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { dueCount, getActiveSession } from "@/features/review/service";
import { progressOf, summarize } from "@/features/lessons/service";
import { history, streak, today } from "@/features/progress/service";
import { ActivityIcon, activityLine } from "@/features/progress/components/activity";
import { getIntlTag, getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("home.title") };
}
export const dynamic = "force-dynamic";

/** "Nguyễn Văn An" → "Văn An" (2 chữ cuối, như firstName bản cũ). */
function firstName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length <= 1 ? (parts[0] ?? "") : parts.slice(-2).join(" ");
}

const CARDS = [
  {
    key: "vocabulary",
    href: "/vocabulary",
    icon: BookOpen,
    glyph: "中",
    bg: "bg-[linear-gradient(180deg,#FFF1D6_0%,#FFF8EA_100%)]",
    ring: "border-[#FBE3B5]",
    iconBg: "bg-[#FFD98A] text-[#B35C00]",
    title: "text-[#9A4B00]",
    btn: "bg-[#F5A524]",
  },
  {
    key: "grammar",
    href: "/grammar",
    icon: GrammarIcon,
    glyph: "文",
    bg: "bg-[linear-gradient(180deg,#E3F0FF_0%,#F2F8FF_100%)]",
    ring: "border-[#CFE3F9]",
    iconBg: "bg-[#BFDCFB] text-blue-700",
    title: "text-blue-700",
    btn: "bg-blue",
  },
  {
    key: "sentences",
    href: "/sentences",
    icon: Languages,
    glyph: "译",
    bg: "bg-[linear-gradient(180deg,#DDF6EA_0%,#F0FBF5_100%)]",
    ring: "border-[#C6EEDB]",
    iconBg: "bg-[#B6EBD2] text-green-700",
    title: "text-green-700",
    btn: "bg-green",
  },
  {
    key: "reading",
    href: "/reading",
    icon: BookOpenText,
    glyph: "读",
    bg: "bg-[linear-gradient(180deg,#FFE4EA_0%,#FFF3F5_100%)]",
    ring: "border-[#FBD2DC]",
    iconBg: "bg-[#FFC6D3] text-[#B4234A]",
    title: "text-[#B4234A]",
    btn: "bg-rose",
  },
  {
    key: "review",
    href: "/review/setup",
    icon: RefreshCw,
    glyph: "复",
    bg: "bg-[linear-gradient(180deg,#ECE6FF_0%,#F6F3FF_100%)]",
    ring: "border-[#DDD3FB]",
    iconBg: "bg-[#D6CAFB] text-[#5B3CC4]",
    title: "text-[#5B3CC4]",
    btn: "bg-[#7C5CE6]",
  },
] as const;

export default async function HomePage() {
  const user = await requireUser();
  const t = await getT();
  const tag = await getIntlTag();
  const [due, active, lessonMap, todayStats, recent, st] = await Promise.all([
    dueCount(user.id),
    getActiveSession(user.id),
    progressOf(user.id),
    today(user.id),
    history(user.id, { limit: 4 }),
    streak(user.id),
  ]);
  const lessons = summarize(lessonMap);
  const name = firstName(user.name);
  const dateLabel = new Date().toLocaleDateString(tag, {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const stats = [
    { key: "todayVocab", value: todayStats.vocab, icon: BookOpen, c: "bg-green-50 text-green-700" },
    { key: "todayGrammar", value: todayStats.grammar, icon: GrammarIcon, c: "bg-blue-50 text-blue-600" },
    { key: "todayReading", value: todayStats.reading, icon: BookOpenText, c: "bg-red-50 text-rose" },
    { key: "todayTranslation", value: todayStats.translation, icon: Languages, c: "bg-amber-50 text-[#B35C00]" },
  ] as const;

  return (
    <>
      {/* ---------- Lời chào ---------- */}
      <section
        aria-labelledby="home-hello"
        className="relative flex items-center gap-4 overflow-hidden rounded-[var(--radius-xl)] border border-[#DDEBF8] bg-[linear-gradient(100deg,#FFFFFF_0%,#F4F9FF_55%,#E6F2FE_100%)] px-5 py-5 shadow-card md:px-8 md:py-7"
      >
        <LeafDecor className="pointer-events-none absolute right-[30%] bottom-2 hidden w-12 -rotate-12 opacity-40 lg:block" />
        <span aria-hidden="true" className="hidden text-[46px] leading-none sm:block md:text-[56px]">
          👋
        </span>
        <div className="min-w-0 flex-1">
          <h1 id="home-hello" className="text-[26px] font-extrabold tracking-tight text-navy-900 md:text-[38px]">
            {name ? t("home.hello", { name }) : t("home.helloAnon")}
          </h1>
          <p className="mt-0.5 text-[18px] font-semibold text-navy md:text-[22px]">{t("home.question")}</p>
          <p className="mt-1.5 text-[14px] text-text-2 md:text-[15px]">{t("home.hint")}</p>
          {st.current ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[13.5px] font-semibold text-[#8A5300]">
              <Flame className="size-4 text-[#F07A1A]" aria-hidden="true" />
              {t("home.streak", { count: st.current })}
            </p>
          ) : null}
        </div>
        <Image
          src="/brand/lingyu-mascot.png"
          alt=""
          aria-hidden="true"
          width={1536}
          height={1024}
          priority
          className="hidden h-auto w-[170px] shrink-0 md:block xl:w-[220px]"
        />
      </section>

      {/* ---------- 5 chức năng chính ---------- */}
      <section aria-labelledby="home-features">
        <h2 id="home-features" className="sr-only">
          {t("home.features")}
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-5">
          {CARDS.map((c) => {
            const title = t(`home.cards.${c.key}.title`);
            return (
              <li key={c.key} className={c.key === "review" ? "col-span-2 sm:col-span-1" : undefined}>
                <Link
                  href={c.href}
                  aria-label={t("home.open", { name: title })}
                  className={cn(
                    "group flex h-full flex-col items-center gap-2 overflow-hidden rounded-[22px] border text-center shadow-card transition-transform outline-none hover:-translate-y-0.5 focus-visible:shadow-[var(--focus-ring)] motion-reduce:transition-none",
                    c.ring,
                    c.bg,
                  )}
                >
                  <div className="flex h-[88px] w-full items-center justify-center md:h-[132px]">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "relative flex size-[58px] items-center justify-center rounded-[20px] shadow-[0_10px_24px_rgba(20,60,110,.12)] md:size-[84px]",
                        c.iconBg,
                      )}
                    >
                      <c.icon className="size-8 md:size-11" />
                      <span className="absolute -top-2 -right-3 rounded-[10px] bg-white px-1.5 hanzi text-[18px] font-bold text-red shadow-soft md:text-[20px]">
                        {c.glyph}
                      </span>
                    </span>
                  </div>
                  <div className="flex w-full flex-1 flex-col items-center gap-1.5 rounded-t-[22px] bg-white/80 px-3 pt-3 pb-4">
                    <span className={cn("text-[18px] font-extrabold md:text-[20px]", c.title)}>{title}</span>
                    <span className="text-[13px] leading-snug text-text-2 md:text-[14px]">
                      {t(`home.cards.${c.key}.desc`)}
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-auto flex size-9 items-center justify-center rounded-full text-white shadow-soft transition-transform group-hover:translate-x-0.5",
                        c.btn,
                      )}
                    >
                      <ChevronRight className="size-5" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
        {active || due ? (
          <p className="mt-3 flex justify-end">
            <Link
              href={active ? "/review/session" : "/review/due"}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#7C5CE6] px-4 text-[14.5px] font-semibold text-white shadow-cta outline-none hover:bg-[#6A4BD6] focus-visible:shadow-[var(--focus-ring)]"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              {active ? t("home.continueReview") : t("home.reviewNow", { count: due })}
            </Link>
          </p>
        ) : null}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          {/* ---------- Học tập hôm nay ---------- */}
          <section
            aria-labelledby="home-today"
            className="rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card md:p-5"
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Flame className="size-6 text-[#F07A1A]" aria-hidden="true" />
              <h2 id="home-today" className="text-[18px] font-bold text-navy-900">
                {t("home.today")}
              </h2>
              <span className="ml-auto flex items-center gap-1.5 text-[13.5px] text-text-2">
                <CalendarDays className="size-4" aria-hidden="true" />
                {dateLabel}
              </span>
            </div>
            <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
              {stats.map((s) => (
                <li key={s.key} className="flex items-center gap-3 rounded-[16px] bg-[#F7FAFE] px-3 py-3">
                  <span
                    aria-hidden="true"
                    className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", s.c)}
                  >
                    <s.icon className="size-6" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[22px] leading-none font-extrabold text-navy-900 tabular-nums">
                      {s.value}
                    </span>
                    <span className="mt-1 text-[12.5px] leading-tight text-text-2">{t(`home.${s.key}`)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* ---------- Tiến độ học tập ---------- */}
          <section
            aria-labelledby="home-progress"
            className="rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card md:p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <GraduationCap className="size-6 text-blue-600" aria-hidden="true" />
              <h2 id="home-progress" className="text-[18px] font-bold text-navy-900">
                {t("home.progress")}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div
                className="h-3 min-w-[160px] flex-1 overflow-hidden rounded-full bg-blue-50"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={lessons.percent}
                aria-label={t("home.progressLessons", { done: lessons.done, total: lessons.total })}
              >
                <div className="h-full rounded-full bg-blue" style={{ width: `${lessons.percent}%` }} />
              </div>
              <span className="text-[14px] font-semibold text-text-2 tabular-nums">{lessons.percent}%</span>
              <Link
                href="/progress"
                className="flex items-center gap-1 text-[14px] font-semibold text-blue-600 hover:underline"
              >
                {t("home.details")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <p className="mt-2 text-[14px] text-text-2">
              {t("home.progressLessons", { done: lessons.done, total: lessons.total })}
            </p>
          </section>
        </div>

        {/* ---------- Bài học gần đây ---------- */}
        <section
          aria-labelledby="home-recent"
          className="rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card md:p-5"
        >
          <div className="mb-2 flex items-center gap-2">
            <Target className="size-6 text-rose" aria-hidden="true" />
            <h2 id="home-recent" className="text-[18px] font-bold text-navy-900">
              {t("home.recent")}
            </h2>
            <Link
              href="/progress/history"
              className="ml-auto flex items-center gap-1 text-[13.5px] font-semibold text-blue-600 hover:underline"
            >
              {t("home.seeAll")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          {recent.length ? (
            <ul className="flex flex-col divide-y divide-border">
              {recent.map((a) => {
                const line = activityLine(a, t);
                return (
                  <li key={a.id} className="flex items-center gap-3 py-2.5">
                    <ActivityIcon kind={a.kind} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-navy-900">{line.title}</p>
                      <p className="truncate text-[13px] text-text-2">{line.sub}</p>
                    </div>
                    <time dateTime={a.createdAt.toISOString()} className="shrink-0 text-[12.5px] text-text-3">
                      {a.createdAt.toLocaleDateString(tag, {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        timeZone: "Asia/Ho_Chi_Minh",
                      })}
                    </time>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-6 text-center text-[14px] text-text-2">{t("home.noRecent")}</p>
          )}
        </section>
      </div>
    </>
  );
}
