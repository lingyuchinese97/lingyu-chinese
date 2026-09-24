"use client";
import * as React from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = Omit<React.ComponentProps<"input">, "id"> & {
  id: string;
  label: string;
  icon: LucideIcon;
  error?: string;
  password?: boolean;
};

/** Ô nhập của trang auth: icon + nhãn nằm trong khung, nút hiện/ẩn mật khẩu. */
export function AuthField({
  id,
  label,
  icon: Icon,
  error,
  password = false,
  type = "text",
  className,
  ...props
}: Props) {
  const [show, setShow] = React.useState(false);
  const errId = `${id}-err`;
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={cn(
          "hover:border-border-strong focus-within:border-blue flex min-h-[66px] items-center gap-3 rounded-md border-[1.5px] border-[#D8E5F3] bg-white px-3 py-2 transition-[border-color,box-shadow] focus-within:[box-shadow:var(--focus-ring)] md:min-h-[76px] md:gap-[18px] md:px-[18px] md:py-2.5",
          error && "border-red hover:border-red focus-within:border-red",
          className,
        )}
      >
        <Icon className="size-[26px] shrink-0 text-blue-600 md:size-[34px]" aria-hidden="true" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <label htmlFor={id} className="text-[15px] font-semibold text-blue-700 md:text-[17px]">
            {label}
          </label>
          <input
            id={id}
            type={password ? (show ? "text" : "password") : type}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errId : undefined}
            className="text-text min-h-7 w-full border-0 bg-transparent p-0 text-base outline-none placeholder:text-[#7D8FA8] md:text-[17px]"
            {...props}
          />
        </div>
        {password && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            aria-pressed={show}
            className="flex size-11 shrink-0 items-center justify-center rounded-sm text-blue-700 hover:bg-blue-50 focus-visible:[box-shadow:var(--focus-ring)] focus-visible:outline-none"
          >
            {show ? <EyeOff className="size-6 md:size-7" /> : <Eye className="size-6 md:size-7" />}
          </button>
        )}
      </div>
      {error && (
        <p id={errId} role="alert" className="text-red pl-1 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

export function AuthTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-1 text-center">
      <h1 className="text-[30px] leading-tight font-extrabold tracking-tight text-[#0A3AB5] md:text-[38px] xl:text-[44px]">
        {title}
      </h1>
      {sub && <p className="text-text-2 mt-1 text-[15.5px] md:text-lg">{sub}</p>}
    </div>
  );
}
