"use client";
import Link from "next/link";
import { BookOpen, Globe } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { FeatureHero } from "@/components/feature-hero";

/**
 * Thanh tiêu đề gọn "Luyện nghe · Chép chính tả" (nút thao tác bên phải) + 2 tab: Luyện nghe từ các kênh · Bài làm của tôi
 * (là link để quay lại / chia sẻ được).
 */
export function ListeningHeader({ tab, actions }: { tab: "practice" | "mine"; actions?: React.ReactNode }) {
  const t = useT();
  const tabs = [
    { key: "practice" as const, href: "/listening", label: t("listening.tabs.practice"), icon: Globe },
    { key: "mine" as const, href: "/listening/exercises", label: t("listening.tabs.mine"), icon: BookOpen },
  ];
  return (
    <div className="flex flex-col gap-3">
      <FeatureHero
        id="ls-title"
        title={tab === "practice" ? t("listening.pageTitle") : t("listening.tabs.mine")}
        description={t("listening.subtitle")}
        actions={actions}
      />
      <nav aria-label={t("listening.tabs.label")} className="flex flex-wrap gap-2">
        {tabs.map((x) => (
          <Link
            key={x.key}
            href={x.href}
            aria-current={tab === x.key ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 text-center text-[14.5px] font-semibold outline-none focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-[18px] [&_svg]:shrink-0",
              tab === x.key
                ? "border-blue-600 bg-blue-600 text-white shadow-cta"
                : "border-[#DDEBF8] bg-white text-blue-700 hover:bg-blue-50",
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
