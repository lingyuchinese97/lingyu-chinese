"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  BookmarkPlus,
  CheckCircle2,
  Eye,
  Languages,
  Lightbulb,
  Loader2,
  NotebookText,
  RotateCcw,
  Send,
  SkipForward,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { SpeakButton } from "@/components/speak-button";
import { useConfirm } from "@/components/ui/confirm";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";
import type { LocalPassage } from "../service";
import { pickPassageAction, saveWordsAction, setSavedAction, submitReadingAction } from "../actions";

type Passage = LocalPassage & { saved: boolean };
type Word = Passage["words"][number];
type Result = {
  correct: number;
  total: number;
  percent: number;
  results: { correct: boolean; answer: number | string; userAnswer: number | string | null }[];
};

const isHan = (ch: string) => /\p{Script=Han}/u.test(ch);

/** Tách một dòng thành các đoạn: từ khoá (bấm được) hoặc chữ thường; mỗi chữ Hán đi kèm âm tiết pinyin của nó. */
function segment(zh: string, py: string, words: Word[]) {
  const syl = py.split(/\s+/).filter(Boolean);
  const chars = [...zh];
  const pys: (string | null)[] = [];
  let k = 0;
  for (const ch of chars) pys.push(isHan(ch) ? (syl[k++] ?? "") : null);
  const keys = words
    .map((w) => w.zh.replace(/…/g, ""))
    .filter((w) => w.length > 0)
    .sort((a, b) => b.length - a.length);
  const out: { text: { ch: string; py: string | null }[]; word: Word | null }[] = [];
  let i = 0;
  while (i < chars.length) {
    const rest = chars.slice(i).join("");
    const hit = keys.find((w) => rest.startsWith(w));
    if (hit) {
      const n = [...hit].length;
      out.push({
        text: chars.slice(i, i + n).map((ch, j) => ({ ch, py: pys[i + j]! })),
        word: words.find((w) => w.zh.replace(/…/g, "") === hit) ?? null,
      });
      i += n;
    } else {
      out.push({ text: [{ ch: chars[i]!, py: pys[i]! }], word: null });
      i++;
    }
  }
  return out;
}

const PUNCT: Record<string, string> = {
  "，": ",",
  "。": ".",
  "？": "?",
  "！": "!",
  "、": ",",
  "：": ":",
  "；": ";",
  "“": "“",
  "”": "”",
};
/** Dòng pinyin đặt trên câu: âm tiết từng chữ Hán, dấu câu đổi sang dấu Latin. */
function pinyinLine(zh: string, py: string) {
  const syl = py.split(/\s+/).filter(Boolean);
  let k = 0;
  let out = "";
  for (const ch of zh) {
    if (isHan(ch)) out += (out && !out.endsWith(" ") && !out.endsWith("“") ? " " : "") + (syl[k++] ?? "");
    else if (PUNCT[ch]) out += PUNCT[ch] + (ch === "“" ? "" : " ");
    else out += ch;
  }
  return out.replace(/\s+/g, " ").trim();
}

export function Reader({ passage }: { passage: Passage }) {
  const t = useT();
  const router = useRouter();
  const [confirm, confirmNode] = useConfirm();
  const [pinyin, setPinyin] = React.useState(true);
  const [showTr, setShowTr] = React.useState(true);
  const [saved, setSaved] = React.useState(passage.saved);
  const [card, setCard] = React.useState<{ word: Word; x: number; y: number } | null>(null);
  const [answers, setAnswers] = React.useState<(number | string | null)[]>(() => passage.questions.map(() => null));
  const [result, setResult] = React.useState<Result | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const startedAt = React.useRef(0);
  React.useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  async function toggleSave() {
    setBusy("save");
    const r = await setSavedAction(passage.id, !saved);
    setBusy(null);
    if (!r.ok) return void toast.error(r.message);
    setSaved(r.data.saved);
    toast.success(r.data.saved ? t("reading.savedToast") : t("reading.unsavedToast"));
  }
  async function saveWord(w: Word) {
    const r = await saveWordsAction(passage.id, [w.zh]);
    if (!r.ok) return void toast.error(r.message);
    const word = w.zh.replace(/…/g, "");
    toast.success(r.data.added.length ? t("reading.wordSaved", { word }) : t("reading.wordExists", { word }));
  }
  async function saveAll() {
    setBusy("all");
    const r = await saveWordsAction(passage.id);
    setBusy(null);
    if (!r.ok) return void toast.error(r.message);
    toast.success(t("reading.savedAll", { added: r.data.added.length, skipped: r.data.skipped.length }));
  }
  async function submit() {
    const missing = answers.filter((a) => a === null || a === "").length;
    if (
      missing &&
      !(await confirm({ title: t("reading.submit"), message: t("reading.unanswered", { count: missing }) }))
    )
      return;
    setBusy("submit");
    const r = await submitReadingAction(passage.id, {
      answers: answers.map((a) => (a === "" ? null : a)),
      durationSec: Math.round((Date.now() - startedAt.current) / 1000),
    });
    setBusy(null);
    if (!r.ok) return void toast.error(r.message);
    setResult(r.data);
    requestAnimationFrame(() => document.getElementById("rd-result")?.scrollIntoView({ behavior: "smooth" }));
  }
  async function next() {
    setBusy("next");
    const r = await pickPassageAction({ level: passage.level });
    setBusy(null);
    if (!r.ok) return void toast.error(r.message);
    router.push(`/reading/${r.data.id}`);
  }
  function retry() {
    setAnswers(passage.questions.map(() => null));
    setResult(null);
    startedAt.current = Date.now();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const optText = (qi: number, a: number | string | null) => {
    const q = passage.questions[qi]!;
    if (a === null || a === "") return t("reading.noAnswer");
    return q.kind === "choice" && typeof a === "number"
      ? `${String.fromCharCode(65 + a)}. ${q.options?.[a] ?? ""}`
      : String(a);
  };

  const answered = answers.filter((a) => a !== null && a !== "").length;
  const [allWords, setAllWords] = React.useState(false);
  const shownWords = allWords ? passage.words : passage.words.slice(0, 6);
  const openCard = (w: Word, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    setCard({ word: w, x: r.left + r.width / 2, y: r.bottom });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="muted" size="sm" className="text-text-2">
          <Link href="/reading">
            <ArrowLeft />
            {t("reading.back")}
          </Link>
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="rounded-[12px] border border-[#D9E3FF] bg-[#EEF2FF] px-3 py-2 text-[14px] font-bold text-[#3F4FC9]">
            HSK {passage.level}
          </span>
          {[
            { v: pinyin, set: setPinyin, label: t("reading.showPinyin"), icon: <Eye /> },
            { v: showTr, set: setShowTr, label: t("reading.showTranslation"), icon: <Languages /> },
          ].map((o) => (
            <label
              key={o.label}
              className="relative flex min-h-10 cursor-pointer items-center gap-2 rounded-[12px] border border-border bg-white px-3 text-[14px] font-semibold text-text shadow-sm [&_svg]:size-[18px] [&_svg]:text-blue-600"
            >
              {o.icon}
              {o.label}
              <input
                type="checkbox"
                checked={o.v}
                onChange={(e) => o.set(e.target.checked)}
                className="peer absolute inset-0 z-[1] size-full cursor-pointer opacity-0"
              />
              <span
                aria-hidden="true"
                className="relative h-6 w-11 rounded-full bg-[#CBD5E1] transition-colors peer-checked:bg-blue-600 peer-focus-visible:shadow-[var(--focus-ring)] after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"
              />
            </label>
          ))}
          <Button
            type="button"
            variant={saved ? "ghost" : "secondary"}
            size="sm"
            onClick={toggleSave}
            disabled={!!busy}
            aria-pressed={saved}
          >
            {saved ? <BookmarkCheck /> : <Bookmark />}
            {saved ? t("reading.unsave") : t("reading.save")}
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <article
          aria-labelledby="rd-title"
          className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-white p-4 shadow-card md:p-5"
        >
          <header className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <NotebookText className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-text-2">
                {t("reading.passageLabel")} · {t(`reading.types.${passage.type}`)} ·{" "}
                {t(`translate.topics.${passage.topic as "daily"}`)}
              </p>
              <h1 id="rd-title" className="hanzi text-[22px] font-extrabold text-navy-900 md:text-[26px]" lang="zh">
                {passage.title}
              </h1>
              <p className="text-[14.5px] text-text-2">{passage.titleTr}</p>
            </div>
          </header>

          <ol className="flex flex-col gap-5 rounded-[18px] bg-[#F5F8FD] px-3 py-4 md:px-5 md:py-5" lang="zh">
            {passage.lines.map((l, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="mt-[calc(var(--py-h)+6px)] flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-bold text-text-2 shadow-sm [--py-h:0px] data-[py=on]:[--py-h:24px]"
                  data-py={pinyin ? "on" : "off"}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  {pinyin ? (
                    <p data-pinyin-line lang="zh-Latn" className="text-[14.5px] leading-6 text-text-2">
                      {l.s ? `${l.s}: ` : ""}
                      {pinyinLine(l.zh, l.py)}
                    </p>
                  ) : null}
                  <p className="hanzi text-[23px] leading-[1.6] font-bold text-navy-900 md:text-[27px]">
                    {l.s ? <span className="mr-1 text-[0.7em] font-semibold text-blue-700">{l.s}:</span> : null}
                    {segment(l.zh, l.py, passage.words).map((sg, j) =>
                      sg.word ? (
                        <button
                          key={j}
                          type="button"
                          onClick={(e) => openCard(sg.word!, e.currentTarget)}
                          aria-label={t("reading.wordCard", { word: sg.word.zh })}
                          className="rounded-[6px] bg-[#FFEFB8] px-0.5 outline-none hover:bg-[#FFE28A] focus-visible:shadow-[var(--focus-ring)]"
                        >
                          {sg.text.map((c) => c.ch).join("")}
                        </button>
                      ) : (
                        <span key={j}>{sg.text.map((c) => c.ch).join("")}</span>
                      ),
                    )}
                  </p>
                  {showTr ? (
                    <p lang={undefined} className="mt-0.5 text-[15.5px] text-text-2">
                      {l.tr}
                    </p>
                  ) : null}
                </div>
                <SpeakButton text={l.zh} label={t("reading.listenLine")} />
              </li>
            ))}
          </ol>

          <section aria-labelledby="rd-words" className="flex flex-col gap-3 rounded-[18px] bg-[#FBFCFE] p-3 md:p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="rd-words" className="flex items-center gap-2 text-[16.5px] font-bold text-navy-900">
                <Lightbulb className="size-5 text-amber" aria-hidden="true" />
                {t("reading.keyWords")}
              </h2>
              <div className="ml-auto flex items-center gap-1">
                <Button type="button" size="sm" variant="ghost" onClick={saveAll} disabled={!!busy}>
                  {busy === "all" ? <Loader2 className="animate-spin" /> : <BookmarkPlus />}
                  {t("reading.saveAll")}
                </Button>
                {passage.words.length > 6 ? (
                  <Button type="button" size="sm" variant="ghost" onClick={() => setAllWords((v) => !v)}>
                    <BookOpen />
                    {allWords ? t("reading.showLess") : t("reading.showAll")}
                  </Button>
                ) : null}
              </div>
            </div>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
              {shownWords.map((w) => (
                <li key={w.zh}>
                  <button
                    type="button"
                    onClick={(e) => openCard(w, e.currentTarget)}
                    className="flex w-full flex-col items-center gap-0.5 rounded-[14px] bg-[#FFF6DA] px-2 py-2.5 text-center outline-none hover:bg-[#FFEDB5] focus-visible:shadow-[var(--focus-ring)]"
                  >
                    <span className="text-[12.5px] text-text-2">{w.py}</span>
                    <span lang="zh" className="hanzi text-[21px] font-bold text-[#C2410C]">
                      {w.zh}
                    </span>
                    <span className="line-clamp-1 text-[12.5px] text-text-2">{w.meaning}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </article>

        <section
          aria-labelledby="rd-q"
          className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-white p-4 shadow-card md:p-5"
        >
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="rd-q" className="flex items-center gap-2 text-[20px] font-extrabold text-navy-900">
              <span className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-[17px] text-white">
                ?
              </span>
              {t("reading.questions")}
            </h2>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-[15px] font-bold text-text-2 tabular-nums">
                {answered} / {passage.questions.length}
              </span>
              <div
                role="progressbar"
                aria-label={t("reading.progress")}
                aria-valuemin={0}
                aria-valuemax={passage.questions.length}
                aria-valuenow={answered}
                className="h-2 w-[120px] overflow-hidden rounded-full bg-[#E3ECF7] md:w-[180px]"
              >
                <div
                  className="h-full rounded-full bg-blue-600 transition-[width]"
                  style={{ width: `${(answered / Math.max(1, passage.questions.length)) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <ol className="flex flex-col gap-4">
            {passage.questions.map((q, i) => {
              const r = result?.results[i];
              return (
                <li
                  key={i}
                  className={cn(
                    "rounded-2xl border p-3.5 md:p-4",
                    r
                      ? r.correct
                        ? "border-green-100 bg-green-50/60"
                        : "border-red-100 bg-red-50/50"
                      : answers[i] !== null && answers[i] !== ""
                        ? "border-[#BBD7F6] bg-[#F7FBFF]"
                        : "border-border",
                  )}
                >
                  <p className="text-[13px] font-bold text-text">{t("reading.questionN", { n: i + 1 })}</p>
                  {pinyin ? <p className="text-[14px] text-text-2">{q.py}</p> : null}
                  <p lang="zh" className="hanzi text-[21px] font-bold text-navy-900">
                    {q.zh}
                  </p>
                  {showTr ? <p className="text-[15px] text-text-2">{q.tr}</p> : null}
                  <div className="mb-2" />
                  {q.kind === "choice" ? (
                    <div
                      role="radiogroup"
                      aria-label={`${t("reading.questionN", { n: i + 1 })}: ${t("reading.choose")}`}
                      className="grid gap-2 sm:grid-cols-2"
                    >
                      {q.options!.map((o, j) => {
                        const on = answers[i] === j;
                        const right = r && r.answer === j;
                        return (
                          <button
                            key={j}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            disabled={!!result}
                            onClick={() => setAnswers((a) => a.map((x, k) => (k === i ? j : x)))}
                            className={cn(
                              "flex min-h-[64px] items-center gap-3 rounded-2xl border-[1.5px] px-3 py-2 text-left outline-none focus-visible:[box-shadow:var(--focus-ring)] disabled:cursor-default",
                              right
                                ? "border-green bg-white"
                                : on
                                  ? r
                                    ? "border-red bg-white"
                                    : "border-blue-600 bg-blue-50"
                                  : "border-border bg-white hover:border-[#A9D3F8]",
                            )}
                          >
                            <span
                              className={cn(
                                "flex size-9 shrink-0 items-center justify-center rounded-full text-[15px] font-bold",
                                on && !r ? "bg-blue-600 text-white" : "bg-[#EEF4FB] text-text-2",
                              )}
                            >
                              {String.fromCharCode(65 + j)}
                            </span>
                            <span lang="zh" className="hanzi text-[19px] font-bold text-navy-900">
                              {o}
                            </span>
                            <span className="min-w-0 flex-1 text-[13.5px] leading-snug text-text-2">
                              {pinyin && q.optionInfo?.[j]?.py ? (
                                <span className="block">{q.optionInfo[j]!.py}</span>
                              ) : null}
                              {showTr && q.optionInfo?.[j]?.meaning ? (
                                <span className="block">{q.optionInfo[j]!.meaning}</span>
                              ) : null}
                            </span>
                            {on && !r ? (
                              <CheckCircle2 className="size-6 shrink-0 fill-blue-600 text-white" aria-hidden="true" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <input
                      lang="zh"
                      value={(answers[i] as string | null) ?? ""}
                      disabled={!!result}
                      onChange={(e) => setAnswers((a) => a.map((x, k) => (k === i ? e.target.value : x)))}
                      placeholder={t("reading.fillPlaceholder")}
                      aria-label={t("reading.fillLabel", { n: i + 1 })}
                      maxLength={40}
                      className={cn(inputClass, "max-w-[280px] text-[18px]")}
                    />
                  )}
                  {r ? (
                    <p
                      role="status"
                      className={cn(
                        "mt-2 flex flex-wrap items-center gap-2 text-[14.5px] font-semibold",
                        r.correct ? "text-green-700" : "text-red",
                      )}
                    >
                      {r.correct ? (
                        <CheckCircle2 className="size-5" aria-hidden="true" />
                      ) : (
                        <XCircle className="size-5" aria-hidden="true" />
                      )}
                      {r.correct ? t("reading.correct") : t("reading.wrong")}
                      {!r.correct ? (
                        <span className="font-normal text-text">
                          {t("reading.yourAnswer", { answer: optText(i, r.userAnswer) })} ·{" "}
                          {t("reading.rightAnswer", { answer: optText(i, r.answer) })}
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
          {!result ? (
            <Button
              variant="primary"
              size="lg"
              className="self-center max-md:w-full md:min-w-[220px]"
              onClick={submit}
              disabled={!!busy}
            >
              {busy === "submit" ? <Loader2 className="animate-spin" /> : <Send />}
              {busy === "submit" ? t("reading.submitting") : t("reading.submit")}
            </Button>
          ) : null}
        </section>
      </div>

      {card ? (
        <div
          role="dialog"
          aria-label={t("reading.wordCard", { word: card.word.zh })}
          style={{ left: Math.min(Math.max(card.x, 150), window.innerWidth - 150), top: card.y + 8 }}
          className="fixed z-[70] w-[280px] -translate-x-1/2 rounded-[16px] border border-[#F6DE9E] bg-white p-3.5 shadow-card"
        >
          <div className="flex items-start gap-2">
            <p lang="zh" className="min-w-0 flex-1 hanzi text-[24px] leading-tight font-bold text-navy-900">
              {card.word.zh}
            </p>
            <SpeakButton text={card.word.zh.replace(/…/g, "")} label={t("ui.listen", { text: card.word.zh })} />
            <button
              type="button"
              onClick={() => setCard(null)}
              aria-label={t("listening.word.close")}
              className="flex size-9 items-center justify-center rounded-full text-text-3 hover:bg-blue-50"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="text-[15px] text-pinyin">{card.word.py}</p>
          <p className="mt-0.5 text-[15px] text-text">{card.word.meaning}</p>
          <Button type="button" size="sm" variant="secondary" className="mt-2.5" onClick={() => saveWord(card.word)}>
            <BookmarkPlus />
            {t("reading.saveWord")}
          </Button>
        </div>
      ) : null}

      {result ? (
        <section
          id="rd-result"
          aria-labelledby="rd-result-title"
          className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-white p-4 shadow-card md:p-6"
        >
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="rd-result-title" className="text-[20px] font-extrabold text-navy-900">
              {t("reading.result")}
            </h2>
            <span className="rounded-full bg-green-50 px-3 py-1 text-[15px] font-bold text-green-700">
              {t("reading.score", { correct: result.correct, total: result.total })} · {result.percent}%
            </span>
          </div>
          <p className="text-[15.5px] text-text">
            {t(result.percent === 100 ? "reading.perfect" : result.percent >= 60 ? "reading.good" : "reading.keep")}
          </p>

          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="text-[16px] font-bold text-navy-900">{t("reading.wordsInText")}</h3>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="ml-auto"
                onClick={saveAll}
                disabled={!!busy}
              >
                {busy === "all" ? <Loader2 className="animate-spin" /> : <BookmarkPlus />}
                {t("reading.saveAll")}
              </Button>
            </div>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2">
              {passage.words.map((w) => (
                <li key={w.zh} className="rounded-xl border border-border bg-white px-3 py-2">
                  <span lang="zh" className="hanzi text-[18px] font-bold text-navy-900">
                    {w.zh}
                  </span>{" "}
                  <span className="text-[14px] pinyin">{w.py}</span>
                  <span className="block text-[13.5px] text-text-2">{w.meaning}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-[16px] font-bold text-navy-900">{t("reading.grammarInText")}</h3>
            <ul className="grid gap-2">
              {passage.grammar.map((g) => (
                <li key={g.id} className="rounded-2xl border border-[#F6DE9E] bg-[#FFF9EA] p-3">
                  <p className="font-bold text-[#8A5300]">{g.name}</p>
                  <p className="mt-0.5 inline-block rounded-lg bg-white px-2 py-0.5 text-[14.5px] font-semibold text-navy-900">
                    {g.structure}
                  </p>
                  <p className="mt-1 text-[14px] text-text">{g.explain}</p>
                  <p lang="zh" className="mt-1 hanzi text-[14px] text-text-2">
                    {g.pattern}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={retry}>
              <RotateCcw />
              {t("reading.retry")}
            </Button>
            <Button type="button" variant="primary" onClick={next} disabled={!!busy}>
              {busy === "next" ? <Loader2 className="animate-spin" /> : <SkipForward />}
              {t("reading.next")}
            </Button>
          </div>
        </section>
      ) : null}
      {confirmNode}
    </div>
  );
}
