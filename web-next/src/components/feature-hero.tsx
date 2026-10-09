import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** Ảnh bìa chung (theo design Ngữ pháp): nền cửa sổ + bàn gỗ, mascot ngồi viết với sách HSK · 语法, vở, cốc trà. */
const COVER = { src: "/brand/hero/cover-desk.webp", width: 2000, height: 471 };

/**
 * Bìa đầu trang dùng chung cho mọi chức năng: ảnh bìa cửa sổ + mascot ngồi viết bên bàn ở bên phải; bên trái là ô icon của
 * chức năng (tuỳ chọn), tiêu đề, mô tả và nút thao tác.
 * Không dùng hook → dùng được ở cả server lẫn client component.
 */
export function FeatureHero({
  id,
  eyebrow,
  eyebrowClassName,
  title,
  question,
  description,
  actions,
  aside,
  art = COVER,
  icon,
  iconImg,
  className,
}: {
  /** id của h1 (cho aria-labelledby). */
  id: string;
  eyebrow?: React.ReactNode;
  /** Thay kiểu mặc định (chữ xanh nhỏ) của dòng trên tiêu đề — vd "Xin chào," cỡ lớn ở Trang chủ. */
  eyebrowClassName?: string;
  title: React.ReactNode;
  question?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Khối phụ (thẻ số liệu…) hiện dưới mô tả. */
  aside?: React.ReactNode;
  /** Ảnh bìa khác (mặc định: cửa sổ + mascot ngồi viết). */
  art?: { src: string; width: number; height: number };
  /** Ô icon cam (icon trắng) trước tiêu đề — như Ngữ pháp. */
  icon?: React.ReactNode;
  /** Hoặc ô icon trắng chứa icon màu của chức năng (ảnh `public/brand/ui/nav-*.png`). */
  iconImg?: string;
  className?: string;
}) {
  const tile = icon ? (
    <span
      aria-hidden="true"
      className="flex size-16 shrink-0 items-center justify-center rounded-[20px] bg-[linear-gradient(145deg,#FFCB57_0%,#F5A524_100%)] text-white shadow-[0_10px_22px_rgba(245,165,36,.32)] md:size-20 md:rounded-[22px] xl:size-[104px] xl:rounded-[26px] [&_svg]:size-8 md:[&_svg]:size-10 xl:[&_svg]:size-[52px]"
    >
      {icon}
    </span>
  ) : iconImg ? (
    <span
      aria-hidden="true"
      className="flex size-16 shrink-0 items-center justify-center rounded-[20px] border border-white bg-white/95 shadow-[0_10px_22px_rgba(30,90,160,.14)] md:size-20 md:rounded-[22px] xl:size-[104px] xl:rounded-[26px]"
    >
      <Image unoptimized src={iconImg} alt="" width={96} height={96} className="size-9 object-contain md:size-11 xl:size-[60px]" />
    </span>
  ) : null;
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "relative isolate overflow-hidden rounded-[26px] border border-[#D3E8F8] bg-[linear-gradient(90deg,#F4F9FF_0%,#EEF7FF_100%)] shadow-card",
        className,
      )}
    >
      {/* Tranh cao tối đa 300px, neo đáy (bìa cao hơn vì có ô tìm / tiêu đề 2 dòng thì mascot không phóng to đè lên chữ);
          mép trên + mép trái mờ dần vào nền. Điện thoại: chỉ nền nhạt để chữ dễ đọc. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 hidden h-full max-h-[300px] [mask-composite:intersect] [mask-image:linear-gradient(180deg,transparent_0%,#000_14%),linear-gradient(90deg,transparent_0%,#000_10%)] md:block"
      >
        {/* Màn vừa: phủ kín khung, neo 60% ngang để mascot luôn trong khung. */}
        <Image
          unoptimized
          src={art.src}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[60%_100%] xl:hidden"
        />
        {/* Màn rộng: giữ tỉ lệ ảnh, neo phải. */}
        <Image
          unoptimized
          src={art.src}
          alt=""
          width={art.width}
          height={art.height}
          priority
          className="absolute right-0 bottom-0 hidden h-full w-auto max-w-none xl:block"
        />
      </div>
      <div className="flex min-h-[200px] flex-col justify-center gap-6 px-5 py-7 md:min-h-[260px] md:max-w-[52%] md:py-9 md:pl-10 xl:max-w-[50%] xl:pl-12">
        <div className="flex items-center gap-5 xl:gap-7">
          {tile}
          <div className="min-w-0">
            <h1 id={id} className="text-navy-900">
              {eyebrow ? (
                <span className={eyebrowClassName ?? "block text-[16px] font-bold text-blue-600 md:text-[18px]"}>
                  {eyebrow}
                </span>
              ) : null}
              <span className="mt-0.5 block text-[30px] leading-[1.12] font-black tracking-tight md:text-[32px] xl:text-[46px]">
                {title}
              </span>
            </h1>
            {question ? <p className="mt-1.5 text-[16.5px] font-bold text-navy md:text-[19px]">{question}</p> : null}
            {description ? (
              <p className="mt-2 text-[15px] font-medium text-navy/75 md:text-[16px] xl:text-[18px]">{description}</p>
            ) : null}
          </div>
        </div>
        {aside ? <div className="max-w-[420px]">{aside}</div> : null}
        {actions ? <div className="flex flex-wrap gap-2.5">{actions}</div> : null}
      </div>
    </section>
  );
}

/** Nút chính (gradient, bo tròn) và nút phụ (viền) theo kiểu bìa — dùng cho `actions`. */
export const heroPrimary =
  "inline-flex min-h-12 items-center gap-2.5 rounded-full px-6 text-[16px] font-bold text-white shadow-cta outline-none bg-grad-primary hover:[background:var(--grad-primary-hover)] focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-5";
export const heroSecondary =
  "inline-flex min-h-12 items-center gap-2 rounded-full border-[1.5px] border-[#CFE0F5] bg-white/90 px-5 text-[15px] font-semibold text-blue-700 outline-none hover:bg-white focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-[18px]";
