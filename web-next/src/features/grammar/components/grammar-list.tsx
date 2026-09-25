"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bookmark,
  BookOpen,
  Check,
  Database,
  Eye,
  Layers,
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
import { AcceptShareDialog, ShareGrammarDialog, rejectWithConfirm, type PendingShare } from "./grammar-dialogs";

type Data = { items: GrammarItem[]; total: number; totalAll: number; savedCount: number };
type TagRow = { id: string; name: string; count: number };

export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

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
    const t = setTimeout(() => go({ q }), 350);
    return () => clearTimeout(t);
  }, [q, params.q, go]);
  const refresh = () => startTransition(() => router.refresh());

  async function toggleSave(g: GrammarItem) {
    const r = await setBookmarkAction(g.id, !g.isSaved);
    if (!r.ok) return void toast.error(r.message);
    toast.success(r.data ? "Đã lưu vào mục Đã lưu." : "Đã bỏ lưu.");
    refresh();
  }
  async function remove(g: GrammarItem) {
    const ok = await confirm({
      title: "Xóa ngữ pháp?",
      message: (
        <>
          Bạn có chắc muốn xóa ngữ pháp này?
          <br />
          <strong>{g.title}</strong>
        </>
      ),
      confirmLabel: "Xóa",
      danger: true,
    });
    if (!ok) return;
    const r = await deleteGrammarAction(g.id);
    if (!r.ok) return void toast.error(r.message || "Không xóa được. Vui lòng thử lại.");
    toast.success("Đã xóa ngữ pháp.");
    refresh();
  }

  const listMode = params.view !== "shared";
  const views = [
    { key: "all" as const, label: "Tất cả", icon: <GrammarIcon />, n: data.totalAll },
    { key: "saved" as const, label: "Đã lưu", icon: <Bookmark />, n: data.savedCount },
    { key: "shared" as const, label: "Được chia sẻ", icon: <Share2 />, n: received.length, alert: true },
  ];

  return (
    <>
      <section
        aria-labelledby="gl-title"
        className="relative flex flex-col gap-4 overflow-hidden rounded-[22px] border border-[#DDEBF8] bg-[linear-gradient(100deg,#F4F9FF_0%,#E9F3FE_60%,#E1EFFD_100%)] px-[18px] py-[22px] md:flex-row md:items-center md:px-8 md:py-7"
      >
        <div className="min-w-0 flex-1">
          <h1
            id="gl-title"
            className="flex items-center gap-3 text-[26px] font-extrabold tracking-tight text-text md:text-[34px]"
          >
            Ngữ pháp
            <LeafDecor className="w-10" />
          </h1>
          <p className="mt-1.5 text-[15px] text-text-2 md:text-[17px]">
            Tự tạo, lưu và chia sẻ các điểm ngữ pháp tiếng Trung của bạn.
          </p>
        </div>
        <Button asChild variant="solid" className="shrink-0 max-md:w-full">
          <Link href="/grammar/new">
            <Plus />
            Thêm ngữ pháp mới
          </Link>
        </Button>
      </section>

      <section
        aria-label="Danh sách ngữ pháp"
        className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-white/92 p-4 shadow-card md:p-[22px]"
      >
        <div
          role="tablist"
          aria-label="Chế độ xem"
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
                <span className="sr-only">Tìm kiếm ngữ pháp</span>
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-text-3" />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm kiếm ngữ pháp..."
                  autoComplete="off"
                  className={cn(inputClass, "pl-11")}
                />
              </label>
              <label>
                <span className="sr-only">Sắp xếp</span>
                <select
                  value={params.sort}
                  onChange={(e) => go({ sort: e.target.value as GrammarListParams["sort"] })}
                  className={cn(inputClass, "cursor-pointer")}
                >
                  {G_SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <Button variant="secondary" onClick={() => setTagsOpen(true)}>
                <TagIcon />
                Quản lý thẻ
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-sm font-semibold text-text-2 max-md:hidden">Thẻ (Tags)</span>
              <div
                role="group"
                aria-label="Lọc theo thẻ"
                className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
              >
                <Chip on={!params.tag} onClick={() => go({ tag: "" })}>
                  Tất cả <span className="opacity-70">{data.totalAll}</span>
                </Chip>
                {tags.map((t) => (
                  <Chip key={t.id} on={t.id === params.tag} onClick={() => go({ tag: t.id })}>
                    {t.name} <span className="opacity-70">{t.count}</span>
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
              <h3 className="text-xl font-bold text-navy">Không có ngữ pháp phù hợp</h3>
              <p className="max-w-[420px] text-text-2">
                {params.view === "saved" && !params.q && !params.tag
                  ? "Bạn chưa lưu ngữ pháp nào. Bấm biểu tượng dấu trang để lưu."
                  : `Thử từ khoá khác hoặc bỏ bộ lọc${params.q ? ` cho “${params.q}”` : ""}.`}
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
                  Xóa bộ lọc
                </Button>
              ) : null}
            </div>
          ) : (
            <>
              <p className="mb-3 text-[13.5px] text-text-3">{data.total} ngữ pháp</p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4">
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
        myTags={tags.map((t) => t.name)}
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
          aria-label={`${g.isSaved ? "Bỏ lưu" : "Lưu"} “${g.title}”`}
          className={cn(btn, g.isSaved && "text-amber")}
        >
          <Bookmark className={cn(g.isSaved && "fill-amber")} />
        </button>
        <Menu>
          <MenuTrigger asChild>
            <button type="button" className={btn} aria-label={`Thao tác cho “${g.title}”`}>
              <MoreHorizontal />
            </button>
          </MenuTrigger>
          <MenuContent className="w-[210px]">
            <MenuItem onSelect={onOpen}>
              <Eye />
              Xem
            </MenuItem>
            <MenuItem onSelect={onEdit}>
              <Pencil />
              Chỉnh sửa
            </MenuItem>
            <MenuItem onSelect={onShare}>
              <Share2 />
              Chia sẻ
            </MenuItem>
            <MenuItem onSelect={onSave}>
              <Bookmark />
              {g.isSaved ? "Bỏ lưu" : "Lưu"}
            </MenuItem>
            <MenuSeparator />
            <MenuItem danger onSelect={onDelete}>
              <Trash2 />
              Xóa
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>
      {g.structure ? (
        <div className="flex items-center gap-3.5 rounded-[14px] border-[1.5px] border-dashed border-[#F8B9C3] bg-[#FFF1F3] px-3.5 py-2.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#FFE3E8] text-rose">
            <Layers className="size-[26px]" />
          </span>
          <span
            lang="zh"
            className="min-w-0 font-cn text-[19px] leading-snug font-bold [overflow-wrap:anywhere] text-rose"
          >
            {g.structure}
          </span>
        </div>
      ) : null}
      {g.meaning ? (
        <div className="flex items-start gap-3 rounded-xl bg-[#EEF6FF] px-3.5 py-2.5 text-[15.5px]">
          <span className="inline-flex items-center gap-1.5 border-r-2 border-[#C9E1F8] pr-3 font-semibold whitespace-nowrap text-blue-600">
            <Lightbulb className="size-5" />Ý nghĩa:
          </span>
          <span className="line-clamp-2 min-w-0 [overflow-wrap:anywhere] text-text-2">{g.meaning}</span>
        </div>
      ) : null}
      {g.tags.length ? (
        <div className="flex flex-wrap gap-1.5">
          {g.tags.map((t) => (
            <span
              key={t.id}
              className="rounded-[9px] bg-[#F0EAFF] px-3 py-1 text-[13.5px] font-semibold text-[#6B3FD0]"
            >
              {t.name}
            </span>
          ))}
        </div>
      ) : null}
      {g.examples.length || g.sourceGrammarId ? (
        <div className="mt-auto flex flex-wrap gap-x-[18px] gap-y-1.5 text-sm text-text-2">
          {g.examples.length ? (
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="size-[18px]" />
              {g.examples.length} ví dụ
            </span>
          ) : null}
          {g.sourceGrammarId ? (
            <span className="inline-flex items-center gap-1 text-green-700">
              <Share2 className="size-[15px]" />
              Nhận từ {g.sourceOwnerName || "người khác"}
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
  if (!received.length)
    return (
      <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Share2 className="size-7" />
        </span>
        <h3 className="text-xl font-bold text-navy">Không có lời mời nào</h3>
        <p className="max-w-[420px] text-text-2">
          Khi ai đó chia sẻ ngữ pháp với bạn, lời mời sẽ xuất hiện ở đây và trong chuông thông báo.
        </p>
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
            <strong className="text-text">{s.senderName}</strong> đã chia sẻ một ngữ pháp với bạn.
            <div className="my-0.5 font-bold text-navy">{s.grammarTitle}</div>
            <span className="text-[13.5px] text-text-3">
              {fmtDate(s.createdAt)} · {s.senderEmail}
            </span>
          </div>
          <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto">
            {s.grammarId ? (
              <>
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/grammar/${s.grammarId}?share=${s.id}`}>
                    <Eye />
                    Xem
                  </Link>
                </Button>
                <Button size="sm" variant="solid" onClick={() => onAccept(s)}>
                  <Check />
                  Chấp nhận
                </Button>
              </>
            ) : (
              <span className="col-span-2 self-center text-sm text-text-3">Ngữ pháp gốc đã bị xóa</span>
            )}
            <Button size="sm" variant="muted" onClick={() => onReject(s)}>
              <X />
              Từ chối
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyAll({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = React.useState(false);
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <GrammarIcon className="size-7" />
      </span>
      <h3 className="text-xl font-bold text-navy">Chưa có ngữ pháp nào</h3>
      <p className="max-w-[420px] text-text-2">Tạo điểm ngữ pháp đầu tiên của bạn, hoặc dùng dữ liệu mẫu để xem thử.</p>
      <div className="flex w-full max-w-md flex-col gap-2.5 sm:w-auto sm:flex-row">
        <Button asChild variant="solid">
          <Link href="/grammar/new">
            <Plus />
            Thêm ngữ pháp mới
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
            toast.success(`Đã thêm ${r.data} ngữ pháp mẫu.`);
            onDone();
          }}
        >
          <Database />
          {busy ? "Đang thêm..." : "Dùng dữ liệu mẫu"}
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
    toast.success(`Đã tạo thẻ “${r.data.name}”.`);
    onChanged();
  }
  async function rename(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const r = await renameTagAction(editing.id, editing.name);
    if (!r.ok) return void setErr(r.message);
    setEditing(null);
    setErr("");
    toast.success("Đã đổi tên thẻ.");
    onChanged();
  }
  async function remove(t: TagRow) {
    const ok = await confirm({
      title: "Xóa thẻ?",
      message: (
        <>
          Thẻ <strong>{t.name}</strong> sẽ bị bỏ khỏi {t.count} ngữ pháp. Các ngữ pháp vẫn được giữ nguyên.
        </>
      ),
      confirmLabel: "Xóa thẻ",
      danger: true,
    });
    if (!ok) return;
    const r = await deleteTagAction(t.id);
    if (!r.ok) return void setErr(r.message);
    toast.success(`Đã xóa thẻ “${t.name}”.`);
    onChanged();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        {open ? (
          <DialogContent title="Quản lý thẻ" icon={<TagIcon />} wide>
            <form onSubmit={create} noValidate className="flex gap-2">
              <label className="min-w-0 flex-1">
                <span className="sr-only">Tên thẻ mới</span>
                <Input
                  value={name}
                  maxLength={G_LIMITS.tag}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErr("");
                  }}
                  placeholder="Tên thẻ mới (vd: HSK1)"
                  autoComplete="off"
                />
              </label>
              <Button type="submit" variant="solid">
                <Plus />
                Tạo thẻ
              </Button>
            </form>
            {err ? (
              <p role="alert" className="text-sm text-red">
                {err}
              </p>
            ) : null}
            <ul className="flex max-h-[45dvh] flex-col gap-1.5 overflow-y-auto">
              {tags.length ? (
                tags.map((t) =>
                  editing?.id === t.id ? (
                    <li key={t.id}>
                      <form onSubmit={rename} noValidate className="flex gap-2">
                        <label className="min-w-0 flex-1">
                          <span className="sr-only">Tên mới cho thẻ {t.name}</span>
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
                          Lưu
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(null)}>
                          Hủy
                        </Button>
                      </form>
                    </li>
                  ) : (
                    <li key={t.id} className="flex items-center gap-2 rounded-md bg-bg px-3 py-1.5">
                      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                        <Tag name={t.name} />
                        <span className="text-[13.5px] text-text-3">{t.count} ngữ pháp</span>
                      </span>
                      <button
                        type="button"
                        aria-label={`Đổi tên thẻ ${t.name}`}
                        onClick={() => setEditing({ id: t.id, name: t.name })}
                        className="inline-flex size-10 items-center justify-center rounded-full text-blue-600 hover:bg-blue-50"
                      >
                        <Pencil className="size-5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Xóa thẻ ${t.name}`}
                        onClick={() => remove(t)}
                        className="inline-flex size-10 items-center justify-center rounded-full text-red hover:bg-red-50"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    </li>
                  ),
                )
              ) : (
                <li className="text-sm text-text-3">Chưa có thẻ nào.</li>
              )}
            </ul>
            <p className="text-[13.5px] text-text-3">Xóa thẻ chỉ bỏ thẻ khỏi các ngữ pháp, không xóa ngữ pháp.</p>
            <DialogActions>
              <DialogClose asChild>
                <Button variant="solid">Xong</Button>
              </DialogClose>
            </DialogActions>
          </DialogContent>
        ) : null}
      </Dialog>
      {confirmNode}
    </>
  );
}
