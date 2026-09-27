import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { grammarByTag } from "@/features/progress/service";
import { LevelRows } from "@/features/progress/components/level-rows";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("progress.grammarDetail") };
}
export const dynamic = "force-dynamic";

export default async function GrammarProgressPage() {
  const user = await requireUser();
  const t = await getT();
  const { hsk, tags } = await grammarByTag(user.id);
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <section
        aria-labelledby="pgr-hsk"
        className="rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card md:p-5"
      >
        <h2 id="pgr-hsk" className="text-[18px] font-bold text-navy-900">
          {t("progress.grammarDetail")} · {t("progress.byHsk")}
        </h2>
        <p className="mb-2 text-[13.5px] text-text-2">{t("progress.grammarHint")}</p>
        <LevelRows
          label={t("progress.byHsk")}
          rows={hsk.map((r, i) => ({
            key: String(r.level),
            name: `HSK ${r.level}`,
            value: t("progress.hskPoints", { learned: r.learned, total: r.total }),
            percent: r.percent,
            tone: i,
          }))}
        />
      </section>
      <section
        aria-labelledby="pgr-tag"
        className="rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card md:p-5"
      >
        <h2 id="pgr-tag" className="mb-2 text-[18px] font-bold text-navy-900">
          {t("progress.byTag")}
        </h2>
        {tags.length ? (
          <LevelRows
            label={t("progress.byTag")}
            rows={tags.map((r, i) => ({
              key: `${r.name}-${i}`,
              name: r.name,
              value: t("progress.hskPoints", { learned: r.learned, total: r.total }),
              percent: r.percent,
              tone: i,
            }))}
          />
        ) : (
          <p className="py-6 text-center text-[14px] text-text-2">{t("progress.noTags")}</p>
        )}
      </section>
    </div>
  );
}
