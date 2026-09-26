"use client";
import { useT } from "@/i18n/client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CheckCircle2,
  Database,
  MoreHorizontal,
  Pencil,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";
import { StatusBadge, Tag, checkboxClass } from "@/components/ui/badges";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { BulkButton, Pager } from "@/components/ui/list-controls";
import { useConfirm } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toaster";
import { LeafDecor } from "@/components/layout/icons";
import { SpeakButton } from "@/components/speak-button";
import { cn } from "@/lib/utils";
import { FAV_TAG, type SentenceListParams } from "../schema";
import type { SentenceItem, SentenceList } from "../service";
import {
  deleteSentencesAction,
  importSampleSentencesAction,
  setSentenceStatusAction,
  startSentenceReviewAction,
  toggleSentenceFavoriteAction,
} from "../actions";

const iconBtn =
  "inline-flex size-10 items-center justify-center rounded-full text-blue-600 outline-none hover:bg-blue-50 focus-visible:shadow-[var(--focus-ring)] md:size-9 [&_svg]:size-[22px]";

export function SentenceListView({ data, params }: { data: SentenceList; params: SentenceListParams }) {
  const router = useRouter();
  const t = useT();
  const pathname = usePathname();
  const [pending, startTransition] = React.useTransition();
  const [confirm, confirmNode] = useConfirm();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [q, setQ] = React.useState(params.q);
  const [favs, setFavs] = React.useState<Record<string, boolean>>({});

  const go = React.useCallback(
    (patch: Partial<SentenceListParams>) => {
      const next = { ...params, ...patch };
      const sp = new URLSearchParams();
      if (next.q.trim()) sp.set("q", next.q.trim());
      if (next.tag) sp.set("tag", next.tag);
      if (next.page > 1) sp.set("page", String(next.page));
      setSelected(new Set());
      startTransition(() => router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false }));
    },
    [params, pathname, router],
  );
  React.useEffect(() => {
    if (q === params.q) return;
    const t = setTimeout(() => go({ q, page: 1 }), 300);
    return () => clearTimeout(t);
  }, [q, params.q, go]);

  const refresh = () => startTransition(() => router.refresh());
  const ids = data.items.map((s) => s.id);
  const onPage = ids.filter((id) => selected.has(id)).length;
  const allOnPage = ids.length > 0 && onPage === ids.length;
  const toggle = (id: string, on: boolean) =>
    setSelected((s) => {
      const n = new Set(s);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });
  const toggleAll = (on: boolean) =>
    setSelected((s) => {
      const n = new Set(s);
      for (const id of ids) {
        if (on) n.add(id);
        else n.delete(id);
      }
      return n;
    });

  async function doDelete(list: string[], label: string) {
    const ok = await confirm({
      title: t("sentences.deleteTitle"),
      message: t("sentences.deleteMessage", { what: label }),
      confirmLabel: t("common.delete"),
      danger: true,
    });
    if (!ok) return;
    const r = await deleteSentencesAction(list);
    if (!r.ok) return void toast.error(r.message);
    toast.success(t("sentences.deleted", { count: r.data }));
    setSelected((s) => new Set([...s].filter((id) => !list.includes(id))));
    refresh();
  }
  async function doStatus(list: string[], status: "learned" | "review") {
    const r = await setSentenceStatusAction(list, status);
    if (!r.ok) return void toast.error(r.message);
    toast.success(t("sentences.statusChanged", { count: r.data, status: t(`ui.${status}`) }));
    refresh();
  }
  async function doReview(list: string[]) {
    const r = await startSentenceReviewAction({
      direction: "vi-zh",
      count: list.length,
      tags: [],
      showPinyin: false,
      showHint: false,
      sentenceIds: list,
      label: t("sentences.selectedSentences", { count: list.length }),
    });
    if (!r.ok) return void toast.error(r.message);
    router.push("/sentences/review/session");
  }
  async function doFav(s: SentenceItem) {
    const cur = favs[s.id] ?? s.isFavorite;
    setFavs((f) => ({ ...f, [s.id]: !cur }));
    const r = await toggleSentenceFavoriteAction(s.id);
    if (!r.ok) {
      setFavs((f) => ({ ...f, [s.id]: cur }));
      toast.error(r.message);
    }
  }

  const rowMenu = (s: SentenceItem) => (
    <Menu>
      <MenuTrigger asChild>
        <button type="button" className={iconBtn} aria-label={t("sentences.moreActions", { text: s.chinese })}>
          <MoreHorizontal />
        </button>
      </MenuTrigger>
      <MenuContent className="w-[220px]">
        <MenuItem onSelect={() => doReview([s.id])}>
          <PlayCircle />
          {t("sentences.reviewThis")}
        </MenuItem>
        <MenuItem onSelect={() => router.push(`/sentences/${s.id}/edit`)}>
          <Pencil />
          {t("sentences.edit")}
        </MenuItem>
        <MenuItem onSelect={() => doFav(s)}>
          <Star />
          {(favs[s.id] ?? s.isFavorite) ? t("sentences.unfavorite") : t("sentences.favorite")}
        </MenuItem>
        <MenuItem onSelect={() => doStatus([s.id], s.status === "learned" ? "review" : "learned")}>
          {s.status === "learned" ? <RefreshCw /> : <CheckCircle2 />}
          {s.status === "learned" ? t("sentences.toReview") : t("sentences.toLearned")}
        </MenuItem>
        <MenuSeparator />
        <MenuItem danger onSelect={() => doDelete([s.id], `“${s.chinese}”`)}>
          <Trash2 />
          {t("sentences.deleteSentence")}
        </MenuItem>
      </MenuContent>
    </Menu>
  );
  const star = (s: SentenceItem) => {
    const on = favs[s.id] ?? s.isFavorite;
    return on ? <Star className="size-4 shrink-0 fill-amber text-amber" aria-label={t("sentences.favorite")} /> : null;
  };

  return (
    <>
      <section
        aria-labelledby="sl-title"
        className="relative flex flex-col gap-4 overflow-hidden rounded-[22px] border border-[#DDEBF8] bg-[linear-gradient(100deg,#F4F9FF_0%,#E9F3FE_60%,#E1EFFD_100%)] px-[18px] py-[22px] md:flex-row md:items-center md:px-8 md:py-7"
      >
        <div className="min-w-0 flex-1">
          <h1
            id="sl-title"
            className="flex items-center gap-3 text-[26px] font-extrabold tracking-tight text-text md:text-[34px]"
          >
            {t("sentences.title")}
            <LeafDecor className="w-10" />
          </h1>
          <p className="mt-1.5 text-[15px] text-text-2 md:text-[17px]">{t("sentences.subtitle")}</p>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2.5 max-md:w-full md:flex">
          <Button asChild variant="secondary">
            <Link href="/sentences/review/setup">
              <PlayCircle />
              {t("sentences.startReview")}
            </Link>
          </Button>
          <Button asChild variant="solid">
            <Link href="/sentences/new">
              <Plus />
              {t("sentences.add")}
            </Link>
          </Button>
        </div>
      </section>

      <section
        aria-label={t("sentences.list")}
        className="flex flex-col gap-[18px] rounded-[var(--radius-xl)] border border-border bg-white/92 p-4 shadow-card md:p-[22px]"
      >
        <label className="relative block">
          <span className="sr-only">{t("sentences.searchLabel")}</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-text-3" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("sentences.searchPlaceholder")}
            autoComplete="off"
            className={cn(inputClass, "pl-11")}
          />
        </label>

        {data.totalAll > 0 ? (
          <div
            role="group"
            aria-label={t("sentences.filterTag")}
            className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
          >
            <Chip on={!params.tag} onClick={() => go({ tag: "", page: 1 })}>
              {t("sentences.allCount", { count: data.totalAll })}
            </Chip>
            {data.tags.map((t) => (
              <Chip
                key={t.id}
                on={t.name.toLowerCase() === params.tag.toLowerCase()}
                onClick={() => go({ tag: t.name, page: 1 })}
              >
                {t.name} ({t.count})
              </Chip>
            ))}
            <Chip on={params.tag === FAV_TAG} onClick={() => go({ tag: FAV_TAG, page: 1 })}>
              <Star className="size-4" aria-hidden="true" />
              {t("sentences.favCount", { count: data.favCount })}
            </Chip>
          </div>
        ) : null}

        <div aria-live="polite" className={cn("transition-opacity", pending && "opacity-60")}>
          {data.totalAll === 0 ? (
            <EmptyAll onSampled={refresh} />
          ) : data.total === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Search className="size-7" />
              </span>
              <h3 className="text-xl font-bold text-navy">{t("sentences.noMatch")}</h3>
              <Button
                variant="secondary"
                onClick={() => {
                  setQ("");
                  go({ q: "", tag: "", page: 1 });
                }}
              >
                <X />
                {t("sentences.clearFilters")}
              </Button>
            </div>
          ) : (
            <>
              <p className="mb-2 text-sm text-text-2">{t("sentences.total", { count: data.total })}</p>
              <div
                role="toolbar"
                aria-label={t("sentences.bulkToolbar")}
                className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-md border border-border bg-bg px-3 py-2.5"
              >
                <label className="inline-flex min-w-[150px] cursor-pointer items-center gap-2.5 font-semibold text-text">
                  <input
                    type="checkbox"
                    className={checkboxClass}
                    checked={allOnPage}
                    ref={(el) => {
                      if (el) el.indeterminate = onPage > 0 && !allOnPage;
                    }}
                    onChange={(e) => toggleAll(e.target.checked)}
                    aria-label={t("sentences.selectAllOnPage")}
                  />
                  <span aria-live="polite">
                    {selected.size
                      ? t("sentences.selectedCount", { count: selected.size })
                      : t("sentences.noneSelected")}
                  </span>
                </label>
                <div className="grid w-full grid-cols-2 gap-2 md:ml-auto md:flex md:w-auto">
                  <BulkButton
                    disabled={!selected.size}
                    hint={t("sentences.hintReview")}
                    onClick={() => doReview([...selected])}
                  >
                    <PlayCircle />
                    {t("sentences.review")}
                  </BulkButton>
                  <BulkButton
                    disabled={!selected.size}
                    hint={t("sentences.hintMark")}
                    onClick={() => doStatus([...selected], "learned")}
                  >
                    <CheckCircle2 />
                    {t("ui.learned")}
                  </BulkButton>
                  <BulkButton
                    disabled={!selected.size}
                    hint={t("sentences.hintMark")}
                    onClick={() => doStatus([...selected], "review")}
                  >
                    <RefreshCw />
                    {t("ui.review")}
                  </BulkButton>
                  <BulkButton
                    danger
                    disabled={!selected.size}
                    hint={t("sentences.hintDelete")}
                    onClick={() => doDelete([...selected], t("sentences.selectedSentences", { count: selected.size }))}
                  >
                    <Trash2 />
                    {t("sentences.delete")}
                  </BulkButton>
                </div>
              </div>

              {/* Desktop: bảng */}
              <div className="hidden overflow-x-auto rounded-md border border-border md:block">
                <table className="w-full min-w-[820px] border-collapse text-[15.5px]">
                  <caption className="sr-only">
                    {t("sentences.caption", { page: data.page, count: data.pageCount })}
                  </caption>
                  <thead>
                    <tr className="bg-[#F3F8FE] text-left [&>th]:px-3 [&>th]:py-3.5 [&>th]:font-semibold">
                      <th className="w-[52px] text-center">
                        <span className="sr-only">{t("sentences.colSelect")}</span>
                      </th>
                      <th className="w-11">#</th>
                      <th>{t("sentences.colChinese")}</th>
                      <th>{t("sentences.colVietnamese")}</th>
                      <th>{t("sentences.colTag")}</th>
                      <th>{t("sentences.colStatus")}</th>
                      <th className="w-[1%]">
                        <span className="sr-only">{t("sentences.colActions")}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((s, i) => (
                      <tr
                        key={s.id}
                        className={cn(
                          "border-t border-[#EDF3F9] hover:bg-[#F9FCFF] [&>td]:px-3 [&>td]:py-2.5 [&>td]:align-middle",
                          selected.has(s.id) && "bg-[#F1F8FF] hover:bg-[#F1F8FF]",
                        )}
                      >
                        <td className="text-center">
                          <input
                            type="checkbox"
                            className={checkboxClass}
                            checked={selected.has(s.id)}
                            onChange={(e) => toggle(s.id, e.target.checked)}
                            aria-label={t("sentences.selectSentence", { text: s.chinese })}
                          />
                        </td>
                        <td className="text-text-2 tabular-nums">{(data.page - 1) * data.pageSize + i + 1}</td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <span className="hanzi text-lg text-text" lang="zh">
                              {s.chinese}
                            </span>
                            <SpeakButton text={s.chinese} className="size-8" />
                            {star(s)}
                          </div>
                          {s.pinyin ? <div className="text-[13.5px] pinyin">{s.pinyin}</div> : null}
                        </td>
                        <td className="text-text">{s.vietnamese}</td>
                        <td>
                          <div className="flex max-w-[220px] flex-wrap gap-1.5">
                            {s.tags.map((t) => (
                              <Tag key={t} name={t} />
                            ))}
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={s.status} />
                        </td>
                        <td>{rowMenu(s)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Điện thoại: thẻ */}
              <ul aria-label={t("sentences.list")} className="flex flex-col gap-3 md:hidden">
                {data.items.map((s) => (
                  <li
                    key={s.id}
                    className={cn(
                      "flex gap-3 rounded-[14px] border border-border bg-white p-3.5",
                      selected.has(s.id) && "border-[#A9D3F8] bg-[#F1F8FF]",
                    )}
                  >
                    <input
                      type="checkbox"
                      className={cn(checkboxClass, "mt-1.5")}
                      checked={selected.has(s.id)}
                      onChange={(e) => toggle(s.id, e.target.checked)}
                      aria-label={t("sentences.selectSentence", { text: s.chinese })}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="hanzi text-lg text-text" lang="zh">
                          {s.chinese}
                        </span>
                        <SpeakButton text={s.chinese} className="size-8" />
                        {star(s)}
                      </div>
                      {s.pinyin ? <div className="text-[13.5px] pinyin">{s.pinyin}</div> : null}
                      <div className="mt-1 text-[15px] text-text">{s.vietnamese}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {s.tags.map((t) => (
                          <Tag key={t} name={t} />
                        ))}
                        <StatusBadge status={s.status} />
                      </div>
                    </div>
                    <div className="-mt-1 -mr-1.5">{rowMenu(s)}</div>
                  </li>
                ))}
              </ul>

              <div className="mt-4">
                <Pager page={data.page} count={data.pageCount} onGo={(p) => go({ page: p })} />
              </div>
            </>
          )}
        </div>
      </section>
      {confirmNode}
    </>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-[10px] border-[1.5px] px-4 text-[14.5px] font-medium whitespace-nowrap transition-colors",
        on
          ? "border-blue-600 bg-blue-600 font-semibold text-white"
          : "border-transparent bg-[#EEF5FC] text-text-2 hover:bg-blue-100",
      )}
    >
      {children}
    </button>
  );
}

function EmptyAll({ onSampled }: { onSampled: () => void }) {
  const t = useT();
  const [busy, setBusy] = React.useState(false);
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
      <Image src="/brand/lingyu-mascot.png" alt="" width={180} height={120} className="h-auto w-[180px]" />
      <h3 className="text-xl font-bold text-navy">{t("sentences.emptyTitle")}</h3>
      <p className="max-w-[420px] text-text-2">{t("sentences.emptyDesc")}</p>
      <div className="flex w-full max-w-md flex-col gap-2.5 sm:w-auto sm:flex-row">
        <Button asChild variant="solid">
          <Link href="/sentences/new">
            <Plus />
            {t("sentences.add")}
          </Link>
        </Button>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const r = await importSampleSentencesAction();
            setBusy(false);
            if (!r.ok) return void toast.error(r.message);
            toast.success(t("sentences.sampleAdded", { count: r.data }));
            onSampled();
          }}
        >
          <Database />
          {busy ? t("vocab.sampleAdding") : t("vocab.useSample")}
        </Button>
      </div>
    </div>
  );
}
