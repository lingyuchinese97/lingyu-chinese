"use client";
import * as React from "react";
import { Clock3 } from "lucide-react";
import { useIntlTag, useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { dailyAction } from "../actions";

type Day = { day: string; minutes: number };

/** Biểu đồ cột số phút học mỗi ngày, đổi được 7 ngày / 30 ngày / 3 tháng. */
export function DailyChart({ initial }: { initial: Day[] }) {
  const t = useT();
  const tag = useIntlTag();
  const [range, setRange] = React.useState(7);
  const [data, setData] = React.useState(initial);
  const [pending, start] = React.useTransition();
  const [hover, setHover] = React.useState<number | null>(null);
  const max = Math.max(30, ...data.map((d) => d.minutes));
  const top = Math.ceil(max / 30) * 30;
  const ticks = [0, 1, 2, 3, 4].map((i) => Math.round((top / 4) * i));
  const fmt = (day: string, long = false) =>
    new Date(`${day}T00:00:00Z`).toLocaleDateString(tag, {
      day: "2-digit",
      month: "2-digit",
      ...(long ? { year: "numeric" } : {}),
      timeZone: "UTC",
    });
  const every = data.length <= 7 ? 1 : data.length <= 30 ? 5 : 15;
  const peak = data.reduce((b, d, i) => (d.minutes > (data[b]?.minutes ?? -1) ? i : b), 0);
  const shown = hover ?? peak;

  function pick(days: number) {
    setRange(days);
    start(async () => setData(await dailyAction(days)));
  }

  return (
    <section
      aria-labelledby="pg-chart"
      className="flex min-w-0 flex-col gap-3 rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card md:p-5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Clock3 className="size-6 text-blue-600" aria-hidden="true" />
        <h2 id="pg-chart" className="mr-auto text-[18px] font-bold text-navy-900">
          {t("progress.chart")}
        </h2>
        <div role="group" aria-label={t("progress.rangeLabel")} className="flex gap-1.5">
          {([7, 30, 90] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={range === d}
              onClick={() => pick(d)}
              className={cn(
                "min-h-9 rounded-[10px] px-3 text-[13.5px] font-semibold outline-none focus-visible:shadow-[var(--focus-ring)]",
                range === d ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100",
              )}
            >
              {t(d === 7 ? "progress.range7" : d === 30 ? "progress.range30" : "progress.range90")}
            </button>
          ))}
        </div>
      </div>
      <div className={cn("relative flex gap-2", pending && "opacity-60")}>
        <div
          className="flex h-[200px] flex-col-reverse justify-between pb-6 text-right text-[11.5px] text-text-3"
          aria-hidden="true"
        >
          {ticks.map((v) => (
            <span key={v}>{t("progress.minutesUnit", { n: v })}</span>
          ))}
        </div>
        <div
          role="img"
          aria-label={`${t("progress.chartLabel")}: ${data.map((d) => `${fmt(d.day)} ${t("progress.minutesUnit", { n: d.minutes })}`).join(", ")}`}
          className="relative flex h-[200px] min-w-0 flex-1 items-end gap-[2px] border-b border-l border-border pb-0 sm:gap-1"
        >
          {ticks.slice(1).map((v) => (
            <span
              key={v}
              aria-hidden="true"
              className="absolute inset-x-0 border-t border-dashed border-[#E3EEF8]"
              style={{ bottom: `${(v / top) * 100}%` }}
            />
          ))}
          {data.map((d, i) => (
            <div
              key={d.day}
              className="relative flex h-full min-w-0 flex-1 items-end justify-center"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <div
                className={cn(
                  "w-full max-w-[44px] rounded-t-[6px] transition-[height] motion-reduce:transition-none",
                  i === shown && d.minutes ? "bg-blue-600" : "bg-[#5AAEF2]",
                )}
                style={{ height: `${Math.max(d.minutes ? 3 : 0, (d.minutes / top) * 100)}%` }}
              />
              {(i % every === 0 || i === data.length - 1) && (
                <span aria-hidden="true" className="absolute -bottom-6 text-[11px] whitespace-nowrap text-text-3">
                  {fmt(d.day)}
                </span>
              )}
            </div>
          ))}
          {data[shown] && data[shown]!.minutes ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-2 rounded-[10px] border border-border bg-white px-2.5 py-1 text-[12.5px] shadow-card"
              style={{ left: `clamp(0px, calc(${((shown + 0.5) / data.length) * 100}% - 48px), calc(100% - 96px))` }}
            >
              <div className="text-text-3">{fmt(data[shown]!.day, true)}</div>
              <div className="font-bold text-navy-900">{t("progress.minutesUnit", { n: data[shown]!.minutes })}</div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="h-4" />
    </section>
  );
}
