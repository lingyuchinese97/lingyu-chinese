import * as React from "react";
import Link from "next/link";
import { House } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LibTone } from "@/data/library/vocab-sets";

const TONES: Record<LibTone, string> = {
  rose: "bg-[linear-gradient(135deg,#FFE9EC,#FFF4F1)]",
  amber: "bg-[linear-gradient(135deg,#FFF3D6,#FFF9EC)]",
  sky: "bg-[linear-gradient(135deg,#E3F1FF,#F2F8FF)]",
  green: "bg-[linear-gradient(135deg,#E3F7EA,#F1FBF4)]",
  violet: "bg-[linear-gradient(135deg,#EFE8FF,#F7F3FF)]",
  orange: "bg-[linear-gradient(135deg,#FFE8D9,#FFF5EE)]",
};

/** Ảnh bìa minh hoạ: emoji lớn trên nền màu nhạt (không tải ảnh ngoài). */
export function Cover({
  emoji,
  tone,
  className,
  size = "md",
}: {
  emoji: string;
  tone: LibTone;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex items-center justify-center select-none",
        TONES[tone],
        size === "sm" ? "text-[30px]" : size === "md" ? "text-[56px]" : "text-[84px]",
        className,
      )}
    >
      <span className="drop-shadow-[0_6px_10px_rgba(16,42,84,0.12)]">{emoji}</span>
    </span>
  );
}

/** Nhãn nhỏ dạng viên thuốc. */
export function Pill({
  children,
  color = "blue",
  className,
}: {
  children: React.ReactNode;
  color?: "blue" | "rose" | "amber" | "green" | "violet" | "orange";
  className?: string;
}) {
  const c = {
    blue: "bg-blue-50 text-blue-700",
    rose: "bg-[#FFE9EC] text-[#C42A42]",
    amber: "bg-[#FFF3D6] text-[#8A5A00]",
    green: "bg-green-50 text-green-700",
    violet: "bg-[#F0EAFF] text-[#6B3FD0]",
    orange: "bg-[#FFEBDD] text-[#B4500E]",
  }[color];
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold", c, className)}
    >
      {children}
    </span>
  );
}

/** Vòng tiến độ x / y. */
export function Ring({ value, total, size = 84 }: { value: number; total: number; size?: number }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const p = total ? Math.min(1, value / total) : 0;
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E6EEF8" strokeWidth="8" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#22C08A"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
        />
      </svg>
      <span className="absolute text-[17px] font-extrabold text-navy-900">
        {value}/{total}
      </span>
    </span>
  );
}

export const card = "rounded-[var(--radius-xl)] border border-border bg-white shadow-card";
export const TOPIC_COLORS = ["rose", "amber", "green", "blue", "violet", "orange"] as const;

/** Breadcrumb nhiều cấp: 🏠 / Thư viện / Từ vựng / … (mục cuối là trang hiện tại). */
export function Crumbs({
  label,
  home,
  items,
}: {
  label: string;
  home: string;
  items: { href?: string; text: string }[];
}) {
  return (
    <nav aria-label={label} className="-mt-1 flex min-h-9 flex-wrap items-center gap-1.5 text-[15px] text-text-2">
      <Link
        href="/home"
        className="inline-flex size-8 items-center justify-center rounded-full hover:bg-blue-50 hover:text-blue-600"
      >
        <House className="size-[18px]" aria-hidden="true" />
        <span className="sr-only">{home}</span>
      </Link>
      {items.map((it, i) => (
        <React.Fragment key={i}>
          <span aria-hidden="true">/</span>
          {it.href ? (
            <Link href={it.href} className="hover:text-blue-600">
              {it.text}
            </Link>
          ) : (
            <span aria-current="page" className="max-w-[50vw] truncate font-semibold text-navy-900">
              {it.text}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
