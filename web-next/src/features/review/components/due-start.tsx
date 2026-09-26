"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { MODES, type ReviewMode } from "../schema";
import { startDueAction } from "../actions";
import { useT } from "@/i18n/client";

/** Chọn dạng câu hỏi rồi bắt đầu ôn các thẻ FSRS đến hạn. */
export function DueStart({ due, defaultMode }: { due: number; defaultMode: ReviewMode }) {
  const router = useRouter();
  const t = useT();
  const [mode, setMode] = React.useState<ReviewMode>(defaultMode);
  const [busy, setBusy] = React.useState(false);
  async function start() {
    setBusy(true);
    const r = await startDueAction({ mode, showImage: false });
    if (!r.ok) {
      setBusy(false);
      return void toast.error(r.message);
    }
    router.push("/review/session");
  }
  return (
    <div className="flex flex-col gap-4">
      <div role="radiogroup" aria-label={t("review.setup.step3")} className="grid gap-2.5 sm:grid-cols-2">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={m.value === mode}
            onClick={() => setMode(m.value)}
            className={cn(
              "min-h-12 rounded-[12px] border-[1.5px] px-4 text-left font-semibold",
              m.value === mode
                ? "border-blue bg-blue-50 text-blue-700"
                : "border-border bg-white text-text hover:border-border-strong",
            )}
          >
            {t(m.label)}
          </button>
        ))}
      </div>
      <Button variant="primary" size="lg" block disabled={!due || busy} onClick={start}>
        {busy ? <Loader2 className="animate-spin" /> : <Play />}
        {busy
          ? t("review.setup.preparing")
          : due
            ? t("review.due.startCount", { count: Math.min(due, 50) })
            : t("review.due.startNow")}
      </Button>
      {!due ? (
        <p className="flex items-center justify-center gap-2 text-center text-[15px] text-text-2">
          <CalendarClock className="size-5 text-green-700" />
          {t("errors.noDueCards")}
        </p>
      ) : null}
    </div>
  );
}
