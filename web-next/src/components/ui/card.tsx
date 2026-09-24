import * as React from "react";
import { cn } from "@/lib/utils";

/** Khung nội dung chính của trang (.page-card ở bản cũ). */
export function Card({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("relative rounded-xl border border-border bg-white/90 p-5 shadow-card sm:p-7", className)}
      {...props}
    />
  );
}
