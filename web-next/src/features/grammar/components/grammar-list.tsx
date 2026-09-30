"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bookmark,
  Check,
  ChevronRight,
  Database,
  Eye,
  LayoutGrid,
  List,
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
import { useConfirm } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toaster";
import { GrammarIcon } from "@/components/layout/icons";
import { cn } from "@/lib/utils";
import { G_LIMITS, G_SORTS, structureLines, type GrammarListParams } from "../schema";
import { iconOf, pillClass } from "../icons";
import type { GrammarItem, ReceivedShare } from "../service";
import { createTagAction, deleteTagAction, importSampleGrammarAction, renameTagAction } from "../actions";
import { AcceptShareDialog, ShareGrammarDialog, rejectWithConfirm, type PendingShare } from "./grammar-dialogs";
import { useIntlTag, useT } from "@/i18n/client";

type Data = { items: GrammarItem[]; total: number; totalAll: number; savedCount: number };
type TagRow = { id: string; name: string; count: number };

/** Dạng lưới / danh sách, nhớ theo trình duyệt. */
const LAYOUT_KEY = "lingyu.grammar.layout";
const layoutListeners = new Set<() => void>();
const layoutStore = {
  get(): "grid" | "list" {
    try {
      return localStorage.getItem(LAYOUT_KEY) === "list" ? "list" : "grid";
    } catch {
      return "grid";
    }
  },
  set(m: "grid" | "list") {
    try {
      localStorage.setItem(LAYOUT_KEY, m);
    } catch {
      /* trình duyệt chặn lưu trữ */
    }
    layoutListeners.forEach((f) => f());
  },
  subscribe(f: () => void) {
    layoutListeners.add(f);
    return () => void layoutListeners.delete(f);
  },
};

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
  const layout = React.useSyncExternalStore(layoutStore.subscribe, layoutStore.get, () => "grid" as const);

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

  const listMode = params.view !== "shared";
  const views = [
    { key: "all" as const, label: t("grammar.viewAll"), icon: <GrammarIcon />, n: data.totalAll },
    { key: "saved" as const, label: t("grammar.viewSaved"), icon: <Bookmark />, n: data.savedCount },
    { key: "shared" as const, label: t("grammar.viewShared"), icon: <Share2 />, n: received.length, alert: true },
  ];

  return (
    <>
      <section aria-labelledby="gl-title" className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <h1 id="gl-title" className="text-[28px] font-extrabold tracking-tight text-navy-900 md:text-[34px]">
            {t("grammar.title")}
          </h1>
          <p className="mt-1 text-[15px] text-text-2 md:text-[16.5px]">{t("grammar.subtitle")}</p>
        </div>
        <Button asChild variant="solid" size="lg" className="shrink-0 max-sm:w-full">
          <Link href="/grammar/new">
            <Plus />
            {t("grammar.addNew")}
          </Link>
        </Button>
      </section>

      <section
        aria-label={t("grammar.list")}
        className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-white/92 p-4 shadow-card md:p-[22px]"
      >
        <div
          role="tablist"
          aria-label={t("grammar.viewMode")}
          className="-mx-1 flex [scrollbar-width:none] gap-1 overflow-x-auto px-1"
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
                  "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[14.5px] font-semibold [&_svg]:size-[17px]",
                  on ? "text-blue-600 underline decoration-2 underline-offset-8" : "text-text-2 hover:text-blue-600",
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
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div
                role="group"
                aria-label={t("grammar.filterTag")}
                className="-mx-4 flex min-w-0 flex-1 [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
              >
                <Chip on={!params.tag} onClick={() => go({ tag: "" })}>
                  {t("grammar.allCount", { count: data.totalAll })}
                </Chip>
                {tags.map((tg) => (
                  <Chip key={tg.id} on={tg.id === params.tag} onClick={() => go({ tag: tg.id })}>
                    {tg.name} ({tg.count})
                  </Chip>
                ))}
                <button
                  type="button"
                  onClick={() => setTagsOpen(true)}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-[12px] border-[1.5px] border-dashed border-[#BCD6F5] bg-white px-3.5 text-[14.5px] font-semibold whitespace-nowrap text-blue-600 hover:bg-blue-50"
                >
                  <Plus className="size-[18px]" />
                  {t("grammar.addTagChip")}
                </button>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <label className="min-w-0 flex-1 lg:w-[230px] lg:flex-none">
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
                <div
                  role="group"
                  aria-label={t("grammar.layout")}
                  className="flex gap-1 rounded-[14px] border border-border bg-white p-1"
                >
                  {(["grid", "list"] as const).map((m) => {
                    const Icon = m === "grid" ? LayoutGrid : List;
                    return (
                      <button
                        key={m}
                        type="button"
                        aria-pressed={layout === m}
                        onClick={() => layoutStore.set(m)}
                        className={cn(
                          "inline-flex min-h-10 items-center gap-1.5 rounded-[10px] border px-3 text-[14px] font-semibold whitespace-nowrap outline-none focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-[18px]",
                          layout === m
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-transparent text-text-2 hover:text-blue-600",
                        )}
                      >
                        <Icon aria-hidden="true" />
                        <span className="max-sm:sr-only">
                          {m === "grid" ? t("grammar.layoutGrid") : t("grammar.layoutList")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <label className="relative block">
              <span className="sr-only">{t("grammar.searchLabel")}</span>
              <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-text-3" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("grammar.searchPlaceholder")}
                autoComplete="off"
                className={cn(inputClass, "pl-12")}
              />
            </label>
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
              <div className={cn("grid gap-3.5", layout === "grid" && "lg:grid-cols-2")}>
                {data.items.map((g) => (
                  <GrammarCard key={g.id} g={g} onOpen={() => router.push(`/grammar/${g.id}`)} />
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
        "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-[12px] border-[1.5px] px-4 text-[14.5px] whitespace-nowrap",
        on
          ? "border-blue-600 bg-blue-600 font-bold text-white"
          : "border-transparent bg-[#EEF5FC] font-medium text-text-2 hover:bg-blue-100",
      )}
    >
      {children}
    </button>
  );
}

function GrammarCard({ g, onOpen }: { g: GrammarItem; onOpen: () => void }) {
  const t = useT();
  const k = iconOf(g);
  const main = structureLines(g.structure)[0];
  const hsk = g.tags.filter((tg) => /^hsk/i.test(tg.name));
  return (
    <article
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button, a")) return;
        onOpen();
      }}
      className="flex min-w-0 cursor-pointer items-end gap-3 rounded-2xl border border-border bg-white px-4 py-3.5 transition-[border-color,box-shadow] hover:border-[#A9D3F8] hover:shadow-[0_8px_22px_rgba(20,90,170,.08)] md:px-5 md:py-4"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div className="flex flex-wrap items-start gap-x-3 gap-y-1.5">
          <h2 className="min-w-0 flex-1 basis-[240px] text-[17px] leading-snug font-bold [overflow-wrap:anywhere] text-navy-900 md:text-[18.5px]">
            <Link href={`/grammar/${g.id}`} className="hover:text-blue-600">
              {g.title}
            </Link>
          </h2>
          <span className="flex shrink-0 flex-wrap gap-1.5">
            {hsk.map((tg) => (
              <span
                key={tg.id}
                className="rounded-[9px] bg-[#F0EAFF] px-2.5 py-1 text-[13px] font-semibold text-[#6B3FD0]"
              >
                {tg.name}
              </span>
            ))}
            <span className={cn("rounded-[9px] px-2.5 py-1 text-[13px] font-semibold", pillClass(k))}>
              {t(`grammar.icon.${k}`)}
            </span>
          </span>
        </div>
        {main ? (
          <span
            className="self-start rounded-[10px] bg-[#FFECEE] px-3.5 py-1.5 hanzi text-[16.5px] font-bold [overflow-wrap:anywhere] text-[#E0302F]"
            lang="zh"
          >
            {main}
          </span>
        ) : null}
        {g.sourceGrammarId ? (
          <span className="inline-flex items-center gap-1 text-[13px] text-green-700">
            <Share2 className="size-[14px]" />
            {t("grammar.receivedFrom", { name: g.sourceOwnerName || t("grammar.someoneElse") })}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onOpen}
        aria-label={t("grammar.openItem", { title: g.title })}
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-text-2 outline-none hover:border-[#A9D3F8] hover:text-blue-600 focus-visible:shadow-[var(--focus-ring)]"
      >
        <ChevronRight className="size-5" />
      </button>
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
