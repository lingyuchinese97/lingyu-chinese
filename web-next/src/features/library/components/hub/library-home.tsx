import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  BookOpen,
  BookOpenText,
  CircleHelp,
  Flame,
  Headphones,
  Languages,
  Lightbulb,
  Library,
  Search,
} from "lucide-react";
import { getT } from "@/i18n/server";
import { cn } from "@/lib/utils";
import type { SetCard } from "../../sets";
import { Cover, Crumbs, Pill, card } from "./parts";
import { SetGridCard } from "./set-card";

type Home = {
  sets: number;
  words: number;
  featured: SetCard[];
  newest: SetCard[];
  topics: string[];
  publicWords: number;
};

const CATS = [
  { key: "all", href: "/library", icon: Library, color: "bg-blue-600 text-white" },
  { key: "vocab", href: "/library/vocabulary", icon: Languages, color: "bg-[#FFE4E8] text-[#E0302F]" },
  { key: "grammar", href: null, icon: BookOpen, color: "bg-[#FFF1D6] text-[#C27C0E]" },
  { key: "pron", href: "/pronunciation", icon: AudioLines, color: "bg-[#EFE6FF] text-[#7A45E0]" },
  { key: "listen", href: "/listening", icon: Headphones, color: "bg-[#DDF6E6] text-[#1E9E5A]" },
  { key: "reading", href: "/reading", icon: BookOpenText, color: "bg-[#E1EEFF] text-[#2C6FDB]" },
  { key: "tips", href: null, icon: Lightbulb, color: "bg-[#FFE7DA] text-[#E0632F]" },
] as const;

/** Trang chủ Thư viện LingYu: danh mục, tài liệu nổi bật / mới nhất, hướng dẫn, chủ đề phổ biến. */
export async function LibraryHome({ data }: { data: Home }) {
  const t = await getT();
  return (
    <div className="flex flex-col gap-5">
      <Crumbs label={t("shell.breadcrumb")} home={t("shell.nav.home")} items={[{ text: t("libhub.breadcrumb") }]} />
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span className="hidden size-[84px] shrink-0 items-center justify-center rounded-full bg-[#DDF3E8] text-[#1E9E5A] sm:flex">
            <BookOpen className="size-10" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="text-[28px] font-extrabold tracking-tight text-navy-900 md:text-[34px]">
              {t("libhub.title")}
            </h1>
            <p className="mt-1 text-[15px] text-text-2">{t("libhub.sub1")}</p>
            <p className="text-[15px] text-text-2">{t("libhub.sub2")}</p>
          </div>
        </div>
        <form action="/library/vocabulary" className="flex w-full flex-col gap-2 xl:max-w-[560px]" role="search">
          <label className="relative block">
            <span className="sr-only">{t("libhub.searchLabel")}</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-text-3" />
            <input
              name="q"
              type="search"
              placeholder={t("libhub.searchAll")}
              className="h-12 w-full rounded-[16px] border border-border bg-white pr-4 pl-12 text-[15px] shadow-card outline-none focus:border-blue-600"
            />
          </label>
          <div className="flex gap-2">
            <label className="flex-1">
              <span className="sr-only">{t("libhub.hskAll")}</span>
              <select
                name="hsk"
                defaultValue="0"
                className="h-11 w-full rounded-[14px] border border-border bg-white px-3 text-[15px] font-semibold text-navy-900"
              >
                <option value="0">{t("libhub.levelAll")}</option>
                {[1, 2, 3, 4, 5, 6].map((l) => (
                  <option key={l} value={l}>
                    HSK {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex-1">
              <span className="sr-only">{t("libhub.sortLabel")}</span>
              <select
                name="sort"
                defaultValue="newest"
                className="h-11 w-full rounded-[14px] border border-border bg-white px-3 text-[15px] font-semibold text-navy-900"
              >
                {(["newest", "order", "name", "size"] as const).map((s) => (
                  <option key={s} value={s}>
                    {t(`libhub.sorts.${s}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </form>
      </header>

      <nav aria-label={t("libhub.breadcrumb")} className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {CATS.map((c) => {
          const inner = (
            <>
              <span className={cn("flex size-11 items-center justify-center rounded-[14px]", c.color)}>
                <c.icon className="size-6" aria-hidden="true" />
              </span>
              {!c.href ? (
                <Pill color="amber" className="absolute top-2.5 right-2.5">
                  {t("libhub.comingSoon")}
                </Pill>
              ) : null}
              <span className="mt-2 text-[16px] font-bold text-navy-900">{t(`libhub.cats.${c.key}`)}</span>
              <span className="text-[13px] leading-snug text-text-2">{t(`libhub.cats.${c.key}Sub`)}</span>
            </>
          );
          const cls = cn(
            card,
            "relative flex flex-col p-3.5 transition",
            c.key === "all" && "border-blue-600 ring-1 ring-blue-600",
            c.href ? "hover:-translate-y-0.5 hover:shadow-lg" : "opacity-80",
          );
          return c.href ? (
            <Link key={c.key} href={c.href} className={cls} aria-current={c.key === "all" ? "page" : undefined}>
              {inner}
            </Link>
          ) : (
            <div key={c.key} className={cls} aria-disabled="true">
              {inner}
            </div>
          );
        })}
      </nav>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          <section aria-labelledby="lh-featured">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="lh-featured" className="text-[22px] font-extrabold text-navy-900">
                {t("libhub.featured")}
              </h2>
              <Link
                href="/library/vocabulary"
                className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:underline"
              >
                {t("libhub.seeAll")} <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.featured.map((s) => (
                <li key={s.id}>
                  <SetGridCard s={s} />
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="lh-new">
            <h2 id="lh-new" className="mb-3 text-[22px] font-extrabold text-navy-900">
              {t("libhub.newest")}
            </h2>
            <ul className={cn(card, "divide-y divide-[#EDF3F9] overflow-hidden")}>
              {data.newest.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/library/vocabulary/${s.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#F7FAFE] md:px-4"
                  >
                    <Cover emoji={s.emoji} tone={s.tone} size="sm" className="size-14 shrink-0 rounded-[12px]" />
                    <Pill className="hidden sm:inline-flex">HSK {s.hsk}</Pill>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-navy-900">
                        {t("libhub.cats.vocab")} HSK {s.hsk} – {s.title}
                      </span>
                      <span className="block truncate text-[13.5px] text-text-2">{s.desc}</span>
                    </span>
                    <Pill color="rose" className="hidden md:inline-flex">
                      {t("libhub.cats.vocab")}
                    </Pill>
                    <span className="hidden text-[13.5px] whitespace-nowrap text-text-2 lg:block">
                      {s.added.split("-").reverse().join("/")}
                    </span>
                  </Link>
                </li>
              ))}
              {data.publicWords ? (
                <li>
                  <Link
                    href="/library/words"
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#F7FAFE] md:px-4"
                  >
                    <Cover emoji="✨" tone="violet" size="sm" className="size-14 shrink-0 rounded-[12px]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-navy-900">{t("libhub.oldWords")}</span>
                      <span className="block truncate text-[13.5px] text-text-2">
                        {t("libhub.oldWordsSub")} · {t("libhub.wordsCount", { count: data.publicWords })}
                      </span>
                    </span>
                    <ArrowRight className="size-5 text-blue-600" aria-hidden="true" />
                  </Link>
                </li>
              ) : null}
            </ul>
          </section>
        </div>

        <aside className="flex flex-col gap-5">
          <section aria-labelledby="lh-guide" className={cn(card, "overflow-hidden")}>
            <h2
              id="lh-guide"
              className="flex items-center gap-2 bg-[#ECF9F1] px-4 py-3 text-[18px] font-extrabold text-navy-900"
            >
              <CircleHelp className="size-6 text-[#1E9E5A]" aria-hidden="true" />
              {t("libhub.guideTitle")}
            </h2>
            <ol className="flex flex-col gap-3 p-4">
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <li key={n} className="flex gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#DDF3E8] font-bold text-[#1E9E5A]">
                    {n}
                  </span>
                  <span>
                    <span className="block font-bold text-navy-900">{t(`libhub.guide.s${n}`)}</span>
                    <span className="block text-[13.5px] text-text-2">{t(`libhub.guide.s${n}Sub`)}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
          <section aria-labelledby="lh-topics" className={cn(card, "p-4")}>
            <h2 id="lh-topics" className="mb-3 flex items-center gap-2 text-[18px] font-extrabold text-navy-900">
              <Flame className="size-5 text-[#F26B1D]" aria-hidden="true" />
              {t("libhub.topicsTitle")}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {data.topics.map((tp) => (
                <li key={tp}>
                  <Link
                    href={`/library/vocabulary?topic=${tp}`}
                    className="inline-flex min-h-9 items-center rounded-full bg-[#F3F8FE] px-3.5 text-[14px] font-semibold text-navy-900 hover:bg-blue-50"
                  >
                    {t(`libhub.topics.${tp as "food"}`)}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[13px] text-text-2">
              {t("libhub.setsWords", { sets: data.sets, words: data.words })}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
