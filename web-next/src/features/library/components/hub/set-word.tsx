"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  Headphones,
  Image as ImageIcon,
  Lightbulb,
  Link2,
  Loader2,
  MessageCircle,
  Puzzle,
  Star,
  Volume2,
} from "lucide-react";
import { SpeakButton } from "@/components/speak-button";
import { toast } from "@/components/ui/toaster";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import type { SetWordDetail } from "../../sets";
import { saveSetAction, setFavoriteAction, setWordLearnedAction } from "../../actions";
import { Crumbs, Pill, Ring, card } from "./parts";

const SPEEDS = [0.5, 0.75, 1] as const;
const TABS = ["overview", "examples", "radicals", "related", "mnemonic", "practice"] as const;

/** Chi tiết một từ trong bộ: nghĩa, phát âm (âm tiết + thanh, nghe chậm), ví dụ, hình, bộ thủ, từ liên quan, cách nhớ. */
export function SetWordView({ data }: { data: SetWordDetail }) {
  const t = useT();
  const router = useRouter();
  const w = data.word;
  const [learned, setLearned] = React.useState(w.learned);
  const [fav, setFav] = React.useState(w.favorite);
  const [saved, setSaved] = React.useState(w.saved);
  const [busy, setBusy] = React.useState<"learn" | "save" | null>(null);
  const [speed, setSpeed] = React.useState<(typeof SPEEDS)[number]>(0.75);
  const [progress, setProgress] = React.useState(data.set.learned);
  const base = `/library/vocabulary/${data.set.id}`;
  const href = (zh: string) => `${base}/${encodeURIComponent(zh)}`;

  async function toggleLearned() {
    setBusy("learn");
    const r = await setWordLearnedAction(data.set.id, w.zh, !learned);
    setBusy(null);
    if (!r.ok) return void toast.error(t.maybe(r.message));
    setLearned(r.data.learned);
    setProgress(r.data.progress.learned);
  }
  async function toggleFav() {
    const next = !fav;
    setFav(next);
    const r = await setFavoriteAction(data.set.id, w.zh, next);
    if (!r.ok) {
      setFav(!next);
      toast.error(t.maybe(r.message));
    }
  }
  async function save() {
    setBusy("save");
    const r = await saveSetAction(data.set.id, w.zh);
    setBusy(null);
    if (!r.ok) return void toast.error(t.maybe(r.message));
    setSaved(true);
    toast.success(r.data.added ? t("libhub.savedWord", { word: w.zh }) : t("libhub.alreadySaved", { word: w.zh }), {
      action: { label: t("libhub.openMine"), onClick: () => router.push(`/vocabulary?q=${encodeURIComponent(w.zh)}`) },
    });
  }

  const toneText = data.syllables.map((s) => `${s.syl} – ${t(`libhub.tones.${s.tone || "t5"}`)}`);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Crumbs
          label={t("shell.breadcrumb")}
          home={t("shell.nav.home")}
          items={[
            { href: "/library", text: t("libhub.breadcrumb") },
            { href: "/library/vocabulary", text: t("libhub.vocabTitle") },
            { href: base, text: data.set.title },
            { text: w.zh },
          ]}
        />
        <div className="ml-auto flex gap-2">
          {data.prev ? (
            <Link
              href={href(data.prev)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-[12px] border border-border bg-white px-3 font-semibold text-navy-900 hover:bg-blue-50"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {t("libhub.prev")}
            </Link>
          ) : null}
          {data.next ? (
            <Link
              href={href(data.next)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-[12px] border border-border bg-white px-3 font-semibold text-navy-900 hover:bg-blue-50"
            >
              {t("libhub.next")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          <header className={cn(card, "flex flex-col gap-4 p-4 sm:flex-row sm:items-center md:p-5")}>
            <span
              aria-hidden="true"
              className="flex h-[100px] w-full shrink-0 items-center justify-center rounded-[20px] bg-[#FFECEE] text-[64px] sm:h-[140px] sm:w-[160px] sm:text-[84px]"
            >
              {w.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 lang="zh" className="hanzi text-[48px] leading-none font-bold text-navy-900">
                  {w.zh}
                </h1>
                <SpeakButton text={w.zh} label={t("ui.listen", { text: w.zh })} className="size-10" />
              </div>
              <p className="mt-1 text-[22px] pinyin text-blue-600">{w.py}</p>
              <p className="text-[16px] text-text-2">{w.meaning}</p>
              <p className="mt-2 flex flex-wrap gap-1.5">
                <Pill>{t(`library.pos.${w.pos}`)}</Pill>
                <Pill color="green">{data.set.title}</Pill>
                {w.hsk ? <Pill color="violet">HSK {w.hsk}</Pill> : null}
              </p>
            </div>
            <div className="flex gap-3 sm:flex-col md:flex-row">
              <button
                type="button"
                onClick={toggleFav}
                aria-pressed={fav}
                className="flex flex-col items-center gap-1 text-[13.5px] text-text-2"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-[#FFF3D6] text-[#F2A900]">
                  <Star className={cn("size-6", fav && "fill-[#F5B70A]")} aria-hidden="true" />
                </span>
                {t("libhub.favorite")}
              </button>
              <button
                type="button"
                onClick={save}
                disabled={busy === "save"}
                aria-pressed={saved}
                className="flex flex-col items-center gap-1 text-[13.5px] text-text-2"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  {busy === "save" ? (
                    <Loader2 className="size-6 animate-spin" />
                  ) : (
                    <Bookmark className={cn("size-6", saved && "fill-blue-600")} aria-hidden="true" />
                  )}
                </span>
                {saved ? t("libhub.saved") : t("libhub.save")}
              </button>
            </div>
          </header>

          <nav aria-label={t("libhub.wordTabsLabel")} className="flex flex-wrap gap-2">
            {TABS.map((k, i) => (
              <a
                key={k}
                href={`#w-${k}`}
                className={cn(
                  "inline-flex min-h-10 items-center rounded-[12px] border px-4 text-[14.5px] font-semibold",
                  i === 0
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-border bg-white text-navy-900 hover:bg-blue-50",
                )}
              >
                {t(`libhub.wordTabs.${k}`)}
              </a>
            ))}
          </nav>

          <div className="grid items-start gap-4 lg:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-4">
              <section id="w-overview" aria-labelledby="w-meaning" className={cn(card, "scroll-mt-24 p-4")}>
                <h2 id="w-meaning" className="flex items-center gap-2 font-bold text-navy-900">
                  <Lightbulb className="size-5 text-amber" aria-hidden="true" />
                  {t("libhub.meaning")}
                </h2>
                <p className="mt-1 text-[16px] text-text">{w.meaning}</p>
              </section>
              <section aria-labelledby="w-pron" className={cn(card, "p-4")}>
                <h2 id="w-pron" className="flex items-center gap-2 font-bold text-navy-900">
                  <Headphones className="size-5 text-blue-600" aria-hidden="true" />
                  {t("libhub.pronunciation")}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="text-[26px] font-semibold pinyin text-blue-600">{w.py}</span>
                  <SpeakButton text={w.zh} label={t("ui.listen", { text: w.zh })} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <SpeakButton
                    text={w.zh}
                    rate={0.35 * speed}
                    label={t("libhub.playSlow")}
                    className="h-10 w-auto gap-2 rounded-[12px] border border-border px-3 font-semibold"
                  >
                    {t("libhub.playSlow")}
                  </SpeakButton>
                  <label className="inline-flex items-center gap-2 text-[13.5px] text-text-2">
                    {t("libhub.speed")}
                    <select
                      value={speed}
                      onChange={(e) => setSpeed(Number(e.target.value) as (typeof SPEEDS)[number])}
                      className="h-10 rounded-[12px] border border-border bg-white px-2 font-semibold text-navy-900"
                    >
                      {SPEEDS.map((s) => (
                        <option key={s} value={s}>
                          {s}x
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <ul className="mt-3 rounded-[12px] bg-[#F3F8FE] px-3 py-2 text-[14px] text-text">
                  {toneText.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </section>
              <section id="w-examples" aria-labelledby="w-ex" className={cn(card, "scroll-mt-24 p-4")}>
                <h2 id="w-ex" className="mb-2 flex items-center gap-2 font-bold text-navy-900">
                  <MessageCircle className="size-5 text-blue-600" aria-hidden="true" />
                  {t("libhub.examplesTitle")}
                </h2>
                <ol className="flex flex-col gap-2">
                  {data.examples.map((e, i) => (
                    <li key={e.zh} className="flex items-start gap-3 rounded-[14px] bg-[#F7FAFE] p-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-bold text-blue-700">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span lang="zh" className="block hanzi text-[17px] font-semibold text-navy-900">
                          {highlight(e.zh, w.zh)}
                        </span>
                        <span className="block text-[13.5px] text-text-2">{e.py}</span>
                        <span className="block text-[13.5px] text-text-2">{e.meaning}</span>
                      </span>
                      <SpeakButton text={e.zh} label={t("ui.listen", { text: e.zh })} className="size-8" />
                    </li>
                  ))}
                </ol>
              </section>
              <section id="w-mnemonic" aria-labelledby="w-mn" className={cn(card, "scroll-mt-24 p-4")}>
                <h2 id="w-mn" className="mb-2 flex items-center gap-2 font-bold text-navy-900">
                  <Lightbulb className="size-5 text-[#F26B1D]" aria-hidden="true" />
                  {t("libhub.mnemonicTitle")}
                </h2>
                <p className="flex gap-3 rounded-[14px] bg-[#FFF8E6] p-3 text-[15px] text-text">
                  <span aria-hidden="true" className="text-[36px]">
                    {w.emoji}
                  </span>
                  <span>{data.mnemonic || t("libhub.mnemonicDefault", { py: w.py, emoji: w.emoji, word: w.zh })}</span>
                </p>
              </section>
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <section aria-labelledby="w-img" className={cn(card, "p-4")}>
                <h2 id="w-img" className="mb-2 flex items-center gap-2 font-bold text-navy-900">
                  <ImageIcon className="size-5 text-[#7A45E0]" aria-hidden="true" />
                  {t("libhub.illustration")}
                </h2>
                <div
                  aria-hidden="true"
                  className="flex h-[200px] items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#FFF6E6,#FFEDEF)] text-[120px]"
                >
                  {w.emoji}
                </div>
              </section>
              <section id="w-radicals" aria-labelledby="w-rad" className={cn(card, "scroll-mt-24 p-4")}>
                <h2 id="w-rad" className="mb-2 flex items-center gap-2 font-bold text-navy-900">
                  <Puzzle className="size-5 text-[#7A45E0]" aria-hidden="true" />
                  {t("libhub.radicalsTitle")}
                </h2>
                {data.components.length ? (
                  <>
                    <ul className="flex flex-col gap-2">
                      {data.components.map((c, i) => (
                        <li
                          key={`${c.char}-${i}`}
                          className="flex items-center gap-3 rounded-[12px] bg-[#F7FAFE] p-2.5"
                        >
                          <span
                            lang="zh"
                            className="flex size-12 items-center justify-center rounded-[12px] bg-white hanzi text-[28px] text-[#1E9E5A]"
                          >
                            {c.char}
                          </span>
                          <span>
                            <span className="block font-semibold text-navy-900">{c.pinyin}</span>
                            <span className="block text-[13.5px] text-text-2">{c.meaning}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 flex items-center gap-2 text-[15px]">
                      <ArrowRight className="size-4 text-text-3" aria-hidden="true" />
                      <span lang="zh" className="hanzi text-[24px] font-bold text-navy-900">
                        {w.zh}
                      </span>
                      <span className="text-text-2">{w.meaning}</span>
                    </p>
                  </>
                ) : (
                  <p className="text-[14px] text-text-2">{t("libhub.noRadicals")}</p>
                )}
              </section>
              <section id="w-related" aria-labelledby="w-rel" className={cn(card, "scroll-mt-24 p-4")}>
                <h2 id="w-rel" className="mb-2 flex items-center gap-2 font-bold text-navy-900">
                  <Link2 className="size-5 text-blue-600" aria-hidden="true" />
                  {t("libhub.relatedTitle")}
                </h2>
                {data.related.length ? (
                  <ul className="divide-y divide-[#EDF3F9]">
                    {data.related.map((r) => (
                      <li
                        key={r.zh}
                        className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-2 py-2"
                      >
                        <span lang="zh" className="hanzi text-[17px] font-semibold text-navy-900">
                          {r.zh}
                        </span>
                        <span className="text-[14px] pinyin text-text-2">{r.py}</span>
                        <span className="text-[14px] text-text">{r.vi}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[14px] text-text-2">{t("libhub.noRelated")}</p>
                )}
              </section>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <section aria-labelledby="w-prog" className={cn(card, "flex items-center gap-4 p-4")}>
            <Ring value={progress} total={data.set.total} />
            <div className="min-w-0 flex-1">
              <h2 id="w-prog" className="font-bold text-navy-900">
                {t("libhub.progress")}
              </h2>
              <p className="text-[13.5px] text-text-2">
                {t("libhub.wordProgress", { learned: progress, total: data.set.total })}
              </p>
              <button
                type="button"
                onClick={toggleLearned}
                disabled={busy === "learn"}
                aria-pressed={learned}
                className={cn(
                  "mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[12px] px-4 font-semibold",
                  learned ? "bg-green-50 text-green-700" : "bg-blue-600 text-white hover:bg-blue-700",
                )}
              >
                {busy === "learn" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                {learned ? t("libhub.done") : t("libhub.markDone")}
              </button>
            </div>
          </section>
          <section aria-labelledby="w-list" className={cn(card, "p-4")}>
            <h2 id="w-list" className="mb-2 text-[18px] font-extrabold text-navy-900">
              {t("libhub.wordsInSet")}
            </h2>
            <ol className="max-h-[420px] overflow-y-auto pr-1">
              {data.words.map((x, i) => (
                <li key={x.zh}>
                  <Link
                    href={href(x.zh)}
                    aria-current={x.zh === w.zh ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-[12px] px-2 py-1.5",
                      x.zh === w.zh ? "bg-blue-50" : "hover:bg-[#F3F8FE]",
                    )}
                  >
                    <span className="w-6 text-center text-[13px] font-bold text-text-2">{i + 1}</span>
                    <span aria-hidden="true" className="text-[22px]">
                      {x.emoji}
                    </span>
                    <span lang="zh" className="hanzi text-[17px] font-semibold text-navy-900">
                      {x.zh}
                    </span>
                    <span className="text-[13px] pinyin text-text-2">{x.py}</span>
                    <span className="ml-auto truncate text-[13px] text-text">{x.meaning}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
          <section id="w-practice" aria-labelledby="w-pr" className={cn(card, "scroll-mt-24 p-4")}>
            <h2 id="w-pr" className="mb-2 text-[18px] font-extrabold text-navy-900">
              {t("libhub.practiceTitle")}
            </h2>
            <ul className="flex flex-col gap-2">
              {(
                [
                  ["listen", Volume2],
                  ["image", ImageIcon],
                ] as const
              ).map(([m, Icon]) => (
                <li key={m}>
                  <Link
                    href={`${base}?tab=practice`}
                    className="flex items-center gap-3 rounded-[12px] border border-border px-3 py-2.5 hover:bg-[#F7FAFE]"
                  >
                    <Icon className="size-5 text-blue-600" aria-hidden="true" />
                    <span>
                      <span className="block font-semibold text-navy-900">{t(`libhub.modes.${m}`)}</span>
                      <span className="block text-[12.5px] text-text-2">{t(`libhub.modes.${m}Sub`)}</span>
                    </span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/translate"
                  className="flex items-center gap-3 rounded-[12px] border border-border px-3 py-2.5 hover:bg-[#F7FAFE]"
                >
                  <BookOpen className="size-5 text-blue-600" aria-hidden="true" />
                  <span>
                    <span className="block font-semibold text-navy-900">{t("libhub.docs.translate")}</span>
                    <span className="block text-[12.5px] text-text-2">{t("libhub.docs.translateSub")}</span>
                  </span>
                </Link>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

/** Tô màu từ đang học trong câu ví dụ. */
function highlight(sentence: string, word: string) {
  const parts = sentence.split(word);
  if (parts.length < 2) return sentence;
  return parts.flatMap((p, i) =>
    i === 0
      ? [p]
      : [
          <span key={i} className="text-[#E0302F]">
            {word}
          </span>,
          p,
        ],
  );
}
