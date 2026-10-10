"use client";
import { WordDetailDialog } from "./word-detail-dialog";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronsUpDown,
  Eye,
  GraduationCap,
  Library,
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
import { PAGE_SIZES, type ListParams } from "../schema";
import { useLocale, useT } from "@/i18n/client";
import type { TagCount, VocabItem, VocabList } from "../service";
import { deleteTagAction, deleteVocabAction, setStatusAction, toggleFavoriteAction } from "../actions";
import { startCustomAction } from "@/features/review/actions";
import { AddTagDialog } from "./add-tag-dialog";
import { TagNameDialog } from "./tag-cards";
import { SpeakButton } from "@/components/speak-button";
import { LeafDecor } from "@/components/layout/icons";
import { BulkButton, Pager } from "@/components/ui/list-controls";
import type { ReceivedVocabShare } from "../share-service";
import { FeatureHero } from "@/components/feature-hero";
import {
  AcceptVocabDialog,
  rejectVocabWithConfirm,
  ShareVocabDialog,
  VocabInvites,
  type ShareWord,
} from "./share-dialogs";

const HAN_RE = /\p{Script=Han}/u;
const LATIN_RE = /\p{Script=Latin}/u;

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
  const activeTag = data.tagCounts.find((g) => g.name.toLowerCase() === params.tag.toLowerCase()) ?? null;
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
  // Ví dụ = ghi chú của từ: dòng có chữ Hán hiện kiểu Khải, phần còn lại (nghĩa) chữ xám bên dưới.
  // Dạng "我们走吧。 — Chúng ta đi nhé." hoặc 2 dòng; ghi chú không có chữ Hán thì hiện cả câu chữ xám.
  const example = (v: VocabItem) => {
    const n = v.note.trim();
    if (!n) return <span className="text-text-3">—</span>;
    const parts = n.includes("\n") ? n.split(/\n+/) : n.split(/\s+[—–-]\s+/);
    // Chỉ coi là câu tiếng Trung khi có chữ Hán và không lẫn chữ Latin (pinyin / tiếng Việt).
    const zh = HAN_RE.test(parts[0] ?? "") && !LATIN_RE.test(parts[0] ?? "") ? parts[0]!.trim() : "";
    const rest = (zh ? parts.slice(1) : parts).join(" — ").trim();
    return (
      <button
        type="button"
        onClick={() => setNoteOf(v)}
        aria-label={t("vocab.fullNote", { word: v.hanzi })}
        title={n}
        className="block max-w-full rounded-md text-left outline-none focus-visible:shadow-[var(--focus-ring)]"
      >
        {zh ? (
          <span
            lang="zh"
            className="block truncate [font-family:var(--font-paper)] text-[17px] font-bold text-navy-900"
          >
            {zh}
          </span>
        ) : null}
        {rest ? <span className="line-clamp-2 text-[14.5px] text-text-2">{rest}</span> : null}
      </button>
    );
  };
  const note = example;

  return (
    <>
      <FeatureHero
        iconImg="/brand/ui/nav-vocabulary.png?v=2"
        id="vl-title"
        title={t("vocab.myTitle", { count: data.totalAll })}
        description={t("vocab.mySub")}
      />

      <VocabInvites received={received} onOpen={setInvite} onReject={rejectInvite} />

      {/* Thanh công cụ (theo design): "Từ vựng" + tổng số · ô tìm · HSK · Tag · Trạng thái · Thêm từ. */}
      <section aria-label={t("vocab.toolbar")} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3 2xl:flex-nowrap">
          <div className="flex shrink-0 items-center gap-3">
            <LeafDecor className="w-9" />
            <h2 className="text-[26px] leading-none font-extrabold tracking-tight text-navy-900">{t("vocab.title")}</h2>
            <span className="rounded-full bg-[#EEF3F9] px-3 py-1 text-[14px] font-medium text-text-2">
              {t("vocab.totalPill", { count: data.totalAll })}
            </span>
          </div>
          <label className="relative order-last block w-full 2xl:order-none 2xl:w-auto 2xl:min-w-[240px] 2xl:flex-1">
            <span className="sr-only">{t("vocab.searchLabel")}</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-text-2" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={params.tag ? t("vocab.searchInTag", { tag: params.tag }) : t("vocab.searchPlaceholder")}
              autoComplete="off"
              className="h-12 w-full rounded-full border border-[#E3EBF5] bg-white pr-4 pl-12 text-[15.5px] text-text shadow-[0_2px_8px_rgba(20,60,110,.05)] outline-none placeholder:text-text-3 focus:border-blue-600 focus-visible:shadow-[var(--focus-ring)]"
            />
          </label>
          <div className="ml-auto flex flex-wrap items-center gap-2.5">
            {/* HSK */}
            <Menu>
              <MenuTrigger asChild>
                <button type="button" className={pill(!!params.hsk)} aria-label={t("vocab.hskFilter")}>
                  <GraduationCap aria-hidden="true" />
                  {params.hsk ? (params.hsk === "other" ? t("vocab.hskOther") : `HSK ${params.hsk}`) : "HSK"}
                  <ChevronDown aria-hidden="true" className="text-text-2" />
                </button>
              </MenuTrigger>
              <MenuContent className="w-[220px]">
                {(["", "1", "2", "3", "4", "5", "6", "other"] as const).map((k) => (
                  <MenuItem key={k || "all"} onSelect={() => go({ hsk: k, page: 1 })}>
                    {params.hsk === k ? <Check /> : <span className="size-5" />}
                    <span className="flex-1">
                      {k ? (k === "other" ? t("vocab.hskOther") : `HSK ${k}`) : t("vocab.allHsk")}
                    </span>
                    <span className="text-[13px] text-text-3">{k ? (data.hskCounts[k] ?? 0) : data.totalAll}</span>
                  </MenuItem>
                ))}
              </MenuContent>
            </Menu>
            {/* Tag — chọn tag để lọc; tạo / đổi tên / xoá tag */}
            <Menu>
              <MenuTrigger asChild>
                <button type="button" className={pill(!!params.tag)} aria-label={t("vocab.tagFilter")}>
                  <TagIcon aria-hidden="true" />
                  <span className="max-w-[140px] truncate">{params.tag || t("vocab.colTag")}</span>
                  <ChevronDown aria-hidden="true" className="text-text-2" />
                </button>
              </MenuTrigger>
              <MenuContent className="max-h-[min(60vh,420px)] w-[260px] overflow-y-auto" collisionPadding={12}>
                <MenuItem onSelect={() => setTagName("new")}>
                  <Plus />
                  {t("vocab.newTag")}
                </MenuItem>
                {activeTag ? (
                  <>
                    <MenuItem onSelect={() => setTagName(activeTag)}>
                      <Pencil />
                      {t("vocab.renameTagN", { name: activeTag.name })}
                    </MenuItem>
                    <MenuItem danger onSelect={() => doDeleteTag(activeTag)}>
                      <Trash2 />
                      {t("vocab.deleteTagN", { name: activeTag.name })}
                    </MenuItem>
                  </>
                ) : null}
                <MenuSeparator />
                <MenuItem onSelect={() => go({ tag: "", page: 1 })}>
                  {!params.tag ? <Check /> : <span className="size-5" />}
                  {t("vocab.allTags")}
                </MenuItem>
                {data.tagCounts.map((g) => (
                  <MenuItem key={g.id} onSelect={() => go({ tag: g.name, q, page: 1 })}>
                    {params.tag.toLowerCase() === g.name.toLowerCase() ? <Check /> : <span className="size-5" />}
                    <span className="min-w-0 flex-1 truncate">{g.name}</span>
                    <span className="text-[13px] text-text-3">{g.count}</span>
                  </MenuItem>
                ))}
              </MenuContent>
            </Menu>
            {/* Trạng thái + yêu thích */}
            <Menu>
              <MenuTrigger asChild>
                <button
                  type="button"
                  className={pill(!!params.status || params.fav)}
                  aria-label={t("vocab.statusFilter")}
                >
                  <RefreshCw aria-hidden="true" />
                  {params.status ? t(`ui.${params.status}`) : params.fav ? t("vocab.favShort") : t("vocab.colStatus")}
                  <ChevronDown aria-hidden="true" className="text-text-2" />
                </button>
              </MenuTrigger>
              <MenuContent className="w-[230px]">
                {(["", "review", "learned"] as const).map((st) => (
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
            <Link
              href="/vocabulary/new"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[linear-gradient(135deg,#1677FF_0%,#1468E0_100%)] px-6 text-[16px] font-semibold text-white shadow-[0_8px_18px_rgba(23,105,201,.28)] outline-none hover:brightness-105 focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-5"
            >
              <Plus aria-hidden="true" />
              {t("vocab.addWord")}
            </Link>
          </div>
        </div>
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

      <section aria-label={t("vocab.title")} ref={listTop} className="flex scroll-mt-4 flex-col gap-3">
        <div aria-live="polite" className={cn("transition-opacity", pending && "opacity-60")}>
          {data.totalAll === 0 ? (
            <div className="rounded-[var(--radius-xl)] border border-border bg-white/95 shadow-card">
              <EmptyAll />
            </div>
          ) : data.total === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[var(--radius-xl)] border border-border bg-white/95 px-5 py-10 text-center shadow-card">
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
              {/* Thanh thao tác hàng loạt: máy tính chỉ hiện khi đã chọn từ (ô chọn tất cả nằm ở đầu bảng); điện thoại luôn hiện. */}
              <div
                role="toolbar"
                aria-label={t("vocab.bulkToolbar")}
                className={cn(
                  "mb-3 flex flex-wrap",
                  !selected.size && "md:hidden",
                  "items-center gap-x-4 gap-y-2.5 rounded-[var(--radius-xl)] border border-border bg-white/95 px-4 py-3 shadow-card",
                )}
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

              {/* Máy tính: bảng (theo design) */}
              <div className="hidden overflow-x-auto rounded-[var(--radius-xl)] border border-[#E8EFF7] bg-white shadow-card md:block">
                <table className="w-full min-w-[820px] border-collapse text-[15.5px]">
                  <caption className="sr-only">
                    {t("vocab.caption", { page: data.page, count: data.pageCount })}
                  </caption>
                  <thead>
                    <tr className="bg-white text-left text-[14px] text-[#172B4D] [&>th]:px-3 [&>th]:py-4 [&>th]:font-semibold [&>th]:whitespace-nowrap">
                      <th className="w-[56px] text-center">
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
                          <ChevronsUpDown
                            className={cn("size-4", params.sort === "pinyin" ? "text-blue-600" : "text-text-2")}
                          />
                        </button>
                      </th>
                      <th>{t("vocab.colMeaning")}</th>
                      <th className="hidden 2xl:table-cell">{t("vocab.colExample")}</th>
                      <th>{t("vocab.colTag")}</th>
                      <th>{t("vocab.colStatus")}</th>
                      <th className="w-[1%] text-center">{t("vocab.colActions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((v, i) => (
                      <tr
                        key={v.id}
                        className={cn(
                          "border-t border-[#E8EFF7] hover:bg-[#F9FBFF] [&>td]:px-3 [&>td]:py-3 [&>td]:align-middle",
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
                          <span className="inline-flex items-center gap-1 whitespace-nowrap">
                            <span className="text-[16px] text-[#526B91]">{v.pinyin}</span>
                            <SpeakButton text={v.hanzi} label={t("vocab.listen", { word: v.hanzi })} className="text-[#1677FF]" />
                          </span>
                        </td>
                        <td className="max-w-[260px] text-[16px] text-[#172B4D]">{v.meaningVi}</td>
                        <td className="hidden max-w-[320px] 2xl:table-cell">{example(v)}</td>
                        <td className="max-w-[200px] min-w-[120px]">
                          <div className="flex flex-wrap gap-1.5">
                            {v.tags.length ? (
                              v.tags.map((tg) => <Tag key={tg} name={tg} />)
                            ) : (
                              <span className="text-text-3">—</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={v.status} fresh={!v.reviewed} />
                        </td>
                        <td className="whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
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

              {/* Điện thoại: thẻ */}
              <ul
                className="grid gap-2.5 md:hidden"
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
                      <SpeakButton text={v.hanzi} label={t("vocab.listen", { word: v.hanzi })} className="text-[#1677FF]" />
                    </div>
                    <div className="text-[15px] text-text [grid-area:mean]">{v.meaningVi}</div>
                    <div className="-mt-1.5 -mr-1 flex items-start justify-end [grid-area:act]">
                      {eye(v)}
                      {star(v)}
                      {rowMenu(v)}
                    </div>
                    <div className="self-center justify-self-end [grid-area:status]">
                      <StatusBadge status={v.status} fresh={!v.reviewed} />
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
  "inline-flex size-10 items-center justify-center rounded-full text-[#1677FF] outline-none hover:bg-blue-50 focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-[22px]";
/** Nút mở bộ lọc dạng viên thuốc (HSK / Tag / Trạng thái) — theo design. */
const pill = (on: boolean) =>
  cn(
    "inline-flex h-12 items-center gap-2 rounded-full border px-5 text-[16px] font-semibold outline-none focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-5",
    on
      ? "border-blue-600 bg-blue-50 text-blue-700"
      : "border-[#E3EBF5] bg-white text-navy-900 shadow-[0_2px_8px_rgba(20,60,110,.05)] hover:bg-blue-50",
  );

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

/** Ô chữ Hán (theo design): nền be, viền nhạt, chữ đỏ kiểu Khải; bấm con mắt để xem ô 米字格 + cách viết. */
function WordChip({ text }: { text: string }) {
  return (
    <span
      lang="zh"
      className="inline-flex min-h-9 min-w-10 max-w-full items-center justify-center rounded-[8px] border border-[#F2DFC6] bg-[#FFF7EB] px-2.5 py-0.5 [font-family:var(--font-paper)] text-[21px] leading-tight font-normal tracking-[0.1em] text-[#A32A24] [-webkit-text-stroke:0.025em_#A32A24] max-md:min-h-9 max-md:text-[20px]"
    >
      {text}
    </span>
  );
}
