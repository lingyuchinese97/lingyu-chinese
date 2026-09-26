"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { compareDictation } from "@/lib/dictation-compare";
import { inputClass } from "@/components/ui/input";

/**
 * Ô sửa bài làm có so sánh TỨC THÌ: mỗi lần gõ → compareDictation(đáp án, nội dung) → tô đỏ phần không khớp ngay trong ô.
 * Kỹ thuật: lớp hiển thị màu nằm dưới <textarea> trong suốt (cùng font / padding) nên vẫn gõ, IME, hoàn tác như ô thường.
 */
export function DiffTextarea({
  id,
  value,
  onChange,
  reference,
  maxLength,
  className,
  ...rest
}: Omit<React.ComponentProps<"textarea">, "value" | "onChange"> & {
  id: string;
  value: string;
  onChange: (v: string) => void;
  reference: string;
  maxLength: number;
}) {
  const back = React.useRef<HTMLDivElement>(null);
  const deferred = React.useDeferredValue(value);
  const computed = React.useMemo(
    () => (reference.trim() ? compareDictation(reference, deferred).parts : null),
    [reference, deferred],
  );
  // Chữ trong ô là trong suốt: lớp dưới phải luôn đúng nội dung hiện tại (kết quả so sánh cũ → hiện chữ thường).
  const parts = deferred === value ? computed : null;
  const shared =
    "font-cn text-[18px] leading-[1.8] px-4 py-3 whitespace-pre-wrap break-words [overflow-wrap:anywhere] tracking-normal";
  return (
    <div className={cn("relative", className)}>
      <div
        ref={back}
        aria-hidden="true"
        className={cn(
          shared,
          "pointer-events-none absolute inset-0 overflow-hidden rounded-md border-[1.5px] border-transparent text-text",
        )}
      >
        {parts
          ? parts.map((p, i) =>
              p.kind === "missing" ? null : (
                <span
                  key={i}
                  className={cn(p.status === "wrong" && "text-red", p.status === "extra" && "text-[#8A97AA]")}
                >
                  {p.text}
                </span>
              ),
            )
          : value}
        {"\n"}
      </div>
      <textarea
        {...rest}
        id={id}
        lang="zh"
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        onScroll={(e) => {
          if (back.current) back.current.scrollTop = e.currentTarget.scrollTop;
        }}
        spellCheck={false}
        className={cn(
          inputClass,
          shared,
          "relative h-auto min-h-[120px] resize-y bg-transparent text-transparent caret-text selection:bg-blue-100 selection:text-text",
        )}
      />
    </div>
  );
}
