import * as React from "react";
import Image from "next/image";
import { LeafDecor } from "@/components/layout/icons";
import { cn } from "@/lib/utils";

/** Mascot LingYu cho từng chức năng (ảnh trong suốt ở /public/brand/ui). */
export const HERO_MASCOT = {
  lessons: { src: "/brand/ui/cover-lessons.png", w: 292, h: 300 },
  vocabulary: { src: "/brand/ui/cover-vocabulary.png", w: 278, h: 300 },
  grammar: { src: "/brand/ui/cover-grammar.png", w: 279, h: 300 },
  pronunciation: { src: "/brand/ui/cover-pronunciation.png", w: 298, h: 300 },
  listening: { src: "/brand/ui/cover-listening.png", w: 287, h: 300 },
  write: { src: "/brand/ui/mascot-write-leaves.png", w: 866, h: 770 },
  wave: { src: "/brand/ui/mascot-wave.png", w: 482, h: 492 },
  bubble: { src: "/brand/ui/mascot-bubble.png", w: 390, h: 396 },
} as const;
export type HeroMascot = keyof typeof HERO_MASCOT;

/**
 * Bìa đầu trang của mỗi chức năng — cùng kiểu với bìa Trang chủ: nền trời xanh nhạt, ánh sáng + lá trang trí, tiêu đề lớn có lá,
 * dòng hỏi đậm + mô tả, nút thao tác, mascot của chức năng bên phải. Không dùng hook → dùng được ở cả server lẫn client component.
 */
export function FeatureHero({
  id,
  eyebrow,
  title,
  question,
  description,
  mascot,
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
  mascot: HeroMascot;
  actions?: React.ReactNode;
  /** Khối phụ bên phải (thẻ số liệu…), thay cho khoảng trống cạnh mascot trên màn rộng. */
  aside?: React.ReactNode;
  className?: string;
}) {
  const m = HERO_MASCOT[mascot];
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "relative isolate overflow-hidden rounded-[24px] border border-[#D7EAF9] bg-[linear-gradient(110deg,#F7FCFF_0%,#E7F5FF_55%,#D8EEFF_100%)] shadow-card",
        className,
      )}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-[38%] size-[300px] rounded-full bg-white/70 blur-3xl" />
        <div className="absolute -bottom-28 -left-16 size-[240px] rounded-full bg-[#DDF6EA]/70 blur-3xl" />
        <div className="absolute top-4 right-[28%] size-[160px] rounded-full bg-[#CFE7FF]/60 blur-2xl" />
        <div className="absolute -right-16 -bottom-24 h-40 w-[70%] rotate-[-7deg] rounded-[50%] bg-[#B9E4FA]/55" />
        <div className="absolute -bottom-28 left-[12%] h-36 w-[58%] rotate-[6deg] rounded-[50%] bg-white/55" />
        <LeafDecor className="absolute top-3 left-3 w-9 -rotate-45 opacity-50" />
        <LeafDecor className="absolute bottom-3 left-[34%] w-11 rotate-12 opacity-40" />
        <LeafDecor className="absolute right-4 bottom-3 w-10 -rotate-12 opacity-40" />
      </div>

      <div
        className={cn(
          "grid items-center gap-4 p-5 md:p-7",
          aside
            ? "md:grid-cols-[minmax(0,1fr)_150px] xl:grid-cols-[minmax(0,1fr)_minmax(150px,200px)_minmax(240px,300px)]"
            : "md:grid-cols-[minmax(0,1fr)_minmax(150px,210px)]",
        )}
      >
        <div className="min-w-0">
          <h1 id={id} className="text-navy-900">
            {eyebrow ? (
              <span className="block text-[17px] font-bold text-blue-600 md:text-[19px]">{eyebrow}</span>
            ) : null}
            <span className="mt-0.5 flex items-center gap-2 text-[28px] leading-tight font-extrabold tracking-tight md:text-[38px]">
              <span className="min-w-0">{title}</span>
              <LeafDecor className="w-8 shrink-0 md:w-10" />
            </span>
          </h1>
          {question ? <p className="mt-1.5 text-[16.5px] font-bold text-navy md:text-[19px]">{question}</p> : null}
          {description ? (
            <p className="mt-1 max-w-[560px] text-[14.5px] text-text-2 md:text-[15px]">{description}</p>
          ) : null}
          {actions ? <div className="mt-4 flex flex-wrap gap-2.5">{actions}</div> : null}
        </div>

        <div aria-hidden="true" className="relative hidden items-center justify-center md:flex">
          <Image
            unoptimized
            src={m.src}
            alt=""
            width={m.w}
            height={m.h}
            priority
            className="relative h-auto max-h-[170px] w-auto max-w-full drop-shadow-[0_14px_22px_rgba(20,60,110,.16)]"
          />
        </div>

        {aside ? <div className="md:col-span-2 xl:col-span-1">{aside}</div> : null}
      </div>
    </section>
  );
}

/** Nút chính (gradient, bo tròn) và nút phụ (viền) theo kiểu bìa Trang chủ — dùng cho `actions`. */
export const heroPrimary =
  "inline-flex min-h-12 items-center gap-2.5 rounded-full px-6 text-[16px] font-bold text-white shadow-cta outline-none bg-grad-primary hover:[background:var(--grad-primary-hover)] focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-5";
export const heroSecondary =
  "inline-flex min-h-12 items-center gap-2 rounded-full border-[1.5px] border-[#CFE0F5] bg-white/90 px-5 text-[15px] font-semibold text-blue-700 outline-none hover:bg-white focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-[18px]";
