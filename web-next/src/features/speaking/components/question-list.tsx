"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { FeatureHero, heroPrimary } from "@/components/feature-hero";
import { SpeakButton } from "@/components/speak-button";
import { useConfirm } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toaster";
import { tagColors } from "@/lib/tag-style";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";
import { deleteQuestionAction, deleteQuestionsAction, setStarredAction } from "../actions";
import { PAGE_SIZES, type QuestionListParams } from "../schema";
import type { QuestionList as Data } from "../service";

/** Màn B — danh sách câu hỏi đã lưu: lọc HSK / tag, tìm, sắp xếp, đánh dấu, nghe, sửa, xoá; bấm câu → màn luyện tập. */
export function QuestionList({ data, params }: { data: Data; params: QuestionListParams }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const [confirm, confirmNode] = useConfirm();
  const [q, setQ] = React.useState(params.q);
  const [sel, setSel] = React.useState<string[]>([]);
  const [, startTransition] = React.useTransition();

  const go = React.useCallback(
    (patch: Partial<Record<keyof QuestionListParams, string | number | boolean | undefined>>) => {
      const next = { ...params, ...patch } as Record<string, unknown>;
      if (!("page" in patch)) next.page = 1;
      const sp = new URLSearchParams();
      if (next.q) sp.set("q", String(next.q));
      if (next.tag) sp.set("tag", String(next.tag));
      if (next.hsk) sp.set("hsk", String(next.hsk));
      if (next.starred) sp.set("starred", "1");
      if (next.sort && next.sort !== "newest") sp.set("sort", String(next.sort));
      if (Number(next.page) > 1) sp.set("page", String(next.page));
      if (next.size && Number(next.size) !== 10) sp.set("size", String(next.size));
      startTransition(() => router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false }));
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
    router.refresh();
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
    setSel([]);
    router.refresh();
  }
  async function toggleStar(id: string, on: boolean) {
    const r = await setStarredAction(id, on);
    if (!r.ok) return void toast.error(r.message);
    router.refresh();
  }

  const chip = (on: boolean) =>
    cn(
      "inline-flex min-h-10 items-center gap-1.5 rounded-[12px] border px-3.5 text-[14.5px] font-semibold outline-none focus-visible:shadow-[var(--focus-ring)]",
      on ? "border-blue-600 bg-blue-50 text-blue-700" : "border-border bg-white text-navy-900 hover:bg-blue-50",
    );
  const pageIds = data.items.map((x) => x.id);
  const allOn = pageIds.length > 0 && pageIds.every((id) => sel.includes(id));
  const noFilter = !params.q && !params.tag && !params.hsk && !params.starred;

  return (
    <div className="flex flex-col gap-4">
      <FeatureHero
        id="sp-title"
        title={t("speaking.title")}
        description={t("speaking.subtitle")}
        actions={
          <Link href="/speaking/new" className={heroPrimary}>
            <Plus aria-hidden="true" />
            {t("speaking.create")}
          </Link>
        }
      />

      <section
        aria-label={t("speaking.listLabel")}
        className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card md:p-5"
      >
        <nav aria-label={t("speaking.filterLabel")} className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={noFilter}
            onClick={() => go({ tag: "", hsk: undefined, starred: undefined })}
            className={chip(noFilter)}
          >
            {t("speaking.all")} <span className="text-[13px] opacity-70">{data.all}</span>
          </button>
          {data.hskCounts
            .filter((h) => h.count > 0)
            .map((h) => (
              <button
                key={h.hsk}
                type="button"
                aria-pressed={params.hsk === h.hsk}
                onClick={() => go({ hsk: params.hsk === h.hsk ? undefined : h.hsk })}
                className={chip(params.hsk === h.hsk)}
              >
                HSK{h.hsk} <span className="text-[13px] opacity-70">{h.count}</span>
              </button>
            ))}
          {data.tags.map((tg) => {
            const on = params.tag.toLowerCase() === tg.name.toLowerCase();
            return (
              <button
                key={tg.name}
                type="button"
                aria-pressed={on}
                onClick={() => go({ tag: on ? "" : tg.name })}
                className={chip(on)}
              >
                {tg.name} <span className="text-[13px] opacity-70">{tg.count}</span>
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={!!params.starred}
            onClick={() => go({ starred: params.starred ? undefined : true })}
            className={chip(!!params.starred)}
          >
            <Star className={cn("size-4", params.starred && "fill-amber text-amber")} aria-hidden="true" />
            {t("speaking.starredOnly")}
          </button>
        </nav>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_150px]">
          <label className="relative block">
            <span className="sr-only">{t("speaking.searchLabel")}</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-text-3" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("speaking.searchPlaceholder")}
              className="h-12 w-full rounded-[14px] border border-border bg-white pr-3 pl-11 text-[15px] outline-none focus:border-blue-600"
            />
          </label>
          <label>
            <span className="sr-only">{t("speaking.sortLabel")}</span>
            <select
              value={params.sort}
              onChange={(e) => go({ sort: e.target.value })}
              className="h-12 w-full rounded-[14px] border border-border bg-white px-3 text-[15px] font-semibold text-navy-900"
            >
              {(["newest", "oldest", "az"] as const).map((s) => (
                <option key={s} value={s}>
                  {t(`speaking.sorts.${s}`)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">{t("speaking.pageSize")}</span>
            <select
              value={params.size}
              onChange={(e) => go({ size: Number(e.target.value) })}
              className="h-12 w-full rounded-[14px] border border-border bg-white px-3 text-[15px] font-semibold text-navy-900"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {t("speaking.count", { count: n })}
                </option>
              ))}
            </select>
          </label>
        </div>

        {data.items.length ? (
          <>
            <div className="flex flex-wrap items-center gap-3 px-1">
              <label className="inline-flex items-center gap-2 text-[14.5px] font-semibold text-navy-900">
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
              <span className="text-[14px] text-text-2">{t("speaking.count", { count: data.total })}</span>
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
            <ol className="flex flex-col divide-y divide-border overflow-hidden rounded-[16px] border border-border">
              {data.items.map((x) => {
                const on = sel.includes(x.id);
                return (
                  <li
                    key={x.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 md:px-4",
                      on ? "bg-blue-50/70" : "bg-white hover:bg-[#F7FAFE]",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(e) => setSel((s) => (e.target.checked ? [...s, x.id] : s.filter((v) => v !== x.id)))}
                      aria-label={t("speaking.selectN", { zh: x.zh })}
                      className="size-[18px] shrink-0 accent-blue-600"
                    />
                    <span className="w-7 shrink-0 text-center text-[15px] font-semibold text-text-2 tabular-nums">
                      {x.no}
                    </span>
                    <Link
                      href={`/speaking/${x.id}`}
                      aria-label={t("speaking.practiceN", { zh: x.zh })}
                      className="min-w-0 flex-1 rounded-[8px] outline-none focus-visible:shadow-[var(--focus-ring)]"
                    >
                      <span lang="zh" className="block kai-bold text-[18px] text-navy-900 md:text-[19px]">
                        {x.zh}
                      </span>
                      {x.meaning ? <span className="block truncate text-[13.5px] text-text-2">{x.meaning}</span> : null}
                    </Link>
                    <span className="hidden flex-wrap justify-end gap-1.5 sm:flex">
                      {x.hsk ? (
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold"
                          style={tagColors("HSK")}
                        >
                          HSK{x.hsk}
                        </span>
                      ) : null}
                      {x.tags.slice(0, 2).map((tg) => (
                        <span
                          key={tg}
                          className="rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold"
                          style={tagColors(tg)}
                        >
                          {tg}
                        </span>
                      ))}
                    </span>
                    <span className="flex shrink-0 items-center gap-0.5">
                      <SpeakButton text={x.zh} label={t("speaking.listen")} />
                      <button
                        type="button"
                        onClick={() => toggleStar(x.id, !x.starred)}
                        aria-pressed={x.starred}
                        aria-label={x.starred ? t("speaking.unstar") : t("speaking.star")}
                        title={x.starred ? t("speaking.unstar") : t("speaking.star")}
                        className="inline-flex size-9 items-center justify-center rounded-full text-text-2 hover:bg-amber-50"
                      >
                        <Star className={cn("size-[18px]", x.starred && "fill-amber text-amber")} />
                      </button>
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
              <nav aria-label={t("speaking.listLabel")} className="flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  disabled={data.page <= 1}
                  onClick={() => go({ page: data.page - 1 })}
                  aria-label={t("speaking.prevPage")}
                  className="inline-flex size-10 items-center justify-center rounded-[10px] border border-border bg-white disabled:opacity-40"
                >
                  <ChevronLeft className="size-5" />
                </button>
                {Array.from({ length: data.pages }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === data.pages || Math.abs(n - data.page) <= 2)
                  .map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => go({ page: n })}
                      aria-label={t("speaking.pageN", { n })}
                      aria-current={n === data.page ? "page" : undefined}
                      className={cn(
                        "inline-flex size-10 items-center justify-center rounded-[10px] text-[15px] font-semibold",
                        n === data.page ? "bg-blue-600 text-white" : "text-navy-900 hover:bg-blue-50",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                <button
                  type="button"
                  disabled={data.page >= data.pages}
                  onClick={() => go({ page: data.page + 1 })}
                  aria-label={t("speaking.nextPage")}
                  className="inline-flex size-10 items-center justify-center rounded-[10px] border border-border bg-white disabled:opacity-40"
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
      </section>
      {confirmNode}
    </div>
  );
}
