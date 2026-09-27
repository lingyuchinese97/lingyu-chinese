"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, History } from "lucide-react";
import { GrammarIcon } from "@/components/layout/icons";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/progress", key: "tabOverview", icon: BarChart3 },
  { href: "/progress/vocab", key: "tabVocab", icon: BookOpen },
  { href: "/progress/grammar", key: "tabGrammar", icon: GrammarIcon },
  { href: "/progress/history", key: "tabHistory", icon: History },
] as const;

export function ProgressTabs() {
  const t = useT();
  const path = usePathname();
  return (
    <nav aria-label={t("progress.tabsLabel")} className="-mx-1 overflow-x-auto px-1 pb-1">
      <ul className="flex min-w-max gap-2">
        {TABS.map((x) => {
          const on = x.href === "/progress" ? path === x.href : path.startsWith(x.href);
          return (
            <li key={x.href}>
              <Link
                href={x.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-[12px] border px-3.5 text-[14.5px] font-semibold whitespace-nowrap outline-none focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-[18px]",
                  on
                    ? "border-blue-600 bg-blue-600 text-white shadow-cta"
                    : "border-[#DDEBF8] bg-white text-blue-700 hover:bg-blue-50",
                )}
              >
                <x.icon aria-hidden="true" />
                {t(`progress.${x.key}`)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
