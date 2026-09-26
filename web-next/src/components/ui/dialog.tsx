"use client";
import * as React from "react";
import { Dialog as D } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";

/**
 * Hộp thoại theo mẫu shadcn: giữa màn hình trên desktop, dạng "bottom sheet" trượt từ đáy trên điện thoại
 * (có thanh kéo, tôn trọng safe-area). Radix lo focus trap, Esc, aria.
 */
export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({
  title,
  description,
  icon,
  wide,
  className,
  children,
  ...props
}: React.ComponentProps<typeof D.Content> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  wide?: boolean;
}) {
  const t = useT();
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-[80] bg-[rgba(9,35,80,.38)]" />
      <D.Content
        {...props}
        aria-describedby={description ? undefined : props["aria-describedby"]}
        className={cn(
          "fixed z-[81] flex flex-col gap-4 bg-white shadow-[0_20px_60px_rgba(9,35,80,.25)] outline-none",
          // điện thoại: bottom sheet
          "inset-x-0 bottom-0 max-h-[92dvh] animate-sheet-in overflow-y-auto rounded-t-[22px] px-[18px] pt-3 pb-[calc(18px+var(--safe-b))] motion-reduce:animate-none",
          "before:mx-auto before:mb-1 before:block before:h-[5px] before:w-11 before:rounded-full before:bg-border-strong",
          // desktop: giữa màn hình
          "md:inset-auto md:top-1/2 md:left-1/2 md:max-h-[88dvh] md:w-[calc(100vw-48px)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[22px] md:p-7 md:before:hidden",
          wide ? "md:max-w-[640px]" : "md:max-w-[460px]",
          className,
        )}
      >
        <div className="flex items-start gap-3 pr-8">
          {icon ? (
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 [&_svg]:size-6">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <D.Title className="text-xl font-bold text-navy">{title}</D.Title>
            {description ? <D.Description className="mt-1 text-[15px] text-text-2">{description}</D.Description> : null}
          </div>
        </div>
        {children}
        <D.Close
          aria-label={t("common.close")}
          className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full text-text-2 outline-none hover:bg-blue-50 focus-visible:shadow-[var(--focus-ring)] md:top-5 md:right-5"
        >
          <X className="size-5" />
        </D.Close>
      </D.Content>
    </D.Portal>
  );
}

export function DialogActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-1 flex flex-wrap justify-end gap-2.5 max-md:[&>*]:min-h-12 max-md:[&>*]:flex-1", className)}
      {...props}
    />
  );
}
