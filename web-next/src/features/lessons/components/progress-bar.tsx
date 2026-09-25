import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  max,
  label,
  className,
}: {
  value: number;
  max: number;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("h-2 overflow-hidden rounded-full bg-blue-50", className)}
    >
      <span
        className="block h-full rounded-full bg-[linear-gradient(90deg,var(--color-blue),var(--color-cyan))] transition-[width]"
        style={{ width: `${max ? (value / max) * 100 : 0}%` }}
      />
    </div>
  );
}
