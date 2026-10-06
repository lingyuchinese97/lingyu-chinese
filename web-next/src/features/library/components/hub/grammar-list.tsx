"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AudioLines,
  BookMarked,
  CheckCircle2,
  ChevronRight,
  Languages,
  LayoutGrid,
  List,
  Search,
  Star,
} from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { LIB_GRAMMAR_TOPICS, type LibGrammarTopic } from "@/data/library/grammar";
import type { GrammarCard, LibGrammarList } from "../../grammar";
import type { GrammarListParams } from "../../schema";
import { setGrammarFavoriteAction } from "../../actions";
import { Cover, Crumbs, Pill, card } from "./parts";

export const TOPIC_EMOJI: Record<LibGrammarTopic, string> = {
  basic: "🧱",
  question: "❓",
  describe: "🎨",
  place: "📍",
  adverb: "🔁",
  modal: "💪",
  aspect: "⏳",
  compare: "⚖️",
  connect: "🔗",
  special: "✨",
};
const TOPIC_TONE = ["sky", "rose", "amber", "green", "violet", "orange"] as const;

const selectCls =
  "h-11 w-full rounded-[14px] border border-border bg-white px-3 text-[15px] font-semibold text-navy-900 md:w-auto";

/** Sao yêu thích một bài ngữ pháp (cập nhật ngay, lỗi thì trả lại). */
export function GrammarFav({
  id,
  name,
  on,
  className,
  withText,
}: {
  id: string;
  name: string;
  on: boolean;
  className?: string;
  withText?: boolean;
}) {
  const t = useT();
  const [fav, setFav] = React.useState(on);
  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !fav;
    setFav(next);
    const r = await setGrammarFavoriteAction(id, next);
    if (!r.ok) {
      setFav(!next);
      toast.error(t.maybe(r.message));
    }
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={fav}
      aria-label={withText ? undefined : fav ? t("libgram.favOff", { name }) : t("libgram.favOn", { name })}
      className={cn(
        withText
          ? "inline-flex min-h-10 items-center justify-center gap-2 rounded-[12px] border border-border bg-white px-3 text-[14px] font-semibold text-navy-900 hover:bg-blue-50"
          : "flex size-9 items-center justify-center rounded-full bg-white/85 shadow-sm hover:bg-white",
        className,
      )}
    >
      <Star className={cn("size-5 text-[#F2A900]", fav && "fill-[#F5B70A]")} aria-hidden="true" />
      {withText ? (fav ? t("libgram.favorited") : t("libgram.favorite")) : null}
    </button>
  );
}

function GrammarGridCard({ g }: { g: GrammarCard }) {
  const t = useT();
  return (
    <article className={cn(card, "relative h-full overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg")}>
      <Link href={`/library/grammar/${g.id}`} className="flex h-full flex-col gap-2 p-4">
        <span className="flex items-center gap-2 pr-9">
          <Pill>HSK {g.hsk}</Pill>
          <Pill color="green">{t(`libgram.topics.${g.topic}`)}</Pill>
          {g.learned ? <CheckCircle2 className="size-5 text-[#22C08A]" aria-label={t("libgram.learnedBadge")} /> : null}
        </span>
        <span className="flex flex-wrap items-baseline gap-x-3">
          <span lang="zh" className="hanzi text-[30px] leading-tight font-bold text-navy-900">
            {g.zh}
          </span>
          <span className="text-[14px] text-text-2">{g.py}</span>
        </span>
        <span className="font-bold text-[#C42A42]">{g.name}</span>
        <span className="line-clamp-2 text-[13.5px] text-text-2">{g.summary}</span>
        <span className="mt-auto rounded-[12px] bg-[#F5F9FF] px-3 py-2">
          <span className="block text-[12px] font-semibold text-text-3">{t("libgram.example")}</span>
          <span lang="zh" className="block hanzi text-[16px] text-navy-900">
            {g.example.zh}
          </span>
          <span className="block text-[13px] text-text-2">{g.example.meaning}</span>
        </span>
      </Link>
      <GrammarFav id={g.id} name={g.zh} on={g.favorite} className="absolute top-3 right-3 border border-border" />
    </article>
  );
}

function GrammarRow({ g }: { g: GrammarCard }) {
  const t = useT();
  return (
    <article className="relative flex items-center gap-3 px-3 py-2.5 hover:bg-[#F7FAFE] md:px-4">
      <Link href={`/library/grammar/${g.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Cover emoji={g.emoji} tone={g.tone} size="sm" className="size-14 shrink-0 rounded-[12px]" />
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-navy-900">
            <span lang="zh" className="hanzi text-[18px]">
              {g.zh}
            </span>{" "}
            <span className="font-normal text-text-2">{g.py}</span> · {g.name}
          </span>
          <span className="block truncate text-[13.5px] text-text-2">{g.summary}</span>
        </span>
        <span className="hidden gap-1.5 md:flex">
          <Pill>HSK {g.hsk}</Pill>
          <Pill color="green">{t(`libgram.topics.${g.topic}`)}</Pill>
        </span>
        {g.learned ? (
          <CheckCircle2 className="size-5 shrink-0 text-[#22C08A]" aria-label={t("libgram.learnedBadge")} />
        ) : null}
        <ChevronRight className="size-5 shrink-0 text-blue-600" aria-hidden="true" />
      </Link>
      <GrammarFav id={g.id} name={g.zh} on={g.favorite} />
    </article>
  );
}

/** Danh sách bài ngữ pháp của Thư viện LingYu (lọc qua URL), cột phải: lộ trình HSK, chủ đề phổ biến, tài liệu. */
export function GrammarList({ data, params }: { data: LibGrammarList; params: GrammarListParams }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = React.useTransition();
  const [q, setQ] = React.useState(params.q);
  const go = React.useCallback(
    (patch: Partial<GrammarListParams>) => {
      const n = { ...params, ...patch };
      const sp = new URLSearchParams();
      if (n.q.trim()) sp.set("q", n.q.trim());
      if (n.hsk) sp.set("hsk", String(n.hsk));
      if (n.topic) sp.set("topic", n.topic);
      if (n.status !== "all") sp.set("status", n.status);
      if (n.sort !== "order") sp.set("sort", n.sort);
      if (n.view !== "grid") sp.set("view", n.view);
      startTransition(() => router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false }));
    },
    [params, pathname, router],
  );
  React.useEffect(() => {
    if (q === params.q) return;
    const id = setTimeout(() => go({ q }), 300);
    return () => clearTimeout(id);
  }, [q, params.q, go]);
  const filtered = !!(params.q || params.hsk || params.topic || params.status !== "all");

  const docs = [
    { href: "/library/vocabulary", icon: Languages, title: "docVocab", color: "bg-[#FFE4E8] text-[#E0302F]" },
    { href: "/grammar", icon: BookMarked, title: "docMine", color: "bg-[#FFF1D6] text-[#C27C0E]" },
    { href: "/translate", icon: Languages, title: "docTranslate", color: "bg-[#E1EEFF] text-[#2C6FDB]" },
    { href: "/library/pronunciation", icon: AudioLines, title: "docPron", color: "bg-[#EFE6FF] text-[#7A45E0]" },
  ] as const;

  return (
    <div className="flex flex-col gap-5">
      <Crumbs
        label={t("shell.breadcrumb")}
        home={t("shell.nav.home")}
        items={[{ href: "/library", text: t("libhub.breadcrumb") }, { text: t("libgram.title") }]}
      />
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span
            lang="zh"
            aria-hidden="true"
            className="hidden size-[84px] shrink-0 items-center justify-center rounded-full bg-[#FFF1D6] hanzi text-[42px] font-bold text-[#C27C0E] sm:flex"
          >
            语
          </span>
          <div className="min-w-0">
            <h1 className="text-[28px] font-extrabold tracking-tight text-navy-900 md:text-[34px]">
              {t("libgram.title")}
            </h1>
            <p className="mt-1 text-[15px] text-text-2">{t("libgram.sub")}</p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 xl:max-w-[640px]">
          <label className="relative block">
            <span className="sr-only">{t("libgram.search")}</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-text-3" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("libgram.search")}
              className="h-12 w-full rounded-[16px] border border-border bg-white pr-4 pl-12 text-[15px] shadow-card outline-none focus:border-blue-600"
            />
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <label>
              <span className="sr-only">{t("libgram.topicAll")}</span>
              <select
                className={selectCls}
                value={params.topic}
                onChange={(e) => go({ topic: e.target.value as GrammarListParams["topic"] })}
              >
                <option value="">{t("libgram.topicAll")}</option>
                {LIB_GRAMMAR_TOPICS.map((tp) => (
                  <option key={tp} value={tp}>
                    {t(`libgram.topics.${tp}`)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">{t("libgram.statusLabel")}</span>
              <select
                className={selectCls}
                value={params.status}
                onChange={(e) => go({ status: e.target.value as GrammarListParams["status"] })}
              >
                {(["all", "learned", "todo", "favorite"] as const).map((s) => (
                  <option key={s} value={s}>
                    {t(`libgram.status.${s}`)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">{t("libgram.sortLabel")}</span>
              <select
                className={selectCls}
                value={params.sort}
                onChange={(e) => go({ sort: e.target.value as GrammarListParams["sort"] })}
              >
                {(["order", "newest", "name"] as const).map((s) => (
                  <option key={s} value={s}>
                    {t(`libgram.sorts.${s}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </header>

      <nav aria-label={t("libgram.levelsLabel")} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {[0, 1, 2, 3, 4, 5, 6].map((h) => {
          const on = params.hsk === h;
          return (
            <button
              key={h}
              type="button"
              aria-pressed={on}
              onClick={() => go({ hsk: h })}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center rounded-[14px] border px-5 text-[15px] font-semibold whitespace-nowrap",
                on ? "border-blue-600 bg-blue-600 text-white" : "border-border bg-white text-navy-900 hover:bg-blue-50",
              )}
            >
              {h ? `HSK ${h}` : t("libgram.all")}
            </button>
          );
        })}
      </nav>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          {!filtered ? (
            <section aria-labelledby="gl-featured" className={cn(card, "p-4 md:p-5")}>
              <h2 id="gl-featured" className="mb-3 text-[22px] font-extrabold text-navy-900">
                {t("libgram.featured")}
              </h2>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-5">
                {data.topics.slice(0, 5).map((tp, i) => (
                  <li key={tp.topic}>
                    <button
                      type="button"
                      onClick={() => go({ topic: tp.topic })}
                      className="flex w-full flex-col overflow-hidden rounded-[16px] border border-border bg-white text-left hover:-translate-y-0.5 hover:shadow-card"
                    >
                      <Cover
                        emoji={TOPIC_EMOJI[tp.topic]}
                        tone={TOPIC_TONE[i % TOPIC_TONE.length]!}
                        size="sm"
                        className="h-[72px] w-full"
                      />
                      <span className="px-3 pt-2 font-bold text-navy-900">{t(`libgram.topics.${tp.topic}`)}</span>
                      <span className="px-3 pb-2.5 text-[13px] text-text-2">
                        {t("libgram.lessons", { count: tp.total })}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="gl-all" className={cn(card, "p-4 md:p-5")}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 id="gl-all" className="text-[22px] font-extrabold text-navy-900">
                {t("libgram.allTitle")}{" "}
                <span className="font-semibold text-text-2">{t("libgram.count", { count: data.total })}</span>
              </h2>
              <div
                role="group"
                aria-label={t("libgram.viewLabel")}
                className="flex overflow-hidden rounded-[12px] border border-border"
              >
                {(["grid", "list"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={params.view === v}
                    onClick={() => go({ view: v })}
                    className={cn(
                      "inline-flex min-h-10 items-center gap-2 px-4 text-[14px] font-semibold",
                      params.view === v ? "bg-blue-600 text-white" : "bg-white text-navy-900 hover:bg-blue-50",
                    )}
                  >
                    {v === "grid" ? <LayoutGrid className="size-4" /> : <List className="size-4" />}
                    {t(`libgram.${v}`)}
                  </button>
                ))}
              </div>
            </div>
            <div aria-busy={pending || undefined} className={cn("transition-opacity", pending && "opacity-60")}>
              {!data.items.length ? (
                <p className="rounded-[14px] border border-dashed border-border px-4 py-10 text-center text-text-2">
                  {t("libgram.empty")}
                </p>
              ) : params.view === "grid" ? (
                <ul className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                  {data.items.map((g) => (
                    <li key={g.id}>
                      <GrammarGridCard g={g} />
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="divide-y divide-[#EDF3F9] overflow-hidden rounded-[14px] border border-border">
                  {data.items.map((g) => (
                    <li key={g.id}>
                      <GrammarRow g={g} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <section aria-labelledby="gl-roadmap" className={cn(card, "p-4")}>
            <h2 id="gl-roadmap" className="mb-3 text-[18px] font-extrabold text-navy-900">
              {t("libgram.roadmap")}
            </h2>
            <ol className="flex flex-col gap-2.5">
              {data.roadmap.map((r) => (
                <li key={r.hsk}>
                  <button
                    type="button"
                    disabled={!r.total}
                    onClick={() => go({ hsk: r.hsk })}
                    className="flex w-full items-center gap-3 rounded-[12px] px-2 py-1.5 text-left hover:bg-blue-50 disabled:opacity-60 disabled:hover:bg-transparent"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[13px] font-extrabold text-blue-700">
                      {r.hsk}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex justify-between text-[14px] font-semibold text-navy-900">
                        HSK {r.hsk}
                        <span className="font-normal text-text-2">
                          {r.total
                            ? t("libgram.roadmapItem", { learned: r.learned, total: r.total })
                            : t("libgram.roadmapSoon")}
                        </span>
                      </span>
                      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[#E6EEF8]">
                        <span
                          className="block h-full rounded-full bg-[#22C08A]"
                          style={{ width: `${r.total ? Math.round((r.learned / r.total) * 100) : 0}%` }}
                        />
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="gl-popular" className={cn(card, "p-4")}>
            <h2 id="gl-popular" className="mb-3 text-[18px] font-extrabold text-navy-900">
              {t("libgram.popular")}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {data.topics.map((tp) => (
                <li key={tp.topic}>
                  <button
                    type="button"
                    aria-pressed={params.topic === tp.topic}
                    onClick={() => go({ topic: params.topic === tp.topic ? "" : tp.topic })}
                    className={cn(
                      "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[13.5px] font-semibold",
                      params.topic === tp.topic
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-border bg-white text-navy-900 hover:bg-blue-50",
                    )}
                  >
                    <span aria-hidden="true">{TOPIC_EMOJI[tp.topic]}</span>
                    {t(`libgram.topics.${tp.topic}`)} · {tp.total}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="gl-docs" className={cn(card, "p-4")}>
            <h2 id="gl-docs" className="mb-2 text-[18px] font-extrabold text-navy-900">
              {t("libgram.docs")}
            </h2>
            <ul className="flex flex-col">
              {docs.map((d) => (
                <li key={d.href}>
                  <Link href={d.href} className="flex items-center gap-3 rounded-[12px] px-2 py-2 hover:bg-blue-50">
                    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-[12px]", d.color)}>
                      <d.icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-navy-900">{t(`libgram.${d.title}`)}</span>
                      <span className="block text-[13px] text-text-2">{t(`libgram.${d.title}Sub`)}</span>
                    </span>
                    <ChevronRight className="size-4 text-text-3" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
