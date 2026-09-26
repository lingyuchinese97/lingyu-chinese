"use client";
import * as React from "react";
import { RotateCcw, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { LISTENING } from "@/lib/limits";
import { formatTime, parseTime } from "@/lib/media-url";

export type Segment = { start: number; end: number };

/** Chọn đoạn (ô giờ + thanh kéo 2 đầu) · tốc độ nghe (dropdown) · lặp lại đoạn · tự chuyển đoạn tiếp theo. */
export function SegmentControls({
  duration,
  segment,
  onSegment,
  onApply,
  speed,
  onSpeed,
  loop,
  onLoop,
  autoNext,
  onAutoNext,
}: {
  duration: number;
  segment: Segment | null;
  onSegment: (s: Segment) => void;
  onApply: (s: Segment) => void;
  speed: number;
  onSpeed: (v: number) => void;
  loop: boolean;
  onLoop: (v: boolean) => void;
  autoNext: boolean;
  onAutoNext: (v: boolean) => void;
}) {
  const t = useT();
  const has = duration > 0 && !!segment;
  const [draft, setDraft] = React.useState({ start: "", end: "" });
  const [err, setErr] = React.useState("");
  // Đồng bộ ô giờ khi đoạn đổi từ nơi khác (thanh kéo, tự chuyển đoạn).
  const segKey = segment ? `${segment.start}-${segment.end}` : "";
  const [shownKey, setShownKey] = React.useState("");
  if (shownKey !== segKey) {
    setShownKey(segKey);
    setDraft(segment ? { start: formatTime(segment.start), end: formatTime(segment.end) } : { start: "", end: "" });
  }

  function apply() {
    if (!has) return void setErr(t("listening.segment.needMedia"));
    const s = parseTime(draft.start);
    const e = parseTime(draft.end);
    if (s === null || e === null) return void setErr(t("listening.segment.badTime"));
    if (e <= s) return void setErr(t("listening.segment.invalid"));
    setErr("");
    const next = { start: Math.min(s, duration), end: Math.min(e, duration) };
    onSegment(next);
    onApply(next);
  }

  const max = Math.max(1, Math.ceil(duration));
  const pct = (v: number) => `${(v / max) * 100}%`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 id="seg-title" className="flex items-center gap-2 text-[15px] font-bold text-navy">
          <Scissors className="size-[18px] text-blue-600" aria-hidden="true" />
          {t("listening.segment.title")}
        </h3>
        {/* Thanh kéo 2 đầu (hai input range chồng lên nhau). */}
        <div className="relative h-8" aria-describedby="seg-title">
          <div className="absolute top-1/2 right-2 left-2 h-1.5 -translate-y-1/2 rounded-full bg-blue-100">
            {has ? (
              <div
                className="absolute h-full rounded-full bg-blue"
                style={{ left: pct(segment!.start), width: pct(segment!.end - segment!.start) }}
              />
            ) : null}
          </div>
          {(["start", "end"] as const).map((k) => (
            <input
              key={k}
              type="range"
              min={0}
              max={max}
              step={0.5}
              disabled={!has}
              value={segment ? segment[k] : 0}
              aria-label={t(k === "start" ? "listening.segment.startSlider" : "listening.segment.endSlider")}
              aria-valuetext={segment ? formatTime(segment[k]) : undefined}
              onChange={(e) => {
                if (!segment) return;
                const v = Number(e.target.value);
                const next =
                  k === "start"
                    ? { start: Math.min(v, segment.end - 0.5), end: segment.end }
                    : { start: segment.start, end: Math.max(v, segment.start + 0.5) };
                setErr("");
                onSegment(next);
              }}
              className="lx-range pointer-events-none absolute inset-0 w-full appearance-none bg-transparent disabled:opacity-40"
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["start", "end"] as const).map((k, i) => (
            <React.Fragment key={k}>
              {i ? (
                <span className="text-text-3" aria-hidden="true">
                  –
                </span>
              ) : null}
              <label className="w-[92px]">
                <span className="sr-only">{t(`listening.segment.${k}`)}</span>
                <input
                  value={draft[k]}
                  disabled={!has}
                  inputMode="numeric"
                  onChange={(e) => {
                    setDraft((d) => ({ ...d, [k]: e.target.value }));
                    setErr("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && apply()}
                  placeholder="00:00"
                  title={t("listening.segment.timeHint")}
                  aria-invalid={!!err || undefined}
                  className={cn(inputClass, "h-10 px-2 text-center tabular-nums")}
                />
              </label>
            </React.Fragment>
          ))}
          <Button type="button" size="sm" variant="secondary" disabled={!has} onClick={apply}>
            <Scissors />
            {t("listening.segment.set")}
          </Button>
        </div>
        {err ? (
          <p role="alert" className="text-[13.5px] text-red">
            {err}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="lx-speed" className="text-[15px] font-bold text-navy">
          {t("listening.speed.label")}
        </label>
        <select
          id="lx-speed"
          value={speed}
          onChange={(e) => onSpeed(Number(e.target.value))}
          className={cn(inputClass, "h-10 w-[92px] cursor-pointer px-3 font-semibold")}
        >
          {LISTENING.SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s}x
            </option>
          ))}
        </select>
        <Button type="button" size="sm" variant="ghost" disabled={speed === 1} onClick={() => onSpeed(1)}>
          <RotateCcw />
          {t("listening.speed.reset")}
        </Button>
      </div>

      <div className="flex flex-col gap-2.5">
        <Toggle checked={loop} onChange={onLoop} label={t("listening.toggles.loop")} />
        <Toggle checked={autoNext} onChange={onAutoNext} label={t("listening.toggles.autoNext")} />
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group inline-flex min-h-9 items-center gap-3 self-start rounded-md text-left text-[15px] text-text outline-none focus-visible:shadow-[var(--focus-ring)]"
    >
      <span
        aria-hidden="true"
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-blue-600" : "bg-[#C9D6E6]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left]",
            checked ? "left-[22px]" : "left-0.5",
          )}
        />
      </span>
      {label}
    </button>
  );
}
