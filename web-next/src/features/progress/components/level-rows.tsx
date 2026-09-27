import { cn } from "@/lib/utils";

const HSK_COLOR = [
  "bg-green-50 text-green-700",
  "bg-blue-50 text-blue-700",
  "bg-amber-50 text-[#8A5300]",
  "bg-[#F1ECFF] text-[#5B3CC4]",
  "bg-red-50 text-red",
  "bg-[#E6FAFB] text-[#0B6E77]",
  "bg-[#EEF4FB] text-text-2",
];

/** Danh sách dòng tiến độ: nhãn (vd HSK 1) · số / tổng · thanh % . */
export function LevelRows({
  rows,
  label,
}: {
  rows: { key: string; name: string; value: string; sub?: string; percent: number; tone?: number }[];
  label: string;
}) {
  return (
    <ul aria-label={label} className="flex flex-col divide-y divide-border">
      {rows.map((r) => (
        <li key={r.key} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-3">
          <span
            className={cn(
              "min-w-[76px] rounded-[10px] px-2.5 py-1 text-center text-[14px] font-bold",
              HSK_COLOR[(r.tone ?? 0) % HSK_COLOR.length],
            )}
          >
            {r.name}
          </span>
          <span className="min-w-[120px] text-[14px] text-text-2 tabular-nums">
            {r.value}
            {r.sub ? <span className="block text-[12.5px] text-text-3">{r.sub}</span> : null}
          </span>
          <div
            className="h-2.5 min-w-[120px] flex-1 overflow-hidden rounded-full bg-[#EEF4FB]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={r.percent}
            aria-label={`${r.name}: ${r.value}`}
          >
            <div className="h-full rounded-full bg-blue" style={{ width: `${r.percent}%` }} />
          </div>
          <span className="w-12 text-right text-[14px] font-semibold text-text-2 tabular-nums">{r.percent}%</span>
        </li>
      ))}
    </ul>
  );
}
