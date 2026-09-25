"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarClock, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { startCustomAction } from "@/features/review/actions";
import type { ReviewMode } from "@/features/review/schema";

/** Số câu cho một bài ôn tập tự chọn (như bản cũ). */
export const REVIEW_COUNTS = [5, 10, 20, 30, 50] as const;

/** Chọn số từ + bắt đầu ôn tập (dùng hình thức lần trước), và "Ôn ngay" các thẻ đến hạn. */
export function ReviewStartCard({
  total,
  due,
  hasActive,
  lastMode,
  lastShowImage,
}: {
  total: number;
  due: number;
  hasActive: boolean;
  lastMode: ReviewMode;
  lastShowImage: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
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

  async function start() {
    if (busy) return;
    if (hasActive) {
      toast.info("Bạn còn một bài ôn tập chưa hoàn thành.");
      return router.push("/review/setup");
    }
    setBusy(true);
    const r = await startCustomAction({ tags: [], count, mode: lastMode, showImage: lastShowImage });
    if (!r.ok) {
      setBusy(false);
      return void toast.error(r.message || "Không thể tạo bài ôn tập.");
    }
    router.push("/review/session");
  }

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
        <Button variant="primary" size="lg" disabled={!total || busy} onClick={start}>
          {busy ? <Loader2 className="animate-spin" /> : <Play />}
          {busy ? "Đang chuẩn bị..." : "Bắt đầu ôn tập"}
          {!busy ? <ArrowRight /> : null}
        </Button>
        {due ? (
          <Button asChild variant="secondary" size="lg">
            <Link href="/review/due">
              <CalendarClock />
              Ôn ngay ({due})
            </Link>
          </Button>
        ) : (
          <Button variant="secondary" size="lg" disabled>
            <CalendarClock />
            Ôn ngay
          </Button>
        )}
      </div>
      {!total ? (
        <p className="-mt-2 text-center text-[13.5px] text-text-3">Thêm ít nhất 1 từ vựng để bắt đầu ôn tập.</p>
      ) : null}
    </>
  );
}
