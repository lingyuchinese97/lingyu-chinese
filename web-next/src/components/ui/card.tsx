import * as React from "react";
import { cn } from "@/lib/utils";

/** Khung nội dung chính của trang (.page-card ở bản cũ). */
export function Card({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("border-border shadow-card relative rounded-xl border bg-white/90 p-5 sm:p-7", className)}
      {...props}
    />
  );
}
