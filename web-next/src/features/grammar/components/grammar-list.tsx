"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bookmark,
  BookOpen,
  Check,
  Database,
  Eye,
  FileText,
  Lightbulb,
  MoreHorizontal,
  Pencil,
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
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { useConfirm } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toaster";
import { GrammarIcon, LeafDecor } from "@/components/layout/icons";
import { cn } from "@/lib/utils";
import { G_LIMITS, G_SORTS, type GrammarListParams } from "../schema";
import type { GrammarItem, ReceivedShare } from "../service";
import {
  createTagAction,
  deleteGrammarAction,
  deleteTagAction,
  importSampleGrammarAction,
  renameTagAction,
  setBookmarkAction,
} from "../actions";
import { StructureBox } from "./structure-box";
import { AcceptShareDialog, ShareGrammarDialog, rejectWithConfirm, type PendingShare } from "./grammar-dialogs";
import { useIntlTag, useT } from "@/i18n/client";

type Data = { items: GrammarItem[]; total: number; totalAll: number; savedCount: number };
type TagRow = { id: string; name: string; count: number };

export const fmtDate = (d: Date | string, tag = "vi-VN") =>
  new Date(d).toLocaleDateString(tag, { day: "2-digit", month: "2-digit", year: "numeric" });

export function GrammarList({
  data,
  params,
  tags,
  received,
}: {
  data: Data;
  params: GrammarListParams;
  tags: TagRow[];
  received: ReceivedShare[];
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

  const go = React.useCallback(
    (patch: Partial<GrammarListParams>) => {
      const n = { ...params, ...patch };
      const sp = new URLSearchParams();
      if (n.q.trim()) sp.set("q", n.q.trim());
      if (n.tag) sp.set("tag", n.tag);
      if (n.sort !== "updated") sp.set("sort", n.sort);
      if (n.view !== "all") sp.set("view", n.view);
      startTransition(() => router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false }));
    },
    [params, pathname, router],
  );
  React.useEffect(() => {
    if (q === params.q) return;
    const timer = setTimeout(() => go({ q }), 350);
    return () => clearTimeout(timer);
  }, [q, params.q, go]);
  const refresh = () => startTransition(() => router.refresh());

  async function toggleSave(g: GrammarItem) {
    const r = await setBookmarkAction(g.id, !g.isSaved);
    if (!r.ok) return void toast.error(r.message);
    toast.success(r.data ? t("grammar.savedToast") : t("grammar.unsavedToast"));
    refresh();
  }
  async function remove(g: GrammarItem) {
    const ok = await confirm({
      title: t("grammar.deleteTitle"),
      message: (
        <>
          {t("grammar.deleteConfirm")}
          <br />
          <strong>{g.title}</strong>
        </>
      ),
      confirmLabel: t("common.delete"),
      danger: true,
    });
    if (!ok) return;
    const r = await deleteGrammarAction(g.id);
    if (!r.ok) return void toast.error(r.message || t("grammar.deleteFailed"));
    toast.success(t("grammar.deleted"));
    refresh();
  }

  const listMode = params.view !== "shared";
  const views = [
    { key: "all" as const, label: t("grammar.viewAll"), icon: <GrammarIcon />, n: data.totalAll },
    { key: "saved" as const, label: t("grammar.viewSaved"), icon: <Bookmark />, n: data.savedCount },
    { key: "shared" as const, label: t("grammar.viewShared"), icon: <Share2 />, n: received.length, alert: true },
  ];

  return (
    <>
      <section
        aria-labelledby="gl-title"
        className="relative overflow-hidden rounded-[22px] border border-[#DDEBF8] bg-[linear-gradient(100deg,#F6FAFF_0%,#EDF5FE_55%,#E3F0FD_100%)] px-[18px] py-5 md:px-7 md:py-6"
      >
        {/* Lá trang trí */}
        <LeafDecor
          aria-hidden
          className="pointer-events-none absolute top-[58%] left-[47%] hidden w-9 -rotate-[25deg] opacity-70 2xl:block"
        />
        <LeafDecor
          aria-hidden
          className="pointer-events-none absolute bottom-3 left-[55%] hidden w-7 rotate-[35deg] opacity-60 2xl:block"
        />
        <LeafDecor
          aria-hidden
          className="pointer-events-none absolute top-5 right-[27%] hidden w-7 rotate-12 opacity-60 lg:block"
        />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-4 md:gap-5">
            <span className="hidden size-[72px] shrink-0 items-center justify-center rounded-[20px] bg-white text-blue-600 shadow-[0_8px_24px_rgba(21,149,245,.14)] sm:flex md:size-[84px]">
              <FileText className="size-10 md:size-12" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1
                id="gl-title"
                className="flex items-center gap-3 text-[28px] font-extrabold tracking-tight whitespace-nowrap text-navy-900 md:text-[40px]"
              >
                {t("grammar.title")}
                <LeafDecor className="w-10 md:w-11" />
              </h1>
              <p className="mt-1 text-[15px] text-text-2 md:text-[17px]">{t("grammar.subtitle")}</p>
            </div>
          </div>

          <div aria-hidden="true" className="hidden shrink-0 flex-col items-center 2xl:flex">
            <p className="-rotate-[7deg] text-center font-hand text-[24px] leading-tight font-semibold text-blue-700">
              {t("grammar.slogan1")}
              <br />
              {t("grammar.slogan2")}
            </p>
            <svg viewBox="0 0 170 24" className="mt-1 w-[170px] -rotate-[7deg] text-blue-600" fill="none">
              <path d="M2 20 C 50 6, 110 4, 168 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-3 lg:items-end">
            <Button asChild variant="solid" size="lg" className="max-lg:w-full">
              <Link href="/grammar/new">
                <Plus />
                {t("grammar.addNew")}
              </Link>
            </Button>
            <div aria-hidden="true" className="hidden items-center gap-1 xl:flex">
              <Image
                src="/brand/lingyu-wordmark.png"
                alt=""
                width={1579}
                height={550}
                className="h-auto w-[200px] xl:w-[230px]"
              />
              <Image
                src="/brand/lingyu-mascot.png"
                alt=""
                width={1536}
                height={1024}
                className="-my-4 h-auto w-[150px] xl:w-[170px]"
              />
            </div>
          </div>
        </div>
      </section>

      <section
        aria-label={t("grammar.list")}
        className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-white/92 p-4 shadow-card md:p-[22px]"
      >
        <div
          role="tablist"
          aria-label={t("grammar.viewMode")}
          className="-mx-1 flex [scrollbar-width:none] gap-2 overflow-x-auto border-b border-border px-1 pb-3"
        >
          {views.map((v) => {
            const on = params.view === v.key;
            return (
              <button
                key={v.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => go({ view: v.key })}
                className={cn(
                  "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-[10px] border-[1.5px] px-3.5 font-semibold [&_svg]:size-[18px]",
                  on
                    ? "border-blue bg-blue-50 text-blue-600"
                    : "border-transparent text-text-2 hover:bg-blue-50 hover:text-blue-600",
                )}
              >
                {v.icon}
                {v.label}
                {v.n ? (
                  <span
                    className={cn(
                      "rounded-full px-2 text-xs leading-5",
                      v.alert ? "bg-rose text-white" : "bg-[#E4EEF8] text-text-2",
                    )}
                  >
                    {v.n}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {listMode ? (
          <>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
              <label className="relative block">
                <span className="sr-only">{t("grammar.searchLabel")}</span>
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-text-3" />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("grammar.searchPlaceholder")}
                  autoComplete="off"
                  className={cn(inputClass, "pl-11")}
                />
              </label>
              <label>
                <span className="sr-only">{t("grammar.sort")}</span>
                <select
                  value={params.sort}
                  onChange={(e) => go({ sort: e.target.value as GrammarListParams["sort"] })}
                  className={cn(inputClass, "cursor-pointer")}
                >
                  {G_SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {t(s.label)}
                    </option>
                  ))}
                </select>
              </label>
              <Button variant="secondary" onClick={() => setTagsOpen(true)}>
                <TagIcon />
                {t("grammar.manageTags")}
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-sm font-semibold text-text-2 max-md:hidden">{t("grammar.tagsLabel")}</span>
              <div
                role="group"
                aria-label={t("grammar.filterTag")}
                className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
              >
                <Chip on={!params.tag} onClick={() => go({ tag: "" })}>
                  {t("grammar.all")} <span className="opacity-70">{data.totalAll}</span>
                </Chip>
                {tags.map((tg) => (
                  <Chip key={tg.id} on={tg.id === params.tag} onClick={() => go({ tag: tg.id })}>
                    {tg.name} <span className="opacity-70">{tg.count}</span>
                  </Chip>
                ))}
              </div>
            </div>
          </>
        ) : null}

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
            <EmptyAll onDone={refresh} />
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
            <>
              <p className="mb-3 text-[13.5px] text-text-3">{t("grammar.total", { count: data.total })}</p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,250px),1fr))] gap-4">
                {data.items.map((g) => (
                  <GrammarCard
                    key={g.id}
                    g={g}
                    onOpen={() => router.push(`/grammar/${g.id}`)}
                    onSave={() => toggleSave(g)}
                    onShare={() => setShareOf(g)}
                    onEdit={() => router.push(`/grammar/${g.id}/edit`)}
                    onDelete={() => remove(g)}
                  />
                ))}
              </div>
            </>
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

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-[10px] border-[1.5px] px-3.5 text-[14.5px] whitespace-nowrap",
        on
          ? "border-blue bg-blue-50 font-bold text-blue-600"
          : "border-transparent bg-[#EEF5FC] font-medium text-text-2 hover:bg-blue-100",
      )}
    >
      {children}
    </button>
  );
}

function GrammarCard({
  g,
  onOpen,
  onSave,
  onShare,
  onEdit,
  onDelete,
}: {
  g: GrammarItem;
  onOpen: () => void;
  onSave: () => void;
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const btn =
    "inline-flex size-10 shrink-0 items-center justify-center rounded-full text-blue-600 outline-none hover:bg-blue-50 focus-visible:shadow-[var(--focus-ring)] md:size-9 [&_svg]:size-5";
  return (
    <article
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button, a")) return;
        onOpen();
      }}
      className="flex min-w-0 cursor-pointer flex-col gap-2.5 rounded-lg border border-border bg-white p-[18px] transition-[border-color,box-shadow] hover:border-[#A9D3F8] hover:shadow-[0_8px_22px_rgba(20,90,170,.08)]"
    >
      <div className="flex items-start gap-1">
        <h2 className="mt-1.5 min-w-0 flex-1 text-[19px] leading-snug font-bold [overflow-wrap:anywhere] text-navy">
          <Link href={`/grammar/${g.id}`} className="hover:text-blue-600">
            {g.title}
          </Link>
        </h2>
        <button
          type="button"
          onClick={onSave}
          aria-pressed={g.isSaved}
          aria-label={
            g.isSaved ? t("grammar.unsaveItem", { title: g.title }) : t("grammar.saveItem", { title: g.title })
          }
          className={cn(btn, g.isSaved && "text-amber")}
        >
          <Bookmark className={cn(g.isSaved && "fill-amber")} />
        </button>
        <Menu>
          <MenuTrigger asChild>
            <button type="button" className={btn} aria-label={t("grammar.actionsFor", { title: g.title })}>
              <MoreHorizontal />
            </button>
          </MenuTrigger>
          <MenuContent className="w-[210px]">
            <MenuItem onSelect={onOpen}>
              <Eye />
              {t("grammar.view")}
            </MenuItem>
            <MenuItem onSelect={onEdit}>
              <Pencil />
              {t("grammar.editAction")}
            </MenuItem>
            <MenuItem onSelect={onShare}>
              <Share2 />
              {t("grammar.share")}
            </MenuItem>
            <MenuItem onSelect={onSave}>
              <Bookmark />
              {g.isSaved ? t("grammar.unsave") : t("grammar.save")}
            </MenuItem>
            <MenuSeparator />
            <MenuItem danger onSelect={onDelete}>
              <Trash2 />
              {t("grammar.delete")}
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>
      <StructureBox structure={g.structure} />
      {g.meaning ? (
        <div className="flex items-start gap-3 rounded-xl bg-[#EEF6FF] px-3.5 py-2.5 text-[15.5px]">
          <span className="inline-flex items-center gap-1.5 border-r-2 border-[#C9E1F8] pr-3 font-semibold whitespace-nowrap text-blue-600">
            <Lightbulb className="size-5" />
            {t("grammar.meaning")}
          </span>
          <span className="line-clamp-2 min-w-0 [overflow-wrap:anywhere] text-text-2">{g.meaning}</span>
        </div>
      ) : null}
      {g.tags.length ? (
        <div className="flex flex-wrap gap-1.5">
          {g.tags.map((tg) => (
            <span
              key={tg.id}
              className="rounded-[9px] bg-[#F0EAFF] px-3 py-1 text-[13.5px] font-semibold text-[#6B3FD0]"
            >
              {tg.name}
            </span>
          ))}
        </div>
      ) : null}
      {g.examples.length || g.sourceGrammarId ? (
        <div className="mt-auto flex flex-wrap gap-x-[18px] gap-y-1.5 text-sm text-text-2">
          {g.examples.length ? (
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="size-[18px]" />
              {t("grammar.examplesCount", { count: g.examples.length })}
            </span>
          ) : null}
          {g.sourceGrammarId ? (
            <span className="inline-flex items-center gap-1 text-green-700">
              <Share2 className="size-[15px]" />
              {t("grammar.receivedFrom", { name: g.sourceOwnerName || t("grammar.someoneElse") })}
            </span>
          ) : null}
        </div>
      ) : null}
    </article>
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

function EmptyAll({ onDone }: { onDone: () => void }) {
  const t = useT();
  const [busy, setBusy] = React.useState(false);
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
        <Button
          variant="secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const r = await importSampleGrammarAction();
            setBusy(false);
            if (!r.ok) return void toast.error(r.message);
            toast.success(t("grammar.sampleAdded", { count: r.data }));
            onDone();
          }}
        >
          <Database />
          {busy ? t("vocab.sampleAdding") : t("vocab.useSample")}
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
