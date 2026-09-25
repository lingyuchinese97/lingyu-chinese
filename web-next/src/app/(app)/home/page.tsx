import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarClock, FileText, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Flashcard, Sparkle } from "@/components/flashcard";
import { LeafDecor } from "@/components/layout/icons";
import { requireUser } from "@/server/session";
import { vocabStats } from "@/features/vocabulary/service";
import { dueCount, getActiveSession, getLastCustomConfig } from "@/features/review/service";
import { ReviewStartCard } from "@/features/home/review-start-card";

export const metadata: Metadata = { title: "Trang chủ" };

/** "Nguyễn Văn An" → "Văn An" (2 chữ cuối, như firstName bản cũ). */
function firstName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length <= 1 ? (parts[0] ?? "") : parts.slice(-2).join(" ");
}

export default async function HomePage() {
  const user = await requireUser();
  const [stats, due, active, last] = await Promise.all([
    vocabStats(user.id),
    dueCount(user.id),
    getActiveSession(user.id),
    getLastCustomConfig(user.id),
  ]);
  const latest = stats.latest;

  return (
    <>
      <section
        aria-labelledby="hero-title"
        className="relative flex min-h-0 items-center overflow-hidden rounded-[26px] border border-[#D6E9FA] bg-[radial-gradient(420px_220px_at_78%_60%,rgba(255,255,255,.9),transparent_70%),radial-gradient(600px_300px_at_100%_0%,#CFE8FF,transparent_70%),linear-gradient(100deg,#EAF5FF_0%,#DCEFFF_55%,#CBE7FF_100%)] px-5 pt-6 pb-[150px] shadow-card md:min-h-[260px] md:px-10 md:py-10 lg:min-h-[280px] lg:px-12 lg:py-11"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[90px]">
          <svg viewBox="0 0 1200 90" preserveAspectRatio="none" className="block size-full">
            <path d="M0 60C160 20 300 70 460 44S760 10 920 40 1120 70 1200 50V90H0Z" fill="#CFE6FB" opacity=".7" />
            <path d="M0 80C200 60 380 88 600 72S980 56 1200 76V90H0Z" fill="#E4F2FF" />
          </svg>
        </div>
        <LeafDecor className="pointer-events-none absolute top-3.5 right-[40%] hidden w-16 rotate-[20deg] opacity-60 md:block" />
        <LeafDecor className="pointer-events-none absolute top-5 right-[3%] w-[70px] -rotate-[40deg] opacity-60" />

        <div className="relative z-[2] max-w-[560px]">
          <p className="text-[17px] text-text-2 md:text-[22px]">Hello,</p>
          <h1
            id="hero-title"
            className="text-[30px] leading-[1.15] font-extrabold tracking-tight text-navy md:text-[38px] xl:text-[46px]"
          >
            Chào mừng trở lại,
            <br />
            <span className="text-[#1A62E0]">{firstName(user.name) || "bạn"}!</span>
          </h1>
          <p className="mt-3 flex items-center gap-2.5 text-base text-text-2 md:text-[19px]">
            <LeafDecor className="w-[26px]" />
            Tiếng Trung gần hơn mỗi ngày
          </p>
          <p className="mt-4 hand text-lg leading-snug md:text-[22px]">
            “Mỗi từ vựng hôm nay
            <br />
            là một bước gần hơn đến ước mơ của bạn!”
          </p>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 bottom-0 z-[1] h-[170px] w-[70%] md:top-0 md:right-6 md:bottom-[-8px] md:h-auto md:w-[42%] lg:w-[46%] lg:max-w-[560px]"
        >
          <Image
            src="/brand/lingyu-mascot.png"
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 520px, 70vw"
            className="object-contain object-right-bottom"
          />
        </div>
        <Flashcard
          hanzi="你好"
          pinyin="nǐ hǎo"
          className="absolute bottom-9 left-[42%] z-[1] hidden origin-bottom-left scale-[.7] xl:block"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <article
          aria-labelledby="c1-title"
          className="relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-border bg-white/94 p-5 shadow-card md:p-[26px]"
        >
          <div className="flex items-start gap-4 md:gap-[18px]">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#E4F1FD] text-blue-600 md:size-20">
              <BookOpen className="size-8 md:size-10" />
            </span>
            <div className="min-w-0">
              <h2 id="c1-title" className="text-[22px] font-bold text-navy md:text-[28px]">
                Từ vựng của tôi
              </h2>
              <p className="mt-1 text-[15px] text-text-2 md:text-[16.5px]">
                Lưu lại những từ vựng mới để học hiệu quả hơn mỗi ngày.
              </p>
            </div>
            <Link
              href="/vocabulary"
              aria-label="Mở danh sách từ vựng"
              className="ml-auto flex size-[46px] shrink-0 items-center justify-center rounded-full border border-border bg-white text-blue-600 hover:bg-blue-50"
            >
              <ArrowRight className="size-[22px]" />
            </Link>
          </div>
          <div className="relative flex min-h-[170px] items-center justify-center">
            <Sparkle className="top-[18%] left-[22%]" />
            <Sparkle className="top-[30%] right-[24%] size-3.5" />
            {latest ? (
              <Flashcard hanzi={latest.hanzi} pinyin={latest.pinyin} meaning={latest.meaningVi} />
            ) : (
              <Flashcard hanzi="你好" pinyin="nǐ hǎo" meaning="xin chào" />
            )}
          </div>
          <div className="grid gap-3.5 rounded-[18px] bg-[#F2F8FE] p-[18px] sm:grid-cols-2 sm:gap-0">
            <Stat icon={<FileText />} tone="violet" value={stats.total} label="Tổng số từ đã thêm" />
            <Stat icon={<RefreshCw />} tone="blue" value={stats.needReview} label="Từ cần ôn tập" divider />
          </div>
          {stats.total ? (
            <Button asChild variant="primary" size="lg" block className="relative">
              <Link href="/vocabulary">
                <BookOpen />
                Xem từ vựng
                <ArrowRight className="absolute right-5" />
              </Link>
            </Button>
          ) : (
            <Button asChild variant="primary" size="lg" block className="relative">
              <Link href="/vocabulary/new">
                <Plus />
                Thêm từ vựng đầu tiên
                <ArrowRight className="absolute right-5" />
              </Link>
            </Button>
          )}
        </article>

        <article
          aria-labelledby="c2-title"
          className="relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-border bg-white/94 p-5 shadow-card md:p-[26px]"
        >
          <div className="flex items-start gap-4 md:gap-[18px]">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#E4F1FD] text-blue-600 md:size-20">
              <RefreshCw className="size-8 md:size-10" />
            </span>
            <div className="min-w-0">
              <h2 id="c2-title" className="text-[22px] font-bold text-navy md:text-[28px]">
                Ôn tập từ vựng
              </h2>
              <p className="mt-1 text-[15px] text-text-2 md:text-[16.5px]">
                Luyện lại những từ đã học để ghi nhớ lâu hơn.
              </p>
            </div>
          </div>
          <div className="relative flex min-h-[170px] items-center justify-center">
            <Flashcard hanzi="学习" pinyin="xué xí" meaning="học tập" />
            <p
              aria-hidden="true"
              className="absolute top-[18%] right-[4%] hidden -rotate-6 hand text-[21px] leading-tight sm:block"
            >
              Ôn tập
              <br />
              mỗi ngày
              <br />
              tiến bộ hơn!
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-[18px] bg-[#FFF7E8] p-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#FFE9C2] text-[#C97A06]">
              <CalendarClock className="size-6" />
            </span>
            <div className="min-w-0">
              <div className="text-[26px] leading-tight font-bold text-navy tabular-nums">{due}</div>
              <div className="text-[15px] text-text-2">thẻ đến hạn ôn hôm nay</div>
            </div>
          </div>
          <ReviewStartCard
            total={stats.total}
            due={due}
            hasActive={!!active}
            lastMode={last?.mode ?? "meaning"}
            lastShowImage={last ? last.showImage : true}
          />
        </article>
      </div>
    </>
  );
}

function Stat({
  icon,
  tone,
  value,
  label,
  divider,
}: {
  icon: React.ReactNode;
  tone: "violet" | "blue";
  value: number;
  label: string;
  divider?: boolean;
}) {
  return (
    <div
      className={
        "flex items-center gap-4 px-3 " +
        (divider ? "border-t border-[#DDE9F5] pt-3.5 sm:border-t-0 sm:border-l sm:pt-0" : "")
      }
    >
      <span
        className={
          "flex size-[60px] shrink-0 items-center justify-center rounded-full [&_svg]:size-7 " +
          (tone === "violet" ? "bg-[#ECE8FD] text-[#6A55D8]" : "bg-[#E1F0FD] text-blue-600")
        }
      >
        {icon}
      </span>
      <div>
        <div className="text-[34px] leading-tight font-bold text-navy tabular-nums">{value}</div>
        <div className="text-[15.5px] text-text-2">{label}</div>
      </div>
    </div>
  );
}
