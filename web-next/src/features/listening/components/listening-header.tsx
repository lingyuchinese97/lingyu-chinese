"use client";
import Link from "next/link";
import { BookOpen, Globe, Headphones } from "lucide-react";
import { LeafDecor } from "@/components/layout/icons";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

/** Tiêu đề "Luyện nghe & Nói" + 2 tab: Luyện nghe từ các kênh · Bài làm của tôi (là link để quay lại / chia sẻ được). */
export function ListeningHeader({ tab }: { tab: "practice" | "mine" }) {
  const t = useT();
  const tabs = [
    { key: "practice" as const, href: "/listening", label: t("listening.tabs.practice"), icon: Globe },
    { key: "mine" as const, href: "/listening/exercises", label: t("listening.tabs.mine"), icon: BookOpen },
  ];
  return (
    <div className="flex flex-col gap-3">
      <section
        aria-labelledby="ls-title"
        className="relative flex items-center gap-4 overflow-hidden rounded-[22px] border border-[#DDEBF8] bg-[linear-gradient(100deg,#F4F9FF_0%,#E9F3FE_60%,#E1EFFD_100%)] px-[18px] py-[18px] md:px-7 md:py-5"
      >
        <span className="hidden size-14 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-soft sm:flex">
          <Headphones className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <h1
            id="ls-title"
            className="flex items-center gap-3 text-[26px] font-extrabold tracking-tight text-text md:text-[32px]"
          >
            {t("listening.title")}
            <LeafDecor className="w-10" />
          </h1>
          <p className="mt-1 text-[14.5px] text-text-2 md:text-[16px]">{t("listening.subtitle")}</p>
        </div>
        <p
          aria-hidden="true"
          className="hidden -rotate-6 text-right font-semibold text-blue-600 italic lg:block lg:text-[17px]"
        >
          {t("listening.bannerLine1")}
          <br />
          {t("listening.bannerLine2")}
        </p>
      </section>
      <nav aria-label={t("listening.tabs.label")} className="grid grid-cols-2 gap-2 md:max-w-[680px]">
        {tabs.map((x) => (
          <Link
            key={x.key}
            href={x.href}
            aria-current={tab === x.key ? "page" : undefined}
            className={cn(
              "flex min-h-12 items-center justify-center gap-2 rounded-[12px] border px-3 text-center text-[15px] font-semibold outline-none focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-5 [&_svg]:shrink-0",
              tab === x.key
                ? "border-blue-600 bg-blue-600 text-white shadow-cta"
                : "border-[#DDEBF8] bg-[#EEF6FE] text-blue-700 hover:bg-blue-100",
            )}
          >
            <x.icon />
            {x.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

/** Thẻ trắng bo góc dùng chung cho các khối của màn luyện nghe. */
export function Panel({
  className,
  children,
  ...props
}: React.ComponentProps<"section"> & { children: React.ReactNode }) {
  return (
    <section
      {...props}
      className={cn("rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card md:p-5", className)}
    >
      {children}
    </section>
  );
}

/** Tiêu đề khối có số thứ tự tròn (1. Chép chính tả, 2. Kết quả...). */
export function StepTitle({
  n,
  id,
  title,
  sub,
  right,
}: {
  n: number;
  id: string;
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-extrabold text-blue-600">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <h2 id={id} className="text-[17px] font-bold text-navy">
          {title}
        </h2>
        {sub ? <p className="text-[13.5px] text-text-3">{sub}</p> : null}
      </div>
      {right}
    </div>
  );
}
