"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useT } from "@/i18n/client";

/** Ô tìm kiếm trên cùng (máy tính) / nút tìm kiếm (điện thoại) → trang /search?q=. */
export function TopSearch() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  return (
    <>
      <form
        role="search"
        action="/search"
        onSubmit={(e) => {
          e.preventDefault();
          const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
          if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
        }}
        className="mr-auto hidden max-w-[560px] flex-1 md:block"
      >
        <label className="relative block">
          <span className="sr-only">{t("search.label")}</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-text-3"
            aria-hidden="true"
          />
          <input
            type="search"
            name="q"
            maxLength={100}
            defaultValue={params.get("q") ?? ""}
            placeholder={t("search.placeholder")}
            className="h-12 w-full rounded-[14px] border border-border bg-white/90 pr-4 pl-12 text-[15px] text-text shadow-soft outline-none placeholder:text-text-3 focus-visible:border-blue focus-visible:shadow-[var(--focus-ring)]"
          />
        </label>
      </form>
      <Link
        href="/search"
        aria-label={t("search.label")}
        className="flex size-11 items-center justify-center rounded-full text-navy outline-none hover:bg-blue-50 focus-visible:shadow-[var(--focus-ring)] md:hidden"
      >
        <Search className="size-6" aria-hidden="true" />
      </Link>
    </>
  );
}
