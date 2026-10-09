import type { Metadata } from "next";
import { sceneOf } from "@/data/reading/scenes";
import { Cover } from "@/features/library/components/hub/parts";
import Link from "next/link";
import { BookmarkCheck, ChevronRight, History, Library } from "lucide-react";
import { requireUser } from "@/server/session";
import { getIntlTag, getLocale, getT } from "@/i18n/server";
import { estimateLevel, localGrammar } from "@/features/translation/service";
import { listPassages, listSaved, readingHistory } from "@/features/reading/service";
import { ReadingSetup } from "@/features/reading/components/reading-setup";
import { R_PASSAGES } from "@/data/reading/passages";
import { FeatureHero } from "@/components/feature-hero";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("reading.title") };
}
export const dynamic = "force-dynamic";

export default async function ReadingPage() {
  const user = await requireUser();
  const t = await getT();
  const l = await getLocale();
  const tag = await getIntlTag();
  const [level, saved, history] = await Promise.all([
    estimateLevel(user.id),
    listSaved(user.id, l),
    readingHistory(user.id, l, 5),
  ]);
  const used = new Set(R_PASSAGES.flatMap((p) => p.grammar.map((g) => g.id)));
  const grammar = localGrammar(l)
    .filter((g) => used.has(g.id))
    .map((g) => ({ id: g.id, name: g.name }));
  const library = listPassages({}, l);
  const date = new Intl.DateTimeFormat(tag, { day: "2-digit", month: "2-digit" });
  const item = (p: (typeof library)[number], sub?: string) => (
    <Link
      href={`/reading/${p.id}`}
      aria-label={t("reading.open", { title: p.title })}
      className="flex items-center gap-3 rounded-xl px-2 py-2 outline-none hover:bg-blue-50 focus-visible:shadow-[var(--focus-ring)]"
    >
      <span className="min-w-0 flex-1">
        <span lang="zh" className="block truncate hanzi font-semibold text-text">
          {p.title}
        </span>
        <span className="block truncate text-[13px] text-text-2">
          HSK {p.level} · {t(`reading.types.${p.type}`)}
          {sub ? ` · ${sub}` : ""}
        </span>
      </span>
      <ChevronRight className="size-4 text-text-3" aria-hidden="true" />
    </Link>
  );
  return (
    <div className="flex flex-col gap-4">
      <FeatureHero
        iconImg="/brand/ui/nav-reading.png?v=2"
        id="rd-page-title"
        title={t("reading.title")}
        description={t("reading.subtitle")}
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <ReadingSetup level={level} grammar={grammar} />
        <div className="flex flex-col gap-4">
          <section
            aria-labelledby="rd-saved"
            className="rounded-[var(--radius-xl)] border border-border bg-white p-4 shadow-card"
          >
            <h2 id="rd-saved" className="mb-2 flex items-center gap-2 font-bold text-navy-900">
              <BookmarkCheck className="size-5 text-blue-600" aria-hidden="true" />
              {t("reading.saved")}
            </h2>
            {saved.length ? (
              <ul className="grid gap-0.5">
                {saved.map((p) => (
                  <li key={p.id}>{item(p)}</li>
                ))}
              </ul>
            ) : (
              <p className="text-[14.5px] text-text-2">{t("reading.savedEmpty")}</p>
            )}
          </section>
          <section
            aria-labelledby="rd-hist"
            className="rounded-[var(--radius-xl)] border border-border bg-white p-4 shadow-card"
          >
            <h2 id="rd-hist" className="mb-2 flex items-center gap-2 font-bold text-navy-900">
              <History className="size-5 text-rose" aria-hidden="true" />
              {t("reading.history")}
            </h2>
            {history.length ? (
              <ul className="grid gap-0.5">
                {history.map((h) => (
                  <li key={h.id}>
                    {item(
                      h.passage,
                      `${t("reading.historyItem", { correct: h.correct, total: h.total })} · ${date.format(new Date(h.createdAt))}`,
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14.5px] text-text-2">{t("reading.historyEmpty")}</p>
            )}
          </section>
        </div>
      </div>
      <section
        aria-labelledby="rd-lib"
        className="rounded-[var(--radius-xl)] border border-border bg-white p-4 shadow-card md:p-5"
      >
        <h2 id="rd-lib" className="mb-3 flex flex-wrap items-center gap-2 text-[18px] font-bold text-navy-900">
          <Library className="size-5 text-blue-600" aria-hidden="true" />
          {t("reading.library")}
          <span className="text-[14px] font-medium text-text-2">
            {t("reading.libraryCount", { count: library.length })}
          </span>
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {library.map((p) => (
            <li key={p.id}>
              <Link
                href={`/reading/${p.id}`}
                aria-label={t("reading.open", { title: p.title })}
                className="flex h-full flex-col overflow-hidden rounded-2xl border border-border outline-none hover:border-[#A9D3F8] hover:bg-[#F8FBFF] focus-visible:shadow-[var(--focus-ring)]"
              >
                <Cover emoji={sceneOf(p.id).main} tone={sceneOf(p.id).tone} size="md" className="h-[96px] w-full" />
                <span className="flex flex-1 flex-col gap-1 p-3.5">
                  <span className="flex flex-wrap gap-1.5 text-[12px] font-semibold">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">HSK {p.level}</span>
                    <span className="rounded-full bg-[#F3EEFF] px-2 py-0.5 text-[#6B46C1]">
                      {t(`reading.types.${p.type}`)}
                    </span>
                  </span>
                  <span lang="zh" className="hanzi text-[18px] font-bold text-navy-900">
                    {p.title}
                  </span>
                  <span className="text-[13.5px] text-text-2">{p.titleTr}</span>
                  <span className="mt-auto text-[12.5px] text-text-3">{t("reading.words", { count: p.words })}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
