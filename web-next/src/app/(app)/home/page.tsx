import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check, ChevronRight, Clock3, PlayCircle, RefreshCw } from "lucide-react";
import { FeatureHero, heroPrimary, heroSecondary } from "@/components/feature-hero";
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

/** 8 chức năng (theo design): icon màu giống thanh bên trong vòng tròn nhạt + mũi tên cùng tông. */
const CARDS = [
  { key: "vocabulary", href: "/vocabulary", img: "nav-vocabulary", tint: "#FFE7EC", arrow: "#F0506E" },
  { key: "grammar", href: "/grammar", img: "nav-grammar", tint: "#FFF0D6", arrow: "#F59E0B" },
  { key: "pronunciation", href: "/pronunciation", img: "nav-pronunciation", tint: "#E2F0FF", arrow: "#1595F5" },
  { key: "listening", href: "/listening", img: "nav-listening", tint: "#EEE8FF", arrow: "#7C5CE6" },
  { key: "speaking", href: "/speaking", img: "nav-speaking", tint: "#DDF5EE", arrow: "#16A37A" },
  { key: "reading", href: "/reading", img: "nav-reading", tint: "#EEE8FF", arrow: "#7C5CE6" },
  { key: "translation", href: "/translate", img: "nav-translation", tint: "#FFE4E7", arrow: "#EF4D64" },
  { key: "review", href: "/review/setup", img: "nav-review", tint: "#DDF5E5", arrow: "#22A55B" },
] as const;

/** Icon theo thiết kế cho "Hoạt động gần đây" (loại hoạt động → ảnh). */
const RECENT_IMG: Partial<Record<string, string>> = {
  lesson: "/brand/ui/recent-hsk.png",
  vocab_review: "/brand/ui/recent-hsk.png",
  vocab_add: "/brand/ui/recent-hsk.png",
  grammar_review: "/brand/ui/recent-grammar.png",
  grammar_add: "/brand/ui/recent-grammar.png",
  listening: "/brand/ui/recent-listening.png",
  pronunciation: "/brand/ui/recent-listening.png",
};

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
    { key: "todayVocab", value: todayStats.vocab, img: "/brand/ui/nav-vocabulary.png?v=2", c: "bg-green-50" },
    { key: "todayGrammar", value: todayStats.grammar, img: "/brand/ui/nav-grammar.png?v=2", c: "bg-blue-50" },
    { key: "todayReading", value: todayStats.reading, img: "/brand/ui/nav-reading.png?v=2", c: "bg-red-50" },
    {
      key: "todayTranslation",
      value: todayStats.translation,
      img: "/brand/ui/nav-translation.png?v=2",
      c: "bg-amber-50",
    },
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
      color: "#8B6CF0",
      sub: t("home.ringGrammar", { a: s.grammar.learned, b: s.grammar.total }),
    },
    {
      key: "listening",
      value: s.skills.listening,
      color: "#1C8FE6",
      sub: t("home.ringSessions", { count: s.sessions30.listening }),
    },
    {
      key: "reading",
      value: s.skills.reading,
      color: "#1C7FD6",
      sub: t("home.ringSessions", { count: s.sessions30.reading }),
    },
  ] as const;

  return (
    <>
      {/* ---------- Ảnh bìa (giống các màn khác): lời chào + nút bắt đầu; mascot ngồi trên sách ---------- */}
      <FeatureHero
        id="home-hello"
        eyebrow={name ? `${t("home.helloSmall")} ` : undefined}
        eyebrowClassName="block text-[28px] leading-tight font-extrabold text-navy-900 md:text-[38px]"
        title={name ? t("home.helloName", { name }) : t("home.helloAnon")}
        actions={
          <>
            <Link href="/library" className={heroPrimary}>
              <PlayCircle aria-hidden="true" />
              {t("home.startNow")}
              <ArrowRight aria-hidden="true" />
            </Link>
            {active || due ? (
              <Link href={active ? "/review/session" : "/review/due"} className={heroSecondary}>
                <RefreshCw aria-hidden="true" />
                {active ? t("home.continueReview") : t("home.reviewNow", { count: due })}
              </Link>
            ) : null}
          </>
        }
      />

      {/* ---------- 8 chức năng ---------- */}
      <section aria-labelledby="home-features">
        <h2 id="home-features" className="sr-only">
          {t("home.features")}
        </h2>
        <ul className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
          {CARDS.map((c) => {
            const title = t(`home.cards.${c.key}.title`);
            return (
              <li key={c.key}>
                <Link
                  href={c.href}
                  aria-label={t("home.open", { name: title })}
                  className="group flex h-full flex-col gap-3 rounded-[20px] border border-border bg-white/95 p-4 shadow-card transition-transform outline-none hover:-translate-y-0.5 focus-visible:shadow-[var(--focus-ring)] motion-reduce:transition-none md:p-5"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-12 items-center justify-center rounded-full md:size-14"
                    style={{ background: c.tint }}
                  >
                    <Image
                      unoptimized
                      src={`/brand/ui/${c.img}.png?v=2`}
                      alt=""
                      width={56}
                      height={56}
                      className="size-7 object-contain md:size-8"
                    />
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 text-[16px] leading-tight font-extrabold text-navy-900 md:text-[18px]">
                      {title}
                    </span>
                    <span
                      aria-hidden="true"
                      className="flex size-9 shrink-0 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5"
                      style={{ background: c.tint, color: c.arrow }}
                    >
                      <ArrowRight className="size-5" strokeWidth={2.5} />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---------- Tiến độ học tập (4 vòng) ---------- */}
      <section
        aria-labelledby="home-progress"
        className="rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card md:p-5"
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Image
            unoptimized
            src="/brand/ui/nav-progress.png?v=2"
            alt=""
            aria-hidden="true"
            width={45}
            height={41}
            className="h-auto w-6"
          />
          <h2 id="home-progress" className="text-[19px] font-bold text-navy-900">
            {t("home.progress")}
          </h2>
          <Link
            href="/progress"
            className="ml-auto flex items-center gap-1 text-[14.5px] font-semibold text-blue-600 hover:underline"
          >
            {t("home.details")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-4 xl:grid-cols-4 xl:divide-x xl:divide-border">
          {rings.map((r) => {
            const label = t(`home.rings.${r.key}`);
            return (
              <li
                key={r.key}
                className="flex flex-col items-center justify-center gap-2 px-2 text-center sm:flex-row sm:gap-4 sm:text-left"
              >
                <Ring value={r.value} color={r.color} label={t("home.ringLabel", { name: label, n: r.value })} />
                <span className="flex min-w-0 flex-col">
                  <span className="text-[16px] font-semibold text-navy-900">{label}</span>
                  <span className="text-[14px] text-text-2">{r.sub}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---------- Học tập hôm nay + Mục tiêu ---------- */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section
          aria-labelledby="home-today"
          className="rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card md:p-5"
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Image
              unoptimized
              src="/brand/ui/icon-calendar.png"
              alt=""
              aria-hidden="true"
              width={47}
              height={51}
              className="h-auto w-6"
            />
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
                  <Image unoptimized src={x.img} alt="" width={48} height={48} className="size-6 object-contain" />
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
            <Image
              unoptimized
              src="/brand/ui/icon-target.png"
              alt=""
              aria-hidden="true"
              width={54}
              height={53}
              className="size-6"
            />
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
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-50"
            >
              <Image unoptimized src="/brand/ui/icon-flame.png" alt="" width={60} height={67} className="h-auto w-6" />
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

      {/* ---------- Chuỗi ngày học + Hoạt động gần đây ---------- */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
        {/* Chuỗi ngày học */}
        <section
          aria-labelledby="home-streak"
          className="rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card md:p-5"
        >
          <div className="flex items-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#FFF6E4,#FFFBF2)] px-3.5 py-3">
            <Image
              unoptimized
              src="/brand/ui/icon-flame.png"
              alt=""
              aria-hidden="true"
              width={60}
              height={67}
              className="h-auto w-[46px] shrink-0"
            />
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
                      {RECENT_IMG[a.kind] ? (
                        <span
                          aria-hidden="true"
                          className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#F4F8FD]"
                        >
                          <Image
                            unoptimized
                            src={RECENT_IMG[a.kind]!}
                            alt=""
                            width={63}
                            height={50}
                            className="h-auto w-9"
                          />
                          <span className="absolute -right-1 -bottom-1 flex size-[18px] items-center justify-center rounded-full border-2 border-white bg-green text-white">
                            <Check className="size-2.5" strokeWidth={4} />
                          </span>
                        </span>
                      ) : (
                        <ActivityIcon kind={a.kind} />
                      )}
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
