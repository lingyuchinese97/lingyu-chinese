"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Filter, Lightbulb, Search, Tags } from "lucide-react";
import { SpeakButton } from "@/components/speak-button";
import { Pager } from "@/components/ui/list-controls";
import { toast } from "@/components/ui/toaster";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { LIB_SET_TOPICS } from "@/data/library/vocab-sets";
import type { HskList } from "../../sets";
import { setHskLearnedAction } from "../../actions";
import { Crumbs, Pill, Ring, card } from "./parts";
import { FeatureHero } from "@/components/feature-hero";

/** Từ vựng theo cấp HSK: tab cấp, tìm, danh sách (pinyin, nghĩa, ví dụ, cách nhớ, đã học), tiến độ. */
export function HskListView({ data, q: q0 }: { data: HskList; q: string }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = React.useTransition();
  const [q, setQ] = React.useState(q0);
  // Thay đổi vừa bấm (chưa có trong dữ liệu server) — phủ lên `data` để hiện ngay.
  const [over, setOver] = React.useState<Record<string, boolean>>({});
  const items = data.items.map((x) => (x.zh in over ? { ...x, learned: over[x.zh]! } : x));
  const learned =
    data.learned +
    data.items.reduce((n, x) => n + (x.zh in over && over[x.zh] !== x.learned ? (over[x.zh] ? 1 : -1) : 0), 0);
  const go = React.useCallback(
    (p: { level?: number; q?: string; page?: number }) => {
      const sp = new URLSearchParams();
      const level = p.level ?? data.level;
      const qq = (p.q ?? q0).trim();
      const page = p.page ?? 1;
      if (level !== 1) sp.set("level", String(level));
      if (qq) sp.set("q", qq);
      if (page > 1) sp.set("page", String(page));
      startTransition(() => router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false }));
    },
    [data.level, q0, pathname, router],
  );
  React.useEffect(() => {
    if (q === q0) return;
    const id = setTimeout(() => go({ q }), 300);
    return () => clearTimeout(id);
  }, [q, q0, go]);

  async function toggle(zh: string, on: boolean) {
    setOver((o) => ({ ...o, [zh]: on }));
    const r = await setHskLearnedAction(data.level, zh, on);
    if (!r.ok) {
      setOver((o) => ({ ...o, [zh]: !on }));
      toast.error(t.maybe(r.message));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Crumbs
        label={t("shell.breadcrumb")}
        home={t("shell.nav.home")}
        items={[
          { href: "/library", text: t("libhub.breadcrumb") },
          { href: "/library/vocabulary", text: t("libhub.vocabTitle") },
          { text: `HSK ${data.level}` },
        ]}
      />
      <FeatureHero
        iconImg="/brand/ui/nav-library.png?v=2"
        id="lhsk-title"
        title={t("libhub.hskTitle", { level: data.level })}
        description={t("libhub.hskSub", { level: data.level })}
      />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-3">
          <nav aria-label={t("libhub.hskLevels")} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {[1, 2, 3, 4, 5, 6].map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={data.level === l}
                onClick={() => go({ level: l, q: "", page: 1 })}
                className={cn(
                  "min-h-11 shrink-0 rounded-[14px] border px-6 font-semibold",
                  data.level === l
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-border bg-white text-navy-900 hover:bg-blue-50",
                )}
              >
                HSK {l}
              </button>
            ))}
          </nav>
          <section
            aria-label={t("libhub.hskTitle", { level: data.level })}
            aria-busy={pending || undefined}
            className={cn(card, "overflow-hidden transition-opacity", pending && "opacity-60")}
          >
            {!items.length ? (
              <p className="px-4 py-10 text-center text-text-2">{t("libhub.hskEmpty")}</p>
            ) : (
              <ol className="divide-y divide-[#EDF3F9]">
                {items.map((w) => (
                  <li
                    key={w.zh}
                    className="grid gap-3 p-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center md:p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[13px] font-bold text-blue-700">
                        {w.n}
                      </span>
                      <span lang="zh" className="min-w-[64px] text-center hanzi text-[40px] leading-none text-navy-900">
                        {w.zh}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[18px] pinyin text-blue-600">{w.py}</span>
                          <SpeakButton text={w.zh} label={t("ui.listen", { text: w.zh })} className="size-8" />
                        </div>
                        <p className={cn("text-[14.5px]", w.meaning ? "text-text" : "text-text-3")}>
                          {w.meaning || t("libhub.noMeaning")}
                        </p>
                        {w.pos.length ? (
                          <p className="mt-1 flex flex-wrap gap-1">
                            {w.pos.map((p) => (
                              <Pill key={p}>{t(`library.pos.${p}`)}</Pill>
                            ))}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="min-w-0 rounded-[12px] bg-[#F7FAFE] p-2.5">
                      {w.example ? (
                        <>
                          <Pill className="mb-0.5">{t("libhub.example")}</Pill>
                          <p lang="zh" className="hanzi text-[15px] font-semibold text-navy-900">
                            {w.example.zh}
                          </p>
                          <p className="text-[12.5px] text-text-2">{w.example.py}</p>
                          <p className="text-[12.5px] text-text-2">{w.example.meaning}</p>
                        </>
                      ) : (
                        <p className="text-[13px] text-text-3">—</p>
                      )}
                    </div>
                    <p className="flex min-w-0 gap-2 text-[13.5px] text-text">
                      <Lightbulb className="size-5 shrink-0 text-amber" aria-hidden="true" />
                      <span>{w.mnemonic || t("libhub.hskMnemonicDefault", { py: w.py, word: w.zh })}</span>
                    </p>
                    <label className="flex size-10 cursor-pointer items-center justify-center justify-self-end rounded-full hover:bg-green-50">
                      <span className="sr-only">
                        {w.learned
                          ? t("libhub.unmarkLearned", { word: w.zh })
                          : t("libhub.markLearned", { word: w.zh })}
                      </span>
                      <input
                        type="checkbox"
                        checked={w.learned}
                        onChange={(e) => toggle(w.zh, e.target.checked)}
                        className="size-5 accent-[#22C08A]"
                      />
                    </label>
                  </li>
                ))}
              </ol>
            )}
          </section>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13.5px] text-text-2">{t("libhub.wordsCount", { count: data.total })}</span>
            <Pager page={data.page} count={data.pageCount} onGo={(page) => go({ page })} />
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <section aria-labelledby="hk-prog" className={cn(card, "flex items-center gap-4 p-4")}>
            <Ring value={learned} total={data.levelTotal} size={96} />
            <div>
              <h2 id="hk-prog" className="font-bold text-navy-900">
                {t("libhub.progress")}
              </h2>
              <p className="text-[13.5px] text-text-2">
                {t("libhub.hskProgress", { learned, total: data.levelTotal })}
              </p>
            </div>
          </section>
          <section aria-labelledby="hk-filter" className={cn(card, "flex flex-col gap-2 p-4")}>
            <h2 id="hk-filter" className="flex items-center gap-2 font-bold text-navy-900">
              <Filter className="size-5 text-blue-600" aria-hidden="true" />
              {t("libhub.filterLabel")}
            </h2>
            <label className="relative block">
              <span className="sr-only">{t("libhub.searchInSet")}</span>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-text-3" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("libhub.searchInSet")}
                className="h-11 w-full rounded-[14px] border border-border bg-white pr-3 pl-11 text-[15px] outline-none focus:border-blue-600"
              />
            </label>
          </section>
          <section aria-labelledby="hk-topics" className={cn(card, "p-4")}>
            <h2 id="hk-topics" className="mb-2 flex items-center gap-2 font-bold text-navy-900">
              <Tags className="size-5 text-[#1E9E5A]" aria-hidden="true" />
              {t("libhub.topicsTitle")}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {LIB_SET_TOPICS.map((tp) => (
                <li key={tp}>
                  <Link
                    href={`/library/vocabulary?topic=${tp}`}
                    className="inline-flex min-h-9 items-center rounded-full bg-[#F3F8FE] px-3 text-[13.5px] font-semibold text-navy-900 hover:bg-blue-50"
                  >
                    {t(`libhub.topics.${tp}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="hk-tips" className={cn(card, "bg-[#FFF8E6] p-4")}>
            <h2 id="hk-tips" className="mb-2 flex items-center gap-2 font-bold text-navy-900">
              <Lightbulb className="size-5 text-amber" aria-hidden="true" />
              {t("libhub.hskTips")}
            </h2>
            <ul className="list-disc pl-5 text-[14px] text-text">
              {([1, 2, 3, 4] as const).map((n) => (
                <li key={n}>{t(`libhub.hskTipsList.t${n}`)}</li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
