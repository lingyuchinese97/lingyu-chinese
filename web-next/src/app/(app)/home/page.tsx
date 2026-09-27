import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  BarChart3,
  BookOpen,
  BookOpenText,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Headphones,
  Languages,
  RefreshCw,
  Target,
} from "lucide-react";
import { GrammarIcon, LeafDecor } from "@/components/layout/icons";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { dueCount, getActiveSession } from "@/features/review/service";
import { history, summary, today } from "@/features/progress/service";
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

/** "25 phút trước", "Hôm qua"… theo ngôn ngữ giao diện. */
function relative(d: Date, now: Date, tag: string, justNow: string) {
  const rtf = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });
  const s = Math.round((d.getTime() - now.getTime()) / 1000);
  const a = Math.abs(s);
  if (a < 60) return justNow;
  if (a < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (a < 86400) return rtf.format(Math.round(s / 3600), "hour");
  if (a < 30 * 86400) return rtf.format(Math.round(s / 86400), "day");
  return d.toLocaleDateString(tag, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" });
}

const CARDS = [
  {
    key: "lessons",
    href: "/lessons",
    icon: BookOpenText,
    badge: "HSK",
    bg: "bg-[linear-gradient(160deg,#FFF3D6_0%,#FFF9EC_100%)]",
    ring: "border-[#FBE3B5]",
    art: "bg-white text-[#E9A22D]",
    halo: "bg-[#FFE5AA]",
    btn: "bg-[#F5A524]",
  },
  {
    key: "vocabulary",
    href: "/vocabulary",
    icon: BookOpen,
    badge: "词",
    bg: "bg-[linear-gradient(160deg,#E3F0FF_0%,#F3F8FF_100%)]",
    ring: "border-[#CFE3F9]",
    art: "bg-white text-blue-700",
    halo: "bg-[#BBDDFC]",
    btn: "bg-blue",
  },
  {
    key: "grammar",
    href: "/grammar",
    icon: GrammarIcon,
    badge: "文",
    bg: "bg-[linear-gradient(160deg,#FFE4EA_0%,#FFF4F6_100%)]",
    ring: "border-[#FBD2DC]",
    art: "bg-white text-[#EF5C8C]",
    halo: "bg-[#FFCAD8]",
    btn: "bg-rose",
  },
  {
    key: "pronunciation",
    href: "/pronunciation",
    icon: AudioLines,
    badge: "音",
    bg: "bg-[linear-gradient(160deg,#DDF6EA_0%,#F1FBF6_100%)]",
    ring: "border-[#C6EEDB]",
    art: "bg-white text-[#08AA9C]",
    halo: "bg-[#B4F0DC]",
    btn: "bg-green",
  },
  {
    key: "listening",
    href: "/listening",
    icon: Headphones,
    badge: "听",
    bg: "bg-[linear-gradient(160deg,#ECE6FF_0%,#F7F4FF_100%)]",
    ring: "border-[#DDD3FB]",
    art: "bg-white text-[#7757DE]",
    halo: "bg-[#DCD2FF]",
    btn: "bg-[#7C5CE6]",
  },
] as const;

/** Vòng tiến độ (SVG). */
function Ring({ value, color, label }: { value: number; color: string; label: string }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-[76px] md:size-[84px]" role="img" aria-label={label}>
      <svg viewBox="0 0 76 76" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="38" cy="38" r={r} fill="none" stroke="#EEF4FB" strokeWidth="7" />
        <circle
          cx="38"
          cy="38"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(100, Math.max(0, value)) / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[17px] font-extrabold text-navy-900 tabular-nums">
        {value}%
      </span>
    </div>
  );
}

export default async function HomePage() {
  const user = await requireUser();
  const t = await getT();
  const tag = await getIntlTag();
  const now = new Date();
  const [due, active, todayStats, recent, s] = await Promise.all([
    dueCount(user.id),
    getActiveSession(user.id),
    today(user.id),
    history(user.id, { limit: 3 }),
    summary(user.id),
  ]);
  const name = firstName(user.name);
  const st = s.streak;
  const week = st.weeks[1] ?? [];
  const days = t("progress.weekdays").split(",");
  const dateLabel = now.toLocaleDateString(tag, {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const goal = s.goals.minutes_day;
  const goalPct = goal.target ? Math.min(100, Math.round((goal.value / goal.target) * 100)) : 0;
  const stats = [
    { key: "todayVocab", value: todayStats.vocab, icon: BookOpen, c: "bg-green-50 text-green-700" },
    { key: "todayGrammar", value: todayStats.grammar, icon: GrammarIcon, c: "bg-blue-50 text-blue-600" },
    { key: "todayReading", value: todayStats.reading, icon: BookOpenText, c: "bg-red-50 text-rose" },
    { key: "todayTranslation", value: todayStats.translation, icon: Languages, c: "bg-amber-50 text-[#B35C00]" },
  ] as const;
  const rings = [
    {
      key: "vocab",
      value: s.vocab.percent,
      color: "#1595F5",
      sub: t("home.ringVocab", { a: s.vocab.learned, b: s.vocab.total }),
    },
    {
      key: "grammar",
      value: s.grammar.percent,
      color: "#7AB8F5",
      sub: t("home.ringGrammar", { a: s.grammar.learned, b: s.grammar.total }),
    },
    {
      key: "reading",
      value: s.skills.reading,
      color: "#1C7FD6",
      sub: t("home.ringSessions", { count: s.sessions30.reading }),
    },
    {
      key: "translation",
      value: s.skills.translation,
      color: "#F08BA0",
      sub: t("home.ringSessions", { count: s.sessions30.translation }),
    },
    {
      key: "review",
      value: s.skills.review,
      color: "#22B573",
      sub: t("home.ringSessions", { count: s.sessions30.review }),
    },
  ] as const;

  return (
    <>
      {/* ---------- Ảnh bìa: lời chào + linh vật + chuỗi ngày học ---------- */}
      <section
        aria-labelledby="home-hello"
        className="relative isolate overflow-hidden rounded-[24px] border border-[#D7EAF9] bg-[linear-gradient(110deg,#F7FCFF_0%,#E7F5FF_55%,#D8EEFF_100%)] shadow-card"
      >
        {/* Nền: ánh sáng + lá trang trí */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-[38%] size-[340px] rounded-full bg-white/70 blur-3xl" />
          <div className="absolute -bottom-28 -left-16 size-[260px] rounded-full bg-[#DDF6EA]/70 blur-3xl" />
          <div className="absolute top-6 right-[30%] size-[180px] rounded-full bg-[#CFE7FF]/60 blur-2xl" />
          <div className="absolute -right-16 -bottom-24 h-44 w-[70%] rotate-[-7deg] rounded-[50%] bg-[#B9E4FA]/55" />
          <div className="absolute -bottom-28 left-[12%] h-40 w-[58%] rotate-[6deg] rounded-[50%] bg-white/55" />
          <LeafDecor className="absolute top-3 left-3 w-10 -rotate-45 opacity-50" />
          <LeafDecor className="absolute bottom-4 left-[32%] w-12 rotate-12 opacity-40" />
          <LeafDecor className="absolute top-8 right-[34%] hidden w-9 rotate-45 opacity-50 lg:block" />
          <LeafDecor className="absolute right-4 bottom-3 w-11 -rotate-12 opacity-40" />
        </div>

        <div className="grid items-center gap-4 p-5 md:grid-cols-[minmax(0,1fr)_180px] md:p-7 xl:min-h-[288px] xl:grid-cols-[minmax(0,1fr)_minmax(210px,280px)_minmax(240px,300px)] xl:gap-2">
          <div className="min-w-0">
            <h1 id="home-hello" className="text-navy-900">
              <span className="block text-[20px] font-bold text-blue-600 md:text-[22px]">{t("home.helloSmall")}</span>{" "}
              <span className="mt-0.5 flex items-center gap-2 text-[32px] leading-tight font-extrabold tracking-tight md:text-[44px]">
                {name ? t("home.helloName", { name }) : t("home.helloAnon")}
                <LeafDecor className="w-9 md:w-11" />
              </span>
            </h1>
            <p className="mt-2 text-[18px] font-bold text-navy md:text-[21px]">{t("home.question")}</p>
            <p className="mt-1 max-w-[520px] text-[14.5px] text-text-2 md:text-[15px]">{t("home.hint")}</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link
                href="/lessons"
                className="inline-flex min-h-12 items-center gap-2.5 rounded-full px-6 text-[16px] font-bold text-white shadow-cta outline-none bg-grad-primary hover:[background:var(--grad-primary-hover)] focus-visible:shadow-[var(--focus-ring)]"
              >
                <BookOpenText className="size-5" aria-hidden="true" />
                {t("home.startNow")}
                <ArrowRight className="size-5" aria-hidden="true" />
              </Link>
              {active || due ? (
                <Link
                  href={active ? "/review/session" : "/review/due"}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border-[1.5px] border-[#CFC2F7] bg-white/90 px-5 text-[15px] font-semibold text-[#5B3CC4] outline-none hover:bg-[#F6F3FF] focus-visible:shadow-[var(--focus-ring)]"
                >
                  <RefreshCw className="size-4" aria-hidden="true" />
                  {active ? t("home.continueReview") : t("home.reviewNow", { count: due })}
                </Link>
              ) : null}
            </div>
          </div>

          <div aria-hidden="true" className="relative hidden h-full min-h-[190px] items-center justify-center md:flex">
            <p className="absolute top-2 left-0 z-10 hidden w-[125px] -rotate-[10deg] hand text-[19px] leading-[1.25] whitespace-pre-line text-navy xl:block">
              {t("home.quote")}
            </p>
            <div className="absolute right-0 bottom-1 hidden h-[52px] w-[175px] -rotate-6 rounded-[50%] border-b-[10px] border-[#92BCD9] bg-white shadow-[0_12px_18px_rgba(28,80,130,.15)] xl:block">
              <BookOpenText className="mx-auto mt-1 size-11 text-[#315A85]" strokeWidth={1.3} />
            </div>
            <Image
              src="/brand/lingyu-mascot.png"
              alt=""
              width={1536}
              height={1024}
              priority
              className="relative z-0 h-auto w-[175px] translate-x-6 -translate-y-1 drop-shadow-[0_16px_24px_rgba(20,60,110,.16)] xl:w-[230px] xl:translate-x-9 xl:-translate-y-4"
            />
          </div>

          {/* Chuỗi ngày học */}
          <section
            aria-labelledby="home-streak"
            className="rounded-[26px] border border-white bg-white/95 p-3.5 shadow-[0_14px_36px_rgba(20,60,110,.10)] md:col-span-2 xl:col-span-1"
          >
            <div className="flex items-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#FFF6E4,#FFFBF2)] px-3.5 py-3">
              <span aria-hidden="true" className="text-[40px] leading-none">
                🔥
              </span>
              <div className="min-w-0">
                <h2 id="home-streak" className="text-[14.5px] font-bold text-[#C2410C]">
                  {t("home.streakTitle")}
                </h2>
                <p className="text-[30px] leading-tight font-extrabold text-blue-600 tabular-nums">
                  {t("home.streakDays", { count: st.current })}
                </p>
                <p className="text-[13.5px] text-text-2">{st.current ? t("home.streakGood") : t("home.streakStart")}</p>
              </div>
            </div>
            <ol className="mt-3 grid grid-cols-7 gap-1 text-center">
              {week.map((d, i) => (
                <li key={d.day} className="flex flex-col items-center gap-1.5">
                  <span className="text-[12.5px] font-semibold text-text-2">{days[i]}</span>
                  <span
                    role="img"
                    aria-label={t(d.studied ? "progress.studiedDay" : "progress.notStudiedDay", { day: days[i] ?? "" })}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full",
                      d.studied
                        ? "bg-green text-white"
                        : d.future
                          ? "bg-[#EEF4FB]"
                          : "border-2 border-[#DCE6F2] bg-white",
                    )}
                  >
                    {d.studied ? <Check className="size-4" strokeWidth={3} aria-hidden="true" /> : null}
                    {d.future ? <span className="size-1.5 rounded-full bg-[#C4D3E3]" aria-hidden="true" /> : null}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </section>

      {/* ---------- 5 chức năng chính ---------- */}
      <section aria-labelledby="home-features">
        <h2 id="home-features" className="sr-only">
          {t("home.features")}
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-5">
          {CARDS.map((c, i) => {
            const title = t(`home.cards.${c.key}.title`);
            return (
              <li key={c.key} className={i === CARDS.length - 1 ? "col-span-2 sm:col-span-1" : undefined}>
                <Link
                  href={c.href}
                  aria-label={t("home.open", { name: title })}
                  className={cn(
                    "group relative flex h-full flex-col overflow-hidden rounded-[22px] border shadow-card transition-transform outline-none hover:-translate-y-0.5 focus-visible:shadow-[var(--focus-ring)] motion-reduce:transition-none",
                    c.ring,
                    c.bg,
                  )}
                >
                  <LeafDecor className="pointer-events-none absolute top-3 right-3 w-8 rotate-12 opacity-40" />
                  <div className="relative flex h-[106px] items-center justify-center overflow-hidden md:h-[124px]">
                    <span
                      aria-hidden="true"
                      className={cn("absolute top-5 size-[100px] rounded-full opacity-70 blur-xl", c.halo)}
                    />
                    <span
                      aria-hidden="true"
                      className="absolute bottom-1 left-5 h-5 w-11 -rotate-[18deg] rounded-[50%] bg-white/70"
                    />
                    {(c.key === "vocabulary" || c.key === "grammar" || c.key === "lessons") && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute size-[72px] rotate-[-17deg] rounded-[16px] border border-white/80 shadow-[0_8px_18px_rgba(20,60,110,.1)] md:size-[86px]",
                          c.halo,
                        )}
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "relative flex size-[72px] -rotate-6 items-center justify-center rounded-[20px] border border-white/80 shadow-[0_13px_22px_rgba(20,60,110,.16)] transition-transform group-hover:rotate-0 motion-reduce:transition-none md:size-[86px]",
                        c.art,
                      )}
                    >
                      <c.icon className="size-10 md:size-12" strokeWidth={1.9} />
                      <span className="absolute -top-2.5 -right-4 rotate-6 rounded-[10px] bg-white px-1.5 py-0.5 text-[15px] font-extrabold text-blue-700 shadow-soft md:text-[17px]">
                        <span className={c.badge === "HSK" ? undefined : "hanzi"}>{c.badge}</span>
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-1 items-end gap-2 rounded-t-[16px] bg-white/80 px-3.5 pt-3 pb-3.5 md:px-4">
                    <div className="min-w-0 flex-1">
                      <span className="block text-[16px] leading-tight font-extrabold text-navy-900 md:text-[18px]">
                        {title}
                      </span>
                      <span className="mt-1 block text-[12.5px] leading-snug text-text-2 md:text-[13.5px]">
                        {t(`home.cards.${c.key}.desc`)}
                      </span>
                    </div>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full text-white shadow-soft transition-transform group-hover:translate-x-0.5",
                        c.btn,
                      )}
                    >
                      <ArrowRight className="size-5" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---------- Học tập hôm nay + Mục tiêu ---------- */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section
          aria-labelledby="home-today"
          className="rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card md:p-5"
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <CalendarDays className="size-6 text-blue-600" aria-hidden="true" />
            <h2 id="home-today" className="text-[18px] font-bold text-navy-900">
              {t("home.today")}
            </h2>
            <span className="ml-auto flex items-center gap-1.5 text-[13.5px] text-text-2">
              <CalendarDays className="size-4" aria-hidden="true" />
              {dateLabel}
            </span>
          </div>
          <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {stats.map((x) => (
              <li key={x.key} className="flex items-center gap-3 rounded-[16px] bg-[#F7FAFE] px-3 py-3">
                <span
                  aria-hidden="true"
                  className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", x.c)}
                >
                  <x.icon className="size-6" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[22px] leading-none font-extrabold text-navy-900 tabular-nums">{x.value}</span>
                  <span className="mt-1 text-[12.5px] leading-tight text-text-2">{t(`home.${x.key}`)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="home-goal"
          className="rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card md:p-5"
        >
          <div className="mb-3 flex items-center gap-2">
            <Target className="size-6 text-rose" aria-hidden="true" />
            <h2 id="home-goal" className="text-[18px] font-bold text-navy-900">
              {t("home.goalTitle")}
            </h2>
            <Link href="/progress" className="ml-auto text-[14px] font-semibold text-blue-600 hover:underline">
              {t("home.goalEdit")}
            </Link>
          </div>
          <div className="flex items-center gap-3 rounded-[16px] bg-[#F7FAFE] px-3.5 py-3">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-[#E08600]"
            >
              <Clock3 className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-semibold text-navy-900">{t("home.goalMinutes", { n: goal.target })}</p>
              <p className="text-[13px] text-text-2">{t("home.goalValue", { v: goal.value, n: goal.target })}</p>
              <div className="mt-1.5 flex items-center gap-2.5">
                <div
                  className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#E4EEF9]"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={goalPct}
                  aria-label={t("home.goalMinutes", { n: goal.target })}
                >
                  <div className="h-full rounded-full bg-blue" style={{ width: `${goalPct}%` }} />
                </div>
                <span className="text-[13px] font-semibold text-text-2 tabular-nums">{goalPct}%</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ---------- Tiến độ học tập + Bài học gần đây ---------- */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section
          aria-labelledby="home-progress"
          className="rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card md:p-5"
        >
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <BarChart3 className="size-6 text-blue-600" aria-hidden="true" />
            <h2 id="home-progress" className="text-[18px] font-bold text-navy-900">
              {t("home.progress")}
            </h2>
            <Link
              href="/progress"
              className="ml-auto flex items-center gap-1 text-[14px] font-semibold text-blue-600 hover:underline"
            >
              {t("home.details")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <p className="mb-3 text-[13.5px] text-text-2">
            {t("home.progressLessons", { done: s.lessons.done, total: s.lessons.total })}
          </p>
          <ul className="grid grid-cols-2 gap-y-4 sm:grid-cols-3 md:grid-cols-5 md:divide-x md:divide-border">
            {rings.map((r) => {
              const label = t(`home.rings.${r.key}`);
              return (
                <li key={r.key} className="flex flex-col items-center gap-1.5 px-2 text-center">
                  <Ring value={r.value} color={r.color} label={t("home.ringLabel", { name: label, n: r.value })} />
                  <span className="text-[15px] font-bold text-navy-900">{label}</span>
                  <span className="text-[12.5px] text-text-2">{r.sub}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section
          aria-labelledby="home-recent"
          className="rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card md:p-5"
        >
          <div className="mb-2 flex items-center gap-2">
            <Clock3 className="size-6 text-rose" aria-hidden="true" />
            <h2 id="home-recent" className="text-[18px] font-bold text-navy-900">
              {t("home.recent")}
            </h2>
            <Link
              href="/progress/history"
              className="ml-auto flex items-center gap-1 text-[13.5px] font-semibold text-blue-600 hover:underline"
            >
              {t("home.seeAll")}
            </Link>
          </div>
          {recent.length ? (
            <ul className="flex flex-col divide-y divide-border">
              {recent.map((a) => {
                const line = activityLine(a, t);
                return (
                  <li key={a.id}>
                    <Link
                      href="/progress/history"
                      className="flex items-center gap-3 rounded-xl py-2.5 outline-none hover:bg-[#F7FAFE] focus-visible:shadow-[var(--focus-ring)]"
                    >
                      <ActivityIcon kind={a.kind} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-navy-900">{line.title}</p>
                        <p className="truncate text-[13px] text-text-2">
                          {line.sub} ·{" "}
                          <time dateTime={a.createdAt.toISOString()}>
                            {relative(a.createdAt, now, tag, t("home.justNow"))}
                          </time>
                        </p>
                      </div>
                      <ChevronRight className="size-5 shrink-0 text-blue-600" aria-hidden="true" />
                    </Link>
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
