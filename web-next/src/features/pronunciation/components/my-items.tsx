"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Library, Loader2, Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogActions, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { useConfirm } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toaster";
import { useLocale, useT } from "@/i18n/client";
import { PRONUNCIATION } from "@/lib/limits";
import { cn } from "@/lib/utils";
import { topicHref, topicLabel } from "@/data/pronunciation";
import type { ItemList } from "../items";
import type { ItemListParams } from "../schema";
import { createItemAction, deleteItemAction, updateItemAction } from "../actions";
import { PCard } from "./pron-header";
import { SpeakBtn } from "./speak-btn";

type Item = ItemList["items"][number];
type Draft = { hanzi: string; pinyin: string; meaning: string; note: string; tags: string[] };
const EMPTY: Draft = { hanzi: "", pinyin: "", meaning: "", note: "", tags: [] };

/** Hộp thêm / sửa một mục (chữ Hán, pinyin — bỏ trống thì tự điền, nghĩa, ghi chú, tag). */
function ItemDialog({
  item,
  open,
  onOpenChange,
  knownTags,
}: {
  item: Item | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  knownTags: string[];
}) {
  const t = useT();
  const router = useRouter();
  const [d, setD] = React.useState<Draft>(item ? { ...item } : EMPTY);
  const [tagText, setTagText] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const id = React.useId();
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  function addTag(raw: string) {
    const v = raw.trim().replace(/\s+/g, " ").slice(0, PRONUNCIATION.MAX_TAG);
    if (!v || d.tags.some((x) => x.toLowerCase() === v.toLowerCase()) || d.tags.length >= PRONUNCIATION.MAX_TAGS)
      return setTagText("");
    set({ tags: [...d.tags, v] });
    setTagText("");
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const input = { ...d, tags: tagText.trim() ? [...d.tags, tagText.trim()] : d.tags };
    setBusy(true);
    const r = item ? await updateItemAction(item.id, input) : await createItemAction(input);
    setBusy(false);
    if (!r.ok) {
      setErrors(r.fieldErrors ?? {});
      return void toast.error(r.message);
    }
    toast.success(item ? t("pronunciation.mine.updated") : t("pronunciation.mine.added"));
    onOpenChange(false);
    router.refresh();
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={item ? t("pronunciation.mine.editTitle", { hanzi: item.hanzi }) : t("pronunciation.mine.addTitle")}
        description={t("pronunciation.mine.formDesc")}
        icon={item ? <Pencil /> : <Plus />}
      >
        <form onSubmit={save} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id={`${id}-h`} label={t("pronunciation.mine.hanzi")} required error={errors.hanzi}>
              <Input
                id={`${id}-h`}
                lang="zh"
                autoFocus
                value={d.hanzi}
                maxLength={PRONUNCIATION.MAX_HANZI}
                onChange={(e) => set({ hanzi: e.target.value })}
                className="hanzi text-[20px]"
              />
            </Field>
            <Field
              id={`${id}-p`}
              label={t("pronunciation.mine.pinyin")}
              hint={t("pronunciation.mine.pinyinHint")}
              error={errors.pinyin}
            >
              <Input
                id={`${id}-p`}
                value={d.pinyin}
                maxLength={PRONUNCIATION.MAX_PINYIN}
                onChange={(e) => set({ pinyin: e.target.value })}
              />
            </Field>
          </div>
          <Field id={`${id}-m`} label={t("pronunciation.mine.meaning")} error={errors.meaning}>
            <Input
              id={`${id}-m`}
              value={d.meaning}
              maxLength={PRONUNCIATION.MAX_MEANING}
              onChange={(e) => set({ meaning: e.target.value })}
            />
          </Field>
          <Field id={`${id}-n`} label={t("pronunciation.mine.note")} error={errors.note}>
            <Textarea
              id={`${id}-n`}
              rows={3}
              value={d.note}
              maxLength={PRONUNCIATION.MAX_TEXT}
              placeholder={t("pronunciation.mine.notePlaceholder")}
              onChange={(e) => set({ note: e.target.value })}
            />
          </Field>
          <Field
            id={`${id}-t`}
            label={t("pronunciation.mine.tags")}
            hint={t("pronunciation.mine.tagsHint")}
            error={errors.tags}
          >
            <div className="flex flex-wrap items-center gap-1.5 rounded-[12px] border border-border bg-white p-1.5">
              {d.tags.map((x) => (
                <span
                  key={x}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-50 py-0.5 pr-1 pl-2.5 text-[13px] font-semibold text-blue-700"
                >
                  {x}
                  <button
                    type="button"
                    onClick={() => set({ tags: d.tags.filter((y) => y !== x) })}
                    aria-label={t("pronunciation.mine.removeTag", { tag: x })}
                    className="rounded-full p-0.5 hover:bg-blue-100"
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
              <input
                id={`${id}-t`}
                list={`${id}-tl`}
                value={tagText}
                maxLength={PRONUNCIATION.MAX_TAG}
                onChange={(e) => setTagText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag(tagText);
                  }
                }}
                onBlur={() => addTag(tagText)}
                className="min-w-[120px] flex-1 bg-transparent px-1.5 py-1 text-[15px] outline-none"
              />
              <datalist id={`${id}-tl`}>
                {knownTags.map((x) => (
                  <option key={x} value={x} />
                ))}
              </datalist>
            </div>
          </Field>
          <DialogActions>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {t("common.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <Save />}
              {t("pronunciation.mine.save")}
            </Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** "Từ & âm của tôi": tìm, lọc tag / nguồn, thêm, sửa, xoá; bản lưu từ Thư viện có link về mục gốc. */
export function MyItems({ data, params }: { data: ItemList; params: ItemListParams }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = React.useTransition();
  const [q, setQ] = React.useState(params.q);
  const [editing, setEditing] = React.useState<Item | "new" | null>(null);
  const [confirm, confirmNode] = useConfirm();
  const go = React.useCallback(
    (patch: Partial<ItemListParams>) => {
      const n = { ...params, ...patch };
      const sp = new URLSearchParams();
      if (n.q.trim()) sp.set("q", n.q.trim());
      if (n.tag) sp.set("tag", n.tag);
      if (n.from !== "all") sp.set("from", n.from);
      if (n.sort !== "updated") sp.set("sort", n.sort);
      startTransition(() => router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false }));
    },
    [params, pathname, router],
  );
  React.useEffect(() => {
    if (q === params.q) return;
    const id = setTimeout(() => go({ q }), 300);
    return () => clearTimeout(id);
  }, [q, params.q, go]);

  async function remove(it: Item) {
    if (
      !(await confirm({
        title: t("pronunciation.mine.deleteTitle"),
        message: t("pronunciation.mine.deleteMsg", { hanzi: it.hanzi }),
        confirmLabel: t("pronunciation.mine.delete"),
        danger: true,
      }))
    )
      return;
    const r = await deleteItemAction(it.id);
    if (!r.ok) return void toast.error(r.message);
    toast.success(t("pronunciation.mine.deleted"));
    router.refresh();
  }

  const knownTags = data.tags.map((x) => x.name);
  return (
    <div className="flex flex-col gap-4">
      {confirmNode}
      {editing ? (
        <ItemDialog
          key={editing === "new" ? "new" : editing.id}
          item={editing === "new" ? null : editing}
          open
          onOpenChange={(o) => !o && setEditing(null)}
          knownTags={knownTags}
        />
      ) : null}

      <PCard aria-labelledby="mi-title" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="mi-title" className="text-[20px] font-extrabold text-navy-900">
            {t("pronunciation.mine.listTitle")}{" "}
            <span className="font-semibold text-text-2">{t("pronunciation.mine.count", { count: data.total })}</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/library/pronunciation/initials">
                <Library />
                {t("pronunciation.mine.fromLibrary")}
              </Link>
            </Button>
            <Button onClick={() => setEditing("new")}>
              <Plus />
              {t("pronunciation.mine.add")}
            </Button>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label className="relative block">
            <span className="sr-only">{t("pronunciation.mine.search")}</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-text-3" />
            <Input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("pronunciation.mine.search")}
              className="pl-11"
            />
          </label>
          <label>
            <span className="sr-only">{t("pronunciation.mine.fromLabel")}</span>
            <Select value={params.from} onChange={(e) => go({ from: e.target.value as ItemListParams["from"] })}>
              {(["all", "library", "mine"] as const).map((f) => (
                <option key={f} value={f}>
                  {t(`pronunciation.mine.from.${f}`)}
                </option>
              ))}
            </Select>
          </label>
          <label>
            <span className="sr-only">{t("pronunciation.mine.sortLabel")}</span>
            <Select value={params.sort} onChange={(e) => go({ sort: e.target.value as ItemListParams["sort"] })}>
              {(["updated", "newest", "az"] as const).map((s) => (
                <option key={s} value={s}>
                  {t(`pronunciation.mine.sorts.${s}`)}
                </option>
              ))}
            </Select>
          </label>
        </div>
        {data.tags.length ? (
          <div role="group" aria-label={t("pronunciation.mine.tagFilter")} className="flex flex-wrap gap-2">
            {data.tags.map((x) => {
              const on = params.tag.toLowerCase() === x.name.toLowerCase();
              return (
                <button
                  key={x.name}
                  type="button"
                  aria-pressed={on}
                  onClick={() => go({ tag: on ? "" : x.name })}
                  className={cn(
                    "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[13.5px] font-semibold",
                    on
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-border bg-white text-navy-900 hover:bg-blue-50",
                  )}
                >
                  {x.name}
                  <span className={cn("rounded-full px-1.5 text-[12px]", on ? "bg-white text-blue-700" : "bg-blue-50")}>
                    {x.count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </PCard>

      <div aria-busy={pending || undefined} className={cn("transition-opacity", pending && "opacity-60")}>
        {!data.items.length ? (
          <PCard className="flex flex-col items-center gap-3 py-10 text-center">
            <h3 className="text-xl font-bold text-navy-900">
              {data.all ? t("pronunciation.mine.noMatch") : t("pronunciation.mine.emptyTitle")}
            </h3>
            {data.all ? null : <p className="max-w-[460px] text-text-2">{t("pronunciation.mine.emptyDesc")}</p>}
          </PCard>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {data.items.map((it) => {
              const src = it.source ? topicLabel(it.source) : null;
              return (
                <li key={it.id}>
                  <PCard aria-label={it.hanzi} className="flex h-full flex-col gap-2 p-4">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p lang="zh" className="hanzi text-[28px] leading-tight font-bold text-navy-900">
                          {it.hanzi}
                        </p>
                        <p className="text-[16px] pinyin">{it.pinyin}</p>
                        {it.meaning ? <p className="text-[14.5px] text-text-2">{it.meaning}</p> : null}
                      </div>
                      <SpeakBtn text={it.hanzi} label={t("ui.listen", { text: it.hanzi })} size="sm" />
                    </div>
                    {it.note ? (
                      <p className="rounded-[12px] bg-[#F1FBF6] px-3 py-2 text-[14px] whitespace-pre-line text-text">
                        {it.note}
                      </p>
                    ) : null}
                    {it.tags.length ? (
                      <p className="flex flex-wrap gap-1.5">
                        {it.tags.map((x) => (
                          <span
                            key={x}
                            className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[12.5px] font-semibold text-blue-700"
                          >
                            {x}
                          </span>
                        ))}
                      </p>
                    ) : null}
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                      {src && it.source ? (
                        <Link
                          href={topicHref(it.source)}
                          className="mr-auto inline-flex items-center gap-1 text-[13px] text-text-2 hover:text-blue-600"
                        >
                          <Library className="size-4" aria-hidden="true" />
                          {locale === "en" ? src.en : src.vi}
                        </Link>
                      ) : (
                        <span className="mr-auto text-[13px] text-text-3">{t("pronunciation.mine.self")}</span>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditing(it)}
                        aria-label={t("pronunciation.mine.editTitle", { hanzi: it.hanzi })}
                      >
                        <Pencil />
                        {t("pronunciation.mine.edit")}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => remove(it)}
                        aria-label={t("pronunciation.mine.deleteOne", { hanzi: it.hanzi })}
                        className="px-2.5"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </PCard>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
