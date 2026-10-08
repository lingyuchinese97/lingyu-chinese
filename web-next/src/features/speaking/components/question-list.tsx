"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, SlidersHorizontal, Star, Trash2 } from "lucide-react";
import { SpeakButton } from "@/components/speak-button";
import { useConfirm } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toaster";
import { tagColors } from "@/lib/tag-style";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";
import { deleteQuestionAction, deleteQuestionsAction } from "../actions";
import { listQuery, PAGE_SIZES, type QuestionListParams } from "../schema";
import type { QuestionList as Data } from "../service";

/** Trang hiện ra trên thanh phân trang: 1 … (trang hiện tại ± 2) … cuối. */
function pageList(page: number, pages: number) {
  const out: (number | "…")[] = [];
  for (let n = 1; n <= pages; n++) {
    if (n === 1 || n === pages || Math.abs(n - page) <= 2) out.push(n);
    else if (out.at(-1) !== "…") out.push("…");
  }
  return out;
}

/**
 * Màn B — danh sách câu hỏi (cột trái trên màn rộng, theo design): lọc HSK / tag, tìm, sắp xếp, nghe, sửa, xoá;
 * bấm câu → màn luyện tập (cột phải). `currentId`: câu đang luyện (tô sáng).
 */
export function QuestionList({
  data,
  params,
  currentId,
}: {
  data: Data;
  params: QuestionListParams;
  currentId?: string;
}) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const [confirm, confirmNode] = useConfirm();
  const [q, setQ] = React.useState(params.q);
  const [sel, setSel] = React.useState<string[]>([]);
  const [more, setMore] = React.useState(!!params.starred || params.size !== 10);
  const [, startTransition] = React.useTransition();

  const go = React.useCallback(
    (patch: Partial<Record<keyof QuestionListParams, string | number | boolean | undefined>>) => {
      const next = { ...params, ...patch };
      if (!("page" in patch)) next.page = 1;
      startTransition(() => router.replace(`${pathname}${listQuery(next)}`, { scroll: false }));
    },
    [params, pathname, router],
  );
  // Tìm khi ngừng gõ.
  React.useEffect(() => {
    if (q === params.q) return;
    const h = setTimeout(() => go({ q }), 300);
    return () => clearTimeout(h);
  }, [q, params.q, go]);

  async function remove(id: string, zh: string) {
    if (
      !(await confirm({
        title: t("speaking.del"),
        message: t("speaking.confirmDel", { zh }),
        danger: true,
        confirmLabel: t("speaking.del"),
      }))
    )
      return;
    const r = await deleteQuestionAction(id);
    if (!r.ok) return void toast.error(r.message);
    toast.success(t("speaking.deleted"));
    setSel((s) => s.filter((x) => x !== id));
    if (id === currentId && pathname !== "/speaking") router.replace(`/speaking${listQuery(params)}`);
    else router.refresh();
  }
  async function removeSelected() {
    if (
      !(await confirm({
        title: t("speaking.del"),
        message: t("speaking.confirmDelMany", { count: sel.length }),
        danger: true,
        confirmLabel: t("speaking.del"),
      }))
    )
      return;
    const r = await deleteQuestionsAction(sel);
    if (!r.ok) return void toast.error(r.message);
    toast.success(t("speaking.deletedMany", { count: r.data.deleted }));
    const gone = currentId && sel.includes(currentId);
    setSel([]);
    if (gone && pathname !== "/speaking") router.replace(`/speaking${listQuery(params)}`);
    else router.refresh();
  }

  const chip = (on: boolean) =>
    cn(
      "inline-flex min-h-10 items-center gap-1.5 rounded-[12px] border px-3.5 text-[14.5px] font-semibold outline-none focus-visible:shadow-[var(--focus-ring)]",
      on
        ? "border-blue-600 bg-blue-50 text-blue-700"
        : "border-transparent bg-[#F3F6FA] text-navy-900 hover:bg-blue-50",
    );
  const pageIds = data.items.map((x) => x.id);
  const allOn = pageIds.length > 0 && pageIds.every((id) => sel.includes(id));
  const noFilter = !params.q && !params.tag && !params.hsk && !params.starred;
  const qs = listQuery(params);

  return (
    <section
      aria-labelledby="sp-title"
      className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card md:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 id="sp-title" className="text-[26px] leading-tight font-extrabold text-navy-900 md:text-[28px]">
            {t("speaking.title")}
          </h1>
          <p className="mt-1 text-[14.5px] text-text-2">{t("speaking.listSubtitle")}</p>
        </div>
        <Link
          href="/speaking/new"
          className="inline-flex h-12 shrink-0 items-center gap-2 rounded-[12px] bg-[#1769C9] px-4 text-[15.5px] font-semibold text-white shadow-[0_6px_14px_rgba(23,105,201,.25)] outline-none hover:bg-[#135AAD] focus-visible:shadow-[var(--focus-ring)] md:px-5"
        >
          <Plus className="size-5" aria-hidden="true" />
          {t("speaking.create")}
        </Link>
      </div>

      <nav aria-label={t("speaking.filterLabel")} className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={noFilter}
          onClick={() => go({ tag: "", hsk: undefined, starred: undefined })}
          className={chip(noFilter)}
        >
          {t("speaking.all")}
        </button>
        {data.hskCounts
          .filter((h) => h.count > 0)
          .map((h) => (
            <button
              key={h.hsk}
              type="button"
              aria-pressed={params.hsk === h.hsk}
              title={t("speaking.count", { count: h.count })}
              onClick={() => go({ hsk: params.hsk === h.hsk ? undefined : h.hsk })}
              className={chip(params.hsk === h.hsk)}
            >
              HSK{h.hsk}
            </button>
          ))}
        {data.tags.map((tg) => {
          const on = params.tag.toLowerCase() === tg.name.toLowerCase();
          return (
            <button
              key={tg.name}
              type="button"
              aria-pressed={on}
              title={t("speaking.count", { count: tg.count })}
              onClick={() => go({ tag: on ? "" : tg.name })}
              className={chip(on)}
            >
              {tg.name}
            </button>
          );
        })}
      </nav>

      <div className="flex gap-2">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">{t("speaking.searchLabel")}</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-text-3" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("speaking.searchPlaceholder")}
            className="h-11 w-full rounded-[12px] border border-border bg-white pr-3 pl-11 text-[15px] outline-none focus:border-blue-600"
          />
        </label>
        <label className="shrink-0">
          <span className="sr-only">{t("speaking.sortLabel")}</span>
          <select
            value={params.sort}
            onChange={(e) => go({ sort: e.target.value })}
            className="h-11 w-[132px] rounded-[12px] border border-border bg-white px-3 text-[14.5px] font-semibold text-navy-900"
          >
            {(["newest", "oldest", "az"] as const).map((s) => (
              <option key={s} value={s}>
                {t(`speaking.sorts.${s}`)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setMore((m) => !m)}
          aria-expanded={more}
          aria-label={t("speaking.moreFilters")}
          title={t("speaking.moreFilters")}
          className={cn(
            "inline-flex size-11 shrink-0 items-center justify-center rounded-[12px] border outline-none focus-visible:shadow-[var(--focus-ring)]",
            more ? "border-blue-600 bg-blue-50 text-blue-700" : "border-border bg-white text-text-2 hover:bg-blue-50",
          )}
        >
          <SlidersHorizontal className="size-5" />
        </button>
      </div>
      {more ? (
        <div className="-mt-1 flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={!!params.starred}
            onClick={() => go({ starred: params.starred ? undefined : true })}
            className={chip(!!params.starred)}
          >
            <Star className={cn("size-4", params.starred && "fill-amber text-amber")} aria-hidden="true" />
            {t("speaking.starredOnly")}
          </button>
          <label>
            <span className="sr-only">{t("speaking.pageSize")}</span>
            <select
              value={params.size}
              onChange={(e) => go({ size: Number(e.target.value) })}
              className="h-10 rounded-[12px] border border-border bg-white px-3 text-[14.5px] font-semibold text-navy-900"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {t("speaking.count", { count: n })}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {data.items.length ? (
        <>
          <div className="flex flex-wrap items-center gap-3 px-1">
            <label className="inline-flex items-center gap-2 text-[14px] font-semibold text-navy-900">
              <input
                type="checkbox"
                checked={allOn}
                onChange={(e) =>
                  setSel((s) =>
                    e.target.checked ? [...new Set([...s, ...pageIds])] : s.filter((x) => !pageIds.includes(x)),
                  )
                }
                className="size-[18px] accent-blue-600"
              />
              {t("speaking.selectAll")}
            </label>
            <span className="text-[13.5px] text-text-2">{t("speaking.count", { count: data.total })}</span>
            {sel.length ? (
              <button
                type="button"
                onClick={removeSelected}
                className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-red-50 px-3 text-[14px] font-semibold text-red hover:bg-red-100"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                {t("speaking.deleteSelected", { count: sel.length })}
              </button>
            ) : null}
          </div>
          <ol aria-label={t("speaking.listLabel")} className="flex flex-col divide-y divide-border">
            {data.items.map((x) => {
              const checked = sel.includes(x.id);
              const current = x.id === currentId;
              return (
                <li
                  key={x.id}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[14px] px-2.5 py-3 md:px-3",
                    current ? "bg-[#EAF3FF]" : checked ? "bg-blue-50/60" : "hover:bg-[#F7FAFE]",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setSel((s) => (e.target.checked ? [...s, x.id] : s.filter((v) => v !== x.id)))}
                    aria-label={t("speaking.selectN", { zh: x.zh })}
                    className="size-[18px] shrink-0 accent-blue-600"
                  />
                  <span className="w-6 shrink-0 text-center text-[15px] font-semibold text-text-2 tabular-nums">
                    {x.no}
                  </span>
                  <Link
                    href={`/speaking/${x.id}${qs}`}
                    aria-label={t("speaking.practiceN", { zh: x.zh })}
                    aria-current={current ? "page" : undefined}
                    scroll={false}
                    className="min-w-0 flex-1 rounded-[8px] outline-none focus-visible:shadow-[var(--focus-ring)]"
                  >
                    <span lang="zh" className="flex items-center gap-1.5 text-[17px] font-bold text-navy-900">
                      <span className="line-clamp-2">{x.zh}</span>
                      {x.starred ? (
                        <Star className="size-3.5 shrink-0 fill-amber text-amber" aria-hidden="true" />
                      ) : null}
                    </span>
                    {x.meaning ? <span className="block truncate text-[13px] text-text-2">{x.meaning}</span> : null}
                  </Link>
                  <span className="hidden shrink-0 flex-wrap justify-end gap-1.5 sm:flex">
                    {x.hsk ? (
                      <span className="rounded-[8px] px-2 py-0.5 text-[12.5px] font-semibold" style={tagColors("HSK")}>
                        HSK{x.hsk}
                      </span>
                    ) : null}
                    {x.tags.slice(0, 1).map((tg) => (
                      <span
                        key={tg}
                        className="max-w-[90px] truncate rounded-[8px] px-2 py-0.5 text-[12.5px] font-semibold"
                        style={tagColors(tg)}
                      >
                        {tg}
                      </span>
                    ))}
                  </span>
                  <span className="flex shrink-0 items-center">
                    <SpeakButton text={x.zh} label={t("speaking.listen")} />
                    <Link
                      href={`/speaking/${x.id}/edit`}
                      aria-label={t("speaking.editN", { zh: x.zh })}
                      title={t("speaking.edit")}
                      className="inline-flex size-9 items-center justify-center rounded-full text-blue-600 hover:bg-blue-50"
                    >
                      <Pencil className="size-[18px]" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(x.id, x.zh)}
                      aria-label={t("speaking.delN", { zh: x.zh })}
                      title={t("speaking.del")}
                      className="inline-flex size-9 items-center justify-center rounded-full text-red hover:bg-red-50"
                    >
                      <Trash2 className="size-[18px]" />
                    </button>
                  </span>
                </li>
              );
            })}
          </ol>
          {data.pages > 1 ? (
            <nav aria-label={t("speaking.pagination")} className="flex items-center justify-center gap-1.5">
              <button
                type="button"
                disabled={data.page <= 1}
                onClick={() => go({ page: data.page - 1 })}
                aria-label={t("speaking.prevPage")}
                className="inline-flex size-9 items-center justify-center rounded-[10px] border border-border bg-white disabled:opacity-40"
              >
                <ChevronLeft className="size-5" />
              </button>
              {pageList(data.page, data.pages).map((n, i) =>
                n === "…" ? (
                  <span key={`gap${i}`} className="px-1 text-text-3" aria-hidden="true">
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => go({ page: n })}
                    aria-label={t("speaking.pageN", { n })}
                    aria-current={n === data.page ? "page" : undefined}
                    className={cn(
                      "inline-flex size-9 items-center justify-center rounded-[10px] text-[15px] font-semibold",
                      n === data.page ? "bg-blue-600 text-white" : "text-navy-900 hover:bg-blue-50",
                    )}
                  >
                    {n}
                  </button>
                ),
              )}
              <button
                type="button"
                disabled={data.page >= data.pages}
                onClick={() => go({ page: data.page + 1 })}
                aria-label={t("speaking.nextPage")}
                className="inline-flex size-9 items-center justify-center rounded-[10px] border border-border bg-white disabled:opacity-40"
              >
                <ChevronRight className="size-5" />
              </button>
            </nav>
          ) : null}
        </>
      ) : (
        <p className="rounded-[16px] border border-dashed border-border px-4 py-10 text-center text-[15px] text-text-2">
          {data.all ? t("speaking.noMatch") : t("speaking.empty")}
        </p>
      )}
      {confirmNode}
    </section>
  );
}
