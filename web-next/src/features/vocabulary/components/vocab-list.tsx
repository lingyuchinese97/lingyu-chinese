"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Eye,
  ImageIcon,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
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
import { SORTS, STATUS_LABEL, type ListParams } from "../schema";
import type { VocabItem, VocabList } from "../service";
import { deleteVocabAction, importSampleAction, setStatusAction, toggleFavoriteAction } from "../actions";
import { AddTagDialog } from "./add-tag-dialog";

/** Ghi chú dài quá 10 ký tự → hiện "…" + nút con mắt để xem đầy đủ (như bản cũ). */
const NOTE_PREVIEW = 10;
const shortNote = (note: string) => {
  const chars = Array.from(note.trim());
  return chars.length > NOTE_PREVIEW ? chars.slice(0, NOTE_PREVIEW).join("").trimEnd() + "…" : chars.join("");
};
const isLongNote = (note: string) => Array.from(note.trim()).length > NOTE_PREVIEW;

export function VocabListView({ data, params }: { data: VocabList; params: ListParams }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = React.useTransition();
  const [confirm, confirmNode] = useConfirm();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [q, setQ] = React.useState(params.q);
  const [noteOf, setNoteOf] = React.useState<VocabItem | null>(null);
  const [tagFor, setTagFor] = React.useState<string[] | null>(null);
  const [favs, setFavs] = React.useState<Record<string, boolean>>({});
  const listTop = React.useRef<HTMLDivElement>(null);

  const go = React.useCallback(
    (patch: Partial<ListParams>, opts: { keepSelection?: boolean } = {}) => {
      const next = { ...params, ...patch };
      const sp = new URLSearchParams();
      if (next.q.trim()) sp.set("q", next.q.trim());
      if (next.tag) sp.set("tag", next.tag);
      if (next.radical) sp.set("radical", String(next.radical));
      if (next.sort !== "newest") sp.set("sort", next.sort);
      if (next.page > 1) sp.set("page", String(next.page));
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
      title: "Xóa từ vựng?",
      message: `Bạn sắp xóa ${label}. Thao tác này không thể hoàn tác.`,
      confirmLabel: "Xóa",
      danger: true,
    });
    if (!ok) return;
    const r = await deleteVocabAction(delIds);
    if (!r.ok) return void toast.error(r.message || "Không xóa được. Vui lòng thử lại.");
    setSelected((s) => new Set([...s].filter((id) => !delIds.includes(id))));
    toast.success(`Đã xóa ${r.data.removed} từ vựng.`);
    refresh();
  }

  async function doStatus(v: VocabItem) {
    const next = v.status === "learned" ? "review" : "learned";
    const r = await setStatusAction([v.id], next);
    if (!r.ok) return void toast.error(r.message);
    toast.success(`Đã chuyển “${v.hanzi}” sang ${STATUS_LABEL[next]}.`);
    refresh();
  }

  async function doBulkStatus(status: "learned" | "review") {
    const r = await setStatusAction([...selected], status);
    if (!r.ok) return void toast.error(r.message);
    toast.success(`Đã chuyển ${r.data.updated} từ sang ${STATUS_LABEL[status]}.`);
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
        <button type="button" className={iconBtn} aria-label={`Thao tác khác cho ${v.hanzi}`}>
          <MoreHorizontal />
        </button>
      </MenuTrigger>
      <MenuContent className="w-[230px]">
        <MenuItem onSelect={() => doStatus(v)}>
          {v.status === "learned" ? <RefreshCw /> : <CheckCircle2 />}
          {v.status === "learned" ? "Đánh dấu cần ôn" : "Đánh dấu đã thuộc"}
        </MenuItem>
        <MenuItem onSelect={() => router.push(`/vocabulary/${v.id}/edit`)}>
          <Pencil />
          Sửa từ vựng
        </MenuItem>
        <MenuItem onSelect={() => setTagFor([v.id])}>
          <TagIcon />
          Thêm tag
        </MenuItem>
        <MenuSeparator />
        <MenuItem danger onSelect={() => doDelete([v.id], `“${v.hanzi}”`)}>
          <Trash2 />
          Xóa từ vựng
        </MenuItem>
      </MenuContent>
    </Menu>
  );
  const star = (v: VocabItem) => {
    const on = favs[v.id] ?? v.isFavorite;
    return (
      <button
        type="button"
        className={iconBtn}
        onClick={() => doFav(v)}
        aria-pressed={on}
        aria-label={`${on ? "Bỏ yêu thích" : "Yêu thích"} ${v.hanzi}`}
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
            aria-label={`Xem đầy đủ ghi chú của ${v.hanzi}`}
            title="Xem thêm"
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
      <section
        aria-labelledby="vl-title"
        className="relative flex flex-col gap-4 overflow-hidden rounded-[22px] border border-[#DDEBF8] bg-[linear-gradient(100deg,#F4F9FF_0%,#E9F3FE_60%,#E1EFFD_100%)] px-[18px] py-[22px] md:flex-row md:items-center md:gap-6 md:px-8 md:py-7"
      >
        <div className="relative z-[1] min-w-0 flex-1">
          <h1 id="vl-title" className="text-[26px] font-extrabold tracking-tight text-text md:text-[34px]">
            Danh sách từ vựng
          </h1>
          <p className="mt-1.5 text-[15px] text-text-2 md:text-[17px]">
            Lưu lại những từ vựng để học hiệu quả hơn mỗi ngày.
          </p>
        </div>
        <div aria-hidden="true" className="relative hidden h-[110px] w-[280px] shrink-0 lg:block">
          <div className="absolute top-1 left-2 flex h-[96px] w-[136px] -rotate-6 flex-col items-center justify-center rounded-2xl border border-[#E1ECF7] bg-white shadow-[0_10px_24px_rgba(34,93,150,.12)]">
            <span className="hanzi text-[32px] leading-tight font-semibold text-[#1E5FD6]">加油</span>
            <span className="text-sm font-semibold text-navy">jiā yóu</span>
          </div>
          <div className="absolute top-0 right-0 w-[128px] -rotate-[4deg] rounded bg-[#FFF9E8] px-3 py-3.5 text-center hand text-[15px] leading-tight text-[#3B5A86] shadow-[0_8px_18px_rgba(80,60,20,.12)]">
            Tích lũy
            <br />
            từng từ nhỏ
            <br />
            Tạo nên hành trình lớn
          </div>
        </div>
        <Button asChild variant="solid" className="shrink-0 max-md:w-full">
          <Link href="/vocabulary/new">
            <Plus />
            Thêm từ vựng
          </Link>
        </Button>
      </section>

      <section
        aria-label="Từ vựng"
        ref={listTop}
        className="flex scroll-mt-4 flex-col gap-[18px] rounded-[var(--radius-xl)] border border-border bg-white/92 p-4 shadow-card md:p-[22px]"
      >
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_190px]">
          <label className="relative block">
            <span className="sr-only">Tìm kiếm từ vựng</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-text-3" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm kiếm từ vựng (Hán tự, pinyin, nghĩa tiếng Việt, tag...)"
              autoComplete="off"
              className={cn(inputClass, "pl-11")}
            />
          </label>
          <label>
            <span className="sr-only">Lọc theo tag</span>
            <select
              value={params.tag}
              onChange={(e) => go({ tag: e.target.value, page: 1 })}
              className={cn(inputClass, "cursor-pointer")}
            >
              <option value="">Tất cả tag</option>
              {data.tagCounts.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name} ({t.count})
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Sắp xếp</span>
            <select
              value={params.sort}
              onChange={(e) => go({ sort: e.target.value as ListParams["sort"], page: 1 }, { keepSelection: true })}
              className={cn(inputClass, "cursor-pointer")}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {data.totalAll > 0 ? (
          <div
            role="group"
            aria-label="Lọc nhanh theo tag"
            className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
          >
            <Chip on={!params.tag} onClick={() => go({ tag: "", page: 1 })}>
              Tất cả ({data.totalAll})
            </Chip>
            {data.tagCounts.map((t) => (
              <Chip
                key={t.id}
                on={t.name.toLowerCase() === params.tag.toLowerCase()}
                onClick={() => go({ tag: t.name, page: 1 })}
              >
                {t.name} ({t.count})
              </Chip>
            ))}
          </div>
        ) : null}

        {radical ? (
          <div className="flex flex-wrap items-center gap-2 text-[15px] text-text-2">
            <span>Lọc theo bộ thủ:</span>
            <Link
              href={`/radicals/${radical.num}`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 font-semibold text-blue-600"
            >
              <span className="hanzi text-lg" lang="zh">
                {radical.char}
              </span>
              {radicalLabel(radical)}
            </Link>
            <Button variant="link" size="sm" onClick={() => go({ radical: 0, page: 1 })}>
              <X />
              Bỏ lọc
            </Button>
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
              <h3 className="text-xl font-bold text-navy">Không tìm thấy từ vựng phù hợp</h3>
              <p className="max-w-[420px] text-text-2">
                Thử từ khoá khác hoặc bỏ bộ lọc{params.q ? ` cho “${params.q}”` : ""}.
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  setQ("");
                  go({ q: "", tag: "", radical: 0, page: 1 });
                }}
              >
                <X />
                Xóa bộ lọc
              </Button>
            </div>
          ) : (
            <>
              {/* Thanh thao tác hàng loạt: luôn hiện đủ nút, chỉ đổi bật/tắt theo số từ đã chọn. */}
              <div
                role="toolbar"
                aria-label="Thao tác với từ đã chọn"
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
                    aria-label="Chọn tất cả trên trang"
                  />
                  <span aria-live="polite">{selected.size ? `Đã chọn ${selected.size} từ` : "Chưa chọn từ nào"}</span>
                </label>
                {selected.size ? (
                  <Button variant="link" size="sm" onClick={() => setSelected(new Set())}>
                    Bỏ chọn
                  </Button>
                ) : null}
                <div className="grid w-full grid-cols-2 gap-2 md:ml-auto md:flex md:w-auto">
                  <BulkButton
                    disabled={!selected.size}
                    hint="Chọn ít nhất 1 từ vựng để thêm tag"
                    onClick={() => setTagFor([...selected])}
                  >
                    <TagIcon />
                    Thêm tag
                  </BulkButton>
                  <BulkButton
                    disabled={!selected.size}
                    hint="Chọn ít nhất 1 từ vựng để đánh dấu"
                    onClick={() => doBulkStatus("learned")}
                  >
                    <CheckCircle2 />
                    Đã thuộc
                  </BulkButton>
                  <BulkButton
                    disabled={!selected.size}
                    hint="Chọn ít nhất 1 từ vựng để đánh dấu"
                    onClick={() => doBulkStatus("review")}
                  >
                    <RefreshCw />
                    Cần ôn
                  </BulkButton>
                  <BulkButton
                    danger
                    disabled={!selected.size}
                    hint="Chọn ít nhất 1 từ vựng để xóa"
                    onClick={() => doDelete([...selected], `${selected.size} từ đã chọn`)}
                  >
                    <Trash2 />
                    Xóa
                  </BulkButton>
                </div>
              </div>

              {/* Desktop: bảng */}
              <div className="hidden overflow-x-auto rounded-md border border-border md:block">
                <table className="w-full min-w-[980px] border-collapse text-[15.5px]">
                  <caption className="sr-only">
                    Danh sách từ vựng, trang {data.page}/{data.pageCount}
                  </caption>
                  <thead>
                    <tr className="bg-[#F3F8FE] text-left [&>th]:px-3 [&>th]:py-3.5 [&>th]:font-semibold [&>th]:whitespace-nowrap">
                      <th className="w-[52px] text-center">
                        <span className="sr-only">Chọn</span>
                      </th>
                      <th className="w-11">#</th>
                      <th className="w-[76px]">Hình ảnh</th>
                      <th>Từ vựng</th>
                      <th>Pinyin</th>
                      <th>Nghĩa tiếng Việt</th>
                      <th>Ghi chú</th>
                      <th>Tag</th>
                      <th>Trạng thái</th>
                      <th className="w-[1%]">Thao tác</th>
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
                            aria-label={`Chọn ${v.hanzi}`}
                          />
                        </td>
                        <td className="text-text-2 tabular-nums">{(data.page - 1) * data.pageSize + i + 1}</td>
                        <td>
                          <Thumb v={v} />
                        </td>
                        <td>
                          <span className="hanzi text-[22px]" lang="zh">
                            {v.hanzi}
                          </span>
                        </td>
                        <td className="pinyin">{v.pinyin}</td>
                        <td className="max-w-[240px]">{v.meaningVi}</td>
                        <td className="w-[170px]">{note(v)}</td>
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
                        <td className="whitespace-nowrap">
                          {star(v)}
                          <Link href={`/vocabulary/${v.id}/edit`} className={iconBtn} aria-label={`Sửa ${v.hanzi}`}>
                            <Pencil />
                          </Link>
                          {rowMenu(v)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Điện thoại: thẻ */}
              <ul
                className="grid gap-2.5 md:hidden"
                aria-label={`Danh sách từ vựng, trang ${data.page}/${data.pageCount}`}
              >
                {data.items.map((v) => (
                  <li
                    key={v.id}
                    className={cn(
                      "grid grid-cols-[30px_52px_minmax(0,1fr)_auto] gap-x-2.5 gap-y-0.5 rounded-2xl border border-border bg-white py-3 pr-2.5 pl-3 [grid-template-areas:'chk_img_word_act''chk_img_py_status''chk_img_mean_mean''note_note_note_note''tags_tags_tags_tags'] max-[380px]:grid-cols-[28px_44px_minmax(0,1fr)_auto]",
                      selected.has(v.id) && "border-[#A9D3F8] bg-[#F1F8FF]",
                    )}
                  >
                    <div className="self-center [grid-area:chk]">
                      <input
                        type="checkbox"
                        className={checkboxClass}
                        checked={selected.has(v.id)}
                        onChange={(e) => toggle(v.id, e.target.checked)}
                        aria-label={`Chọn ${v.hanzi}`}
                      />
                    </div>
                    <div className="self-center [grid-area:img]">
                      <Thumb v={v} className="size-[52px] max-[380px]:size-11" />
                    </div>
                    <div
                      className="min-w-0 hanzi text-[22px] leading-tight [overflow-wrap:anywhere] [grid-area:word]"
                      lang="zh"
                    >
                      {v.hanzi}
                    </div>
                    <div className="text-[14.5px] pinyin [grid-area:py]">{v.pinyin}</div>
                    <div className="text-[15px] text-text [grid-area:mean]">{v.meaningVi}</div>
                    <div className="-mt-1.5 -mr-1 flex items-start justify-end [grid-area:act]">
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
                <span className="text-[13.5px] text-text-3">{data.total} từ vựng</span>
                <Pager
                  page={data.page}
                  count={data.pageCount}
                  onGo={(p) => {
                    go({ page: p }, { keepSelection: true });
                    listTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                />
              </div>
            </>
          )}
        </div>
      </section>

      <Dialog open={!!noteOf} onOpenChange={(o) => !o && setNoteOf(null)}>
        {noteOf ? (
          <DialogContent title="Ghi chú" icon={<Eye />} wide>
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
                Sửa ghi chú
              </Button>
              <DialogClose asChild>
                <Button variant="solid">Đóng</Button>
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
      {confirmNode}
    </>
  );
}

const iconBtn =
  "inline-flex size-10 items-center justify-center rounded-full text-blue-600 outline-none hover:bg-blue-50 focus-visible:shadow-[var(--focus-ring)] md:size-9 [&_svg]:size-[22px]";

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center rounded-[10px] border-[1.5px] px-4 text-[14.5px] font-medium whitespace-nowrap transition-colors",
        on
          ? "border-blue bg-blue font-semibold text-white"
          : "border-transparent bg-[#EEF5FC] text-text-2 hover:bg-blue-100",
      )}
    >
      {children}
    </button>
  );
}

function BulkButton({
  disabled,
  hint,
  danger,
  onClick,
  children,
}: {
  disabled: boolean;
  hint: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-disabled={disabled}
      title={disabled ? hint : undefined}
      onClick={() => {
        // Tắt: không làm gì (không mở hộp thoại, không gọi server); màn cảm ứng không có tooltip → báo bằng toast.
        if (disabled) {
          if (window.matchMedia("(hover: none)").matches) toast.info(hint);
          return;
        }
        onClick();
      }}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md border-[1.5px] px-3.5 text-sm font-semibold whitespace-nowrap [&_svg]:size-[18px]",
        disabled
          ? "cursor-not-allowed border-border bg-[#F3F7FC] text-text-3"
          : danger
            ? "border-border-strong bg-white text-red hover:border-red-100 hover:bg-red-50"
            : "border-border-strong bg-white text-blue-600 hover:border-[#A9D3F8] hover:bg-blue-50",
      )}
    >
      {children}
    </button>
  );
}

function Thumb({ v, className }: { v: VocabItem; className?: string }) {
  const [broken, setBroken] = React.useState(false);
  if (!v.imageId || broken)
    return (
      <span
        aria-hidden="true"
        title={broken ? "Không tải được ảnh" : undefined}
        className={cn(
          "flex size-[50px] items-center justify-center rounded-[10px] bg-[#EEF5FC] text-[#A6BBD4]",
          className,
        )}
      >
        <ImageIcon className="size-6" />
      </span>
    );
  return (
    // Ảnh riêng tư (cần cookie) → không qua next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/images/${v.imageId}`}
      alt=""
      loading="lazy"
      onError={() => setBroken(true)}
      className={cn("size-[50px] rounded-[10px] bg-[#EEF5FC] object-cover", className)}
    />
  );
}

function Pager({ page, count, onGo }: { page: number; count: number; onGo: (p: number) => void }) {
  if (count <= 1) return null;
  const nums = new Set([1, count, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((x) => nums.add(x));
  if (page >= count - 2) [count - 3, count - 2, count - 1].forEach((x) => nums.add(x));
  const list = [...nums].filter((x) => x >= 1 && x <= count).sort((a, b) => a - b);
  const btn = "inline-flex h-[42px] min-w-[42px] items-center justify-center rounded-[10px] font-semibold";
  const out: React.ReactNode[] = [];
  let prev = 0;
  for (const x of list) {
    if (x - prev > 1)
      out.push(
        <span key={`gap-${x}`} className="px-1 text-text-3">
          …
        </span>,
      );
    out.push(
      <button
        key={x}
        type="button"
        onClick={() => onGo(x)}
        aria-current={x === page ? "page" : undefined}
        aria-label={`Trang ${x}`}
        className={cn(btn, x === page ? "bg-blue text-white" : "text-text hover:bg-blue-50")}
      >
        {x}
      </button>,
    );
    prev = x;
  }
  return (
    <nav aria-label="Phân trang" className="flex flex-wrap items-center justify-center gap-1.5">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onGo(page - 1)}
        aria-label="Trang trước"
        className={cn(btn, "border border-border bg-white text-blue-600 disabled:opacity-40")}
      >
        <ChevronLeft className="size-5" />
      </button>
      {out}
      <button
        type="button"
        disabled={page >= count}
        onClick={() => onGo(page + 1)}
        aria-label="Trang sau"
        className={cn(btn, "border border-border bg-white text-blue-600 disabled:opacity-40")}
      >
        <ChevronRight className="size-5" />
      </button>
    </nav>
  );
}

function EmptyAll({ onSampled }: { onSampled: () => void }) {
  const [busy, setBusy] = React.useState(false);
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
      <Image src="/brand/lingyu-mascot.png" alt="" width={180} height={120} className="h-auto w-[180px]" />
      <h3 className="text-xl font-bold text-navy">Chưa có từ vựng nào</h3>
      <p className="max-w-[420px] text-text-2">Thêm từ vựng đầu tiên để bắt đầu xây dựng kho từ của riêng bạn.</p>
      <div className="flex w-full max-w-md flex-col gap-2.5 sm:w-auto sm:flex-row">
        <Button asChild variant="solid">
          <Link href="/vocabulary/new">
            <Plus />
            Thêm từ vựng
          </Link>
        </Button>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const r = await importSampleAction();
            setBusy(false);
            if (!r.ok) return void toast.error(r.message);
            toast.success(`Đã thêm ${r.data.added} từ vựng mẫu.`);
            onSampled();
          }}
        >
          <Database />
          {busy ? "Đang thêm..." : "Dùng dữ liệu mẫu"}
        </Button>
      </div>
    </div>
  );
}
