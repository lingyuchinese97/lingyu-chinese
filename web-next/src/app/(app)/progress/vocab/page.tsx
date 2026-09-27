import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { vocabByHsk, vocabByTag } from "@/features/progress/service";
import { LevelRows } from "@/features/progress/components/level-rows";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("progress.vocabDetail") };
}
export const dynamic = "force-dynamic";

export default async function VocabProgressPage() {
  const user = await requireUser();
  const t = await getT();
  const [hsk, tags] = await Promise.all([vocabByHsk(user.id), vocabByTag(user.id)]);
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <section
        aria-labelledby="pv-hsk"
        className="rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card md:p-5"
      >
        <h2 id="pv-hsk" className="text-[18px] font-bold text-navy-900">
          {t("progress.vocabDetail")} · {t("progress.byHsk")}
        </h2>
        <p className="mb-2 text-[13.5px] text-text-2">{t("progress.vocabHint")}</p>
        <LevelRows
          label={t("progress.byHsk")}
          rows={hsk.map((r, i) => ({
            key: String(r.level),
            name: r.level === 7 ? "HSK 7–9" : `HSK ${r.level}`,
            value: t("progress.hskWords", { learned: r.learned, total: r.total }),
            sub: t("progress.inBank", { n: r.inBank }),
            percent: r.percent,
            tone: i,
          }))}
        />
      </section>
      <section
        aria-labelledby="pv-tag"
        className="rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card md:p-5"
      >
        <h2 id="pv-tag" className="mb-2 text-[18px] font-bold text-navy-900">
          {t("progress.byTag")}
        </h2>
        {tags.length ? (
          <LevelRows
            label={t("progress.byTag")}
            rows={tags.map((r, i) => ({
              key: r.id,
              name: r.name,
              value: t("progress.hskWords", { learned: r.learned, total: r.total }),
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
