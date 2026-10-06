"use client";
import * as React from "react";
import {
  BookOpen,
  Briefcase,
  Bus,
  CloudSun,
  Dumbbell,
  GraduationCap,
  Hash,
  HeartPulse,
  Home,
  Layers,
  MessageCircle,
  MoreHorizontal,
  Music,
  Palette,
  PawPrint,
  Pencil,
  Plane,
  Plus,
  ShoppingBag,
  Tag as TagIcon,
  Trash2,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogActions, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { toast } from "@/components/ui/toaster";
import { fold } from "@/lib/fold";
import { cn } from "@/lib/utils";
import { tagColors } from "@/lib/tag-style";
import { VOCAB } from "@/lib/limits";
import { useT } from "@/i18n/client";
import type { TagCount } from "../service";
import { createTagAction, renameTagAction } from "../actions";

/** Biểu tượng của tag đoán theo tên (không có từ khoá nào khớp → biểu tượng tag). */
const ICONS: [RegExp, LucideIcon][] = [
  [/du lich|travel|may bay|san bay|khach san/, Plane],
  [/an uong|do an|thuc an|mon an|nau|food|nha hang|do uong/, Utensils],
  [/gia dinh|family|nha cua|nha o|home/, Home],
  [/truong|hoc tap|lop hoc|school|study|giao duc/, GraduationCap],
  [/cong viec|van phong|work|job|kinh doanh|business/, Briefcase],
  [/mua sam|shopping|cua hang|sieu thi/, ShoppingBag],
  [/suc khoe|benh|bac si|health|y te|co the/, HeartPulse],
  [/thoi tiet|weather|mua|mua xuan|khi hau/, CloudSun],
  [/giao thong|di lai|xe|transport/, Bus],
  [/the thao|sport|bong/, Dumbbell],
  [/am nhac|music|bai hat/, Music],
  [/mau sac|color|colour/, Palette],
  [/dong vat|con vat|animal|thu cung/, PawPrint],
  [/so dem|con so|number|so luong/, Hash],
  [/giao tiep|chao hoi|hoi thoai|conversation/, MessageCircle],
  [/hsk|giao trinh|bai \d|lesson|doc hieu/, BookOpen],
];
const COLORS = [
  "bg-[#EAF3FF] text-[#1E6FE0]",
  "bg-[#FFF1E6] text-[#E8742A]",
  "bg-[#EAF8EF] text-[#1F9D55]",
  "bg-[#F3EDFF] text-[#7A4FE0]",
  "bg-[#FFECEF] text-[#E0485E]",
  "bg-[#E8F7F8] text-[#11919B]",
  "bg-[#FFF7DB] text-[#B98900]",
];
export function tagIcon(name: string): LucideIcon {
  const f = fold(name);
  return ICONS.find(([re]) => re.test(f))?.[1] ?? TagIcon;
}
const colorOf = (name: string) => {
  let h = 0;
  for (const c of fold(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length]!;
};

/** Hàng thẻ tag: Tất cả · từng tag (bấm để lọc, "…" để đổi tên / xoá) · Tạo tag mới. */
export function TagCards({
  tags,
  totalAll,
  active,
  onPick,
  onCreate,
  onRename,
  onDelete,
}: {
  tags: TagCount[];
  totalAll: number;
  active: string;
  onPick: (name: string) => void;
  onCreate: () => void;
  onRename: (t: TagCount) => void;
  onDelete: (t: TagCount) => void;
}) {
  const t = useT();
  return (
    <div
      role="group"
      aria-label={t("vocab.quickFilter")}
      className="-mx-4 flex [scrollbar-width:none] gap-3 overflow-x-auto px-4 pt-0.5 pb-1.5 md:mx-0 md:grid md:grid-cols-[repeat(auto-fill,minmax(168px,1fr))] md:overflow-visible md:px-0"
    >
      <Card
        on={!active}
        icon={Layers}
        color="bg-[#E3EEFF] text-blue-600"
        name={t("vocab.allTagsCard")}
        count={t("vocab.tagWords", { count: totalAll })}
        onClick={() => onPick("")}
      />
      {tags.map((g) => (
        <Card
          key={g.id}
          on={g.name.toLowerCase() === active.toLowerCase()}
          icon={tagIcon(g.name)}
          color={colorOf(g.name)}
          name={g.name}
          count={t("vocab.tagWords", { count: g.count })}
          onClick={() => onPick(g.name)}
          menu={
            <Menu>
              <MenuTrigger asChild>
                <button
                  type="button"
                  aria-label={t("vocab.tagMenu", { name: g.name })}
                  className="absolute top-1.5 right-1.5 inline-flex size-8 items-center justify-center rounded-full text-text-3 outline-none hover:bg-white hover:text-blue-600 focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-[18px]"
                >
                  <MoreHorizontal />
                </button>
              </MenuTrigger>
              <MenuContent className="w-[200px]">
                <MenuItem onSelect={() => onRename(g)}>
                  <Pencil />
                  {t("vocab.renameTag")}
                </MenuItem>
                <MenuSeparator />
                <MenuItem danger onSelect={() => onDelete(g)}>
                  <Trash2 />
                  {t("vocab.deleteTag")}
                </MenuItem>
              </MenuContent>
            </Menu>
          }
        />
      ))}
      <button
        type="button"
        onClick={onCreate}
        className="flex min-h-[76px] w-[168px] shrink-0 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#BCD6F5] bg-white/70 px-3 font-semibold text-blue-600 outline-none hover:bg-blue-50 focus-visible:shadow-[var(--focus-ring)] md:w-auto"
      >
        <Plus className="size-5" />
        {t("vocab.newTag")}
      </button>
    </div>
  );
}

const HSK_COLORS = [
  "bg-[#E3EEFF] text-blue-600",
  "bg-[#E6F7EE] text-[#1F9D55]",
  "bg-[#FFF3D6] text-[#C27C0E]",
  "bg-[#E6F1FF] text-[#2C6FDB]",
  "bg-[#FFEBDD] text-[#E0632F]",
  "bg-[#F1EAFF] text-[#7A45E0]",
  "bg-[#FFE6EA] text-[#E0305A]",
  "bg-[#EEF2F7] text-[#5B6B80]",
];

/** Hàng thẻ cấp HSK (theo tag HSK của từ): Tất cả · HSK1–6 · Khác, kèm số từ; bấm để lọc. */
export function HskCards({
  counts,
  totalAll,
  active,
  onPick,
}: {
  counts: Record<string, number>;
  totalAll: number;
  active: string;
  onPick: (hsk: "" | "1" | "2" | "3" | "4" | "5" | "6" | "other") => void;
}) {
  const t = useT();
  const items = [
    { k: "" as const, name: t("vocab.allTagsCard"), n: totalAll, icon: Layers },
    ...(["1", "2", "3", "4", "5", "6"] as const).map((k) => ({
      k,
      name: `HSK${k}`,
      n: counts[k] ?? 0,
      icon: BookOpen,
    })),
    { k: "other" as const, name: t("vocab.hskOther"), n: counts.other ?? 0, icon: Layers },
  ];
  return (
    <div
      role="group"
      aria-label={t("vocab.hskFilter")}
      className="-mx-4 flex [scrollbar-width:none] gap-3 overflow-x-auto rounded-[var(--radius-xl)] px-4 pt-0.5 pb-1.5 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:border md:border-border md:bg-white/92 md:p-3 md:shadow-card xl:grid-cols-8"
    >
      {items.map((it, i) => (
        <Card
          key={it.k || "all"}
          on={active === it.k}
          icon={it.icon}
          color={HSK_COLORS[i]!}
          name={it.name}
          count={t("vocab.tagWords", { count: it.n })}
          onClick={() => onPick(it.k)}
          compact
        />
      ))}
    </div>
  );
}

/** Hàng chip tag: Tất cả · từng tag (bấm để lọc; "…" đổi tên / xoá) · Thêm tag. */
export function TagChips({
  tags,
  active,
  onPick,
  onCreate,
  onRename,
  onDelete,
}: {
  tags: TagCount[];
  active: string;
  onPick: (name: string) => void;
  onCreate: () => void;
  onRename: (t: TagCount) => void;
  onDelete: (t: TagCount) => void;
}) {
  const t = useT();
  const chip = (on: boolean) =>
    cn(
      "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-[12px] border-[1.5px] px-3.5 text-[14.5px] font-semibold whitespace-nowrap outline-none focus-visible:shadow-[var(--focus-ring)]",
      on ? "border-blue-600 bg-blue-600 text-white" : "border-border bg-white text-text hover:bg-blue-50",
    );
  return (
    <div
      role="group"
      aria-label={t("vocab.quickFilter")}
      className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
    >
      <button type="button" aria-pressed={!active} onClick={() => onPick("")} className={chip(!active)}>
        {t("vocab.allTagsCard")}
      </button>
      {tags.map((g) => {
        const on = g.name.toLowerCase() === active.toLowerCase();
        return (
          <span key={g.id} className="inline-flex shrink-0 items-center">
            <button
              type="button"
              aria-pressed={on}
              onClick={() => onPick(on ? "" : g.name)}
              className={cn(chip(on), "rounded-r-none border-r-0 pr-2.5")}
              style={on ? undefined : tagColors(g.name)}
            >
              {g.name}
              <span className="text-[12.5px] font-normal">{g.count}</span>
            </button>
            <Menu>
              <MenuTrigger asChild>
                <button
                  type="button"
                  aria-label={t("vocab.tagMenu", { name: g.name })}
                  className={cn(chip(on), "rounded-l-none px-1.5 [&_svg]:size-4")}
                  style={on ? undefined : tagColors(g.name)}
                >
                  <MoreHorizontal />
                </button>
              </MenuTrigger>
              <MenuContent className="w-[200px]">
                <MenuItem onSelect={() => onRename(g)}>
                  <Pencil />
                  {t("vocab.renameTag")}
                </MenuItem>
                <MenuSeparator />
                <MenuItem danger onSelect={() => onDelete(g)}>
                  <Trash2 />
                  {t("vocab.deleteTag")}
                </MenuItem>
              </MenuContent>
            </Menu>
          </span>
        );
      })}
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-[12px] border-[1.5px] border-dashed border-[#BCD6F5] bg-white px-3.5 text-[14.5px] font-semibold whitespace-nowrap text-blue-600 hover:bg-blue-50"
      >
        <Plus className="size-[18px]" />
        {t("vocab.addTagChip")}
      </button>
    </div>
  );
}

function Card({
  on,
  icon: Icon,
  color,
  name,
  count,
  onClick,
  menu,
  compact,
}: {
  on: boolean;
  icon: LucideIcon;
  color: string;
  name: string;
  count: string;
  onClick: () => void;
  menu?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn("relative shrink-0 md:w-auto", compact ? "w-[140px]" : "w-[168px]")}>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={on}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border-[1.5px] bg-white py-3 pl-3 text-left",
          compact ? "min-h-[60px] gap-2 pr-2 pl-2.5" : "min-h-[76px] pr-9",
          "shadow-[0_4px_14px_rgba(34,93,150,.06)] transition-colors outline-none focus-visible:shadow-[var(--focus-ring)]",
          on ? "border-blue-600 bg-[#F2F8FF]" : "border-border hover:border-[#BCD6F5]",
        )}
      >
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl",
            compact ? "size-9 [&_svg]:size-5" : "size-11 [&_svg]:size-[22px]",
            color,
          )}
        >
          <Icon aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className={cn("block font-bold text-text", compact ? "whitespace-nowrap" : "truncate")}>{name}</span>
          <span className="block text-[13.5px] text-text-2">{count}</span>
        </span>
      </button>
      {menu}
    </div>
  );
}

/** Hộp thoại tạo tag mới hoặc đổi tên tag. */
export function TagNameDialog({
  target,
  onClose,
  onDone,
}: {
  /** "new" = tạo mới; một tag = đổi tên; null = đóng. */
  target: "new" | TagCount | null;
  onClose: () => void;
  onDone: (name: string) => void;
}) {
  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      {target ? (
        <NameBody key={target === "new" ? "new" : target.id} target={target} onClose={onClose} onDone={onDone} />
      ) : null}
    </Dialog>
  );
}

function NameBody({
  target,
  onClose,
  onDone,
}: {
  target: "new" | TagCount;
  onClose: () => void;
  onDone: (name: string) => void;
}) {
  const t = useT();
  const isNew = target === "new";
  const [name, setName] = React.useState(isNew ? "" : target.name);
  const [busy, setBusy] = React.useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    setBusy(true);
    const r = isNew ? await createTagAction(clean) : await renameTagAction(target.id, clean);
    setBusy(false);
    if (!r.ok) return void toast.error(r.message);
    toast.success(isNew ? t("vocab.tagCreated", { name: clean }) : t("vocab.tagRenamed", { name: clean }));
    onClose();
    onDone(clean);
  }
  return (
    <DialogContent title={isNew ? t("vocab.newTag") : t("vocab.renameTag")} icon={<TagIcon />}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-semibold text-text">{t("vocab.tagName")}</span>
          <Input
            value={name}
            autoFocus
            maxLength={VOCAB.MAX_TAG}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("vocab.tagNamePlaceholder")}
          />
          <span className="text-right text-[13px] text-text-3">
            {Array.from(name).length}/{VOCAB.MAX_TAG}
          </span>
        </label>
        <DialogActions>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              {t("common.cancel")}
            </Button>
          </DialogClose>
          <Button type="submit" variant="solid" disabled={busy || !name.trim()}>
            {busy ? t("common.saving") : isNew ? t("vocab.createTag") : t("common.save")}
          </Button>
        </DialogActions>
      </form>
    </DialogContent>
  );
}
