import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Bìa đầu trang dùng chung cho mọi chức năng (theo design): ảnh bìa cố định (trời xanh, cửa sổ, lá bay), tiêu đề lớn, mô tả, nút
 * thao tác; bên phải là mascot LingYu đọc sách ngồi trên chồng sách HSK · 汉语 · 中国文化 kèm bong bóng "每天进步一点点！".
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
        "relative isolate overflow-hidden rounded-[26px] border border-[#D3E8F8] bg-[#DCEFFD] shadow-card",
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
        className="-z-20 object-cover object-[60%_center]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(255,255,255,.72)_0%,rgba(255,255,255,.45)_42%,rgba(255,255,255,0)_68%)]"
      />

      <div className="grid items-center gap-4 md:grid-cols-[minmax(0,1fr)_minmax(220px,340px)]">
        <div className="min-w-0 px-5 py-6 md:py-8 md:pl-10">
          <h1 id={id} className="text-navy-900">
            {eyebrow ? (
              <span className="block text-[16px] font-bold text-blue-600 md:text-[18px]">{eyebrow}</span>
            ) : null}
            <span className="mt-0.5 block text-[30px] leading-[1.12] font-black tracking-tight md:text-[44px]">
              {title}
            </span>
          </h1>
          {question ? <p className="mt-1.5 text-[16.5px] font-bold text-navy md:text-[19px]">{question}</p> : null}
          {description ? (
            <p className="mt-2 max-w-[620px] text-[15px] text-navy/80 md:text-[17px]">{description}</p>
          ) : null}
          {aside ? <div className="mt-4 max-w-[420px]">{aside}</div> : null}
          {actions ? <div className="mt-5 flex flex-wrap gap-2.5">{actions}</div> : null}
        </div>

        <div aria-hidden="true" className="relative hidden h-full min-h-[230px] self-stretch md:block">
          <Image
            unoptimized
            src="/brand/hero/mascot-books.webp"
            alt=""
            width={640}
            height={636}
            priority
            className="absolute right-[6%] bottom-[-14px] w-[min(92%,260px)] drop-shadow-[0_14px_20px_rgba(20,70,40,.18)]"
          />
          <Image
            unoptimized
            src="/brand/library/speech-bubble.png"
            alt=""
            width={293}
            height={220}
            className="absolute top-3 left-[-4%] w-[min(42%,130px)] -rotate-6"
          />
        </div>
      </div>
    </section>
  );
}

/** Nút chính (gradient, bo tròn) và nút phụ (viền) theo kiểu bìa — dùng cho `actions`. */
export const heroPrimary =
  "inline-flex min-h-12 items-center gap-2.5 rounded-full px-6 text-[16px] font-bold text-white shadow-cta outline-none bg-grad-primary hover:[background:var(--grad-primary-hover)] focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-5";
export const heroSecondary =
  "inline-flex min-h-12 items-center gap-2 rounded-full border-[1.5px] border-[#CFE0F5] bg-white/90 px-5 text-[15px] font-semibold text-blue-700 outline-none hover:bg-white focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-[18px]";
