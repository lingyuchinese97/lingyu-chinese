import * as React from "react";
import Image from "next/image";
import { LeafDecor } from "@/components/layout/icons";
import { cn } from "@/lib/utils";

/**
 * Bìa đầu trang dùng chung cho mọi chức năng (theo design): ảnh bìa cố định (trời xanh, cửa sổ, lá bay), tiêu đề lớn có nhánh lá,
 * mô tả, nút thao tác; bên phải là mascot LingYu ngồi trên bậu cửa sổ cầm sách đọc.
 * Không dùng hook → dùng được ở cả server lẫn client component.
 */
export function FeatureHero({
  id,
  eyebrow,
  title,
  question,
  description,
  actions,
  aside,
  className,
}: {
  /** id của h1 (cho aria-labelledby). */
  id: string;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  question?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Khối phụ (thẻ số liệu…) hiện dưới mô tả. */
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "@container relative isolate overflow-hidden rounded-[26px] border border-[#D3E8F8] bg-[#DCEFFD] shadow-card",
        className,
      )}
    >
      <Image
        unoptimized
        src="/brand/hero/cover-bg.webp"
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-bottom"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(255,255,255,.72)_0%,rgba(255,255,255,.45)_42%,rgba(255,255,255,0)_68%)]"
      />

      {/* Ảnh bìa neo đáy (dư thì cắt phần trời phía trên) → mascot ngồi trên mặt bàn cạnh cửa sổ, cầm sách đọc. */}
      <Image
        unoptimized
        src="/brand/hero/mascot-reading.webp"
        alt=""
        aria-hidden="true"
        width={560}
        height={493}
        priority
        className="pointer-events-none absolute bottom-[1.6cqw] left-[70%] -z-10 hidden h-[74%] max-h-[230px] w-auto -translate-x-1/2 drop-shadow-[0_10px_14px_rgba(20,70,40,.18)] md:block"
      />

      <div className="flex min-h-[200px] flex-col justify-center px-5 py-7 md:min-h-[260px] md:max-w-[62%] md:py-9 md:pl-12">
        <h1 id={id} className="text-navy-900">
          {eyebrow ? <span className="block text-[16px] font-bold text-blue-600 md:text-[18px]">{eyebrow}</span> : null}
          <span className="mt-0.5 flex items-start gap-1 text-[30px] leading-[1.12] font-black tracking-tight md:text-[46px]">
            <span className="min-w-0">{title}</span>
            <LeafDecor className="mt-[-4px] w-8 shrink-0 -rotate-12 md:w-11" />
          </span>
        </h1>
        {question ? <p className="mt-1.5 text-[16.5px] font-bold text-navy md:text-[19px]">{question}</p> : null}
        {description ? (
          <p className="mt-2 max-w-[620px] text-[15px] font-medium text-navy/75 md:text-[18px]">{description}</p>
        ) : null}
        {aside ? <div className="mt-4 max-w-[420px]">{aside}</div> : null}
        {actions ? <div className="mt-5 flex flex-wrap gap-2.5">{actions}</div> : null}
      </div>
    </section>
  );
}

/** Nút chính (gradient, bo tròn) và nút phụ (viền) theo kiểu bìa — dùng cho `actions`. */
export const heroPrimary =
  "inline-flex min-h-12 items-center gap-2.5 rounded-full px-6 text-[16px] font-bold text-white shadow-cta outline-none bg-grad-primary hover:[background:var(--grad-primary-hover)] focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-5";
export const heroSecondary =
  "inline-flex min-h-12 items-center gap-2 rounded-full border-[1.5px] border-[#CFE0F5] bg-white/90 px-5 text-[15px] font-semibold text-blue-700 outline-none hover:bg-white focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-[18px]";
