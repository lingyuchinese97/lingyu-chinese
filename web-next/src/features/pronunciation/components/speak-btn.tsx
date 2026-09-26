"use client";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { speakZh, useChineseVoice, type SpeakMode } from "./speech";

/**
 * Nút đọc bằng giọng tiếng Trung của máy. Máy không có giọng → ẩn (như SpeakButton).
 * `text` là mảng → đọc từng phần tách rời.
 */
export function SpeakBtn({
  text,
  label,
  children,
  mode = "normal",
  className,
  size = "md",
}: {
  text: string | string[];
  label: string;
  children?: React.ReactNode;
  mode?: SpeakMode;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const voice = useChineseVoice();
  if (!voice) return null;
  return (
    <button
      type="button"
      onClick={() => speakZh(text, mode)}
      aria-label={children ? undefined : label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold text-blue-600 outline-none hover:bg-blue-100 focus-visible:shadow-[var(--focus-ring)]",
        children ? "h-10 rounded-[12px] border border-[#CFE3F7] bg-blue-50 px-4 text-[15px]" : "bg-blue-50",
        !children && size === "sm" && "size-8 [&_svg]:size-4",
        !children && size === "md" && "size-10 [&_svg]:size-5",
        !children && size === "lg" && "size-14 [&_svg]:size-7",
        className,
      )}
    >
      <Volume2 aria-hidden="true" />
      {children}
    </button>
  );
}
