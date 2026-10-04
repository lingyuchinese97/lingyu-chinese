"use client";
import * as React from "react";
import Link from "next/link";
import { BookmarkPlus, ChevronRight, Headphones, Languages, Loader2, Play, Search, Share2, Star } from "lucide-react";
import { SpeakButton } from "@/components/speak-button";
import { toast } from "@/components/ui/toaster";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { foldCompact, fold } from "@/lib/fold";
import type { SetDetail } from "../../sets";
import { saveSetAction, setFavoriteAction, setWordLearnedAction } from "../../actions";
import { Cover, Crumbs, Pill, Ring, card } from "./parts";
import { FavStar } from "./set-card";
import { SetPractice } from "./set-practice";

type Word = SetDetail["words"][number];
type Filter = "all" | "new" | "learned" | "favorite";

/** Chi tiết bộ từ vựng: đầu trang + tiến độ, tab Danh sách / Luyện tập, cột phải (nội dung bộ, tài liệu, bộ liên quan). */
export function SetDetailView({ data, initialTab }: { data: SetDetail; initialTab: "list" | "practice" }) {
  const t = useT();
  const [tab, setTab] = React.useState(initialTab);
  const [words, setWords] = React.useState(data.words);
  const [q, setQ] = React.useState("");
  const [showPy, setShowPy] = React.useState(true);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [sort, setSort] = React.useState<"order" | "pinyin">("order");
  const [saving, setSaving] = React.useState(false);
  const learned = words.filter((w) => w.learned).length;

  const patch = (zh: string, p: Partial<Word>) => setWords((ws) => ws.map((w) => (w.zh === zh ? { ...w, ...p } : w)));
  async function toggleLearned(w: Word) {
    patch(w.zh, { learned: !w.learned });
    const r = await setWordLearnedAction(data.id, w.zh, !w.learned);
    if (!r.ok) {
      patch(w.zh, { learned: w.learned });
      toast.error(t.maybe(r.message));
    }
  }
  async function toggleFav(w: Word) {
    patch(w.zh, { favorite: !w.favorite });
    const r = await setFavoriteAction(data.id, w.zh, !w.favorite);
    if (!r.ok) {
      patch(w.zh, { favorite: w.favorite });
      toast.error(t.maybe(r.message));
    }
  }
  async function saveAll() {
    setSaving(true);
    const r = await saveSetAction(data.id, null);
    setSaving(false);
    if (!r.ok) return void toast.error(t.maybe(r.message));
    setWords((ws) => ws.map((w) => ({ ...w, saved: true })));
    toast.success(t("libhub.savedSet", { added: r.data.added, skipped: r.data.skipped }));
  }
  async function share() {
    const url = window.location.href.split("?")[0]!;
    try {
      if (navigator.share) await navigator.share({ title: data.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success(t("libhub.copied"));
      }
    } catch {
      /* người dùng huỷ chia sẻ */
    }
  }

  const shown = React.useMemo(() => {
    const f = fold(q);
    const fc = foldCompact(q);
    const list = words.filter(
      (w) =>
        (!q || w.zh.includes(q) || foldCompact(w.py).includes(fc) || fold(w.meaning).includes(f)) &&
        (filter === "all" ||
          (filter === "new" && !w.learned) ||
          (filter === "learned" && w.learned) ||
          (filter === "favorite" && w.favorite)),
    );
    return sort === "pinyin" ? [...list].sort((a, b) => foldCompact(a.py).localeCompare(foldCompact(b.py))) : list;
  }, [words, q, filter, sort]);

  return (
    <div className="flex flex-col gap-4">
      <Crumbs
        label={t("shell.breadcrumb")}
        home={t("shell.nav.home")}
        items={[
          { href: "/library", text: t("libhub.breadcrumb") },
          { href: "/library/vocabulary", text: t("libhub.vocabTitle") },
          { text: data.title },
        ]}
      />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <header className={cn(card, "flex flex-col gap-4 p-4 sm:flex-row md:p-5")}>
          <Cover
            emoji={data.emoji}
            tone={data.tone}
            size="lg"
            className="h-[110px] w-full shrink-0 rounded-[20px] sm:h-[150px] sm:w-[220px]"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <Pill>HSK {data.hsk}</Pill>
              <FavStar id={data.id} name={data.title} on={data.favorite} className="ml-auto border border-border" />
            </div>
            <h1 className="mt-1 text-[28px] font-extrabold tracking-tight text-navy-900 md:text-[34px]">
              {data.title}{" "}
              <span lang="zh" className="hanzi">
                {data.titleZh}
              </span>
            </h1>
            <p className="mt-1 text-[15px] text-text-2">
              {t("libhub.wordsCount", { count: data.total })} · {data.desc}
            </p>
            <p className="mt-2 flex flex-wrap gap-1.5">
              <Pill color="amber">{t("libhub.cats.vocab")}</Pill>
              <Pill color="green">{t(`libhub.topics.${data.topic}`)}</Pill>
              {data.kinds
                .filter((k) => k !== "topic")
                .map((k) => (
                  <Pill key={k} color="rose">
                    {t(`libhub.kinds.${k}`)}
                  </Pill>
                ))}
            </p>
          </div>
        </header>
        <section aria-labelledby="sd-progress" className={cn(card, "flex flex-col gap-3 p-4")}>
          <div className="flex items-center gap-4">
            <Ring value={learned} total={data.total} />
            <div className="min-w-0 flex-1">
              <h2 id="sd-progress" className="font-bold text-navy-900">
                {t("libhub.progress")}
              </h2>
              <p className="text-[13.5px] text-text-2">
                {learned === 0
                  ? t("libhub.progressNone")
                  : learned === data.total
                    ? t("libhub.progressDone")
                    : t("libhub.progressSome", { learned, total: data.total })}
              </p>
              <button
                type="button"
                onClick={() => setTab("practice")}
                className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[12px] bg-blue-600 px-4 font-semibold text-white hover:bg-blue-700"
              >
                <Play className="size-4 fill-white" aria-hidden="true" />
                {learned ? t("libhub.continue") : t("libhub.start")}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={saveAll}
              disabled={saving}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[12px] border border-border px-3 text-[14px] font-semibold text-navy-900 hover:bg-blue-50"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <BookmarkPlus className="size-4" />}
              {t("libhub.saveSet")}
            </button>
            <button
              type="button"
              onClick={share}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[12px] border border-border px-3 text-[14px] font-semibold text-navy-900 hover:bg-blue-50"
            >
              <Share2 className="size-4" />
              {t("libhub.share")}
            </button>
          </div>
        </section>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div role="tablist" aria-label={data.title} className="flex flex-wrap gap-2">
            {(["list", "practice"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={cn(
                  "min-h-11 rounded-[14px] border px-5 font-semibold",
                  tab === k
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-border bg-white text-navy-900 hover:bg-blue-50",
                )}
              >
                {k === "list" ? t("libhub.tabList", { count: data.total }) : t("libhub.tabPractice")}
              </button>
            ))}
          </div>

          {tab === "practice" ? (
            <SetPractice
              setId={data.id}
              words={words}
              onLearned={(zh) => patch(zh, { learned: true })}
              onBack={() => setTab("list")}
            />
          ) : (
            <section aria-labelledby="sd-list" className={cn(card, "flex flex-col gap-3 p-3 md:p-4")}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <h2 id="sd-list" className="text-[20px] font-extrabold text-navy-900">
                  {t("libhub.tabList", { count: data.total })}
                </h2>
                <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                  <label className="inline-flex min-h-10 items-center gap-2 text-[14px] text-text-2">
                    <input
                      type="checkbox"
                      checked={showPy}
                      onChange={(e) => setShowPy(e.target.checked)}
                      className="size-4"
                    />
                    {t("libhub.showPinyin")}
                  </label>
                  <label>
                    <span className="sr-only">{t("libhub.filterLabel")}</span>
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value as Filter)}
                      className="h-10 rounded-[12px] border border-border bg-white px-2.5 text-[14px] font-semibold"
                    >
                      {(["all", "new", "learned", "favorite"] as const).map((f) => (
                        <option key={f} value={f}>
                          {t(`libhub.filters.${f}`)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="sr-only">{t("libhub.sortLabel")}</span>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as "order" | "pinyin")}
                      className="h-10 rounded-[12px] border border-border bg-white px-2.5 text-[14px] font-semibold"
                    >
                      <option value="order">{t("libhub.wordSorts.order")}</option>
                      <option value="pinyin">{t("libhub.wordSorts.pinyin")}</option>
                    </select>
                  </label>
                </div>
              </div>
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
              {!shown.length ? (
                <p className="rounded-[14px] border border-dashed border-border px-4 py-8 text-center text-text-2">
                  {t("libhub.noWords")}
                </p>
              ) : (
                <ol className="flex flex-col gap-2.5">
                  {shown.map((w) => (
                    <WordRow
                      key={w.zh}
                      w={w}
                      n={data.words.findIndex((x) => x.zh === w.zh) + 1}
                      setId={data.id}
                      showPy={showPy}
                      onLearned={() => toggleLearned(w)}
                      onFav={() => toggleFav(w)}
                    />
                  ))}
                </ol>
              )}
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <section aria-labelledby="sd-contents" className={cn(card, "p-4")}>
            <h2 id="sd-contents" className="mb-2 text-[18px] font-extrabold text-navy-900">
              {t("libhub.contents")}
            </h2>
            <ol className="max-h-[360px] overflow-y-auto pr-1">
              {words.map((w, i) => (
                <li key={w.zh}>
                  <Link
                    href={`/library/vocabulary/${data.id}/${encodeURIComponent(w.zh)}`}
                    className="flex items-center gap-3 rounded-[10px] px-1.5 py-1.5 hover:bg-[#F3F8FE]"
                  >
                    <span className="w-6 text-center text-[13px] font-bold text-text-2">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-[14.5px] text-navy-900">
                      {w.meaning}{" "}
                      <span lang="zh" className="hanzi">
                        {w.zh}
                      </span>
                    </span>
                    {w.learned ? (
                      <span className="size-2 rounded-full bg-[#22C08A]" aria-label={t("libhub.done")} />
                    ) : null}
                  </Link>
                </li>
              ))}
            </ol>
          </section>
          <section aria-labelledby="sd-docs" className={cn(card, "p-4")}>
            <h2 id="sd-docs" className="mb-2 text-[18px] font-extrabold text-navy-900">
              {t("libhub.relatedDocs")}
            </h2>
            <ul className="flex flex-col gap-2">
              {(
                [
                  ["reading", "/reading", Languages],
                  ["listening", "/listening", Headphones],
                  ["translate", "/translate", Star],
                ] as const
              ).map(([k, href, Icon]) => (
                <li key={k}>
                  <Link
                    href={href}
                    className="flex items-center gap-3 rounded-[12px] border border-border px-3 py-2.5 hover:bg-[#F7FAFE]"
                  >
                    <Icon className="size-6 shrink-0 text-blue-600" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-navy-900">{t(`libhub.docs.${k}`)}</span>
                      <span className="block text-[12.5px] text-text-2">{t(`libhub.docs.${k}Sub`)}</span>
                    </span>
                    <ChevronRight className="size-4 text-blue-600" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          {data.related.length ? (
            <section aria-labelledby="sd-related" className={cn(card, "p-4")}>
              <h2 id="sd-related" className="mb-2 text-[18px] font-extrabold text-navy-900">
                {t("libhub.relatedSets")}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {data.related.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/library/vocabulary/${r.id}`}
                      className="inline-flex min-h-9 items-center rounded-full bg-[#F3F8FE] px-3 text-[13.5px] font-semibold text-navy-900 hover:bg-blue-50"
                    >
                      {r.title} · HSK {r.hsk}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function WordRow({
  w,
  n,
  setId,
  showPy,
  onLearned,
  onFav,
}: {
  w: Word;
  n: number;
  setId: string;
  showPy: boolean;
  onLearned: () => void;
  onFav: () => void;
}) {
  const t = useT();
  const href = `/library/vocabulary/${setId}/${encodeURIComponent(w.zh)}`;
  return (
    <li className="grid gap-3 rounded-[16px] border border-[#E6EEF8] p-2.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[14px] font-bold text-blue-700">
          {n}
        </span>
        <span
          aria-hidden="true"
          className="flex size-[72px] shrink-0 items-center justify-center rounded-[14px] bg-[#F7FAFE] text-[40px] md:size-[88px] md:text-[48px]"
        >
          {w.emoji}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2">
            <Link href={href} lang="zh" className="hanzi text-[28px] font-bold text-navy-900 hover:text-blue-700">
              {w.zh}
            </Link>
            {showPy ? <span className="text-[16px] pinyin text-blue-600">{w.py}</span> : null}
            <SpeakButton text={w.zh} label={t("ui.listen", { text: w.zh })} className="size-8" />
          </div>
          <p className="text-[15.5px] text-text">{w.meaning}</p>
          <p className="mt-1 flex flex-wrap gap-1.5">
            <Pill>{t(`library.pos.${w.pos}`)}</Pill>
            {w.hsk ? <Pill color="green">HSK {w.hsk}</Pill> : null}
          </p>
        </div>
      </div>
      <div className="flex items-start gap-2 rounded-[14px] bg-[#F3F8FE] p-3">
        <div className="min-w-0 flex-1">
          <Pill className="mb-1">{t("libhub.example")}</Pill>
          <p lang="zh" className="hanzi text-[16px] font-semibold text-navy-900">
            {w.example.zh}
          </p>
          {showPy ? <p className="text-[13.5px] text-text-2">{w.example.py}</p> : null}
          <p className="text-[13.5px] text-text-2">{w.example.meaning}</p>
        </div>
        <SpeakButton text={w.example.zh} label={t("ui.listen", { text: w.example.zh })} className="size-8" />
      </div>
      <div className="flex items-center justify-end gap-1 md:flex-col">
        <button
          type="button"
          onClick={onFav}
          aria-pressed={w.favorite}
          aria-label={w.favorite ? t("libhub.unfavWord", { word: w.zh }) : t("libhub.favWord", { word: w.zh })}
          className="flex size-10 items-center justify-center rounded-full text-[#F2A900] hover:bg-[#FFF6DD]"
        >
          <Star className={cn("size-5", w.favorite && "fill-[#F5B70A]")} />
        </button>
        <label className="flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-green-50">
          <span className="sr-only">
            {w.learned ? t("libhub.unmarkLearned", { word: w.zh }) : t("libhub.markLearned", { word: w.zh })}
          </span>
          <input type="checkbox" checked={w.learned} onChange={onLearned} className="size-5 accent-[#22C08A]" />
        </label>
      </div>
    </li>
  );
}
