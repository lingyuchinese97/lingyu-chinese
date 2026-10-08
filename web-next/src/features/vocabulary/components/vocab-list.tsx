"use client";
import { WordDetailDialog } from "./word-detail-dialog";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpDown,
  Check,
  CheckCircle2,
  SlidersHorizontal,
  Library,
  Eye,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Star,
  Tag as TagIcon,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";
import { StatusBadge, Tag, checkboxClass } from "@/components/ui/badges";
import { Dialog, DialogActions, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { useConfirm } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { radicalByNum, radicalLabel } from "@/lib/radicals";
import { PAGE_SIZES, SORTS, type ListParams } from "../schema";
import { useLocale, useT } from "@/i18n/client";
import type { TagCount, VocabItem, VocabList } from "../service";
import { deleteTagAction, deleteVocabAction, setStatusAction, toggleFavoriteAction } from "../actions";
import { startCustomAction } from "@/features/review/actions";
import { AddTagDialog } from "./add-tag-dialog";
import { TagChips, TagNameDialog } from "./tag-cards";
import { SpeakButton } from "@/components/speak-button";
import { BulkButton, Pager } from "@/components/ui/list-controls";
import type { ReceivedVocabShare } from "../share-service";
import { FeatureHero, heroPrimary } from "@/components/feature-hero";
import {
  AcceptVocabDialog,
  rejectVocabWithConfirm,
  ShareVocabDialog,
  VocabInvites,
  type ShareWord,
} from "./share-dialogs";

/** Ghi chú dài quá 10 ký tự → hiện "…" + nút con mắt để xem đầy đủ (như bản cũ). */
const NOTE_PREVIEW = 10;
const VIEW_KEY = "lingyu.vocab.view";
/** Kiểu hiển thị trên máy tính (danh sách / lưới), nhớ theo trình duyệt. */
const viewListeners = new Set<() => void>();
const viewStore = {
  get(): "list" | "grid" {
    try {
      return localStorage.getItem(VIEW_KEY) === "grid" ? "grid" : "list";
    } catch {
      return "list";
    }
  },
  set(m: "list" | "grid") {
    try {
      localStorage.setItem(VIEW_KEY, m);
    } catch {
      /* trình duyệt chặn lưu trữ */
    }
    viewListeners.forEach((f) => f());
  },
  subscribe(f: () => void) {
    viewListeners.add(f);
    return () => void viewListeners.delete(f);
  },
};
const shortNote = (note: string) => {
  const chars = Array.from(note.trim());
  return chars.length > NOTE_PREVIEW ? chars.slice(0, NOTE_PREVIEW).join("").trimEnd() + "…" : chars.join("");
};
const isLongNote = (note: string) => Array.from(note.trim()).length > NOTE_PREVIEW;

export function VocabListView({
  data,
  params,
  received,
}: {
  data: VocabList;
  params: ListParams;
  received: ReceivedVocabShare[];
}) {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const pathname = usePathname();
  const [pending, startTransition] = React.useTransition();
  const [confirm, confirmNode] = useConfirm();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [q, setQ] = React.useState(params.q);
  const [noteOf, setNoteOf] = React.useState<VocabItem | null>(null);
  const [detailOf, setDetailOf] = React.useState<VocabItem | null>(null);
  const [tagFor, setTagFor] = React.useState<string[] | null>(null);
  const [favs, setFavs] = React.useState<Record<string, boolean>>({});
  const listTop = React.useRef<HTMLDivElement>(null);
  const [shareWords, setShareWords] = React.useState<ShareWord[] | null>(null);
  const [invite, setInvite] = React.useState<ReceivedVocabShare | null>(null);
  const [tagName, setTagName] = React.useState<"new" | TagCount | null>(null);
  // Kiểu hiển thị trên máy tính (danh sách / lưới), nhớ theo trình duyệt.
  const view = React.useSyncExternalStore(viewStore.subscribe, viewStore.get, () => "list" as const);
  const changeView = viewStore.set;
  // Từ đã thấy ở các trang (để hộp thoại Chia sẻ hiện đúng các từ đã chọn dù chọn qua nhiều trang).
  const seen = React.useRef(new Map<string, VocabItem>());
  React.useEffect(() => {
    for (const v of data.items) seen.current.set(v.id, v);
  }, [data.items]);

  const go = React.useCallback(
    (patch: Partial<ListParams>, opts: { keepSelection?: boolean } = {}) => {
      const next = { ...params, ...patch };
      const sp = new URLSearchParams();
      if (next.q.trim()) sp.set("q", next.q.trim());
      if (next.tag) sp.set("tag", next.tag);
      if (next.radical) sp.set("radical", String(next.radical));
      if (next.sort !== "newest") sp.set("sort", next.sort);
      if (next.page > 1) sp.set("page", String(next.page));
      if (next.hsk) sp.set("hsk", next.hsk);
      if (next.status) sp.set("status", next.status);
      if (next.fav) sp.set("fav", "1");
      if (next.size !== 8) sp.set("size", String(next.size));
      if (!opts.keepSelection) setSelected(new Set());
      startTransition(() => router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false }));
    },
    [params, pathname, router],
  );

  // Tìm kiếm: đợi 300ms sau lần gõ cuối.
  React.useEffect(() => {
    if (q === params.q) return;
    const t = setTimeout(() => go({ q, page: 1 }), 300);
    return () => clearTimeout(t);
  }, [q, params.q, go]);

  const refresh = () => startTransition(() => router.refresh());
  const ids = data.items.map((v) => v.id);
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

  async function doDelete(delIds: string[], label: string) {
    const ok = await confirm({
      title: t("vocab.deleteTitle"),
      message: t("vocab.deleteMessage", { what: label }),
      confirmLabel: t("common.delete"),
      danger: true,
    });
    if (!ok) return;
    const r = await deleteVocabAction(delIds);
    if (!r.ok) return void toast.error(r.message || t("vocab.deleteFailed"));
    setSelected((s) => new Set([...s].filter((id) => !delIds.includes(id))));
    toast.success(t("vocab.deleted", { count: r.data.removed }));
    refresh();
  }

  async function doDeleteTag(g: TagCount) {
    const ok = await confirm({
      title: t("vocab.deleteTag"),
      message: t("vocab.deleteTagMessage", { name: g.name, count: g.count }),
      confirmLabel: t("common.delete"),
      danger: true,
    });
    if (!ok) return;
    const r = await deleteTagAction(g.id);
    if (!r.ok) return void toast.error(r.message);
    toast.success(t("vocab.tagDeleted", { name: g.name }));
    if (params.tag.toLowerCase() === g.name.toLowerCase()) go({ tag: "", page: 1 });
    else refresh();
  }

  async function doStatus(v: VocabItem) {
    const next = v.status === "learned" ? "review" : "learned";
    const r = await setStatusAction([v.id], next);
    if (!r.ok) return void toast.error(r.message);
    toast.success(t("vocab.statusChanged", { word: v.hanzi, status: t(`ui.${next}`) }));
    refresh();
  }

  async function doBulkReview() {
    const ids = [...selected];
    const r = await startCustomAction({
      tags: [],
      vocabIds: ids,
      count: ids.length,
      mode: "meaning",
      showImage: false,
      label: t("vocab.selectedWords", { count: ids.length }),
    });
    if (!r.ok) return void toast.error(r.message || t("vocab.reviewFailed"));
    router.push("/review/session");
  }

  const openShare = (list: string[]) =>
    setShareWords(
      list
        .map((id) => seen.current.get(id))
        .filter((v): v is VocabItem => !!v)
        .map((v) => ({
          id: v.id,
          hanzi: v.hanzi,
          pinyin: v.pinyin,
          meaningVi: v.meaningVi,
          note: v.note,
          tags: v.tags,
        })),
    );
  async function rejectInvite(s: ReceivedVocabShare) {
    if (await rejectVocabWithConfirm(confirm, s)) {
      setInvite(null);
      refresh();
    }
  }

  async function doBulkStatus(status: "learned" | "review") {
    const r = await setStatusAction([...selected], status);
    if (!r.ok) return void toast.error(r.message);
    toast.success(t("vocab.statusChangedMany", { count: r.data.updated, status: t(`ui.${status}`) }));
    refresh();
  }

  async function doFav(v: VocabItem) {
    const cur = favs[v.id] ?? v.isFavorite;
    setFavs((f) => ({ ...f, [v.id]: !cur }));
    const r = await toggleFavoriteAction(v.id);
    if (!r.ok) {
      setFavs((f) => ({ ...f, [v.id]: cur }));
      toast.error(r.message);
    }
  }

  const radical = params.radical ? radicalByNum(params.radical) : null;
  const rowMenu = (v: VocabItem) => (
    <Menu>
      <MenuTrigger asChild>
        <button type="button" className={iconBtn} aria-label={t("vocab.moreActions", { word: v.hanzi })}>
          <MoreHorizontal />
        </button>
      </MenuTrigger>
      <MenuContent className="w-[230px]">
        <MenuItem onSelect={() => doStatus(v)}>
          {v.status === "learned" ? <RefreshCw /> : <CheckCircle2 />}
          {v.status === "learned" ? t("vocab.toReview") : t("vocab.toLearned")}
        </MenuItem>
        <MenuItem onSelect={() => router.push(`/vocabulary/${v.id}/edit`)}>
          <Pencil />
          {t("vocab.edit")}
        </MenuItem>
        <MenuItem onSelect={() => setTagFor([v.id])}>
          <TagIcon />
          {t("vocab.addTag")}
        </MenuItem>
        <MenuItem onSelect={() => openShare([v.id])}>
          <Share2 />
          {t("vocab.shareAction")}
        </MenuItem>
        <MenuSeparator />
        <MenuItem danger onSelect={() => doDelete([v.id], `“${v.hanzi}”`)}>
          <Trash2 />
          {t("vocab.deleteWord")}
        </MenuItem>
      </MenuContent>
    </Menu>
  );
  const eye = (v: VocabItem) => (
    <button
      type="button"
      className={cn(iconBtn, "bg-[#EAF4FF] hover:bg-[#DCEBFF]")}
      onClick={() => setDetailOf(v)}
      aria-label={t("vocab.viewDetail", { word: v.hanzi })}
      title={t("vocab.viewDetail", { word: v.hanzi })}
    >
      <Eye />
    </button>
  );
  const star = (v: VocabItem) => {
    const on = favs[v.id] ?? v.isFavorite;
    return (
      <button
        type="button"
        className={iconBtn}
        onClick={() => doFav(v)}
        aria-pressed={on}
        aria-label={on ? t("vocab.unfavorite", { word: v.hanzi }) : t("vocab.favorite", { word: v.hanzi })}
      >
        <Star className={cn(on ? "fill-amber text-amber" : "text-text-3")} />
      </button>
    );
  };
  const note = (v: VocabItem) =>
    v.note ? (
      <span className="inline-flex items-center gap-1">
        <span className="text-text-2">{shortNote(v.note)}</span>
        {isLongNote(v.note) ? (
          <button
            type="button"
            className={cn(iconBtn, "size-8 [&_svg]:size-[18px]")}
            onClick={() => setNoteOf(v)}
            aria-label={t("vocab.fullNote", { word: v.hanzi })}
            title={t("vocab.seeMore")}
          >
            <Eye />
          </button>
        ) : null}
      </span>
    ) : (
      <span className="text-text-3">—</span>
    );

  return (
    <>
      <FeatureHero
        id="vl-title"
        title={t("vocab.myTitle", { count: data.totalAll })}
        description={t("vocab.mySub")}
        actions={
          <Link href="/vocabulary/new" className={heroPrimary}>
            <Plus aria-hidden="true" />
            {t("vocab.add")}
          </Link>
        }
      />

      <VocabInvites received={received} onOpen={setInvite} onReject={rejectInvite} />

      {/* Thanh tìm kiếm & lọc: khung riêng (theo thiết kế) — tìm · cấp HSK · sắp xếp · lọc · kiểu xem · tạo mới. */}
      <section
        aria-label={t("vocab.toolbarLabel")}
        className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-white/92 p-4 shadow-card md:px-[22px] md:py-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative block min-w-0 flex-[999_1_280px]">
            <span className="sr-only">{t("vocab.searchLabel")}</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-text-3" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={params.tag ? t("vocab.searchInTag", { tag: params.tag }) : t("vocab.searchPlaceholder")}
              autoComplete="off"
              className={cn(inputClass, "pl-11")}
            />
          </label>
          <div className="flex flex-[1_1_auto] flex-wrap items-center gap-3 max-md:w-full">
            <label className="min-w-0 flex-[1_1_140px] md:w-[150px] md:flex-none">
              <span className="sr-only">{t("vocab.hskFilter")}</span>
              <select
                value={params.hsk}
                onChange={(e) => go({ hsk: e.target.value as ListParams["hsk"], page: 1 })}
                className={cn(inputClass, "cursor-pointer")}
              >
                <option value="">{t("vocab.allHsk")}</option>
                {(["1", "2", "3", "4", "5", "6"] as const).map((k) => (
                  <option key={k} value={k}>
                    {`HSK ${k} (${data.hskCounts[k] ?? 0})`}
                  </option>
                ))}
                <option value="other">{`${t("vocab.hskOther")} (${data.hskCounts.other ?? 0})`}</option>
              </select>
            </label>
            <label className="min-w-0 flex-[1_1_160px] md:w-[180px] md:flex-none">
              <span className="sr-only">{t("vocab.sort")}</span>
              <select
                value={params.sort}
                onChange={(e) => go({ sort: e.target.value as ListParams["sort"], page: 1 }, { keepSelection: true })}
                className={cn(inputClass, "cursor-pointer")}
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {t(s.label)}
                  </option>
                ))}
              </select>
            </label>
            <Menu>
              <MenuTrigger asChild>
                <button
                  type="button"
                  aria-label={t("vocab.filter")}
                  title={t("vocab.filter")}
                  className={cn(
                    "relative inline-flex h-12 w-14 shrink-0 items-center justify-center rounded-md border-[1.5px] outline-none focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-[22px]",
                    params.status || params.fav
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-border bg-white text-blue-600 hover:bg-blue-50",
                  )}
                >
                  <SlidersHorizontal />
                  {params.status || params.fav ? (
                    <span className="absolute -top-1.5 -right-1.5 min-w-5 rounded-full bg-blue-600 px-1.5 text-[12px] leading-5 font-semibold text-white">
                      {(params.status ? 1 : 0) + (params.fav ? 1 : 0)}
                    </span>
                  ) : null}
                </button>
              </MenuTrigger>
              <MenuContent align="end" className="w-[230px]">
                {(["", "learned", "review"] as const).map((st) => (
                  <MenuItem key={st || "all"} onSelect={() => go({ status: st, page: 1 })}>
                    {params.status === st ? <Check /> : <span className="size-5" />}
                    {st ? t(`ui.${st}`) : t("vocab.allStatus")}
                  </MenuItem>
                ))}
                <MenuSeparator />
                <MenuItem onSelect={() => go({ fav: !params.fav, page: 1 })}>
                  {params.fav ? <Check /> : <Star />}
                  {t("vocab.onlyFavorite")}
                </MenuItem>
              </MenuContent>
            </Menu>
            <div
              role="group"
              aria-label={t("vocab.viewLabel")}
              className="hidden h-12 items-center gap-1 rounded-md border border-border bg-bg p-1 md:flex"
            >
              {(["list", "grid"] as const).map((m) => {
                const Icon = m === "list" ? List : LayoutGrid;
                return (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={view === m}
                    aria-label={m === "list" ? t("vocab.viewList") : t("vocab.viewGrid")}
                    title={m === "list" ? t("vocab.viewList") : t("vocab.viewGrid")}
                    onClick={() => changeView(m)}
                    className={cn(
                      "inline-flex size-9 items-center justify-center rounded-[9px] outline-none focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-5",
                      view === m ? "bg-white text-blue-600 shadow-sm" : "text-text-3 hover:text-blue-600",
                    )}
                  >
                    <Icon />
                  </button>
                );
              })}
            </div>
            <Button asChild variant="solid" className="max-md:flex-[1_1_100%]">
              <Link href="/vocabulary/new">
                <Plus />
                {t("vocab.createNew")}
              </Link>
            </Button>
          </div>
        </div>

        {data.totalAll > 0 ? (
          <TagChips
            tags={data.tagCounts}
            active={params.tag}
            onPick={(tag) => go({ tag, q, page: 1 })}
            onCreate={() => setTagName("new")}
            onRename={(g) => setTagName(g)}
            onDelete={doDeleteTag}
          />
        ) : null}

        {radical ? (
          <div className="flex flex-wrap items-center gap-2 text-[15px] text-text-2">
            <span>{t("vocab.byRadical")}</span>
            <Link
              href={`/radicals/${radical.num}`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 font-semibold text-blue-600"
            >
              <span className="hanzi text-lg" lang="zh">
                {radical.char}
              </span>
              {radicalLabel(radical, locale)}
            </Link>
            <Button variant="link" size="sm" onClick={() => go({ radical: 0, page: 1 })}>
              <X />
              {t("vocab.clearFilter")}
            </Button>
          </div>
        ) : null}
      </section>

      <section
        aria-label={t("vocab.title")}
        ref={listTop}
        className="scroll-mt-4 rounded-[var(--radius-xl)] border border-border bg-white/92 p-4 shadow-card md:p-[22px]"
      >
        <div aria-live="polite" className={cn("transition-opacity", pending && "opacity-60")}>
          {data.totalAll === 0 ? (
            <EmptyAll />
          ) : data.total === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Search className="size-7" />
              </span>
              <h3 className="text-xl font-bold text-navy">{t("vocab.noMatch")}</h3>
              <p className="max-w-[420px] text-text-2">
                {params.q ? t("vocab.noMatchHintQ", { q: params.q }) : t("vocab.noMatchHint")}
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  setQ("");
                  go({ q: "", tag: "", radical: 0, page: 1 });
                }}
              >
                <X />
                {t("vocab.clearFilters")}
              </Button>
            </div>
          ) : (
            <>
              {/* Thanh thao tác hàng loạt: luôn hiện đủ nút, chỉ đổi bật/tắt theo số từ đã chọn. */}
              <div
                role="toolbar"
                aria-label={t("vocab.bulkToolbar")}
                className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-[14px] border border-border bg-bg px-3 py-2.5"
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
                    aria-label={t("vocab.selectAllOnPage")}
                  />
                  <span aria-live="polite">
                    {selected.size ? t("vocab.selectedCount", { count: selected.size }) : t("vocab.selectLabel")}
                  </span>
                </label>
                {selected.size ? (
                  <Button variant="link" size="sm" onClick={() => setSelected(new Set())}>
                    {t("vocab.unselect")}
                  </Button>
                ) : null}
                <div className="grid w-full grid-cols-2 gap-2 md:ml-auto md:flex md:w-auto md:flex-wrap">
                  <BulkButton disabled={!selected.size} hint={t("vocab.hintReview")} onClick={doBulkReview}>
                    <PlayCircle />
                    {t("vocab.review")}
                  </BulkButton>
                  <BulkButton
                    disabled={!selected.size}
                    hint={t("vocab.hintShare")}
                    onClick={() => openShare([...selected])}
                  >
                    <Share2 />
                    {t("vocab.shareAction")}
                  </BulkButton>
                  <BulkButton
                    disabled={!selected.size}
                    hint={t("vocab.hintTag")}
                    onClick={() => setTagFor([...selected])}
                  >
                    <TagIcon />
                    {t("vocab.addTag")}
                  </BulkButton>
                  <BulkButton
                    disabled={!selected.size}
                    hint={t("vocab.hintMark")}
                    onClick={() => doBulkStatus("review")}
                  >
                    <RefreshCw />
                    {t("vocab.markReview")}
                  </BulkButton>
                  <BulkButton
                    disabled={!selected.size}
                    hint={t("vocab.hintMark")}
                    onClick={() => doBulkStatus("learned")}
                  >
                    <CheckCircle2 />
                    {t("vocab.markLearned")}
                  </BulkButton>
                  <BulkButton
                    danger
                    disabled={!selected.size}
                    hint={t("vocab.hintDelete")}
                    onClick={() => doDelete([...selected], t("vocab.selectedWords", { count: selected.size }))}
                  >
                    <Trash2 />
                    {t("vocab.delete")}
                  </BulkButton>
                </div>
              </div>

              {/* Máy tính, dạng danh sách: bảng */}
              {view === "list" ? (
                <div className="hidden overflow-x-auto rounded-[14px] border border-border md:block">
                  <table className="w-full min-w-[900px] border-collapse text-[15.5px]">
                    <caption className="sr-only">
                      {t("vocab.caption", { page: data.page, count: data.pageCount })}
                    </caption>
                    <thead>
                      <tr className="bg-[#F3F8FE] text-left text-[14.5px] text-text-2 [&>th]:px-3 [&>th]:py-3.5 [&>th]:font-semibold [&>th]:whitespace-nowrap">
                        <th className="w-[52px] text-center">
                          <span className="sr-only">{t("vocab.colSelect")}</span>
                        </th>
                        <th className="w-11">#</th>
                        <th>{t("vocab.colWord")}</th>
                        <th aria-sort={params.sort === "pinyin" ? "ascending" : undefined}>
                          <button
                            type="button"
                            onClick={() => go({ sort: params.sort === "pinyin" ? "newest" : "pinyin", page: 1 })}
                            className="inline-flex items-center gap-1 rounded-md outline-none hover:text-blue-600 focus-visible:shadow-[var(--focus-ring)]"
                          >
                            {t("vocab.colPinyin")}
                            <ArrowUpDown className={cn("size-4", params.sort === "pinyin" && "text-blue-600")} />
                          </button>
                        </th>
                        <th>{t("vocab.colMeaning")}</th>
                        <th>{t("vocab.colTag")}</th>
                        <th>{t("vocab.colStatus")}</th>
                        <th>{t("vocab.colNote")}</th>
                        <th className="w-[1%] text-center">{t("vocab.colView")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((v, i) => (
                        <tr
                          key={v.id}
                          className={cn(
                            "border-t border-[#EDF3F9] hover:bg-[#F9FCFF] [&>td]:px-3 [&>td]:py-2.5 [&>td]:align-middle",
                            selected.has(v.id) && "bg-[#F1F8FF] hover:bg-[#F1F8FF]",
                          )}
                        >
                          <td className="text-center">
                            <input
                              type="checkbox"
                              className={checkboxClass}
                              checked={selected.has(v.id)}
                              onChange={(e) => toggle(v.id, e.target.checked)}
                              aria-label={t("vocab.selectWord", { word: v.hanzi })}
                            />
                          </td>
                          <td className="text-text-2 tabular-nums">{(data.page - 1) * data.pageSize + i + 1}</td>
                          <td>
                            <WordChip text={v.hanzi} />
                          </td>
                          <td>
                            <span className="inline-flex items-center gap-1">
                              <span className="pinyin">{v.pinyin}</span>
                              <SpeakButton text={v.hanzi} label={t("vocab.listen", { word: v.hanzi })} />
                            </span>
                          </td>
                          <td className="max-w-[240px]">{v.meaningVi}</td>
                          <td className="max-w-[260px] min-w-[150px]">
                            <div className="flex flex-wrap gap-1.5">
                              {v.tags.length ? (
                                v.tags.map((t) => <Tag key={t} name={t} />)
                              ) : (
                                <span className="text-text-3">—</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <StatusBadge status={v.status} />
                          </td>
                          <td className="w-[150px]">{note(v)}</td>
                          <td className="whitespace-nowrap">
                            <span className="inline-flex items-center gap-0.5">
                              {eye(v)}
                              {star(v)}
                              {rowMenu(v)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {/* Điện thoại (hoặc dạng lưới trên máy tính): thẻ */}
              <ul
                className={cn("grid gap-2.5", view === "list" ? "md:hidden" : "md:grid-cols-2 md:gap-3 xl:grid-cols-4")}
                aria-label={t("vocab.caption", { page: data.page, count: data.pageCount })}
              >
                {data.items.map((v) => (
                  <li
                    key={v.id}
                    className={cn(
                      "grid grid-cols-[30px_minmax(0,1fr)_auto] gap-x-2.5 gap-y-0.5 rounded-2xl border border-border bg-white py-3 pr-2.5 pl-3 [grid-template-areas:'chk_word_act''chk_py_status''chk_mean_mean''note_note_note''tags_tags_tags'] max-[380px]:grid-cols-[28px_minmax(0,1fr)_auto]",
                      selected.has(v.id) && "border-[#A9D3F8] bg-[#F1F8FF]",
                    )}
                  >
                    <div className="self-center [grid-area:chk]">
                      <input
                        type="checkbox"
                        className={checkboxClass}
                        checked={selected.has(v.id)}
                        onChange={(e) => toggle(v.id, e.target.checked)}
                        aria-label={t("vocab.selectWord", { word: v.hanzi })}
                      />
                    </div>
                    <div className="min-w-0 [grid-area:word]">
                      <WordChip text={v.hanzi} />
                    </div>
                    <div className="flex items-center gap-1 text-[14.5px] [grid-area:py]">
                      <span className="pinyin">{v.pinyin}</span>
                      <SpeakButton text={v.hanzi} label={t("vocab.listen", { word: v.hanzi })} />
                    </div>
                    <div className="text-[15px] text-text [grid-area:mean]">{v.meaningVi}</div>
                    <div className="-mt-1.5 -mr-1 flex items-start justify-end [grid-area:act]">
                      {eye(v)}
                      {star(v)}
                      {rowMenu(v)}
                    </div>
                    <div className="self-center justify-self-end [grid-area:status]">
                      <StatusBadge status={v.status} />
                    </div>
                    {v.note ? <div className="mt-1.5 text-sm [grid-area:note]">{note(v)}</div> : null}
                    {v.tags.length ? (
                      <div className="mt-1.5 flex flex-wrap gap-1 [grid-area:tags]">
                        {v.tags.map((t) => (
                          <Tag key={t} name={t} />
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between">
                <span className="text-[14px] text-text-2">
                  {t("vocab.showing", {
                    from: (data.page - 1) * data.pageSize + 1,
                    to: (data.page - 1) * data.pageSize + data.items.length,
                  })}{" "}
                  <span className="font-semibold text-text">{t("vocab.total", { count: data.total })}</span>
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <Pager
                    page={data.page}
                    count={data.pageCount}
                    onGo={(p) => {
                      go({ page: p }, { keepSelection: true });
                      listTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  />
                  <label>
                    <span className="sr-only">{t("vocab.perPageLabel")}</span>
                    <select
                      value={params.size}
                      onChange={(e) => go({ size: Number(e.target.value), page: 1 }, { keepSelection: true })}
                      className={cn(inputClass, "h-[42px] w-[130px] cursor-pointer py-0")}
                    >
                      {PAGE_SIZES.map((n) => (
                        <option key={n} value={n}>
                          {t("vocab.perPage", { n })}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <WordDetailDialog word={detailOf} onClose={() => setDetailOf(null)} />
      <Dialog open={!!noteOf} onOpenChange={(o) => !o && setNoteOf(null)}>
        {noteOf ? (
          <DialogContent title={t("vocab.noteTitle")} icon={<Eye />} wide>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-md bg-bg px-4 py-3">
              <span className="hanzi text-2xl" lang="zh">
                {noteOf.hanzi}
              </span>
              <span className="pinyin">{noteOf.pinyin}</span>
              <span>{noteOf.meaningVi}</span>
            </div>
            <p className="leading-relaxed break-words whitespace-pre-wrap text-text">{noteOf.note}</p>
            <DialogActions>
              <Button variant="secondary" onClick={() => router.push(`/vocabulary/${noteOf.id}/edit`)}>
                {t("vocab.editNote")}
              </Button>
              <DialogClose asChild>
                <Button variant="solid">{t("common.close")}</Button>
              </DialogClose>
            </DialogActions>
          </DialogContent>
        ) : null}
      </Dialog>

      <AddTagDialog
        ids={tagFor}
        allTags={data.tagCounts.map((t) => t.name)}
        onClose={() => setTagFor(null)}
        onDone={refresh}
      />
      <TagNameDialog
        target={tagName}
        onClose={() => setTagName(null)}
        onDone={(name) => {
          const renamed = tagName !== "new" && tagName && tagName.name.toLowerCase() === params.tag.toLowerCase();
          if (renamed) go({ tag: name, page: 1 });
          else refresh();
        }}
      />
      <ShareVocabDialog words={shareWords} onClose={() => setShareWords(null)} />
      <AcceptVocabDialog
        share={invite}
        myTags={data.tagCounts.map((t) => t.name)}
        onClose={() => setInvite(null)}
        onDone={() => {
          setInvite(null);
          refresh();
        }}
        onReject={rejectInvite}
      />
      {confirmNode}
    </>
  );
}

const iconBtn =
  "inline-flex size-10 items-center justify-center rounded-full text-blue-600 outline-none hover:bg-blue-50 focus-visible:shadow-[var(--focus-ring)] md:size-9 [&_svg]:size-[22px]";

function EmptyAll() {
  const t = useT();
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
      <Image src="/brand/lingyu-mascot.png" alt="" width={180} height={120} className="h-auto w-[180px]" />
      <h3 className="text-xl font-bold text-navy">{t("vocab.emptyTitle")}</h3>
      <p className="max-w-[420px] text-text-2">{t("vocab.emptyDesc")}</p>
      <div className="flex w-full max-w-md flex-col gap-2.5 sm:w-auto sm:flex-row">
        <Button asChild variant="solid">
          <Link href="/vocabulary/new">
            <Plus />
            {t("vocab.add")}
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/library/vocabulary">
            <Library />
            {t("vocab.fromLibrary")}
          </Link>
        </Button>
      </div>
    </div>
  );
}

/** Ô chữ Hán trong bảng (theo thiết kế): nền xanh nhạt, chữ đậm; bấm con mắt để xem ô 米字格 + cách viết. */
function WordChip({ text }: { text: string }) {
  return (
    <span
      lang="zh"
      className="inline-flex min-h-11 items-center rounded-[10px] border border-[#DCE9F8] bg-[#F1F7FE] px-3 py-1 hanzi text-[22px] leading-tight font-bold tracking-[0.12em] whitespace-nowrap text-navy-900 max-md:[overflow-wrap:anywhere] max-md:whitespace-normal"
    >
      {text}
    </span>
  );
}
