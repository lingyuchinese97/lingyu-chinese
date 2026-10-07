"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  Grid2x2,
  LayoutGrid,
  List,
  MessageCircle,
  Search,
  Shapes,
  Signpost,
  Sparkles,
  Star,
} from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { LIB_SET_TOPICS } from "@/data/library/vocab-sets";
import type { SetCard } from "../../sets";
import type { SetListParams } from "../../schema";
import { SetGridCard, SetRow } from "./set-card";
import { Crumbs, card } from "./parts";
import { FeatureHero } from "@/components/feature-hero";

type Data = { items: SetCard[]; total: number; all: number; featured: SetCard[] };

const TABS = [
  { key: "all", icon: LayoutGrid },
  { key: "hsk", icon: Boxes },
  { key: "topic", icon: Shapes },
  { key: "communication", icon: MessageCircle },
  { key: "essential", icon: Sparkles },
  { key: "radical", icon: Grid2x2 },
  { key: "situation", icon: Signpost },
  { key: "favorite", icon: Star },
] as const;

const selectCls =
  "h-11 w-full rounded-[14px] border border-border bg-white px-3 text-[15px] font-semibold text-navy-900 md:w-auto";

/** Danh sách bộ từ vựng của Thư viện LingYu (lọc qua URL để chia sẻ / quay lại được). */
export function SetList({ data, params }: { data: Data; params: SetListParams }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = React.useTransition();
  const [q, setQ] = React.useState(params.q);
  const go = React.useCallback(
    (patch: Partial<SetListParams>) => {
      const n = { ...params, ...patch };
      const sp = new URLSearchParams();
      if (n.q.trim()) sp.set("q", n.q.trim());
      if (n.hsk) sp.set("hsk", String(n.hsk));
      if (n.topic) sp.set("topic", n.topic);
      if (n.kind !== "all") sp.set("kind", n.kind);
      if (n.sort !== "order") sp.set("sort", n.sort);
      if (n.view !== "grid") sp.set("view", n.view);
      startTransition(() => router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false }));
    },
    [params, pathname, router],
  );
  React.useEffect(() => {
    if (q === params.q) return;
    const id = setTimeout(() => go({ q }), 300);
    return () => clearTimeout(id);
  }, [q, params.q, go]);
  const filtered = !!(params.q || params.hsk || params.topic || params.kind !== "all");

  return (
    <div className="flex flex-col gap-5">
      <Crumbs
        label={t("shell.breadcrumb")}
        home={t("shell.nav.home")}
        items={[{ href: "/library", text: t("libhub.breadcrumb") }, { text: t("libhub.vocabTitle") }]}
      />
      <FeatureHero
        id="ls-sets-title"
        title={t("libhub.vocabTitle")}
        description={t("libhub.vocabSub")}
        actions={
          <div className="flex w-full max-w-[680px] flex-col gap-2">
            <label className="relative block">
              <span className="sr-only">{t("libhub.searchSets")}</span>
              <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-text-3" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("libhub.searchSets")}
                className="h-12 w-full rounded-[16px] border border-border bg-white pr-4 pl-12 text-[15px] shadow-card outline-none focus:border-blue-600"
              />
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <label>
                <span className="sr-only">{t("libhub.hskAll")}</span>
                <select className={selectCls} value={params.hsk} onChange={(e) => go({ hsk: Number(e.target.value) })}>
                  <option value={0}>{t("libhub.hskAll")}</option>
                  {[1, 2, 3, 4, 5, 6].map((l) => (
                    <option key={l} value={l}>
                      HSK {l}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sr-only">{t("libhub.topicAll")}</span>
                <select
                  className={selectCls}
                  value={params.topic}
                  onChange={(e) => go({ topic: e.target.value as SetListParams["topic"] })}
                >
                  <option value="">{t("libhub.topicAll")}</option>
                  {LIB_SET_TOPICS.map((tp) => (
                    <option key={tp} value={tp}>
                      {t(`libhub.topics.${tp}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sr-only">{t("libhub.sortLabel")}</span>
                <select
                  className={selectCls}
                  value={params.sort}
                  onChange={(e) => go({ sort: e.target.value as SetListParams["sort"] })}
                >
                  {(["order", "newest", "name", "size"] as const).map((s) => (
                    <option key={s} value={s}>
                      {t(`libhub.sorts.${s}`)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        }
      />

      <nav aria-label={t("libhub.kindsLabel")} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((tab) => {
          const on = tab.key !== "hsk" && params.kind === tab.key;
          const cls = cn(
            "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[14px] border px-4 text-[15px] font-semibold whitespace-nowrap",
            on ? "border-blue-600 bg-blue-600 text-white" : "border-border bg-white text-navy-900 hover:bg-blue-50",
          );
          const label = (
            <>
              <tab.icon className="size-[18px]" aria-hidden="true" />
              {t(`libhub.kinds.${tab.key}`)}
            </>
          );
          return tab.key === "hsk" ? (
            <Link key={tab.key} href="/library/vocabulary/hsk" className={cls}>
              {label}
            </Link>
          ) : (
            <button key={tab.key} type="button" aria-pressed={on} onClick={() => go({ kind: tab.key })} className={cls}>
              {label}
            </button>
          );
        })}
      </nav>

      {!filtered && data.featured.length ? (
        <section aria-labelledby="sl-featured" className={cn(card, "p-4 md:p-5")}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="sl-featured" className="text-[22px] font-extrabold text-navy-900">
              {t("libhub.featuredSets")}
            </h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            {data.featured.map((s) => (
              <li key={s.id}>
                <SetGridCard s={s} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="sl-all" className={cn(card, "p-4 md:p-5")}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="sl-all" className="text-[22px] font-extrabold text-navy-900">
            {t("libhub.allSets")}{" "}
            <span className="font-semibold text-text-2">{t("libhub.setsCount", { count: data.total })}</span>
          </h2>
          <div
            role="group"
            aria-label={t("libhub.viewLabel")}
            className="flex overflow-hidden rounded-[12px] border border-border"
          >
            {(["grid", "list"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={params.view === v}
                onClick={() => go({ view: v })}
                className={cn(
                  "inline-flex min-h-10 items-center gap-2 px-4 text-[14px] font-semibold",
                  params.view === v ? "bg-blue-600 text-white" : "bg-white text-navy-900 hover:bg-blue-50",
                )}
              >
                {v === "grid" ? <LayoutGrid className="size-4" /> : <List className="size-4" />}
                {t(`libhub.${v}`)}
              </button>
            ))}
          </div>
        </div>
        <div aria-busy={pending || undefined} className={cn("transition-opacity", pending && "opacity-60")}>
          {!data.items.length ? (
            <p className="rounded-[14px] border border-dashed border-border px-4 py-10 text-center text-text-2">
              {t("libhub.emptySets")}
            </p>
          ) : params.view === "grid" ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
              {data.items.map((s) => (
                <li key={s.id}>
                  <SetGridCard s={s} />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="divide-y divide-[#EDF3F9] overflow-hidden rounded-[14px] border border-border">
              {data.items.map((s) => (
                <li key={s.id}>
                  <SetRow s={s} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
