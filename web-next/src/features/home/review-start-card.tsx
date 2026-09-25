"use client";
import * as React from "react";
import { ArrowRight, CalendarClock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Số câu cho một bài ôn tập tự chọn (như bản cũ). */
export const REVIEW_COUNTS = [5, 10, 20, 30, 50] as const;

/**
 * Chọn số từ + bắt đầu ôn tập, và "Ôn ngay" các thẻ đến hạn.
 * Phần Ôn tập (phase 5–6) chưa làm → nút tạm tắt, kèm ghi chú.
 */
export function ReviewStartCard({ total, due }: { total: number; due: number }) {
  const options: { value: number; label: string; disabled: boolean }[] = REVIEW_COUNTS.map((c) => ({
    value: c,
    label: `${c} từ${c > total ? " (chưa đủ từ)" : ""}`,
    disabled: c > total,
  }));
  if (total > 0 && total < 50 && !REVIEW_COUNTS.includes(total as (typeof REVIEW_COUNTS)[number]))
    options.push({ value: total, label: `Tất cả (${total} từ)`, disabled: false });
  const enabled = options.filter((o) => !o.disabled).map((o) => o.value);
  const def = enabled.includes(10) ? 10 : (enabled[enabled.length - 1] ?? 0);
  const [count, setCount] = React.useState(def);
  const comingSoon = true;

  return (
    <>
      <label className="flex flex-col gap-2.5 rounded-[18px] bg-[#F2F8FE] px-5 py-4">
        <span className="text-[15.5px] text-text-2">Chọn số từ để ôn tập</span>
        <select
          className={cn(inputClass, "cursor-pointer")}
          disabled={!total}
          value={total ? count : ""}
          onChange={(e) => setCount(Number(e.target.value))}
        >
          {total ? (
            options.map((o) => (
              <option key={`${o.value}-${o.label}`} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))
          ) : (
            <option value="">Chưa có từ vựng</option>
          )}
        </select>
      </label>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <Button variant="primary" size="lg" disabled={!total || comingSoon}>
          <Play />
          Bắt đầu ôn tập
          <ArrowRight />
        </Button>
        <Button variant="secondary" size="lg" disabled={!due || comingSoon}>
          <CalendarClock />
          Ôn ngay{due ? ` (${due})` : ""}
        </Button>
      </div>
      <p className="-mt-2 text-center text-[13.5px] text-text-3">
        {!total
          ? "Thêm ít nhất 1 từ vựng để bắt đầu ôn tập."
          : "Chức năng ôn tập đang được hoàn thiện và sẽ mở trong bản cập nhật tới."}
      </p>
    </>
  );
}
