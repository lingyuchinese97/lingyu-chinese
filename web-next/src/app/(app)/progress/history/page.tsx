import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { addDays, dayVN, history } from "@/features/progress/service";
import { ACTIVITY_KINDS } from "@/features/progress/constants";
import { historyQuerySchema } from "@/features/progress/schema";
import { ActivityIcon, activityLine } from "@/features/progress/components/activity";
import { HistoryFilters } from "@/features/progress/components/history-filters";
import { getIntlTag, getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("progress.historyTitle") };
}
export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function HistoryPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  const t = await getT();
  const tag = await getIntlTag();
  const sp = await searchParams;
  const q = historyQuerySchema.parse({ kind: one(sp.kind), days: one(sp.days) ?? 7 });
  const items = await history(user.id, { ...q, limit: 300 });
  const todayDay = dayVN();
  const yesterday = addDays(todayDay, -1);
  const groups = new Map<string, typeof items>();
  for (const a of items) {
    const d = dayVN(a.createdAt);
    groups.set(d, [...(groups.get(d) ?? []), a]);
  }
  const label = (d: string) => {
    const date = new Date(`${d}T00:00:00Z`).toLocaleDateString(tag, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    });
    return d === todayDay
      ? `${t("progress.today")} · ${date}`
      : d === yesterday
        ? `${t("progress.yesterday")} · ${date}`
        : date;
  };
  return (
    <section
      aria-labelledby="ph-title"
      className="rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card md:p-5"
    >
      <div className="mb-3 flex flex-wrap items-start gap-3">
        <div className="mr-auto">
          <h2 id="ph-title" className="text-[18px] font-bold text-navy-900">
            {t("progress.historyTitle")}
          </h2>
          <p className="text-[13.5px] text-text-2">{t("progress.historySub")}</p>
        </div>
        <HistoryFilters kinds={[...ACTIVITY_KINDS]} kind={q.kind ?? ""} days={q.days} />
      </div>
      {groups.size ? (
        <div className="flex flex-col gap-4">
          {[...groups.entries()].map(([d, list]) => (
            <section key={d} aria-label={label(d)}>
              <h3 className="mb-1 text-[14.5px] font-bold text-navy-900">{label(d)}</h3>
              <ul className="flex flex-col divide-y divide-border">
                {list.map((a) => {
                  const line = activityLine(a, t);
                  return (
                    <li key={a.id} className="flex items-center gap-3 py-2.5">
                      <ActivityIcon kind={a.kind} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-navy-900">{line.title}</p>
                        <p className="truncate text-[13px] text-text-2">{line.sub}</p>
                      </div>
                      <time
                        dateTime={a.createdAt.toISOString()}
                        className="shrink-0 text-[13px] text-text-3 tabular-nums"
                      >
                        {a.createdAt.toLocaleTimeString(tag, {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Ho_Chi_Minh",
                        })}
                      </time>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-[14px] text-text-2">{t("progress.noHistory")}</p>
      )}
    </section>
  );
}
