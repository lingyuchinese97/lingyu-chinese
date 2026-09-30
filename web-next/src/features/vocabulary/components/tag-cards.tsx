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

function Card({
  on,
  icon: Icon,
  color,
  name,
  count,
  onClick,
  menu,
}: {
  on: boolean;
  icon: LucideIcon;
  color: string;
  name: string;
  count: string;
  onClick: () => void;
  menu?: React.ReactNode;
}) {
  return (
    <div className="relative w-[168px] shrink-0 md:w-auto">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={on}
        className={cn(
          "flex min-h-[76px] w-full items-center gap-3 rounded-2xl border-[1.5px] bg-white py-3 pr-9 pl-3 text-left shadow-[0_4px_14px_rgba(34,93,150,.06)] transition-colors outline-none focus-visible:shadow-[var(--focus-ring)]",
          on ? "border-blue-600 bg-[#F2F8FF]" : "border-border hover:border-[#BCD6F5]",
        )}
      >
        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl [&_svg]:size-[22px]", color)}>
          <Icon aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-bold text-text">{name}</span>
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
