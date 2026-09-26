"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";
import type { NavItem, NavKey } from "./nav";

/** Thanh tab dưới đáy — chỉ hiện trên điện thoại (<768px), ẩn ở màn tập trung. */
export function BottomNav({ items, active }: { items: NavItem[]; active: NavKey | null }) {
  const t = useT();
  return (
    <nav
      aria-label={t("shell.quickNav")}
      className="fixed inset-x-0 bottom-0 z-40 grid h-[calc(var(--tabbar-h)+var(--safe-b))] grid-cols-5 border-t border-border bg-white/96 pb-[var(--safe-b)] shadow-[0_-6px_20px_rgba(20,60,110,.06)] backdrop-blur-md backdrop-saturate-150 md:hidden"
    >
      {items.map((it) => {
        const on = it.key === active;
        const Icon = it.icon;
        return (
          <Link
            key={it.key}
            href={it.href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "relative flex flex-col items-center justify-center gap-[3px] text-[11.5px] font-semibold text-text-3 max-[380px]:text-[10.5px]",
              on &&
                "text-blue-600 before:absolute before:inset-x-[28%] before:top-0 before:h-[3px] before:rounded-b-[3px] before:bg-blue",
            )}
          >
            <Icon className="size-6" />
            <span>{t(`shell.nav.${it.key}`)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
