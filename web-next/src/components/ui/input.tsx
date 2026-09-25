import * as React from "react";
import { cn } from "@/lib/utils";

export const inputClass =
  "h-12 w-full min-w-0 rounded-md border-[1.5px] border-border bg-white px-4 text-[15.5px] text-text transition-[border-color,box-shadow] outline-none placeholder:text-[#9AAAC0] hover:border-border-strong focus-visible:border-blue focus-visible:shadow-[var(--focus-ring)] aria-invalid:border-red disabled:cursor-not-allowed disabled:opacity-60";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn(inputClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(inputClass, "h-auto min-h-24 py-3 leading-relaxed", className)}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        inputClass,
        "cursor-pointer appearance-none bg-[url(\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%230B7BE0'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='m6%209%206%206%206-6'/%3E%3C/svg%3E\")] bg-[length:20px] bg-[right_14px_center] bg-no-repeat pr-11 font-semibold",
        className,
      )}
      {...props}
    />
  );
}
