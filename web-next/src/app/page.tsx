import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, FileText, GraduationCap, RefreshCw, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSession } from "@/server/session";
import { getT } from "@/i18n/server";
import { LanguageSwitch } from "@/components/language-switch";

export const dynamic = "force-dynamic";

/** Lá trang trí (dùng chung gradient #ly-leaf định nghĩa một lần ở đầu trang). */
function Leaf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" aria-hidden="true" className={cn("pointer-events-none absolute", className)}>
      <path d="M2 36C8 12 34 0 62 2 56 26 32 40 2 36Z" fill="url(#ly-leaf)" />
      <path
        d="M6 34C20 26 36 16 56 5"
        fill="none"
        stroke="#3E9A4E"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity=".7"
      />
    </svg>
  );
}

function RadicalGlyph({ className }: { className?: string }) {
  return (
    <span lang="zh" className={cn("font-cn leading-none font-bold", className)}>
      字
    </span>
  );
}

const TILES = [
  { label: "shell.nav.vocabulary", icon: BookOpen, ring: "bg-[#FFF1D6] text-[#F29A17]", wave: "#FFF3DC" },
  { label: "shell.nav.review", icon: RefreshCw, ring: "bg-[#E1F0FE] text-[#1595F5]", wave: "#E3F1FE" },
  { label: "shell.nav.grammar", icon: FileText, ring: "bg-[#FFE4E8] text-[#EE3B55]", wave: "#FFE9EC" },
  { label: "shell.nav.radicals", icon: RadicalGlyph, ring: "bg-[#EEE6FE] text-[#8B5CF6]", wave: "#EFE8FE" },
  { label: "landing.practice", icon: GraduationCap, ring: "bg-[#DDF6EA] text-[#16A36F]", wave: "#E0F6EB" },
] as const;

const bubble =
  "absolute rounded-full bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,.95)_0_14%,rgba(190,225,250,.6)_60%,rgba(140,195,240,.7)_100%)]";

export default async function LandingPage() {
  if (await getSession()) redirect("/home");
  const t = await getT();
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[radial-gradient(900px_600px_at_75%_30%,#E3F2FF_0%,transparent_60%),linear-gradient(180deg,#F8FCFF_0%,#EEF7FF_100%)]">
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="ly-leaf" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#7FD37A" />
            <stop offset="1" stopColor="#3FB36A" />
          </linearGradient>
        </defs>
      </svg>

      {/* Sóng nền phía sau hàng thẻ (desktop) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[540px] h-[280px] max-lg:hidden">
        <svg viewBox="0 0 1440 280" preserveAspectRatio="none" className="block size-full">
          <path d="M0 70C240 10 420 110 720 70S1200 0 1440 50V280H0Z" fill="#D6EBFB" opacity=".7" />
          <path d="M0 120C260 70 520 150 820 110S1260 70 1440 100V280H0Z" fill="#E6F3FD" />
        </svg>
      </div>

      <header className="relative z-[1] mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2 md:px-6 md:pt-6">
        <Image
          src="/brand/lingyu-wordmark.png"
          alt={t("shell.logoAlt")}
          width={1579}
          height={550}
          priority
          sizes="180px"
          className="h-auto w-[140px] md:w-[180px]"
        />
        <div className="flex items-center gap-2 md:gap-3">
          <LanguageSwitch className="max-sm:[&_svg]:hidden" />
          <Button asChild variant="secondary" className="h-11 rounded-[14px] px-5 md:h-12 md:px-7 md:text-[17px]">
            <Link href="/login">{t("auth.signIn")}</Link>
          </Button>
        </div>
      </header>

      <main className="relative z-[1] mx-auto max-w-6xl px-4 pb-12 md:px-6">
        <section className="grid items-center gap-6 pt-4 lg:grid-cols-[1.15fr_1fr] lg:gap-4 lg:pt-6">
          <div className="flex flex-col items-center gap-7 text-center lg:items-start lg:text-left">
            <div className="relative">
              <p className="hand text-[28px] text-blue-600 md:text-[38px]">{t("common.tagline")}</p>
              <svg
                aria-hidden="true"
                viewBox="0 0 600 24"
                preserveAspectRatio="none"
                className="absolute -bottom-3 left-[-4%] h-4 w-[108%]"
              >
                <path d="M2 18C160 4 420 2 598 10" fill="none" stroke="#9ADAEC" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <Leaf className="-top-5 -right-12 w-11 -rotate-12 md:-right-16 md:w-14" />
            </div>
            <h1 className="text-[31px] leading-[1.15] font-extrabold tracking-tight text-navy min-[400px]:text-[34px] md:text-[58px]">
              <span className="whitespace-pre-line">{t("landing.title")}</span>
            </h1>
            <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row lg:max-w-none">
              <Button asChild variant="primary" className="h-14 rounded-[14px] px-7 text-[17px] md:h-[60px] md:text-lg">
                <Link href="/register">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="!size-6">
                    <path d="M4 20C4 10 10 4 20 4c0 10-6 16-16 16Z" fill="currentColor" />
                    <path d="M5 19C9 15 12 12 16 8" stroke="#1595F5" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  {t("landing.registerFree")}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="h-14 rounded-[14px] px-7 text-[17px] md:h-[60px] md:text-lg"
              >
                <Link href="/login">
                  <UserRound aria-hidden="true" className="fill-current" />
                  {t("landing.haveAccount")}
                </Link>
              </Button>
            </div>
          </div>

          {/* Mascot lớn + lá bay xung quanh */}
          <div aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-[260px] md:max-w-[480px]">
            <Image
              src="/brand/lingyu-mascot.png"
              alt=""
              fill
              priority
              sizes="(min-width: 768px) 640px, 400px"
              className="scale-[1.35] object-contain"
            />
            <Leaf className="top-[4%] left-[-8%] w-[18%] rotate-[35deg]" />
            <Leaf className="top-[10%] right-[-10%] w-[16%] -rotate-[40deg]" />
            <Leaf className="bottom-[24%] left-[-4%] w-[14%] rotate-[60deg]" />
            <Leaf className="right-[-6%] bottom-[8%] w-[17%] -rotate-[25deg]" />
            <Leaf className="bottom-[0%] left-[20%] w-[9%] rotate-[80deg] opacity-80" />
            <span className={cn(bubble, "top-[40%] right-[-8%] size-6 md:size-8")} />
            <span className={cn(bubble, "top-[26%] left-[4%] size-5")} />
          </div>
        </section>

        <ul className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:mt-10 lg:grid-cols-5">
          {TILES.map((tile) => (
            <li
              key={tile.label}
              className="relative flex flex-col items-center gap-3 overflow-hidden rounded-[20px] border border-white bg-white/90 px-3 pt-4 pb-10 shadow-[0_10px_30px_rgba(34,93,150,.08)] last:max-sm:col-span-2 md:pt-6 md:pb-16"
            >
              <span className={cn("flex size-14 items-center justify-center rounded-full md:size-[84px]", tile.ring)}>
                <tile.icon className="size-7 text-[28px] md:size-10 md:text-[40px]" />
              </span>
              <span className="relative z-[1] text-base font-bold text-navy md:text-[22px]">{t(tile.label)}</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 200 60"
                preserveAspectRatio="none"
                className="absolute inset-x-0 bottom-0 h-10 w-full md:h-16"
              >
                <path d="M0 30C50 5 110 50 200 18V60H0Z" fill={tile.wave} />
              </svg>
              <Leaf className="right-3 bottom-2 w-7 -rotate-[55deg] md:right-4 md:bottom-3 md:w-11" />
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
