"use client";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";
import { useT } from "@/i18n/client";
import type { ActivityKind } from "../constants";

/** Bộ lọc Lịch sử học tập (ghi vào URL để quay lại / chia sẻ được). */
export function HistoryFilters({ kinds, kind, days }: { kinds: ActivityKind[]; kind: string; days: number }) {
  const t = useT();
  const router = useRouter();
  const go = (k: string, d: number) => {
    const p = new URLSearchParams();
    if (k) p.set("kind", k);
    p.set("days", String(d));
    router.push(`/progress/history?${p}`);
  };
  return (
    <div className="flex flex-wrap gap-2">
      <label className="sr-only" htmlFor="ph-kind">
        {t("progress.filterKind")}
      </label>
      <Select id="ph-kind" value={kind} onChange={(e) => go(e.target.value, days)} className="h-10 w-auto">
        <option value="">{t("progress.allKinds")}</option>
        {kinds.map((k) => (
          <option key={k} value={k}>
            {t(`progress.kind.${k}`)}
          </option>
        ))}
      </Select>
      <label className="sr-only" htmlFor="ph-days">
        {t("progress.filterDays")}
      </label>
      <Select id="ph-days" value={days} onChange={(e) => go(kind, Number(e.target.value))} className="h-10 w-auto">
        {[7, 30, 90, 365].map((d) => (
          <option key={d} value={d}>
            {t("progress.lastDays", { n: d })}
          </option>
        ))}
      </Select>
    </div>
  );
}
