import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CircleCheck,
  FileText,
  GraduationCap,
  MessageCircle,
  MessagesSquare,
  Play,
  RefreshCw,
} from "lucide-react";
import { Sparkle } from "@/components/flashcard";
import { LeafDecor } from "@/components/layout/icons";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { dueCount, getActiveSession } from "@/features/review/service";
import { progressOf, summarize } from "@/features/lessons/service";
import { homeStats } from "@/features/home/service";
import { DailyQuote } from "@/features/home/daily-quote";
import { quoteIndexForDay } from "@/data/daily-quotes";

export const metadata: Metadata = { title: "Trang chủ" };

/** "Nguyễn Văn An" → "Văn An" (2 chữ cuối, như firstName bản cũ). */
function firstName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length <= 1 ? (parts[0] ?? "") : parts.slice(-2).join(" ");
}

export default async function HomePage() {
  const user = await requireUser();
  const [stats, due, active, progress] = await Promise.all([
    homeStats(user.id),
    dueCount(user.id),
    getActiveSession(user.id),
    progressOf(user.id),
  ]);
  const lessons = summarize(progress);
  const nextLesson = lessons.lessons.find((l) => l.done < l.total) ?? lessons.lessons[0];
  const pct = stats.vocab.total ? Math.round((stats.vocab.learned / stats.vocab.total) * 100) : 0;
  const cont = active
    ? { href: "/review/session", label: "Tiếp tục ôn tập" }
    : due
      ? { href: "/review/due", label: `Ôn ngay (${due})` }
      : { href: "/review/setup", label: "Bắt đầu ôn tập" };

  return (
    <>
      {/* ---------- Lời chào ---------- */}
      <section
        aria-labelledby="hero-title"
        className="relative flex min-h-0 items-center overflow-hidden rounded-[26px] border border-[#D6E9FA] bg-[radial-gradient(420px_220px_at_78%_60%,rgba(255,255,255,.9),transparent_70%),radial-gradient(600px_300px_at_100%_0%,#CFE8FF,transparent_70%),linear-gradient(100deg,#EAF5FF_0%,#DCEFFF_55%,#CBE7FF_100%)] px-5 pt-6 pb-[190px] shadow-card md:min-h-[300px] md:px-10 md:py-10 lg:px-12"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[90px]">
          <svg viewBox="0 0 1200 90" preserveAspectRatio="none" className="block size-full">
            <path d="M0 60C160 20 300 70 460 44S760 10 920 40 1120 70 1200 50V90H0Z" fill="#CFE6FB" opacity=".7" />
            <path d="M0 80C200 60 380 88 600 72S980 56 1200 76V90H0Z" fill="#E4F2FF" />
          </svg>
        </div>
        <LeafDecor className="pointer-events-none absolute top-5 right-[44%] hidden w-16 rotate-[20deg] opacity-60 md:block" />
        <LeafDecor className="pointer-events-none absolute bottom-6 left-3 w-10 -rotate-[30deg] opacity-50" />

        <div className="relative z-[2] max-w-[560px]">
          <h1
            id="hero-title"
            className="text-[28px] leading-[1.15] font-extrabold tracking-tight text-navy md:text-[38px] xl:text-[42px]"
          >
            Chào mừng bạn trở lại
            <br />
            <span className="text-[24px] font-semibold text-text-2 md:text-[30px]">
              {firstName(user.name) || "bạn"}!
            </span>
          </h1>
          <p className="mt-3 flex items-center gap-2.5 text-base text-text-2 md:text-[18px]">
            <LeafDecor className="w-[26px]" />
            Tiếng Trung gần hơn mỗi ngày
          </p>
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
            <p className="hand text-lg leading-snug md:text-[20px]">
              “Mỗi từ vựng hôm nay
              <br />
              là một bước gần hơn đến ước mơ của bạn!”
            </p>
            <Link
              href={nextLesson ? `/lessons/${nextLesson.id}` : "/lessons"}
              className="inline-flex h-12 w-fit shrink-0 items-center gap-2 rounded-full px-6 font-semibold text-white shadow-cta outline-none bg-grad-primary hover:[background:var(--grad-primary-hover)] focus-visible:[box-shadow:var(--focus-ring)]"
            >
              Bắt đầu học ngay
              <ArrowRight className="size-5" />
            </Link>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 bottom-0 z-[1] h-[190px] w-[75%] md:top-0 md:right-4 md:h-auto md:w-[40%] lg:max-w-[440px]"
        >
          <Image
            src="/brand/lingyu-mascot.png"
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 440px, 75vw"
            className="object-contain object-bottom md:object-center"
          />
        </div>
        {/* Thẻ chữ bay quanh mascot (desktop) */}
        <FloatCard hanzi="你好" pinyin="nǐ hǎo" className="top-[18%] right-[36%] -rotate-12" />
        <FloatCard hanzi="学习" pinyin="xué xí" className="top-[8%] right-[5%] rotate-[10deg]" />
        <FloatCard hanzi="加油" pinyin="jiā yóu" className="top-[46%] right-[3%] rotate-[14deg]" />
        <Sparkle className="top-[12%] right-[30%] hidden md:block" />
      </section>

      {/* ---------- 4 lối tắt ---------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FeatureCard
          href="/vocabulary"
          title="Từ vựng"
          desc="Lưu lại những từ vựng mới để học hiệu quả hơn mỗi ngày."
          icon={<BookOpen />}
          tone="blue"
          art={<CardArt hanzi="你好" />}
        />
        <FeatureCard
          href="/sentences"
          title="Ôn dịch câu"
          desc="Luyện dịch Trung ⇄ Việt dễ dàng và hiệu quả."
          icon={<MessageCircle />}
          tone="green"
          art={<BubbleArt />}
        />
        <FeatureCard
          href="/grammar"
          title="Ngữ pháp"
          desc="Nắm vững ngữ pháp cơ bản và ứng dụng vào thực tế."
          icon={<FileText />}
          tone="violet"
          art={<NoteArt />}
        />
        <FeatureCard
          href="/lessons"
          title="Bài học"
          desc="Học theo bài, có lộ trình rõ ràng từ Bài 1 trở lên."
          icon={<GraduationCap />}
          tone="amber"
          art={<BooksArt />}
        />
      </div>

      {/* ---------- Tiến độ · Hôm nay · Câu nói ---------- */}
      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr] xl:grid-cols-[1.3fr_1fr_1fr]">
        <article
          aria-labelledby="pg-title"
          className="flex flex-col gap-4 rounded-3xl border border-border bg-white/94 p-5 shadow-card"
        >
          <div className="flex items-center gap-2.5">
            <BarChart3 className="size-6 text-blue-600" aria-hidden="true" />
            <h2 id="pg-title" className="flex-1 text-lg font-bold text-navy">
              Tiến độ học tập
            </h2>
            <Link href="/vocabulary" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
              Xem chi tiết
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid items-center gap-5 sm:grid-cols-[auto_1fr] xl:grid-cols-1 2xl:grid-cols-[auto_1fr]">
            <div className="flex items-center gap-4">
              <Ring pct={pct} />
              <div>
                <div className="text-[15px] text-text-2">Đã thuộc</div>
                <div className="text-xl font-extrabold text-navy">Từ vựng</div>
                <div className="text-sm text-text-2 tabular-nums">
                  {stats.vocab.learned} / {stats.vocab.total} từ vựng
                </div>
              </div>
            </div>
            <ul className="flex flex-col gap-2.5 border-border sm:border-l sm:pl-5 xl:border-l-0 xl:pl-0 2xl:border-l 2xl:pl-5">
              <ProgressRow
                icon={<BookOpen />}
                label="Từ vựng đã thuộc"
                value={`${stats.vocab.learned} / ${stats.vocab.total}`}
              />
              <ProgressRow icon={<RefreshCw />} label="Thẻ đến hạn ôn" value={String(due)} />
              <ProgressRow
                icon={<MessagesSquare />}
                label="Câu đã thuộc"
                value={`${stats.sentences.learned} / ${stats.sentences.total}`}
              />
              <ProgressRow icon={<FileText />} label="Ngữ pháp đã lưu" value={String(stats.grammar)} />
              <ProgressRow
                icon={<GraduationCap />}
                label="Bài học"
                value={`${lessons.done} / ${lessons.total} phần`}
                title={`Đã làm ${lessons.done}/${lessons.total} phần (${lessons.percent}%)`}
              />
            </ul>
          </div>
        </article>

        <article
          aria-labelledby="td-title"
          className="flex flex-col gap-4 rounded-3xl border border-border bg-white/94 p-5 shadow-card"
        >
          <div className="flex items-center gap-2.5">
            <CalendarDays className="size-6 text-blue-600" aria-hidden="true" />
            <h2 id="td-title" className="flex-1 text-lg font-bold text-navy">
              Học hôm nay
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <TodayTile tone="rose" icon={<BookOpen />} value={stats.newToday} label="từ vựng mới" />
            <TodayTile tone="green" icon={<CircleCheck />} value={stats.reviewsToday} label="lần ôn tập" />
            <TodayTile tone="amber" icon={<RefreshCw />} value={due} label="thẻ đến hạn" />
          </div>
          <Link
            href={cont.href}
            className="mt-auto flex h-14 items-center justify-center gap-2.5 rounded-2xl text-[17px] font-semibold text-white shadow-cta outline-none bg-grad-primary hover:[background:var(--grad-primary-hover)] focus-visible:[box-shadow:var(--focus-ring)]"
          >
            <Play className="size-5" />
            {cont.label}
            <ArrowRight className="size-5" />
          </Link>
        </article>

        <div className="lg:col-span-2 xl:col-span-1">
          <DailyQuote initial={quoteIndexForDay()} />
        </div>
      </div>
    </>
  );
}

// ---------- Thành phần trang trí ----------

function FloatCard({ hanzi, pinyin, className }: { hanzi: string; pinyin: string; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute z-[2] hidden flex-col items-center rounded-xl bg-[#FFF8E6] px-4 py-2 shadow-[0_10px_24px_rgba(80,60,20,.14)] lg:flex",
        className,
      )}
    >
      <span className="font-cn text-[26px] leading-tight font-semibold text-navy" lang="zh">
        {hanzi}
      </span>
      <span className="text-[13px] font-semibold text-text-2">{pinyin}</span>
    </div>
  );
}

const TONES = {
  blue: { icon: "bg-[#E4F1FD] text-blue-600", art: "from-[#EEF6FF]" },
  green: { icon: "bg-[#E2F7EC] text-green-700", art: "from-[#EAF9F1]" },
  violet: { icon: "bg-[#ECE8FD] text-[#6A55D8]", art: "from-[#F2EFFE]" },
  amber: { icon: "bg-[#FFF1D9] text-[#B36B00]", art: "from-[#FFF6E6]" },
};

function FeatureCard({
  href,
  title,
  desc,
  icon,
  tone,
  art,
}: {
  href: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  tone: keyof typeof TONES;
  art: React.ReactNode;
}) {
  const t = TONES[tone];
  return (
    <Link
      href={href}
      className="group relative flex min-h-[230px] flex-col overflow-hidden rounded-3xl border border-border bg-white/94 shadow-card transition outline-none hover:-translate-y-0.5 hover:border-[#A9D3F8] focus-visible:[box-shadow:var(--focus-ring)]"
    >
      <div className="flex flex-col gap-2.5 p-5 pb-2">
        <div className="flex items-center gap-3">
          <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-full [&_svg]:size-6", t.icon)}>
            {icon}
          </span>
          <h2 className="min-w-0 flex-1 text-xl font-bold text-navy">{title}</h2>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-white text-blue-600 transition group-hover:bg-blue-50">
            <ArrowRight className="size-4" />
          </span>
        </div>
        <p className="text-[14.5px] leading-snug text-text-2">{desc}</p>
      </div>
      <div
        aria-hidden="true"
        className={cn(
          "relative mt-auto flex h-[110px] items-end justify-center bg-gradient-to-t to-transparent",
          t.art,
        )}
      >
        <LeafDecor className="absolute bottom-3 left-4 w-9 -rotate-[25deg] opacity-60" />
        <LeafDecor className="absolute right-5 bottom-8 w-8 rotate-[35deg] opacity-50" />
        {art}
      </div>
    </Link>
  );
}

function CardArt({ hanzi }: { hanzi: string }) {
  return (
    <div className="relative mb-4 h-[70px] w-[130px]">
      <div className="absolute inset-0 translate-x-2 translate-y-1.5 -rotate-6 rounded-xl bg-[#DCEBFA]" />
      <div className="absolute inset-0 flex -rotate-6 items-center justify-center rounded-xl bg-white shadow-[0_8px_18px_rgba(34,93,150,.14)]">
        <span className="font-cn text-[30px] font-semibold text-[#1E5FD6]" lang="zh">
          {hanzi}
        </span>
      </div>
    </div>
  );
}

function BubbleArt() {
  return (
    <div className="relative mb-4 flex items-end gap-2">
      <div className="rounded-2xl rounded-bl-sm bg-[#DDEEFF] px-4 py-2.5 shadow-[0_8px_18px_rgba(34,93,150,.12)]">
        <span className="font-cn text-[26px] font-semibold text-[#1E5FD6]" lang="zh">
          你好！
        </span>
      </div>
      <div className="mb-1 flex gap-1 rounded-2xl bg-white px-3 py-2.5 shadow-[0_8px_18px_rgba(34,93,150,.12)]">
        <span className="size-2 rounded-full bg-blue-600" />
        <span className="size-2 rounded-full bg-blue-600/70" />
        <span className="size-2 rounded-full bg-blue-600/40" />
      </div>
    </div>
  );
}

function NoteArt() {
  return (
    <div className="relative mb-3 h-[84px] w-[110px] rotate-[-6deg] rounded-lg bg-white p-3 shadow-[0_8px_18px_rgba(60,40,140,.14)]">
      <div className="mb-2 h-2 w-3/4 rounded bg-[#C9C0F5]" />
      <div className="mb-2 h-2 w-full rounded bg-[#E3DEFB]" />
      <div className="mb-2 h-2 w-5/6 rounded bg-[#E3DEFB]" />
      <div className="h-2 w-2/3 rounded bg-[#E3DEFB]" />
      <span className="absolute -right-2 -bottom-1 h-16 w-2.5 rotate-[30deg] rounded-full bg-[#F6B73C]" />
    </div>
  );
}

function BooksArt() {
  return (
    <div className="mb-3 flex flex-col items-center gap-0.5">
      {[
        ["HSK 1", "bg-[#B45309]", "w-[110px]"],
        ["HSK 2", "bg-[#1F6BC4]", "w-[118px]"],
        ["HSK 3", "bg-[#1E5FD6]", "w-[126px]"],
      ].map(([label, bg, w]) => (
        <span
          key={label}
          className={cn("rounded-md px-3 py-1 text-left text-xs font-bold text-white shadow-sm", bg, w)}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function Ring({ pct }: { pct: number }) {
  const R = 44;
  const C = 2 * Math.PI * R;
  return (
    <svg width="112" height="112" viewBox="0 0 112 112" role="img" aria-label={`Đã thuộc ${pct}% từ vựng`}>
      <circle cx="56" cy="56" r={R} fill="none" stroke="#E6F1FC" strokeWidth="11" />
      <circle
        cx="56"
        cy="56"
        r={R}
        fill="none"
        stroke="var(--color-blue)"
        strokeWidth="11"
        strokeLinecap="round"
        strokeDasharray={`${(C * pct) / 100} ${C}`}
        transform="rotate(-90 56 56)"
      />
      <text x="56" y="63" textAnchor="middle" className="fill-navy text-[22px] font-extrabold">
        {pct}%
      </text>
    </svg>
  );
}

function ProgressRow({
  icon,
  label,
  value,
  title,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <li className="flex items-center gap-3" title={title}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-[#EEF5FC] text-blue-600 [&_svg]:size-[18px]">
        {icon}
      </span>
      <span className="flex-1 text-[14.5px] text-text-2">{label}</span>
      <span className="text-[14.5px] font-semibold whitespace-nowrap text-navy tabular-nums">{value}</span>
      {title ? <span className="sr-only">{title}</span> : null}
    </li>
  );
}

const TODAY = {
  rose: "bg-[#FFF0F2] text-rose",
  green: "bg-[#EAF9F1] text-green-700",
  amber: "bg-[#FFF5E5] text-[#B36B00]",
};

function TodayTile({
  tone,
  icon,
  value,
  label,
}: {
  tone: keyof typeof TODAY;
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div
      className={cn("flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-center [&_svg]:size-6", TODAY[tone])}
    >
      {icon}
      <span className="text-2xl font-extrabold tabular-nums">{value}</span>
      <span className="text-[13px] leading-tight text-text-2">{label}</span>
    </div>
  );
}
