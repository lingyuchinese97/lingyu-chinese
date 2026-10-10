"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
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
import { Input } from "@/components/ui/input";
import { Tag } from "@/components/ui/badges";
import { Dialog, DialogActions, DialogClose, DialogContent } from "@/components/ui/dialog";
import { useConfirm } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toaster";
import { GrammarIcon, LeafDecor } from "@/components/layout/icons";
import { cn } from "@/lib/utils";
import { G_LIMITS, hskOfTag, structureLines, type GrammarListParams } from "../schema";
import { Marked } from "./hanzi-mark";
import { FormulaLine } from "./structure-box";
import { GrammarBody } from "./grammar-view";
import type { GrammarItem, ReceivedShare } from "../service";
import { createTagAction, deleteTagAction, renameTagAction, setBookmarkAction } from "../actions";
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
  const [preview, setPreview] = React.useState<GrammarItem | null>(null);
  const userTags = tags.filter((tg) => hskOfTag(tg.name) === null);
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
  const pickTag = (v: string) => {
    if (v === "manage") return setTagsOpen(true);
    if (v === "view:shared") return go({ view: "shared", tag: "" });
    go({ view: params.view === "shared" ? "all" : params.view, tag: v.replace(/^tag:/, "") });
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

      {/* Khung danh sách (theo design): "Ngữ pháp" + số điểm ngữ pháp + Thêm ngữ pháp · tìm · HSK · tag · tab Tất cả / Đã lưu · bảng. */}
      <section
        aria-label={t("grammar.list")}
        className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-[#E8EFF7] bg-white p-4 shadow-card md:p-7"
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <h2 className="text-[30px] leading-none font-extrabold tracking-tight text-navy-900 md:text-[36px]">
            {t("grammar.title")}
          </h2>
          <LeafDecor className="-ml-1 w-7" />
          <span className="text-[16.5px] text-[#526B91]">{t("grammar.points", { count: data.totalAll })}</span>
          <Link
            href="/grammar/new"
            className="ml-auto inline-flex h-12 items-center gap-2.5 rounded-[8px] bg-[#1668DC] px-5 text-[17px] text-white shadow-[0_6px_14px_rgba(22,104,220,.25)] outline-none hover:bg-[#135BC4] focus-visible:shadow-[var(--focus-ring)] max-sm:w-full max-sm:justify-center [&_svg]:size-5"
          >
            <Plus aria-hidden="true" />
            {t("grammar.addGrammar")}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-[minmax(0,1fr)_224px_256px]">
          <label className="relative col-span-2 block md:col-span-1">
            <span className="sr-only">{t("grammar.searchLabel")}</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#526B91]" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("grammar.searchShort")}
              autoComplete="off"
              disabled={!listMode}
              className={cn(selectCls, "pl-12")}
            />
          </label>
          <label>
            <span className="sr-only">{t("grammar.hskLabel")}</span>
            <select
              value={params.hsk}
              disabled={!listMode}
              onChange={(e) => go({ hsk: e.target.value as GrammarListParams["hsk"] })}
              className={cn(selectCls, "cursor-pointer")}
            >
              <option value="">{t("grammar.allHsk")}</option>
              {(["1", "2", "3", "4", "5", "6", "other"] as const).map((h) => {
                const n = data.hskCounts[h] ?? 0;
                return (
                  <option key={h} value={h}>
                    {h === "other" ? t("grammar.hskOther", { count: n }) : `HSK ${h} (${n})`}
                  </option>
                );
              })}
            </select>
          </label>
          <label>
            <span className="sr-only">{t("grammar.tagLabel")}</span>
            <select
              value={params.view === "shared" ? "view:shared" : params.tag ? `tag:${params.tag}` : ""}
              onChange={(e) => pickTag(e.target.value)}
              className={cn(selectCls, "cursor-pointer")}
            >
              <option value="">{t("grammar.allTagsOpt")}</option>
              {userTags.map((tg) => (
                <option key={tg.id} value={`tag:${tg.id}`}>
                  {tg.name} ({tg.count})
                </option>
              ))}
              <option value="view:shared">
                {t("grammar.viewShared")} ({received.length})
              </option>
              <option value="manage">{t("grammar.manageTags")}…</option>
            </select>
          </label>
        </div>
        <div role="tablist" aria-label={t("grammar.list")} className="-mb-1 flex gap-2 border-b border-[#E8EFF7]">
          {(["all", "saved"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={params.view === v}
              onClick={() => go({ view: v })}
              className={cn(
                "-mb-px min-h-11 border-b-[3px] px-4 text-[17px] outline-none focus-visible:shadow-[var(--focus-ring)]",
                params.view === v
                  ? "border-[#1668DC] font-semibold text-[#1668DC]"
                  : "border-transparent text-[#526B91] hover:text-navy-900",
              )}
            >
              {v === "all" ? t("grammar.viewAll") : t("grammar.viewSaved")}
            </button>
          ))}
        </div>
        {listMode ? <p className="sr-only">{t("grammar.total", { count: data.total })}</p> : null}
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
            <GrammarTable items={data.items} titlePy={titlePy} onPreview={setPreview} />
          )}
        </div>
      </section>

      <GrammarPreview
        g={preview}
        py={preview ? (titlePy[preview.id] ?? "") : ""}
        onClose={() => setPreview(null)}
        onShare={(g) => {
          setPreview(null);
          setShareOf(g);
        }}
        onChanged={refresh}
      />
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
const NO_KEYS = new Set<string>();
const selectCls =
  "h-12 w-full rounded-[8px] border border-[#D5DEEA] bg-white px-4 text-[16.5px] text-[#172B4D] outline-none placeholder:text-[#7A8AA6] focus:border-[#1668DC] focus-visible:shadow-[var(--focus-ring)] disabled:opacity-60";

/**
 * Bảng ngữ pháp (theo thiết kế): hàng tiêu đề nền xanh nhạt; mỗi ngữ pháp một hàng thẻ trắng — STT · tên (chữ Hán Kai ·
 * pinyin) · cấu trúc dòng đầu (chữ Hán Kai đỏ, "+N" nếu còn dòng khác) · HSK · con mắt (mở popup xem nhanh); phân trang.
 */
function GrammarTable({
  items,
  titlePy,
  onPreview,
}: {
  items: GrammarItem[];
  titlePy: Record<string, string>;
  onPreview: (g: GrammarItem) => void;
}) {
  const t = useT();
  // Trang hiện tại gắn với danh sách: lọc / tìm ra danh sách mới → về trang 1.
  const [pg, setPg] = React.useState({ of: items, n: 1 });
  const pages = Math.max(1, Math.ceil(items.length / PAGE));
  const page = pg.of === items ? Math.min(pg.n, pages) : 1;
  const from = (page - 1) * PAGE;
  const rows = items.slice(from, from + PAGE);
  const th = "px-4 py-3.5 text-left text-[17px] font-semibold text-navy-900";
  const td = "border-b border-[#E8EFF7] px-4 py-3";
  return (
    <div className="flex flex-col gap-4">
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="bg-[#E6F0FC]">
            <th scope="col" className={cn(th, "hidden w-24 rounded-tl-[10px] pl-6 sm:table-cell")}>
              {t("grammar.colNo")}
            </th>
            <th scope="col" className={cn(th, "max-sm:rounded-tl-[10px]")}>
              {t("grammar.colGrammar")}
            </th>
            <th scope="col" className={cn(th, "hidden md:table-cell")}>
              {t("grammar.colStructure")}
            </th>
            <th scope="col" className={cn(th, "w-16 rounded-tr-[10px] md:w-20")}>
              <span className="sr-only">{t("grammar.colView")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((g, i) => {
            const lines = structureLines(g.structure);
            const formula = lines[0] ? (
              <span className="inline-flex max-w-full flex-wrap items-center gap-x-5 gap-y-1">
                <span className="max-w-full rounded-[6px] bg-[#FFF4E3] px-4 py-1.5">
                  <FormulaLine formula={lines[0]} keys={NO_KEYS} className="text-[17px] text-[#172B4D]" />
                </span>
                {lines.length > 1 ? (
                  <span className="text-[15.5px] text-[#526B91]">
                    {t("grammar.moreStructures", { count: lines.length - 1 })}
                  </span>
                ) : null}
              </span>
            ) : null;
            return (
              <tr
                key={g.id}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("button, a")) return;
                  onPreview(g);
                }}
                className="cursor-pointer align-middle hover:bg-[#F7FBFF]"
              >
                <td className={cn(td, "hidden pl-8 text-[17px] text-[#172B4D] tabular-nums sm:table-cell")}>
                  {from + i + 1}
                </td>
                <td className={td}>
                  <h2 className="text-[18px] leading-snug font-bold [overflow-wrap:anywhere] text-navy-900 md:text-[19px]">
                    <Link href={`/grammar/${g.id}`} className="hover:text-[#1668DC]">
                      <Marked text={g.title} hanClass="text-[1.1em] text-navy-900" />
                    </Link>
                    {titlePy[g.id] ? <span aria-hidden="true"> · {titlePy[g.id]}</span> : null}
                  </h2>
                  {formula ? <div className="mt-1.5 md:hidden">{formula}</div> : null}
                  {g.sourceGrammarId ? (
                    <span className="mt-1 inline-flex items-center gap-1 text-[13px] text-green-700">
                      <Share2 className="size-[14px]" />
                      {t("grammar.receivedFrom", { name: g.sourceOwnerName || t("grammar.someoneElse") })}
                    </span>
                  ) : null}
                </td>
                <td className={cn(td, "hidden md:table-cell")}>{formula ?? <span className="text-text-3">—</span>}</td>
                <td className={cn(td, "px-2 text-center")}>
                  <button
                    type="button"
                    onClick={() => onPreview(g)}
                    aria-label={t("grammar.openItem", { title: g.title })}
                    className="inline-flex size-11 items-center justify-center rounded-full text-[#1668DC] outline-none hover:bg-[#E6F1FD] focus-visible:shadow-[var(--focus-ring)]"
                  >
                    <Eye className="size-6" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {items.length > PAGE ? (
        <nav aria-label={t("grammar.pagination")} className="flex flex-wrap items-center gap-2">
          <span className="text-[16px] text-[#526B91] tabular-nums">
            {from + 1}–{from + rows.length} / {items.length}
          </span>
          <span className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPg({ of: items, n: page - 1 })}
              aria-label={t("grammar.prevPage")}
              className={pageBtn}
            >
              <ChevronLeft className="size-5" />
            </button>
            {Array.from({ length: pages }, (_, k) => k + 1).map((n) => (
              <button
                key={n}
                type="button"
                aria-current={n === page ? "page" : undefined}
                aria-label={t("grammar.pageN", { n })}
                onClick={() => setPg({ of: items, n })}
                className={cn(pageBtn, n === page && "border-[#1668DC] bg-[#1668DC] text-white hover:bg-[#1668DC]")}
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
              <ChevronRight className="size-5" />
            </button>
          </span>
        </nav>
      ) : null}
    </div>
  );
}

const pageBtn =
  "inline-flex size-12 items-center justify-center rounded-[8px] border border-[#DCE6F2] bg-white text-[16px] text-[#172B4D] outline-none hover:bg-[#F1F6FD] focus-visible:shadow-[var(--focus-ring)] disabled:opacity-40 [&_svg]:text-[#1668DC]";

/** Popup xem nhanh (bấm con mắt / hàng): tiêu đề · HSK · Lưu · Chia sẻ; nội dung như trang chi tiết; Đóng · Xem chi tiết. */
function GrammarPreview({
  g,
  py,
  onClose,
  onShare,
  onChanged,
}: {
  g: GrammarItem | null;
  py: string;
  onClose: () => void;
  onShare: (g: GrammarItem) => void;
  onChanged: () => void;
}) {
  const t = useT();
  const [saved, setSaved] = React.useState<{ id: string; on: boolean } | null>(null);
  const isSaved = g ? (saved?.id === g.id ? saved.on : g.isSaved) : false;
  async function toggle() {
    if (!g) return;
    const r = await setBookmarkAction(g.id, !isSaved);
    if (!r.ok) return void toast.error(r.message);
    setSaved({ id: g.id, on: r.data });
    toast.success(r.data ? t("grammar.savedToast") : t("grammar.unsavedToast"));
    onChanged();
  }
  const hsk = g?.tags.filter((tg) => hskOfTag(tg.name) !== null) ?? [];
  const btn =
    "inline-flex min-h-11 items-center gap-2 rounded-[8px] border border-[#D5DEEA] bg-white px-4 text-[16px] text-[#172B4D] outline-none hover:bg-[#F1F6FD] focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-5 [&_svg]:text-navy-900";
  return (
    <Dialog open={!!g} onOpenChange={(o) => !o && onClose()}>
      {g ? (
        <DialogContent
          className="md:max-w-[1080px] md:p-8"
          title={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[24px] leading-tight font-extrabold [overflow-wrap:anywhere] text-navy-900 md:text-[30px]">
              <span>
                <Marked text={g.title} hanClass="text-navy-900" />
                {py ? (
                  <span aria-hidden="true" className="font-normal">
                    {" "}
                    · {py}
                  </span>
                ) : null}
              </span>
              {hsk.map((tg) => (
                <span
                  key={tg.id}
                  className="rounded-[6px] bg-[#E6F0FC] px-3 py-1 text-[16px] font-normal text-[#1668DC]"
                >
                  {tg.name}
                </span>
              ))}
            </span>
          }
          aside={
            <>
              <button type="button" onClick={toggle} aria-pressed={isSaved} className={btn}>
                <Bookmark className={cn(isSaved && "fill-amber text-amber!")} />
                {isSaved ? t("grammar.detail.saved") : t("grammar.save")}
              </button>
              <button type="button" onClick={() => onShare(g)} className={btn}>
                <Share2 />
                {t("grammar.share")}
              </button>
            </>
          }
        >
          <GrammarBody
            g={g}
            canEdit
            menu={false}
            labels={{
              meaning: t("grammar.detail.meaning"),
              structure: t("grammar.detail.structure"),
              remember: t("grammar.detail.remember"),
              empty: t("grammar.detail.empty"),
            }}
          />
          <div className="-mx-[18px] mt-1 flex flex-wrap justify-between gap-3 border-t border-[#E8EFF7] px-[18px] pt-5 md:-mx-8 md:px-8">
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex min-h-12 min-w-[150px] items-center justify-center rounded-[8px] border-[1.5px] border-[#1668DC] bg-white px-6 text-[17px] font-semibold text-[#1668DC] outline-none hover:bg-[#F1F6FD] focus-visible:shadow-[var(--focus-ring)] max-sm:flex-1"
              >
                {t("common.close")}
              </button>
            </DialogClose>
            <Link
              href={`/grammar/${g.id}`}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] bg-[#1668DC] px-7 text-[17px] font-semibold text-white outline-none hover:bg-[#135BC4] focus-visible:shadow-[var(--focus-ring)] max-sm:flex-1 [&_svg]:size-5"
            >
              {t("grammar.openDetail")}
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

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
