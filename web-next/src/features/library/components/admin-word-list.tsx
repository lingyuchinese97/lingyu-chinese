"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Eye, EyeOff, Library, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";
import { Pager } from "@/components/ui/list-controls";
import { useConfirm } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toaster";
import { useIntlTag, useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import type { AdminLibListParams } from "../schema";
import type { AdminLibWord } from "../service";
import { deleteWordAction, setWordStatusAction } from "../actions";

type Data = {
  items: AdminLibWord[];
  total: number;
  page: number;
  pageCount: number;
  counts: { all: number; draft: number; public: number };
};

/** Admin: danh sách từ trong Thư viện LingYu (nháp + public), tìm, lọc trạng thái, public / về nháp, xoá. */
export function AdminWordList({ data, params }: { data: Data; params: AdminLibListParams }) {
  const t = useT();
  const intl = useIntlTag();
  const router = useRouter();
  const pathname = usePathname();
  const [confirm, confirmNode] = useConfirm();
  const [pending, startTransition] = React.useTransition();
  const [q, setQ] = React.useState(params.q);
  const go = React.useCallback(
    (patch: Partial<AdminLibListParams>) => {
      const n = { ...params, ...patch };
      const sp = new URLSearchParams();
      if (n.q.trim()) sp.set("q", n.q.trim());
      if (n.status !== "all") sp.set("status", n.status);
      if (n.page > 1) sp.set("page", String(n.page));
      startTransition(() => router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false }));
    },
    [params, pathname, router],
  );
  React.useEffect(() => {
    if (q === params.q) return;
    const id = setTimeout(() => go({ q, page: 1 }), 300);
    return () => clearTimeout(id);
  }, [q, params.q, go]);
  const refresh = () => startTransition(() => router.refresh());

  async function toggle(w: AdminLibWord) {
    const r = await setWordStatusAction(w.id, w.status !== "public");
    if (!r.ok) return void toast.error(t.maybe(r.message));
    toast.success(
      w.status === "public" ? t("library.unpublished", { word: w.hanzi }) : t("library.published", { word: w.hanzi }),
    );
    refresh();
  }
  async function remove(w: AdminLibWord) {
    const ok = await confirm({
      title: t("library.deleteTitle"),
      message: t("library.deleteMessage", { word: w.hanzi }),
      confirmLabel: t("common.delete"),
      danger: true,
    });
    if (!ok) return;
    const r = await deleteWordAction(w.id);
    if (!r.ok) return void toast.error(t.maybe(r.message));
    toast.success(t("library.deleted", { word: w.hanzi }));
    refresh();
  }

  const chips = [
    { key: "all" as const, label: t("library.statusAll", { count: data.counts.all }) },
    { key: "draft" as const, label: t("library.statusDraft", { count: data.counts.draft }) },
    { key: "public" as const, label: t("library.statusPublic", { count: data.counts.public }) },
  ];

  return (
    <>
      <section aria-labelledby="al-title" className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <span className="hidden size-14 shrink-0 items-center justify-center rounded-[18px] bg-blue-50 text-blue-600 sm:flex">
          <Library className="size-7" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 id="al-title" className="text-[26px] font-extrabold tracking-tight text-navy-900 md:text-[30px]">
            {t("library.adminTitle")}
          </h1>
          <p className="mt-0.5 text-[15px] text-text-2">{t("library.adminSub")}</p>
        </div>
        <Button asChild variant="solid" className="shrink-0 max-sm:w-full">
          <Link href="/admin/library/new">
            <Plus />
            {t("library.addWord")}
          </Link>
        </Button>
      </section>

      <section className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-border bg-white p-4 shadow-card md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">{t("library.searchLabel")}</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-text-3" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("library.search")}
              autoComplete="off"
              className={cn(inputClass, "pl-11")}
            />
          </label>
          <div role="group" aria-label={t("library.statusFilter")} className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                aria-pressed={params.status === c.key}
                onClick={() => go({ status: c.key, page: 1 })}
                className={cn(
                  "min-h-10 rounded-[12px] px-3.5 text-[14px] font-semibold",
                  params.status === c.key ? "bg-blue-600 text-white" : "bg-[#EEF5FC] text-text-2 hover:bg-blue-100",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div aria-busy={pending || undefined} className={cn("transition-opacity", pending && "opacity-60")}>
          {data.total === 0 ? (
            <p className="rounded-[14px] border border-dashed border-border px-4 py-10 text-center text-text-2">
              {t("library.empty")}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-[14px] border border-border">
              <table className="w-full min-w-[760px] border-collapse text-[15px]">
                <thead>
                  <tr className="bg-[#F3F8FE] text-left text-[14px] text-text-2 [&>th]:px-3 [&>th]:py-3 [&>th]:font-semibold">
                    <th>{t("library.colWord")}</th>
                    <th>{t("library.colMeaning")}</th>
                    <th>{t("library.colHsk")}</th>
                    <th>{t("library.colStatus")}</th>
                    <th>{t("library.colUpdated")}</th>
                    <th className="w-[1%]">{t("library.colActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((w) => (
                    <tr key={w.id} className="border-t border-[#EDF3F9] [&>td]:px-3 [&>td]:py-2.5">
                      <td>
                        <span className="mr-2 hanzi text-[22px] font-bold text-[#E0302F]" lang="zh">
                          {w.hanzi}
                        </span>
                        <span className="pinyin">{w.pinyin}</span>
                      </td>
                      <td className="max-w-[260px]">{w.meaningVi || <span className="text-text-3">—</span>}</td>
                      <td>{w.hskLevel ? `HSK ${w.hskLevel}` : "—"}</td>
                      <td>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[13px] font-semibold",
                            w.status === "public" ? "bg-green-50 text-green-700" : "bg-[#FFF3D6] text-[#8A5A00]",
                          )}
                        >
                          {w.status === "public" ? t("library.public") : t("library.draft")}
                        </span>
                      </td>
                      <td className="text-[14px] whitespace-nowrap text-text-2">
                        {new Date(w.updatedAt).toLocaleDateString(intl)}
                      </td>
                      <td className="whitespace-nowrap">
                        <Link
                          href={`/admin/library/${w.id}`}
                          aria-label={t("library.edit", { word: w.hanzi })}
                          className="inline-flex size-9 items-center justify-center rounded-full text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil className="size-[18px]" />
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => toggle(w)}>
                          {w.status === "public" ? <EyeOff /> : <Eye />}
                          {w.status === "public" ? t("library.unpublish") : t("library.publish")}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red" onClick={() => remove(w)}>
                          <Trash2 />
                          {t("library.delete")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13.5px] text-text-2">{t("library.total", { count: data.total })}</span>
          <Pager page={data.page} count={data.pageCount} onGo={(page) => go({ page })} />
        </div>
      </section>
      {confirmNode}
    </>
  );
}
