"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  BookOpen,
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
import { Dialog, DialogActions, DialogClose, DialogContent } from "@/components/ui/dialog";
import { SPEECH_RATE } from "@/lib/speech-rate";
import { inputClass } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { SpeakButton } from "@/components/speak-button";
import { useConfirm } from "@/components/ui/confirm";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";
import type { LocalPassage } from "../service";
import { sceneOf } from "@/data/reading/scenes";
import { Cover } from "@/features/library/components/hub/parts";
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

/** Cỡ ô chữ (nút "Aa" đổi vòng): ô vuông và cỡ chữ Hán / pinyin trong ô. */
const CELL = [
  { cell: 44, zh: 24, py: 10 },
  { cell: 52, zh: 29, py: 11 },
  { cell: 62, zh: 35, py: 12.5 },
] as const;

/** Một ô trên giấy ô vuông: chữ Hán (hoặc dấu câu) ở giữa, pinyin nhỏ phía trên khi bật. */
function GridCell({
  ch,
  py,
  pinyin,
  size,
  keyword,
  speaker,
}: {
  ch: string;
  py: string | null;
  pinyin: boolean;
  size: number;
  keyword?: boolean;
  speaker?: boolean;
}) {
  const c = CELL[size]!;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex shrink-0 flex-col items-center justify-end border-r border-b border-[#E8EEF5]",
        speaker && "text-blue-700",
      )}
      style={{ width: speaker ? c.cell * 1.2 : c.cell, height: c.cell + (pinyin ? c.py + 6 : 0) }}
    >
      {pinyin && py ? (
        <span data-pinyin-line className="absolute top-1 text-text-2" style={{ fontSize: c.py, lineHeight: 1 }}>
          {py}
        </span>
      ) : null}
      <span
        className={cn("flex items-center justify-center hanzi font-bold", keyword ? "text-[#B45309]" : "text-navy-900")}
        style={{ fontSize: speaker ? c.zh * 0.7 : c.zh, height: c.cell, lineHeight: 1 }}
      >
        {ch}
      </span>
    </span>
  );
}

export function Reader({
  passage,
  nav,
}: {
  passage: Passage;
  nav: { index: number; total: number; prev: string | null; next: string | null };
}) {
  const t = useT();
  const router = useRouter();
  const [confirm, confirmNode] = useConfirm();
  const [pinyin, setPinyin] = React.useState(true);
  const [showTr, setShowTr] = React.useState(true);
  const [saved, setSaved] = React.useState(passage.saved);
  const [card, setCard] = React.useState<{ word: Word; x: number; y: number; above: boolean } | null>(null);
  const [answers, setAnswers] = React.useState<(number | string | null)[]>(() => passage.questions.map(() => null));
  const [result, setResult] = React.useState<Result | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [speed, setSpeed] = React.useState(1);
  const [size, setSize] = React.useState(0);
  const [wide, setWide] = React.useState(false);
  const [hint, setHint] = React.useState(false);
  const [wordsOpen, setWordsOpen] = React.useState(false);
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
  const navBtn =
    "inline-flex size-10 shrink-0 items-center justify-center rounded-[12px] border border-border bg-white text-navy-900 outline-none hover:bg-blue-50 focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-5";
  const scene = sceneOf(passage.id);
  const openCard = (w: Word, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    // Không đủ chỗ phía dưới (thanh tab dưới đáy trên điện thoại) → mở thẻ phía trên chữ.
    const above = window.innerHeight - r.bottom < 260;
    setCard({ word: w, x: r.left + r.width / 2, y: above ? r.top : r.bottom, above });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Thanh trên: ‹ Bài đọc n: 标题 n/N › · Nghe mẫu · tốc độ · cỡ chữ · pinyin · bản dịch · Từ vựng · Lưu bài */}
      <div className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-border bg-white/92 p-3 shadow-card xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link
            href={nav.prev ? `/reading/${nav.prev}` : "/reading"}
            aria-label={nav.prev ? t("reading.prevPassage") : t("reading.back")}
            className={navBtn}
          >
            <ChevronLeft />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-[17px] font-bold text-navy-900">{t("reading.passageN", { n: nav.index })}:</span>
              <h1
                id="rd-title"
                lang="zh"
                className="hanzi text-[24px] leading-tight font-extrabold text-navy-900 md:text-[28px]"
              >
                {passage.title}
              </h1>
              <span className="text-[14px] text-text-2">
                {passage.titleTr} · HSK {passage.level} · {t(`reading.types.${passage.type}`)}
              </span>
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[13px] font-semibold text-text-2 tabular-nums">
                {nav.index} / {nav.total}
              </span>
              <span className="h-1.5 w-[140px] overflow-hidden rounded-full bg-[#E3ECF7]">
                <span
                  className="block h-full rounded-full bg-blue-600"
                  style={{ width: `${(nav.index / Math.max(1, nav.total)) * 100}%` }}
                />
              </span>
            </div>
          </div>
          {nav.next ? (
            <Link href={`/reading/${nav.next}`} aria-label={t("reading.nextPassage")} className={navBtn}>
              <ChevronRight />
            </Link>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SpeakButton
            text={passage.lines.map((l) => l.zh).join("")}
            rate={SPEECH_RATE.normal * speed}
            label={t("reading.listenAll")}
            className="h-10 w-auto gap-2 rounded-[12px] border border-[#CFE3F7] bg-blue-50 px-3.5 text-[14.5px] font-semibold hover:bg-blue-100"
          >
            {t("reading.listenAll")}
          </SpeakButton>
          <label>
            <span className="sr-only">{t("reading.speed")}</span>
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="h-10 rounded-[12px] border border-border bg-white px-2.5 text-[14px] font-semibold text-navy-900"
            >
              {[0.75, 1, 1.25].map((v) => (
                <option key={v} value={v}>
                  {v.toFixed(v === 1 ? 1 : 2)}x
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setSize((x) => (x + 1) % CELL.length)}
            aria-label={t("reading.fontSize")}
            title={t("reading.fontSize")}
            className="inline-flex h-10 min-w-10 items-center justify-center rounded-[12px] border border-border bg-white px-2.5 text-[16px] font-bold text-navy-900 hover:bg-blue-50"
          >
            A<span className="text-[12px]">a</span>
          </button>
          {[
            { v: pinyin, set: setPinyin, label: t("reading.showPinyin") },
            { v: showTr, set: setShowTr, label: t("reading.showTranslation") },
          ].map((o) => (
            <label
              key={o.label}
              className="relative flex min-h-10 cursor-pointer items-center gap-2 rounded-[12px] border border-border bg-white px-3 text-[14px] font-semibold text-text shadow-sm"
            >
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
              {o.label}
            </label>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={() => setWordsOpen(true)}>
            <Lightbulb className="text-amber" />
            {t("reading.keyWordsShort")}
          </Button>
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

      <div
        className={cn(
          "grid grid-cols-[minmax(0,1fr)] items-start gap-4",
          !wide && "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]",
        )}
      >
        <article
          aria-labelledby="rd-title"
          className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-border bg-white p-3 shadow-card md:p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 rounded-[12px] bg-[#FFF3D6] px-3 py-1.5 text-[15px] font-bold text-[#8A5A00]">
              <BookOpen className="size-[18px] text-blue-600" aria-hidden="true" />
              {t("reading.passageLabel")}
            </span>
            <button
              type="button"
              onClick={() => setWide((w) => !w)}
              aria-pressed={wide}
              aria-label={wide ? t("reading.collapse") : t("reading.expand")}
              title={wide ? t("reading.collapse") : t("reading.expand")}
              className="hidden size-10 items-center justify-center rounded-[12px] text-text-2 hover:bg-blue-50 hover:text-blue-600 lg:inline-flex"
            >
              {wide ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
            </button>
          </div>

          <figure
            aria-label={t("reading.illustration")}
            className="overflow-hidden rounded-[16px] border border-border"
          >
            <Cover
              emoji={scene.main}
              tone={scene.tone}
              size="lg"
              className="h-[180px] w-full text-[100px] md:h-[230px]"
            />
            {scene.extras.length ? (
              <div
                aria-hidden="true"
                className="flex justify-center gap-4 border-t border-border bg-white py-2 text-[30px]"
              >
                {scene.extras.map((e, i) => (
                  <span key={i}>{e}</span>
                ))}
              </div>
            ) : null}
          </figure>

          {/* Bài đọc chép trên giấy ô vuông: mỗi chữ / dấu câu một ô, mỗi câu bắt đầu dòng mới. */}
          <ol
            lang="zh"
            className="overflow-hidden rounded-[12px] border border-[#E3EAF3] bg-[#FDFEFF]"
            style={{ ["--c" as string]: `${CELL[size]!.cell}px` } as React.CSSProperties}
          >
            {passage.lines.map((l, i) => (
              <li key={i} className="border-b border-[#E3EAF3] last:border-b-0">
                <div className="flex items-stretch">
                  <div className="min-w-0 flex-1 bg-[linear-gradient(to_right,#E8EEF5_1px,transparent_1px)] bg-[length:var(--c)_100%]">
                    <span className="sr-only">
                      {l.s ? `${l.s}: ` : ""}
                      {l.zh}
                    </span>
                    <p aria-hidden={false} className="flex flex-wrap">
                      {l.s ? <GridCell ch={`${l.s}:`} py={null} pinyin={pinyin} size={size} speaker /> : null}
                      {segment(l.zh, l.py, passage.words).map((sg, j) =>
                        sg.word ? (
                          <button
                            key={j}
                            type="button"
                            onClick={(e) => openCard(sg.word!, e.currentTarget)}
                            aria-label={t("reading.wordCard", { word: sg.word.zh })}
                            className="flex flex-wrap bg-[#FFF3C4] outline-none hover:bg-[#FFE9A0] focus-visible:shadow-[var(--focus-ring)]"
                          >
                            {sg.text.map((c, k) => (
                              <GridCell key={k} ch={c.ch} py={c.py} pinyin={pinyin} size={size} keyword />
                            ))}
                          </button>
                        ) : (
                          sg.text.map((c, k) => (
                            <GridCell key={`${j}-${k}`} ch={c.ch} py={c.py} pinyin={pinyin} size={size} />
                          ))
                        ),
                      )}
                    </p>
                  </div>
                  <SpeakButton text={l.zh} label={t("reading.listenLine")} className="m-1 self-center" />
                </div>
                {showTr ? (
                  <p className="border-t border-dashed border-[#E3EAF3] px-3 py-1.5 text-[14.5px] text-text-2">
                    {l.tr}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </article>

        <section
          aria-labelledby="rd-q"
          className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-border bg-white p-3 shadow-card md:p-4"
        >
          <div className="flex flex-wrap items-center gap-3">
            <h2
              id="rd-q"
              className="inline-flex items-center gap-2 rounded-[12px] bg-[#FFE9EC] px-3 py-1.5 text-[16px] font-bold text-[#C42A42]"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-[#E0302F] text-[14px] text-white">
                ?
              </span>
              {t("reading.questions")}
            </h2>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-[14px] font-bold text-text-2 tabular-nums">
                {answered} / {passage.questions.length}
              </span>
              <div
                role="progressbar"
                aria-label={t("reading.progress")}
                aria-valuemin={0}
                aria-valuemax={passage.questions.length}
                aria-valuenow={answered}
                className="h-2 w-[100px] overflow-hidden rounded-full bg-[#E3ECF7]"
              >
                <div
                  className="h-full rounded-full bg-blue-600 transition-[width]"
                  style={{ width: `${(answered / Math.max(1, passage.questions.length)) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <ol className="flex flex-col gap-3">
            {passage.questions.map((q, i) => {
              const r = result?.results[i];
              return (
                <li
                  key={i}
                  className={cn(
                    "@container rounded-2xl border p-3",
                    r
                      ? r.correct
                        ? "border-green-100 bg-green-50/60"
                        : "border-red-100 bg-red-50/50"
                      : "border-transparent bg-[#F5F8FD]",
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#DCEBFF] text-[14px] font-bold text-blue-700">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="sr-only">{t("reading.questionN", { n: i + 1 })}: </span>
                      {pinyin ? <p className="text-[13.5px] text-text-2">{q.py}</p> : null}
                      <p lang="zh" className="hanzi text-[19px] font-bold text-navy-900">
                        {q.zh}
                      </p>
                      {showTr || hint ? <p className="text-[14px] text-text-2">{q.tr}</p> : null}
                    </div>
                  </div>
                  <div className="mt-2 pl-0 @md:pl-9">
                    {q.kind === "choice" ? (
                      <div
                        role="radiogroup"
                        aria-label={`${t("reading.questionN", { n: i + 1 })}: ${t("reading.choose")}`}
                        className={cn(
                          "grid gap-2",
                          q.options!.length === 4 ? "@md:grid-cols-2 @3xl:grid-cols-4" : "@md:grid-cols-3",
                        )}
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
                                "flex min-h-12 items-center gap-2.5 rounded-[14px] border-[1.5px] bg-white px-2.5 py-1.5 text-left outline-none focus-visible:[box-shadow:var(--focus-ring)] disabled:cursor-default",
                                right
                                  ? "border-green"
                                  : on
                                    ? r
                                      ? "border-red"
                                      : "border-blue-600 bg-blue-50"
                                    : "border-border hover:border-[#A9D3F8]",
                              )}
                            >
                              <span
                                className={cn(
                                  "flex size-8 shrink-0 items-center justify-center rounded-full text-[14px] font-bold",
                                  on && !r ? "bg-blue-600 text-white" : "bg-[#EEF4FB] text-text-2",
                                )}
                              >
                                {String.fromCharCode(65 + j)}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span lang="zh" className="block hanzi text-[17px] font-bold text-navy-900">
                                  {o}
                                </span>
                                {pinyin && q.optionInfo?.[j]?.py ? (
                                  <span className="block text-[12.5px] leading-snug text-text-2">
                                    {q.optionInfo[j]!.py}
                                  </span>
                                ) : null}
                                {(showTr || hint) && q.optionInfo?.[j]?.meaning ? (
                                  <span className="block text-[12.5px] leading-snug text-text-2">
                                    {q.optionInfo[j]!.meaning}
                                  </span>
                                ) : null}
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
                        className={cn(inputClass, "bg-white text-[17px]")}
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
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="mt-1 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <Button type="button" variant="secondary" size="sm" onClick={() => setHint((h) => !h)} aria-pressed={hint}>
              <Lightbulb className="text-amber" />
              {t("reading.hint")}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={retry}>
              <RotateCcw />
              {t("reading.retry")}
            </Button>
            {!result ? (
              <Button variant="primary" className="ml-auto max-sm:w-full" onClick={submit} disabled={!!busy}>
                {busy === "submit" ? <Loader2 className="animate-spin" /> : <Send />}
                {busy === "submit" ? t("reading.submitting") : t("reading.submit")}
                <ChevronRight />
              </Button>
            ) : null}
          </div>
        </section>
      </div>

      <Dialog open={wordsOpen} onOpenChange={setWordsOpen}>
        <DialogContent title={t("reading.keyWords")} icon={<Lightbulb />} wide>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
            {passage.words.map((w) => (
              <li key={w.zh} className="flex items-start gap-2 rounded-[14px] bg-[#FFF6DA] px-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] text-text-2">{w.py}</span>
                  <span lang="zh" className="block hanzi text-[20px] font-bold text-[#C2410C]">
                    {w.zh}
                  </span>
                  <span className="block text-[13px] text-text-2">{w.meaning}</span>
                </span>
                <button
                  type="button"
                  onClick={() => saveWord(w)}
                  aria-label={t("reading.saveWordN", { word: w.zh })}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-blue-600 hover:bg-white"
                >
                  <BookmarkPlus className="size-5" />
                </button>
              </li>
            ))}
          </ul>
          <DialogActions>
            <Button type="button" variant="secondary" onClick={saveAll} disabled={!!busy}>
              {busy === "all" ? <Loader2 className="animate-spin" /> : <BookmarkPlus />}
              {t("reading.saveAll")}
            </Button>
            <DialogClose asChild>
              <Button variant="solid">{t("common.close")}</Button>
            </DialogClose>
          </DialogActions>
        </DialogContent>
      </Dialog>

      {card ? (
        <div
          role="dialog"
          aria-label={t("reading.wordCard", { word: card.word.zh })}
          style={{
            left: Math.min(Math.max(card.x, 150), window.innerWidth - 150),
            top: card.above ? card.y - 8 : card.y + 8,
          }}
          className={cn(
            "fixed z-[70] w-[280px] -translate-x-1/2 rounded-[16px] border border-[#F6DE9E] bg-white p-3.5 shadow-card",
            card.above && "-translate-y-full",
          )}
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
