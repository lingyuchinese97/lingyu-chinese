"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, ChevronRight, Headphones, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/badges";
import { inputClass, Select } from "@/components/ui/input";
import { Pager } from "@/components/ui/list-controls";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import type { ExerciseListParams } from "../schema";
import type { Exercise, ExerciseList } from "../service";
import { ListeningHeader, Panel } from "./listening-header";
import { ExerciseDetail } from "./exercise-detail";

const tone = (p: number) => (p >= 80 ? "text-green-700" : p >= 50 ? "text-[#B86E00]" : "text-red");

/** Tab "Bài làm của tôi": tìm · lọc thẻ · sắp xếp · danh sách (trái) · chi tiết (phải). */
export function ExercisesView({
  data,
  params,
  selected,
}: {
  data: ExerciseList;
  params: ExerciseListParams;
  selected: Exercise | null;
}) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = React.useTransition();
  const [q, setQ] = React.useState(params.q);
  const detailRef = React.useRef<HTMLDivElement>(null);

  const href = React.useCallback(
    (patch: Partial<ExerciseListParams & { id: string }>) => {
      const next = { ...params, id: selected?.id ?? "", ...patch };
      const sp = new URLSearchParams();
      if (next.q.trim()) sp.set("q", next.q.trim());
      if (next.tag) sp.set("tag", next.tag);
      if (next.sort !== "newest") sp.set("sort", next.sort);
      if (next.page > 1) sp.set("page", String(next.page));
      if (next.id) sp.set("id", next.id);
      return `${pathname}${sp.size ? `?${sp}` : ""}`;
    },
    [params, pathname, selected?.id],
  );
  const go = React.useCallback(
    (patch: Partial<ExerciseListParams & { id: string }>) =>
      startTransition(() => router.replace(href(patch), { scroll: false })),
    [href, router],
  );
  React.useEffect(() => {
    if (q === params.q) return;
    const id = setTimeout(() => go({ q, page: 1, id: "" }), 300);
    return () => clearTimeout(id);
  }, [q, params.q, go]);

  const filtered = !!(params.q || params.tag);
  const allTags = data.tags.map((x) => x.name);

  return (
    <>
      <ListeningHeader tab="mine" />
      <Panel aria-labelledby="lx-mine-title" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="hidden size-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 sm:flex">
            <BookOpen className="size-6" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="lx-mine-title" className="text-[20px] font-extrabold text-navy">
              {t("listening.mine.title")}
            </h2>
            <p className="text-[14px] text-text-2">{t("listening.mine.sub")}</p>
          </div>
          <Button asChild variant="solid">
            <Link href="/listening?new=1">
              <Plus />
              {t("listening.mine.new")}
            </Link>
          </Button>
        </div>

        <div className="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_200px_170px]">
          <label className="relative block">
            <span className="sr-only">{t("listening.mine.searchLabel")}</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-text-3" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("listening.mine.search")}
              autoComplete="off"
              className={cn(inputClass, "pl-11")}
            />
          </label>
          <label>
            <span className="sr-only">{t("listening.mine.tagFilter")}</span>
            <Select value={params.tag} onChange={(e) => go({ tag: e.target.value, page: 1, id: "" })}>
              <option value="">{t("listening.mine.allTags")}</option>
              {data.tags.map((x) => (
                <option key={x.id} value={x.name}>
                  {x.name} ({x.count})
                </option>
              ))}
            </Select>
          </label>
          <label>
            <span className="sr-only">{t("listening.mine.sort")}</span>
            <Select
              value={params.sort}
              onChange={(e) => go({ sort: e.target.value as ExerciseListParams["sort"], page: 1 })}
            >
              <option value="newest">{t("listening.mine.newest")}</option>
              <option value="oldest">{t("listening.mine.oldest")}</option>
            </Select>
          </label>
        </div>

        {data.total === 0 && !filtered ? (
          <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Headphones className="size-8" aria-hidden="true" />
            </span>
            <h3 className="text-xl font-bold text-navy">{t("listening.mine.empty")}</h3>
            <p className="max-w-[420px] text-text-2">{t("listening.mine.emptyHint")}</p>
            <Button asChild variant="primary">
              <Link href="/listening">{t("listening.mine.start")}</Link>
            </Button>
          </div>
        ) : (
          <div
            aria-busy={pending || undefined}
            className={cn(
              "grid gap-4 transition-opacity lg:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.5fr)]",
              pending && "opacity-60",
            )}
          >
            <div className="flex min-w-0 flex-col gap-2">
              <p className="text-[13.5px] text-text-2" aria-live="polite">
                {t("listening.mine.total", { count: data.total })}
              </p>
              {data.total === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-[16px] border border-dashed border-border px-4 py-10 text-center">
                  <p className="font-bold text-navy">{t("listening.mine.noMatch")}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setQ("");
                      go({ q: "", tag: "", page: 1, id: "" });
                    }}
                  >
                    <X />
                    {t("listening.mine.clearFilters")}
                  </Button>
                </div>
              ) : (
                <ul aria-label={t("listening.mine.list")} className="flex flex-col gap-2">
                  {data.items.map((it) => {
                    const on = it.id === selected?.id;
                    return (
                      <li key={it.id}>
                        <Link
                          href={href({ id: it.id })}
                          replace
                          scroll={false}
                          aria-current={on ? "true" : undefined}
                          aria-label={t("listening.mine.open", { title: it.title })}
                          onClick={() =>
                            requestAnimationFrame(() => {
                              if (window.matchMedia("(max-width: 1023px)").matches)
                                detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                            })
                          }
                          className={cn(
                            "flex items-center gap-3 rounded-[14px] border p-3.5 outline-none focus-visible:shadow-[var(--focus-ring)]",
                            on ? "border-[#A9D3F8] bg-blue-50" : "border-border bg-white hover:border-[#A9D3F8]",
                          )}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block font-bold break-words text-navy">{it.title}</span>
                            {it.tags.length ? (
                              <span className="mt-1.5 flex flex-wrap gap-1">
                                {it.tags.map((x) => (
                                  <Tag key={x} name={x} className="px-2 text-[12.5px]" />
                                ))}
                              </span>
                            ) : null}
                          </span>
                          <span className={cn("shrink-0 text-right font-bold tabular-nums", tone(it.scorePercent))}>
                            <span className="block">
                              {t("listening.mine.scoreShort", { correct: it.scoreCorrect, total: it.scoreTotal })}
                            </span>
                            <span className="block text-[13px]">{it.scorePercent}%</span>
                          </span>
                          <ChevronRight className="size-5 shrink-0 text-text-3" aria-hidden="true" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Pager page={data.page} count={data.pageCount} onGo={(page) => go({ page, id: "" })} />
            </div>

            <div
              ref={detailRef}
              aria-label={t("listening.detail.label")}
              role="region"
              className="min-w-0 scroll-mt-4 rounded-[18px] border border-border bg-white p-4 md:p-5"
            >
              {selected ? (
                <ExerciseDetail key={selected.id} initial={selected} allTags={allTags} />
              ) : (
                <p className="py-10 text-center text-text-3">{t("listening.mine.pickOne")}</p>
              )}
            </div>
          </div>
        )}
      </Panel>
    </>
  );
}
