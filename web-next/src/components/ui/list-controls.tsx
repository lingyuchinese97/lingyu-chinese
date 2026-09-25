"use client";
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

/** Nút của thanh thao tác hàng loạt: luôn hiện, tắt khi chưa chọn gì (bấm lúc tắt chỉ báo gợi ý). */
export function BulkButton({
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

/** Phân trang: đầu, cuối, quanh trang hiện tại, "…" ở khoảng trống. */
export function Pager({ page, count, onGo }: { page: number; count: number; onGo: (p: number) => void }) {
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
