import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { tagColors } from "@/lib/tag-style";

export function Tag({ name, onRemove, className }: { name: string; onRemove?: () => void; className?: string }) {
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
          aria-label={`Bỏ tag ${name}`}
          className="-mr-1 ml-1 inline-flex size-5 items-center justify-center rounded-full hover:bg-black/5"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </span>
  );
}

export function StatusBadge({ status }: { status: "learned" | "review" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-3 py-1 text-[13.5px] font-medium whitespace-nowrap",
        status === "learned" ? "bg-green-50 text-green-700" : "bg-amber-50 text-[#9A5C03]",
      )}
    >
      {status === "learned" ? "Đã thuộc" : "Cần ôn"}
    </span>
  );
}

export const checkboxClass =
  "size-[22px] shrink-0 cursor-pointer rounded-md accent-blue focus-visible:shadow-[var(--focus-ring)] max-md:size-[26px]";
