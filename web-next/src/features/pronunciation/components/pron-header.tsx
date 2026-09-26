"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AudioLines, BookOpen, Layers, LayoutGrid, Music, NotebookPen, Target, Waves } from "lucide-react";
import { LeafDecor } from "@/components/layout/icons";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

export const PRON_TABS = [
  { key: "overview", href: "/pronunciation", icon: LayoutGrid },
  { key: "initials", href: "/pronunciation/initials", icon: BookOpen },
  { key: "finals", href: "/pronunciation/finals", icon: Layers },
  { key: "tones", href: "/pronunciation/tones", icon: Music },
  { key: "sandhi", href: "/pronunciation/sandhi", icon: Waves },
  { key: "practice", href: "/pronunciation/practice", icon: Target },
  { key: "notes", href: "/pronunciation/notes", icon: NotebookPen },
] as const;

/** Tiêu đề module + thanh tab (link, nên quay lại / chia sẻ được). Tab đang mở lấy theo đường dẫn. */
export function PronunciationHeader() {
  const t = useT();
  const path = usePathname();
  const active =
    [...PRON_TABS].reverse().find((x) => (x.key === "overview" ? path === x.href : path.startsWith(x.href)))?.key ??
    "overview";
  return (
    <div className="flex flex-col gap-3">
      <section
        aria-labelledby="pr-title"
        className="relative flex items-center gap-4 overflow-hidden rounded-[22px] border border-[#DDEBF8] bg-[linear-gradient(100deg,#F4F9FF_0%,#E9F3FE_60%,#E1EFFD_100%)] px-[18px] py-[18px] md:px-7 md:py-5"
      >
        <LeafDecor className="pointer-events-none absolute right-[34%] -bottom-2 hidden w-12 -rotate-12 opacity-40 lg:block" />
        <span className="hidden size-14 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-soft sm:flex md:size-16">
          <AudioLines className="size-7 md:size-8" />
        </span>
        <div className="min-w-0 flex-1">
          <h1
            id="pr-title"
            className="flex items-center gap-3 text-[24px] font-extrabold tracking-tight text-navy-900 md:text-[32px]"
          >
            {t("pronunciation.title")}
            <LeafDecor className="hidden w-10 sm:block" />
          </h1>
          <p className="mt-1 text-[14px] text-text-2 md:text-[16px]">{t("pronunciation.subtitle")}</p>
        </div>
        <p
          aria-hidden="true"
          className="hidden -rotate-6 text-center font-hand text-[22px] leading-tight font-semibold text-blue-700 xl:block"
        >
          {t("pronunciation.slogan1")}
          <br />
          {t("pronunciation.slogan2")}
        </p>
        <Image
          src="/brand/lingyu-mascot.png"
          alt=""
          aria-hidden="true"
          width={1536}
          height={1024}
          className="hidden h-auto w-[130px] shrink-0 lg:block"
        />
      </section>
      <nav aria-label={t("pronunciation.tabs.label")} className="-mx-1 overflow-x-auto px-1 pb-1">
        <ul className="flex min-w-max gap-2">
          {PRON_TABS.map((x) => (
            <li key={x.key}>
              <Link
                href={x.href}
                aria-current={active === x.key ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-[12px] border px-3.5 text-[14.5px] font-semibold whitespace-nowrap outline-none focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-[18px] [&_svg]:shrink-0",
                  active === x.key
                    ? "border-blue-600 bg-blue-600 text-white shadow-cta"
                    : "border-[#DDEBF8] bg-white text-blue-700 hover:bg-blue-50",
                )}
              >
                <x.icon aria-hidden="true" />
                {t(`pronunciation.tabs.${x.key}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/** Thẻ trắng dùng chung. */
export function PCard({ className, children, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      {...props}
      className={cn("rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card md:p-5", className)}
    >
      {children}
    </section>
  );
}

/** Tiêu đề khối có biểu tượng tròn. */
export function PTitle({
  id,
  icon,
  children,
  right,
  tone = "blue",
}: {
  id?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  right?: React.ReactNode;
  tone?: "blue" | "amber" | "green";
}) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      {icon ? (
        <span
          aria-hidden="true"
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-[18px]",
            tone === "blue" && "bg-blue-50 text-blue-600",
            tone === "amber" && "bg-amber-50 text-amber",
            tone === "green" && "bg-green-50 text-green-700",
          )}
        >
          {icon}
        </span>
      ) : null}
      <h2 id={id} className="min-w-0 flex-1 text-[17px] font-bold text-navy-900">
        {children}
      </h2>
      {right}
    </div>
  );
}
