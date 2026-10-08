"use client";
import { CheckCircle2, CircleDashed, RefreshCw, X } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { tagColors } from "@/lib/tag-style";

export function Tag({ name, onRemove, className }: { name: string; onRemove?: () => void; className?: string }) {
  const t = useT();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[7px] px-2.5 py-[3px] text-[13.5px] leading-[1.4] font-medium whitespace-nowrap",
        className,
      )}
      style={tagColors(name)}
    >
      {name}
      {onRemove ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={t("ui.removeTag", { name })}
          className="-mr-1 ml-1 inline-flex size-5 items-center justify-center rounded-full hover:bg-black/5"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </span>
  );
}

/** Trạng thái học: Đã thuộc (xanh lá), Cần ôn (cam), Chưa ôn (xám — từ chưa từng được ôn, truyền `fresh`). */
export function StatusBadge({ status, fresh = false }: { status: "learned" | "review"; fresh?: boolean }) {
  const t = useT();
  const kind = status === "learned" ? "learned" : fresh ? "fresh" : "review";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13.5px] font-semibold whitespace-nowrap [&_svg]:size-4",
        kind === "learned"
          ? "bg-green-50 text-green-700"
          : kind === "fresh"
            ? "bg-[#F1F4F8] text-text-2"
            : "bg-amber-50 text-[#9A5C03]",
      )}
    >
      {kind === "learned" ? (
        <CheckCircle2 aria-hidden="true" className="text-[#22A55B]" />
      ) : kind === "fresh" ? (
        <CircleDashed aria-hidden="true" className="text-text-3" />
      ) : (
        <RefreshCw aria-hidden="true" className="text-[#E8742A]" />
      )}
      {kind === "fresh" ? t("ui.notReviewed") : t(`ui.${status}`)}
    </span>
  );
}

export const checkboxClass =
  "size-[22px] shrink-0 cursor-pointer rounded-md accent-blue focus-visible:shadow-[var(--focus-ring)] max-md:size-[26px]";
