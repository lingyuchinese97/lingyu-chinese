"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  BookmarkPlus,
  CheckCircle2,
  Lightbulb,
  Loader2,
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

function Ruby({ text, pinyin }: { text: { ch: string; py: string | null }[]; pinyin: boolean }) {
  return (
    <>
      {text.map((c, i) =>
        pinyin && c.py ? (
          <ruby key={i} className="[ruby-position:over]">
            {c.ch}
            <rt className="text-[0.5em] font-normal text-pinyin">{c.py}</rt>
          </ruby>
        ) : (
          <span key={i}>{c.ch}</span>
        ),
      )}
    </>
  );
}

export function Reader({ passage }: { passage: Passage }) {
  const t = useT();
  const router = useRouter();
  const [confirm, confirmNode] = useConfirm();
  const [pinyin, setPinyin] = React.useState(true);
  const [showTr, setShowTr] = React.useState(false);
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="muted" size="sm">
          <Link href="/reading">
            <ArrowLeft />
            {t("reading.back")}
          </Link>
        </Button>
      </div>

      <article
        aria-labelledby="rd-title"
        className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-white p-4 shadow-card md:p-6"
      >
        <header className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="mb-1 flex flex-wrap gap-1.5 text-[12.5px] font-semibold">
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">HSK {passage.level}</span>
              <span className="rounded-full bg-[#F3EEFF] px-2 py-0.5 text-[#6B46C1]">
                {t(`reading.types.${passage.type}`)}
              </span>
              <span className="rounded-full bg-[#FFF3D2] px-2 py-0.5 text-[#8A5300]">
                {t(`translate.topics.${passage.topic as "daily"}`)}
              </span>
            </p>
            <h1 id="rd-title" className="hanzi text-[26px] font-extrabold text-navy-900 md:text-[30px]" lang="zh">
              {passage.title}
            </h1>
            <p className="text-[15px] text-text-2">{passage.titleTr}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
        </header>

        <div className="flex flex-wrap gap-4 rounded-[14px] bg-[#F4F8FD] px-3.5 py-2.5 text-[14.5px]">
          {[
            { v: pinyin, set: setPinyin, label: t("reading.showPinyin") },
            { v: showTr, set: setShowTr, label: t("reading.showTranslation") },
          ].map((o) => (
            <label key={o.label} className="flex cursor-pointer items-center gap-2 font-semibold text-text">
              <input
                type="checkbox"
                checked={o.v}
                onChange={(e) => o.set(e.target.checked)}
                className="size-4 accent-blue-600"
              />
              {o.label}
            </label>
          ))}
          <span className="ml-auto flex items-center gap-1.5 text-[13.5px] text-text-3">
            <Lightbulb className="size-4" aria-hidden="true" />
            {t("reading.keyWordsHint")}
          </span>
        </div>

        <div className="flex flex-col gap-3" lang="zh">
          {passage.lines.map((l, i) => (
            <div key={i} className="flex items-start gap-2">
              {l.s ? (
                <span className="mt-2 flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[14px] font-bold text-blue-700">
                  {l.s}
                </span>
              ) : null}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "hanzi text-[22px] text-navy-900 md:text-[24px]",
                    pinyin ? "leading-[2.4]" : "leading-[1.8]",
                  )}
                >
                  {segment(l.zh, l.py, passage.words).map((sg, j) =>
                    sg.word ? (
                      <button
                        key={j}
                        type="button"
                        onClick={(e) => {
                          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setCard({ word: sg.word!, x: r.left + r.width / 2, y: r.bottom });
                        }}
                        aria-label={t("reading.wordCard", { word: sg.word.zh })}
                        className="rounded-[6px] border-b-2 border-[#F5A524] bg-[#FFF6DD] px-0.5 outline-none hover:bg-[#FFEBB5] focus-visible:shadow-[var(--focus-ring)]"
                      >
                        <Ruby text={sg.text} pinyin={pinyin} />
                      </button>
                    ) : (
                      <Ruby key={j} text={sg.text} pinyin={pinyin} />
                    ),
                  )}
                </p>
                {showTr ? (
                  <p lang={undefined} className="text-[15px] text-text-2">
                    {l.tr}
                  </p>
                ) : null}
              </div>
              <SpeakButton text={l.zh} label={t("reading.listenLine")} />
            </div>
          ))}
        </div>
      </article>

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

      <section
        aria-labelledby="rd-q"
        className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-white p-4 shadow-card md:p-6"
      >
        <h2 id="rd-q" className="text-[20px] font-extrabold text-navy-900">
          {t("reading.questions")}
        </h2>
        <ol className="flex flex-col gap-4">
          {passage.questions.map((q, i) => {
            const r = result?.results[i];
            return (
              <li
                key={i}
                className={cn(
                  "rounded-2xl border p-3.5",
                  r ? (r.correct ? "border-green-100 bg-green-50/60" : "border-red-100 bg-red-50/50") : "border-border",
                )}
              >
                <p className="text-[13px] font-semibold text-text-3">{t("reading.questionN", { n: i + 1 })}</p>
                <p lang="zh" className="hanzi text-[19px] font-semibold text-navy-900">
                  {q.zh}
                </p>
                <p className="mb-2 text-[14px] text-text-2">{q.tr}</p>
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
                            "flex min-h-11 items-center gap-2.5 rounded-xl border-[1.5px] px-3 text-left outline-none focus-visible:[box-shadow:var(--focus-ring)] disabled:cursor-default",
                            right
                              ? "border-green bg-white"
                              : on
                                ? r
                                  ? "border-red bg-white"
                                  : "border-blue-600 bg-blue-50"
                                : "border-border bg-white hover:border-[#A9D3F8]",
                          )}
                        >
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#EEF4FB] text-[13px] font-bold text-text-2">
                            {String.fromCharCode(65 + j)}
                          </span>
                          <span lang="zh" className="hanzi text-[17px]">
                            {o}
                          </span>
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
