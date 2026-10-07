import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  BookOpen,
  BookOpenText,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Flame,
  Headphones,
  Languages,
  Layers,
  Lightbulb,
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
  {
    key: "all",
    href: "/library",
    icon: Layers,
    bg: "border-[#CFE3F7] bg-[#EEF6FF]",
    icon_bg: "bg-[#DCEBFF] text-blue-600",
    chev: "bg-[#DCEBFF] text-blue-600",
  },
  {
    key: "vocab",
    href: "/library/vocabulary",
    icon: Languages,
    bg: "border-[#FBDDE2] bg-[#FFF1F3]",
    icon_bg: "bg-[#FFE0E6] text-[#E0302F]",
    chev: "bg-[#FFE0E6] text-[#E0302F]",
  },
  {
    key: "grammar",
    href: "/library/grammar",
    icon: BookOpen,
    bg: "border-[#FBE8C6] bg-[#FFF7E8]",
    icon_bg: "bg-[#FFEBC4] text-[#D98A0B]",
    chev: "bg-[#FFEBC4] text-[#B86E00]",
  },
  {
    key: "pron",
    href: "/library/pronunciation",
    icon: AudioLines,
    bg: "border-[#E6DAFB] bg-[#F5F0FF]",
    icon_bg: "bg-[#E8DCFF] text-[#7A45E0]",
    chev: "bg-[#E8DCFF] text-[#6A36D0]",
  },
  {
    key: "listen",
    href: "/listening",
    icon: Headphones,
    bg: "border-[#CDEEDB] bg-[#EEFAF3]",
    icon_bg: "bg-[#D5F2E1] text-[#1E9E5A]",
    chev: "bg-[#D5F2E1] text-[#16804A]",
  },
  {
    key: "reading",
    href: "/reading",
    icon: BookOpenText,
    bg: "border-[#D3E4FA] bg-[#EEF5FF]",
    icon_bg: "bg-[#D9E8FF] text-[#2C6FDB]",
    chev: "bg-[#D9E8FF] text-[#2C6FDB]",
  },
  {
    key: "tips",
    href: null,
    icon: Lightbulb,
    bg: "border-[#FBDCCB] bg-[#FFF3EC]",
    icon_bg: "bg-[#FFE2D2] text-[#E0632F]",
    chev: "bg-[#FFE2D2] text-[#C24E1E]",
  },
] as const;

/** "Thư viện LingYu" → chữ LingYu màu xanh như design. */
function BrandTitle({ text }: { text: string }) {
  const i = text.indexOf("LingYu");
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="text-[#1F8BEA]">LingYu</span>
      {text.slice(i + 6)}
    </>
  );
}

/** Ô chọn bo tròn có mũi tên (bộ lọc trên bìa). */
function SelectBox({
  name,
  label,
  defaultValue,
  children,
}: {
  name: string;
  label: string;
  defaultValue: string;
  children: React.ReactNode;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-14 w-full appearance-none rounded-[16px] border border-white bg-white/95 pr-11 pl-5 text-[16px] font-semibold text-navy-900 shadow-[0_8px_24px_rgba(20,60,110,.08)] outline-none focus:border-blue-600"
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-navy-900"
        aria-hidden="true"
      />
    </label>
  );
}

/** Trang chủ Thư viện LingYu: danh mục, tài liệu nổi bật / mới nhất, hướng dẫn, chủ đề phổ biến. */
export async function LibraryHome({ data }: { data: Home }) {
  const t = await getT();
  return (
    <div className="flex flex-col gap-5">
      {/* Bìa Thư viện (theo design): nền trời + cửa sổ, mascot ngồi trên chồng sách, ô tìm + bộ lọc, hàng danh mục. */}
      <section
        aria-labelledby="lh-title"
        className="relative isolate overflow-hidden rounded-[28px] border border-[#D3E8F8] bg-[#DCEFFD] shadow-card"
      >
        <Image
          unoptimized
          src="/brand/hero/cover-bg.webp"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[70%_center]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(255,255,255,.55)_0%,rgba(255,255,255,.25)_45%,rgba(255,255,255,0)_70%)]"
        />
        <Image
          unoptimized
          src="/brand/library/leaves.png"
          alt=""
          aria-hidden="true"
          width={276}
          height={265}
          className="pointer-events-none absolute top-3 left-[46%] -z-10 hidden w-[120px] opacity-70 lg:block"
        />

        <div className="px-4 pt-3 md:px-9 md:pt-4">
          <Crumbs label={t("shell.breadcrumb")} home={t("shell.nav.home")} items={[{ text: t("libhub.breadcrumb") }]} />
          <div className="grid items-end gap-4 md:grid-cols-[minmax(0,1fr)_minmax(240px,400px)]">
            <div className="min-w-0 pt-2 pb-4 md:pt-6 md:pb-7">
              <h1
                id="lh-title"
                className="text-[38px] leading-[1.1] font-black tracking-tight text-navy-900 md:text-[56px]"
              >
                <BrandTitle text={t("libhub.title")} />
              </h1>
              <form action="/library/vocabulary" role="search" className="mt-5 flex max-w-[860px] flex-col gap-3">
                <label className="relative block">
                  <span className="sr-only">{t("libhub.searchLabel")}</span>
                  <Search className="pointer-events-none absolute top-1/2 left-5 size-[22px] -translate-y-1/2 text-text-2" />
                  <input
                    name="q"
                    type="search"
                    placeholder={t("libhub.searchAll")}
                    className="h-14 w-full rounded-[18px] border border-white bg-white/95 pr-4 pl-14 text-[16px] text-navy-900 shadow-[0_8px_24px_rgba(20,60,110,.10)] outline-none placeholder:text-text-3 focus:border-blue-600"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2 sm:pr-[12%]">
                  <SelectBox name="hsk" label={t("libhub.hskAll")} defaultValue="0">
                    <option value="0">{t("libhub.levelAll")}</option>
                    {[1, 2, 3, 4, 5, 6].map((l) => (
                      <option key={l} value={l}>
                        HSK {l}
                      </option>
                    ))}
                  </SelectBox>
                  <SelectBox name="sort" label={t("libhub.sortLabel")} defaultValue="newest">
                    {(["newest", "order", "name", "size"] as const).map((s) => (
                      <option key={s} value={s}>
                        {t(`libhub.sorts.${s}`)}
                      </option>
                    ))}
                  </SelectBox>
                </div>
              </form>
            </div>

            <div aria-hidden="true" className="relative hidden h-[300px] md:block">
              <Image
                unoptimized
                src="/brand/hero/mascot-reading.webp"
                alt=""
                width={560}
                height={493}
                priority
                className="absolute right-[14%] bottom-[2px] h-[230px] w-auto drop-shadow-[0_10px_14px_rgba(20,70,40,.18)]"
              />
            </div>
          </div>
        </div>

        <nav
          aria-label={t("libhub.breadcrumb")}
          className="grid grid-cols-2 gap-3 rounded-t-[26px] bg-white/60 p-3 backdrop-blur-sm sm:grid-cols-4 md:p-5 xl:grid-cols-7"
        >
          {CATS.map((c) => {
            const inner = (
              <>
                <span className={cn("flex size-[52px] items-center justify-center rounded-[16px]", c.icon_bg)}>
                  <c.icon className="size-7" aria-hidden="true" />
                </span>
                <span className="mt-3 block pr-9">
                  <span className="text-[16px] leading-tight font-extrabold text-navy-900 2xl:text-[18px]">
                    {t(`libhub.cats.${c.key}`)}
                    {!c.href ? <span className="sr-only"> ({t("libhub.comingSoon")})</span> : null}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-1/2 right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-full",
                      c.chev,
                    )}
                  >
                    <ChevronRight className="size-[18px]" />
                  </span>
                </span>
              </>
            );
            const cls = cn(
              "relative flex min-h-[124px] flex-col justify-between rounded-[20px] border p-3.5 shadow-[0_6px_16px_rgba(20,60,110,.06)] transition",
              c.bg,
              c.key === "all" && "border-[#8EC0EE] ring-1 ring-[#8EC0EE]",
              c.href ? "hover:-translate-y-0.5 hover:shadow-lg" : "cursor-default",
            );
            return c.href ? (
              <Link key={c.key} href={c.href} className={cls} aria-current={c.key === "all" ? "page" : undefined}>
                {inner}
              </Link>
            ) : (
              <div key={c.key} className={cls} aria-disabled="true" title={t("libhub.comingSoon")}>
                {inner}
              </div>
            );
          })}
        </nav>
      </section>

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
