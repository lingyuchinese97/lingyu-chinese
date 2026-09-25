"use client";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeafDecor } from "./icons";
import type { NavItem, NavKey } from "./nav";

type Props = { items: NavItem[]; active: NavKey | null; quote: string; open: boolean; onNavigate: () => void };

/**
 * Sidebar: ≥1280px đầy đủ (280px), 1024–1279px thu gọn còn icon (96px), <1024px là ngăn kéo mở bằng nút ☰.
 */
export function Sidebar({ items, active, quote, open, onNavigate }: Props) {
  return (
    <aside
      id="sidebar"
      aria-label="Điều hướng chính"
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col overflow-hidden border-r border-[#E3EEF8] bg-[linear-gradient(180deg,#F9FCFF_0%,#F1F8FF_100%)] px-[18px] pt-[26px] pb-[18px] shadow-[10px_0_40px_rgba(9,35,80,.12)] transition-transform duration-250 ease-out motion-reduce:transition-none",
        open ? "translate-x-0" : "-translate-x-[102%]",
        "lg:sticky lg:top-0 lg:z-30 lg:h-dvh lg:w-24 lg:translate-x-0 lg:items-center lg:px-3 lg:py-[22px] lg:shadow-none",
        "xl:w-[280px] xl:items-stretch xl:px-[18px] xl:pt-[26px] xl:pb-[18px]",
      )}
    >
      <Link
        href="/home"
        onClick={onNavigate}
        aria-label="LingYu Chinese — Trang chủ"
        className="mb-6 block px-1.5 lg:w-[72px] lg:px-0 xl:w-auto xl:px-1.5"
      >
        {/* Logo chữ (không kèm mascot), cỡ vừa. Thanh thu gọn (lg) không đủ chỗ cho chữ → dùng icon app. */}
        <Image
          src="/brand/lingyu-wordmark.png"
          alt="LingYu Chinese — Tiếng Trung gần hơn mỗi ngày"
          width={1579}
          height={550}
          priority
          sizes="190px"
          className="h-auto w-[190px] lg:hidden xl:block"
        />
        <Image
          src="/icons/icon-192.png"
          alt="LingYu Chinese"
          width={192}
          height={192}
          sizes="56px"
          className="hidden size-14 rounded-full lg:mx-auto lg:block xl:hidden"
        />
      </Link>
      <nav className="relative z-[1] flex flex-col gap-2">
        {items.map((n) => {
          const on = n.key === active;
          const Icon = n.icon;
          return (
            <Link
              key={n.key}
              href={n.href}
              onClick={onNavigate}
              title={n.label}
              aria-current={on ? "page" : undefined}
              className={cn(
                "relative flex h-[52px] items-center gap-4 rounded-md px-5 text-base font-medium text-text-2 transition-colors hover:bg-[#EAF4FE] hover:text-navy xl:h-14 xl:text-[17px]",
                "lg:w-16 lg:justify-center lg:px-0 xl:w-auto xl:justify-start xl:px-5",
                on &&
                  "bg-[linear-gradient(90deg,#DDEEFF_0%,#E8F4FF_100%)] font-bold text-blue-600 before:absolute before:inset-y-3 before:-left-[18px] before:w-1 before:rounded-r before:bg-blue lg:before:-left-3 xl:before:-left-[18px]",
              )}
            >
              <Icon className={cn("size-7 shrink-0 text-blue-600", !on && "opacity-85")} />
              <span className="lg:sr-only xl:not-sr-only">{n.label}</span>
            </Link>
          );
        })}
      </nav>
      <div aria-hidden="true" className="relative mt-auto pt-5 lg:hidden xl:block [@media(max-height:799px)]:hidden">
        <LeafDecor className="pointer-events-none absolute top-[-10px] left-1.5 w-10 -rotate-30 opacity-45" />
        <LeafDecor className="pointer-events-none absolute top-5 right-2.5 w-9 rotate-25 opacity-45" />
        <Image
          src="/brand/lingyu-mascot.png"
          alt=""
          width={1536}
          height={1024}
          loading="eager"
          sizes="190px"
          className="mx-auto mb-1 h-auto w-[130px] xl:w-[190px]"
        />
        {quote && (
          <p className="origin-left -rotate-6 px-3 hand text-lg leading-snug whitespace-pre-line xl:text-[19px]">
            {quote}
            <Heart className="ml-1.5 inline size-6 -translate-y-0.5 text-blue-600" />
          </p>
        )}
      </div>
      <div
        aria-hidden="true"
        className="mt-[18px] hidden items-center gap-2.5 pl-1.5 text-[13.5px] leading-tight text-text-3 italic xl:flex [@media(max-height:799px)]:!hidden"
      >
        <LeafDecor className="w-[30px]" />
        <span>
          Small steps,
          <br />
          big future
        </span>
      </div>
    </aside>
  );
}
