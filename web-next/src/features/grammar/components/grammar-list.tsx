"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpDown,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Library,
  Eye,
  FileText,
  Pencil,
  PlayCircle,
  Plus,
  Search,
  Share2,
  Tag as TagIcon,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, inputClass } from "@/components/ui/input";
import { Tag } from "@/components/ui/badges";
import { Dialog, DialogActions, DialogClose, DialogContent } from "@/components/ui/dialog";
import { useConfirm } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toaster";
import { GrammarIcon } from "@/components/layout/icons";
import { cn } from "@/lib/utils";
import { G_LIMITS, G_SORTS, hskOfTag, structureLines, type GrammarListParams } from "../schema";
import { Marked } from "./hanzi-mark";
import type { GrammarItem, ReceivedShare } from "../service";
import { createTagAction, deleteTagAction, renameTagAction } from "../actions";
import { AcceptShareDialog, ShareGrammarDialog, rejectWithConfirm, type PendingShare } from "./grammar-dialogs";
import { useIntlTag, useT } from "@/i18n/client";
import { FeatureHero, heroPrimary } from "@/components/feature-hero";

type Data = {
  items: GrammarItem[];
  total: number;
  totalAll: number;
  savedCount: number;
  hskCounts: Record<string, number>;
};
type TagRow = { id: string; name: string; count: number };

export const fmtDate = (d: Date | string, tag = "vi-VN") =>
  new Date(d).toLocaleDateString(tag, { day: "2-digit", month: "2-digit", year: "numeric" });

export function GrammarList({
  data,
  params,
  tags,
  received,
  titlePy,
}: {
  data: Data;
  params: GrammarListParams;
  tags: TagRow[];
  received: ReceivedShare[];
  /** Pinyin của chữ Hán trong tiêu đề, theo id ngữ pháp (tính ở server). */
  titlePy: Record<string, string>;
}) {
  const router = useRouter();
  const t = useT();
  const pathname = usePathname();
  const [pending, startTransition] = React.useTransition();
  const [confirm, confirmNode] = useConfirm();
  const [q, setQ] = React.useState(params.q);
  const [shareOf, setShareOf] = React.useState<GrammarItem | null>(null);
  const [acceptOf, setAcceptOf] = React.useState<PendingShare | null>(null);
  const [tagsOpen, setTagsOpen] = React.useState(false);
  const userTags = tags.filter((tg) => hskOfTag(tg.name) === null);
  // Một ô lọc gộp: chế độ xem, cấp HSK hoặc một thẻ (chọn một mục sẽ bỏ các mục kia).
  const filterValue =
    params.view !== "all"
      ? `view:${params.view}`
      : params.tag
        ? `tag:${params.tag}`
        : params.hsk
          ? `hsk:${params.hsk}`
          : "";

  const go = React.useCallback(
    (patch: Partial<GrammarListParams>) => {
      const n = { ...params, ...patch };
      const sp = new URLSearchParams();
      if (n.q.trim()) sp.set("q", n.q.trim());
      if (n.tag) sp.set("tag", n.tag);
      if (n.sort !== "updated") sp.set("sort", n.sort);
      if (n.view !== "all") sp.set("view", n.view);
      if (n.hsk) sp.set("hsk", n.hsk);
      startTransition(() => router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false }));
    },
    [params, pathname, router],
  );
  const pickFilter = (v: string) => {
    if (v === "manage") return setTagsOpen(true);
    const [kind, val = ""] = v.split(":");
    go({
      view: kind === "view" ? (val as GrammarListParams["view"]) : "all",
      hsk: kind === "hsk" ? (val as GrammarListParams["hsk"]) : "",
      tag: kind === "tag" ? val : "",
    });
  };
  React.useEffect(() => {
    if (q === params.q) return;
    const timer = setTimeout(() => go({ q }), 350);
    return () => clearTimeout(timer);
  }, [q, params.q, go]);
  const refresh = () => startTransition(() => router.refresh());

  const listMode = params.view !== "shared";


  return (
    <>
      <FeatureHero
        id="gl-title"
        title={t("grammar.title")}
        description={t("grammar.heroSub")}
        icon={<FileText strokeWidth={2.2} />}
        actions={
          <Link href="/library/grammar" className={heroPrimary}>
            <PlayCircle aria-hidden="true" />
            {t("grammar.startLearning")}
            <ArrowRight aria-hidden="true" />
          </Link>
        }
      />

      {/* Thanh công cụ (giống Từ vựng): tìm · ô lọc (Tất cả / Đã lưu / Được chia sẻ / HSK / thẻ) · sắp xếp · Tạo mới. */}
      <section
        aria-label={t("grammar.toolbar")}
        className="rounded-[var(--radius-xl)] border border-border bg-white/95 p-3 shadow-card md:p-4"
      >
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-[minmax(0,1fr)_220px_230px_auto] md:gap-3">
          <label className="relative col-span-2 block md:col-span-1">
            <span className="sr-only">{t("grammar.searchLabel")}</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-text-3" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("grammar.searchPlaceholder")}
              autoComplete="off"
              disabled={!listMode}
              className={cn(inputClass, "h-12 pl-12")}
            />
          </label>
          <label>
            <span className="sr-only">{t("grammar.filterLabel")}</span>
            <select
              value={filterValue}
              onChange={(e) => pickFilter(e.target.value)}
              className={cn(inputClass, "h-12 cursor-pointer font-semibold")}
            >
              <option value="">{t("grammar.allCount", { count: data.totalAll })}</option>
              <option value="view:saved">
                {t("grammar.viewSaved")} ({data.savedCount})
              </option>
              <option value="view:shared">
                {t("grammar.viewShared")} ({received.length})
              </option>
              <optgroup label="HSK">
                {(["1", "2", "3", "4", "5", "6", "other"] as const).map((h) => {
                  const n = data.hskCounts[h] ?? 0;
                  return (
                    <option key={h} value={`hsk:${h}`}>
                      {h === "other" ? t("grammar.hskOther", { count: n }) : `HSK ${h} (${n})`}
                    </option>
                  );
                })}
              </optgroup>
              {userTags.length ? (
                <optgroup label={t("grammar.tagsGroup")}>
                  {userTags.map((tg) => (
                    <option key={tg.id} value={`tag:${tg.id}`}>
                      {tg.name} ({tg.count})
                    </option>
                  ))}
                </optgroup>
              ) : null}
              <option value="manage">{t("grammar.manageTags")}…</option>
            </select>
          </label>
          <label className="relative">
            <span className="sr-only">{t("grammar.sort")}</span>
            <ArrowUpDown className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-navy-900" />
            <select
              value={params.sort}
              disabled={!listMode}
              onChange={(e) => go({ sort: e.target.value as GrammarListParams["sort"] })}
              className={cn(inputClass, "h-12 cursor-pointer pl-11 font-semibold")}
            >
              {G_SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {t(s.label)}
                </option>
              ))}
            </select>
          </label>
          <Link
            href="/grammar/new"
            className="col-span-2 inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-[#1769C9] px-5 text-[16px] font-semibold text-white shadow-[0_6px_14px_rgba(23,105,201,.25)] outline-none hover:bg-[#135AAD] focus-visible:shadow-[var(--focus-ring)] md:col-span-1 [&_svg]:size-5"
          >
            <Plus aria-hidden="true" />
            {t("grammar.createNew")}
          </Link>
        </div>
      </section>

      <section
        aria-label={t("grammar.list")}
        className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-white/92 p-4 shadow-card md:p-[22px]"
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex gap-1 rounded-full bg-[#EEF4FB] p-1">
            {(["all", "saved"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={params.view === v}
                onClick={() => go({ view: v, hsk: "", tag: "" })}
                className={cn(
                  "min-h-10 rounded-full px-4 text-[15px] font-semibold outline-none focus-visible:shadow-[var(--focus-ring)]",
                  params.view === v ? "bg-white text-blue-700 shadow-[0_2px_8px_rgba(20,90,170,.12)]" : "text-text-2",
                )}
              >
                {v === "all" ? t("grammar.viewAll") : t("grammar.viewSaved")}{" "}
                <span>({v === "all" ? data.totalAll : data.savedCount})</span>
              </button>
            ))}
          </div>
          {listMode && data.total ? (
            <p className="ml-auto text-[14.5px] font-semibold text-text-2">{t("grammar.total", { count: data.total })}</p>
          ) : null}
        </div>
        <div aria-live="polite" className={cn("transition-opacity", pending && "opacity-60")}>
          {!listMode ? (
            <Received
              received={received}
              onAccept={setAcceptOf}
              onReject={async (s) => {
                if (await rejectWithConfirm(confirm, s)) refresh();
              }}
            />
          ) : data.totalAll === 0 ? (
            <EmptyAll />
          ) : data.total === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                {params.view === "saved" ? <Bookmark className="size-7" /> : <Search className="size-7" />}
              </span>
              <h3 className="text-xl font-bold text-navy">{t("grammar.noMatch")}</h3>
              <p className="max-w-[420px] text-text-2">
                {params.view === "saved" && !params.q && !params.tag
                  ? t("grammar.noneSaved")
                  : params.q
                    ? t("grammar.noMatchHintQ", { q: params.q })
                    : t("grammar.noMatchHint")}
              </p>
              {params.q || params.tag ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQ("");
                    go({ q: "", tag: "" });
                  }}
                >
                  <X />
                  {t("grammar.clearFilters")}
                </Button>
              ) : null}
            </div>
          ) : (
            <GrammarTable items={data.items} titlePy={titlePy} onOpen={(g) => router.push(`/grammar/${g.id}`)} />
          )}
        </div>
      </section>

      <ShareGrammarDialog grammar={shareOf} sent={[]} onClose={() => setShareOf(null)} />
      <AcceptShareDialog
        share={acceptOf}
        myTags={tags.map((tg) => tg.name)}
        onClose={() => setAcceptOf(null)}
        onDone={(g) => {
          setAcceptOf(null);
          router.push(`/grammar/${g.id}`);
        }}
      />
      <TagManager open={tagsOpen} tags={tags} onClose={() => setTagsOpen(false)} onChanged={refresh} />
      {confirmNode}
    </>
  );
}

/** Bỏ nhãn "Tên dạng: " ở đầu dòng cấu trúc (xem `structureParts`). */
export const formulaOf = (line: string) => line.replace(/^[^:：+]{1,40}[:：]\s*/, "");

const PAGE = 10;

/** Bảng ngữ pháp (theo thiết kế): STT · Ngữ pháp (chữ Hán đỏ · pinyin) · Cấu trúc (dòng đầu, +N) · HSK · xem; có phân trang. */
function GrammarTable({
  items,
  titlePy,
  onOpen,
}: {
  items: GrammarItem[];
  titlePy: Record<string, string>;
  onOpen: (g: GrammarItem) => void;
}) {
  const t = useT();
  // Trang hiện tại gắn với danh sách: lọc / tìm ra danh sách mới → về trang 1.
  const [pg, setPg] = React.useState({ of: items, n: 1 });
  const pages = Math.max(1, Math.ceil(items.length / PAGE));
  const page = pg.of === items ? Math.min(pg.n, pages) : 1;
  const from = (page - 1) * PAGE;
  const rows = items.slice(from, from + PAGE);
  const th = "px-3 py-3 text-left text-[13.5px] font-semibold text-text-2";
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full table-fixed border-collapse bg-white">
          <thead className="bg-[#F6F9FD]">
            <tr>
              <th scope="col" className={cn(th, "hidden w-14 text-center sm:table-cell")}>
                {t("grammar.colNo")}
              </th>
              <th scope="col" className={th}>
                {t("grammar.colGrammar")}
              </th>
              <th scope="col" className={cn(th, "hidden md:table-cell")}>
                {t("grammar.colStructure")}
              </th>
              <th scope="col" className={cn(th, "w-[84px] md:w-24")}>
                HSK
              </th>
              <th scope="col" className={cn(th, "w-14")}>
                <span className="sr-only">{t("grammar.colView")}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((g, i) => {
              const lines = structureLines(g.structure);
              const hsk = g.tags.filter((tg) => hskOfTag(tg.name) !== null);
              const formula = lines[0] ? (
                <span className="[overflow-wrap:anywhere]">
                  <Marked text={formulaOf(lines[0])} hanClass="text-[1.1em]" />
                  {lines.length > 1 ? (
                    <span className="ml-2 rounded-full bg-[#EEF4FB] px-2 py-0.5 text-[12.5px] font-bold text-blue-700">
                      +{lines.length - 1}
                    </span>
                  ) : null}
                </span>
              ) : null;
              return (
                <tr
                  key={g.id}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("button, a")) return;
                    onOpen(g);
                  }}
                  className="cursor-pointer align-middle transition-colors hover:bg-[#F7FBFF]"
                >
                  <td className="hidden px-3 py-3.5 text-center font-semibold text-text-3 tabular-nums sm:table-cell">
                    {from + i + 1}
                  </td>
                  <td className="px-3 py-3.5">
                    <h2 className="text-[16.5px] leading-snug font-bold [overflow-wrap:anywhere] text-navy-900 md:text-[17.5px]">
                      <Link href={`/grammar/${g.id}`} className="hover:text-blue-600">
                        <Marked text={g.title} />
                      </Link>
                      {titlePy[g.id] ? (
                        <span aria-hidden="true" className="font-medium text-text-3">
                          {" "}
                          · <span className="pinyin">{titlePy[g.id]}</span>
                        </span>
                      ) : null}
                    </h2>
                    {formula ? (
                      <p className="mt-1 text-[14.5px] font-semibold text-navy md:hidden">{formula}</p>
                    ) : null}
                    {g.sourceGrammarId ? (
                      <span className="mt-1 inline-flex items-center gap-1 text-[13px] text-green-700">
                        <Share2 className="size-[14px]" />
                        {t("grammar.receivedFrom", { name: g.sourceOwnerName || t("grammar.someoneElse") })}
                      </span>
                    ) : null}
                  </td>
                  <td className="hidden px-3 py-3.5 text-[15.5px] font-semibold text-navy md:table-cell">
                    {formula ?? <span className="text-text-3">—</span>}
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="flex flex-wrap gap-1">
                      {hsk.length ? (
                        hsk.map((tg) => (
                          <span
                            key={tg.id}
                            className="rounded-full bg-[#E8F7EE] px-2.5 py-1 text-[12.5px] font-semibold whitespace-nowrap text-[#1E8A4C]"
                          >
                            {tg.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-text-3">—</span>
                      )}
                    </span>
                  </td>
                  <td className="px-2 py-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => onOpen(g)}
                      aria-label={t("grammar.openItem", { title: g.title })}
                      className="inline-flex size-10 items-center justify-center rounded-full text-text-2 outline-none hover:bg-blue-50 hover:text-blue-600 focus-visible:shadow-[var(--focus-ring)]"
                    >
                      <Eye className="size-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {items.length > PAGE ? (
        <nav aria-label={t("grammar.pagination")} className="flex flex-wrap items-center gap-2">
          <span className="text-[14px] text-text-3 tabular-nums">
            {from + 1}–{from + rows.length} / {items.length}
          </span>
          <span className="ml-auto flex flex-wrap gap-1.5">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPg({ of: items, n: page - 1 })}
              aria-label={t("grammar.prevPage")}
              className={pageBtn}
            >
              <ChevronLeft className="size-[18px]" />
            </button>
            {Array.from({ length: pages }, (_, k) => k + 1).map((n) => (
              <button
                key={n}
                type="button"
                aria-current={n === page ? "page" : undefined}
                aria-label={t("grammar.pageN", { n })}
                onClick={() => setPg({ of: items, n })}
                className={cn(pageBtn, n === page && "border-blue-600 bg-blue-600 text-white hover:bg-blue-600")}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              disabled={page === pages}
              onClick={() => setPg({ of: items, n: page + 1 })}
              aria-label={t("grammar.nextPage")}
              className={pageBtn}
            >
              <ChevronRight className="size-[18px]" />
            </button>
          </span>
        </nav>
      ) : null}
    </div>
  );
}

const pageBtn =
  "inline-flex size-10 items-center justify-center rounded-[10px] border border-border bg-white text-[14.5px] font-semibold text-text-2 outline-none hover:bg-blue-50 focus-visible:shadow-[var(--focus-ring)] disabled:opacity-40";

function Received({
  received,
  onAccept,
  onReject,
}: {
  received: ReceivedShare[];
  onAccept: (s: PendingShare) => void;
  onReject: (s: PendingShare) => void;
}) {
  const t = useT();
  const tag = useIntlTag();
  if (!received.length)
    return (
      <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Share2 className="size-7" />
        </span>
        <h3 className="text-xl font-bold text-navy">{t("grammar.noInvites")}</h3>
        <p className="max-w-[420px] text-text-2">{t("grammar.noInvitesDesc")}</p>
      </div>
    );
  return (
    <ul className="grid gap-3">
      {received.map((s) => (
        <li
          key={s.id}
          className="flex flex-wrap items-center gap-3.5 rounded-lg border border-border bg-white px-[18px] py-4"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Share2 className="size-[22px]" />
          </span>
          <div className="min-w-[220px] flex-1 text-text-2">
            {t.rich("grammar.sharedWithYou", { name: <strong className="text-text">{s.senderName}</strong> })}
            <div className="my-0.5 font-bold text-navy">{s.grammarTitle}</div>
            <span className="text-[13.5px] text-text-3">
              {fmtDate(s.createdAt, tag)} · {s.senderEmail}
            </span>
          </div>
          <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto">
            {s.grammarId ? (
              <>
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/grammar/${s.grammarId}?share=${s.id}`}>
                    <Eye />
                    {t("common.view")}
                  </Link>
                </Button>
                <Button size="sm" variant="solid" onClick={() => onAccept(s)}>
                  <Check />
                  {t("common.accept")}
                </Button>
              </>
            ) : (
              <span className="col-span-2 self-center text-sm text-text-3">{t("grammar.sourceDeleted")}</span>
            )}
            <Button size="sm" variant="muted" onClick={() => onReject(s)}>
              <X />
              {t("common.reject")}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyAll() {
  const t = useT();
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <GrammarIcon className="size-7" />
      </span>
      <h3 className="text-xl font-bold text-navy">{t("grammar.emptyTitle")}</h3>
      <p className="max-w-[420px] text-text-2">{t("grammar.emptyDesc")}</p>
      <div className="flex w-full max-w-md flex-col gap-2.5 sm:w-auto sm:flex-row">
        <Button asChild variant="solid">
          <Link href="/grammar/new">
            <Plus />
            {t("grammar.addNew")}
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/library/grammar">
            <Library />
            {t("grammar.fromLibrary")}
          </Link>
        </Button>
      </div>
    </div>
  );
}

function TagManager({
  open,
  tags,
  onClose,
  onChanged,
}: {
  open: boolean;
  tags: TagRow[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const tr = useT();
  const [confirm, confirmNode] = useConfirm();
  const [name, setName] = React.useState("");
  const [err, setErr] = React.useState("");
  const [editing, setEditing] = React.useState<{ id: string; name: string } | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const r = await createTagAction(name);
    if (!r.ok) return void setErr(r.message);
    setName("");
    setErr("");
    toast.success(tr("grammar.tags.created", { name: r.data.name }));
    onChanged();
  }
  async function rename(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const r = await renameTagAction(editing.id, editing.name);
    if (!r.ok) return void setErr(r.message);
    setEditing(null);
    setErr("");
    toast.success(tr("grammar.tags.renamed"));
    onChanged();
  }
  async function remove(t: TagRow) {
    const ok = await confirm({
      title: tr("grammar.tags.deleteTitle"),
      message: tr.rich("grammar.tags.deleteMessage", { name: <strong>{t.name}</strong>, count: t.count }),
      confirmLabel: tr("grammar.tags.deleteConfirm"),
      danger: true,
    });
    if (!ok) return;
    const r = await deleteTagAction(t.id);
    if (!r.ok) return void setErr(r.message);
    toast.success(tr("grammar.tags.deleted", { name: t.name }));
    onChanged();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        {open ? (
          <DialogContent title={tr("grammar.tags.title")} icon={<TagIcon />} wide>
            <form onSubmit={create} noValidate className="flex gap-2">
              <label className="min-w-0 flex-1">
                <span className="sr-only">{tr("grammar.tags.newName")}</span>
                <Input
                  value={name}
                  maxLength={G_LIMITS.tag}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErr("");
                  }}
                  placeholder={tr("grammar.tags.newPlaceholder")}
                  autoComplete="off"
                />
              </label>
              <Button type="submit" variant="solid">
                <Plus />
                {tr("grammar.tags.create")}
              </Button>
            </form>
            {err ? (
              <p role="alert" className="text-sm text-red">
                {tr.maybe(err)}
              </p>
            ) : null}
            <ul className="flex max-h-[45dvh] flex-col gap-1.5 overflow-y-auto">
              {tags.length ? (
                tags.map((t) =>
                  editing?.id === t.id ? (
                    <li key={t.id}>
                      <form onSubmit={rename} noValidate className="flex gap-2">
                        <label className="min-w-0 flex-1">
                          <span className="sr-only">{tr("grammar.tags.renameLabel", { name: t.name })}</span>
                          <Input
                            autoFocus
                            value={editing.name}
                            maxLength={G_LIMITS.tag}
                            onChange={(e) => setEditing({ id: t.id, name: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") {
                                e.stopPropagation();
                                setEditing(null);
                              }
                            }}
                            className="h-10"
                          />
                        </label>
                        <Button type="submit" size="sm" variant="solid">
                          {tr("common.save")}
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(null)}>
                          {tr("common.cancel")}
                        </Button>
                      </form>
                    </li>
                  ) : (
                    <li key={t.id} className="flex items-center gap-2 rounded-md bg-bg px-3 py-1.5">
                      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                        <Tag name={t.name} />
                        <span className="text-[13.5px] text-text-3">
                          {tr("grammar.tags.count", { count: t.count })}
                        </span>
                      </span>
                      <button
                        type="button"
                        aria-label={tr("grammar.tags.rename", { name: t.name })}
                        onClick={() => setEditing({ id: t.id, name: t.name })}
                        className="inline-flex size-10 items-center justify-center rounded-full text-blue-600 hover:bg-blue-50"
                      >
                        <Pencil className="size-5" />
                      </button>
                      <button
                        type="button"
                        aria-label={tr("grammar.tags.remove", { name: t.name })}
                        onClick={() => remove(t)}
                        className="inline-flex size-10 items-center justify-center rounded-full text-red hover:bg-red-50"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    </li>
                  ),
                )
              ) : (
                <li className="text-sm text-text-3">{tr("grammar.tags.none")}</li>
              )}
            </ul>
            <p className="text-[13.5px] text-text-3">{tr("grammar.tags.note")}</p>
            <DialogActions>
              <DialogClose asChild>
                <Button variant="solid">{tr("grammar.tags.done")}</Button>
              </DialogClose>
            </DialogActions>
          </DialogContent>
        ) : null}
      </Dialog>
      {confirmNode}
    </>
  );
}
