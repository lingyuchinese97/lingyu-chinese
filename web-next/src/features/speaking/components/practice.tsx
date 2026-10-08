"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Loader2,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  PenLine,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { SpeakButton } from "@/components/speak-button";
import { InkLayer, InkTools, type Ink, type Stroke } from "@/components/ink-layer";
import { toast } from "@/components/ui/toaster";
import { SPEECH_RATE } from "@/lib/speech-rate";
import { SPEAKING } from "@/lib/limits";
import { tagColors } from "@/lib/tag-style";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";
import { assistAction, checkAnswerAction, saveAnswerAction, setStarredAction, updateQuestionAction } from "../actions";
import type { Feedback, QuestionDetail } from "../service";

/* Web Speech API (nhận dạng giọng nói) — chưa có trong lib.dom của TypeScript. */
type Recog = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult:
    ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
const getRecognition = (): (new () => Recog) | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recog; webkitSpeechRecognition?: new () => Recog };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

const hasHan = (s: string) => /\p{Script=Han}/u.test(s);

/** Gợi ý trả lời (không có đáp án mẫu): đổi chủ ngữ 你 → 我, từ khoá nên dùng lại. */
function hintOf(zh: string) {
  const start = zh.startsWith("你们") ? "我们…" : zh.includes("你") ? "我…" : zh.slice(0, 2) + "…";
  const stop = "你我他她们的是吗呢什么么怎样哪儿里谁几多？?，,。";
  const words: string[] = [];
  const text = zh.replace(/[？?。，,！!]/g, "");
  for (const w of text.split(/你|吗|呢|什么|怎么样|怎么|哪儿|哪里|谁|几|多少/)) {
    const k = [...w].filter((c) => hasHan(c) && !stop.includes(c)).join("");
    if (k.length >= 1) words.push(k);
  }
  return { start, words: [...new Set(words)].slice(0, 4) };
}

type QFields = { zh: string; pinyin: string; meaning: string; hsk: number | null; tags: string[] };

/**
 * Màn C — luyện trả lời một câu hỏi (cột phải trên màn rộng, theo design). Mọi phần đều sửa được: câu hỏi (chữ Hán, pinyin,
 * nghĩa, HSK, tag), câu trả lời trên vở ô ly, pinyin + nghĩa của câu trả lời (tự sinh, sửa tay được). Câu trả lời tự lưu;
 * chuyển câu trước / sau lưu trước nên không mất bài. `qs`: bộ lọc của danh sách (giữ nguyên khi chuyển câu).
 */
export function Practice({ q, knownTags, qs = "" }: { q: QuestionDetail; knownTags: string[]; qs?: string }) {
  const t = useT();
  const router = useRouter();
  const [qf, setQf] = React.useState<QFields>({
    zh: q.zh,
    pinyin: q.pinyin,
    meaning: q.meaning,
    hsk: q.hsk,
    tags: q.tags,
  });
  const [editQ, setEditQ] = React.useState<QFields | null>(null);
  const [answer, setAnswer] = React.useState(q.answer);
  const [pinyin, setPinyin] = React.useState(q.answerPinyin);
  const [meaning, setMeaning] = React.useState(q.answerMeaning);
  const [manual, setManual] = React.useState({ pinyin: false, meaning: false });
  const [saved, setSaved] = React.useState({ answer: q.answer, pinyin: q.answerPinyin, meaning: q.answerMeaning });
  const [saving, setSaving] = React.useState(false);
  const [feedback, setFeedback] = React.useState<Feedback | null>(q.feedback);
  const [checking, setChecking] = React.useState(false);
  const [showPinyin, setShowPinyin] = React.useState(true);
  const [showMeaning, setShowMeaning] = React.useState(true);
  const [wide, setWide] = React.useState(false);
  const [hint, setHint] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);
  const [starred, setStarred] = React.useState(q.starred);
  const [tagInput, setTagInput] = React.useState<string | null>(null);
  const [rec, setRec] = React.useState<Recog | null>(null);
  const [pen, setPen] = React.useState(false);
  const [ink, setInk] = React.useState<Ink>("yellow");
  const [strokes, setStrokes] = React.useState<Stroke[]>([]);
  const inFlight = React.useRef<Promise<unknown> | null>(null);

  const dirty =
    answer.trim() !== saved.answer ||
    (manual.pinyin && pinyin.trim() !== saved.pinyin) ||
    (manual.meaning && meaning.trim() !== saved.meaning);

  /** Lưu câu trả lời (+ pinyin / nghĩa nếu người học tự sửa). Dùng trước khi chuyển câu để không mất bài. */
  const flush = React.useCallback(async () => {
    if (!dirty) return true;
    setSaving(true);
    const v = answer.trim();
    const p = saveAnswerAction(q.id, {
      answer: v,
      ...(manual.pinyin && v ? { answerPinyin: pinyin.trim() } : {}),
      ...(manual.meaning && v ? { answerMeaning: meaning.trim() } : {}),
    });
    inFlight.current = p;
    const r = await p;
    if (inFlight.current === p) setSaving(false);
    if (!r.ok) {
      toast.error(r.message);
      return false;
    }
    setSaved({ answer: r.data.answer, pinyin: r.data.answerPinyin, meaning: r.data.answerMeaning });
    if (!manual.pinyin || !v) setPinyin(r.data.answerPinyin);
    if (!manual.meaning || !v) setMeaning(r.data.answerMeaning);
    if (r.data.changed) setFeedback(null);
    return true;
  }, [dirty, answer, pinyin, meaning, manual, q.id]);
  // Tự lưu khi ngừng gõ (câu trả lời đổi → sinh lại pinyin + nghĩa).
  React.useEffect(() => {
    if (!dirty) return;
    const h = setTimeout(() => void flush(), 900);
    return () => clearTimeout(h);
  }, [dirty, flush]);

  async function goTo(href: string) {
    if (await flush()) router.push(href, { scroll: false });
  }
  async function check() {
    const v = answer.trim();
    if (!v || !hasHan(v)) return void toast.error(t("speaking.needAnswer"));
    if (!(await flush())) return;
    setChecking(true);
    const r = await checkAnswerAction(q.id, v);
    setChecking(false);
    if (!r.ok) return void toast.error(r.message);
    setFeedback(r.data.feedback);
    requestAnimationFrame(() =>
      document.getElementById("sp-feedback")?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
    );
  }
  async function toggleStar() {
    const r = await setStarredAction(q.id, !starred);
    if (!r.ok) return void toast.error(r.message);
    setStarred(r.data.starred);
    router.refresh();
  }
  async function saveQuestion(next: QFields) {
    const r = await updateQuestionAction(q.id, next);
    if (!r.ok) {
      toast.error(r.message);
      return false;
    }
    setQf({ zh: r.data.zh, pinyin: r.data.pinyin, meaning: r.data.meaning, hsk: r.data.hsk, tags: r.data.tags });
    return true;
  }
  async function autoFillQuestion() {
    if (!editQ?.zh.trim()) return;
    const r = await assistAction(editQ.zh);
    if (!r.ok) return void toast.error(r.message);
    setEditQ((e) => (e ? { ...e, pinyin: r.data.pinyin, meaning: r.data.meaning } : e));
  }
  function record() {
    if (rec) return rec.stop();
    const R = getRecognition();
    if (!R) return void toast.error(t("speaking.noMic"));
    const r = new R();
    r.lang = "zh-CN";
    r.interimResults = false;
    r.continuous = false;
    const base = answer;
    r.onresult = (e) => {
      let txt = "";
      for (let i = e.resultIndex; i < e.results.length; i++)
        if (e.results[i]!.isFinal) txt += e.results[i]![0].transcript;
      if (txt) {
        setAnswer((base + txt).slice(0, SPEAKING.MAX_ANSWER));
        setManual({ pinyin: false, meaning: false });
      }
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") toast.error(t("speaking.micDenied"));
    };
    r.onend = () => setRec(null);
    setRec(r);
    r.start();
  }

  const nav = q.nav;
  const rate = SPEECH_RATE.normal * speed;
  const h = hintOf(qf.zh);
  const generating = saving && answer.trim() !== saved.answer;
  const navBtn =
    "inline-flex size-10 shrink-0 items-center justify-center rounded-[12px] border border-border bg-white text-navy-900 outline-none hover:bg-blue-50 focus-visible:shadow-[var(--focus-ring)] disabled:opacity-40 [&_svg]:size-5";
  const tool =
    "inline-flex h-11 items-center gap-2 rounded-[12px] border border-border bg-white px-4 text-[14.5px] font-semibold text-navy-900 outline-none hover:bg-blue-50 focus-visible:shadow-[var(--focus-ring)] disabled:opacity-50 [&_svg]:size-[18px]";
  const field =
    "w-full rounded-[12px] border border-border bg-white px-3.5 py-2.5 text-[15.5px] text-navy-900 outline-none focus:border-blue-600 focus-visible:shadow-[var(--focus-ring)]";
  const toggles = [
    { v: showPinyin, set: setShowPinyin, label: t("speaking.showPinyin"), badge: "ā", c: "bg-[#E6F1FF] text-blue-700" },
    {
      v: showMeaning,
      set: setShowMeaning,
      label: t("speaking.showMeaning"),
      badge: "VI",
      c: "bg-[#EEE8FF] text-[#6D4FD8]",
    },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-white/95 p-3 shadow-card md:p-4">
      {/* Thanh trên: ← Câu hỏi n / N → · Nghe câu hỏi · tốc độ · Đánh dấu · Bút highlight · Lưu */}
      <div className="@container">
        <div className="flex flex-col gap-2.5 @[44rem]:flex-row @[44rem]:items-center @[44rem]:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => goTo(nav.prev ? `/speaking/${nav.prev}${qs}` : `/speaking${qs}`)}
              aria-label={nav.prev ? t("speaking.prevQuestion") : t("speaking.backToList")}
              className={navBtn}
            >
              {nav.prev ? <ArrowLeft /> : <ChevronLeft />}
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-3 px-1">
              <span className="text-[18px] font-extrabold whitespace-nowrap text-navy-900">
                {t("speaking.questionOf", { n: nav.index })}
                <span className="font-semibold text-text-3"> / {nav.total}</span>
              </span>
              <span
                role="progressbar"
                aria-label={t("speaking.progress", { n: nav.index, total: nav.total })}
                aria-valuemin={1}
                aria-valuemax={nav.total}
                aria-valuenow={nav.index}
                className="block h-1.5 w-full max-w-[130px] min-w-[60px] overflow-hidden rounded-full bg-[#E3ECF7]"
              >
                <span
                  className="block h-full rounded-full bg-blue-600"
                  style={{ width: `${(nav.index / Math.max(1, nav.total)) * 100}%` }}
                />
              </span>
            </div>
            <button
              type="button"
              disabled={!nav.next}
              onClick={() => nav.next && goTo(`/speaking/${nav.next}${qs}`)}
              aria-label={t("speaking.nextQuestion")}
              className={navBtn}
            >
              <ChevronRight />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SpeakButton
              text={qf.zh}
              rate={rate}
              label={t("speaking.listen")}
              className="h-10 w-auto gap-2 rounded-[12px] border border-[#CFE3F7] bg-blue-50 px-3 text-[14px] font-semibold hover:bg-blue-100"
            >
              {t("speaking.listen")}
            </SpeakButton>
            <label>
              <span className="sr-only">{t("speaking.speed")}</span>
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
              onClick={toggleStar}
              aria-pressed={starred}
              className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-border bg-white px-3 text-[14px] font-semibold text-navy-900 hover:bg-amber-50"
            >
              <Star
                className={cn("size-[18px]", starred ? "fill-amber text-amber" : "text-amber")}
                aria-hidden="true"
              />
              {t("speaking.starQuestion")}
            </button>
          </div>
        </div>
      </div>

      {/* Câu hỏi — sửa ngay tại chỗ (chữ Hán, pinyin, nghĩa, HSK). */}
      <section
        aria-labelledby="sp-q"
        className="relative isolate overflow-hidden rounded-[20px] border border-[#D3E8F8] bg-[linear-gradient(110deg,#F4F9FF_0%,#E8F3FE_55%,#D9EDFD_100%)] px-5 py-5 md:px-7"
      >
        <Image
          unoptimized
          src="/brand/hero/mascot-reading.webp"
          alt=""
          aria-hidden="true"
          width={560}
          height={493}
          className="pointer-events-none absolute right-5 bottom-0 -z-10 hidden h-[88%] max-h-[124px] w-auto drop-shadow-[0_6px_10px_rgba(20,70,40,.16)] sm:block"
        />
        <Image
          unoptimized
          src="/brand/ui/deco-leaf.png"
          alt=""
          aria-hidden="true"
          width={57}
          height={68}
          className="pointer-events-none absolute right-[150px] bottom-2 -z-10 hidden w-7 -rotate-[30deg] opacity-70 sm:block"
        />
        {editQ ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (await saveQuestion(editQ)) {
                setEditQ(null);
                toast.success(t("speaking.updated"));
              }
            }}
            className="flex flex-col gap-2.5 sm:pr-36"
          >
            <h2 id="sp-q" className="text-[15px] font-bold text-navy-900">
              {t("speaking.editQuestion")}
            </h2>
            <label className="flex flex-col gap-1">
              <span className="text-[13.5px] font-semibold text-text-2">{t("speaking.zh")}</span>
              <input
                lang="zh"
                value={editQ.zh}
                maxLength={SPEAKING.MAX_ZH}
                onChange={(e) => setEditQ({ ...editQ, zh: e.target.value })}
                className={cn(field, "text-[19px] font-bold")}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[13.5px] font-semibold text-text-2">{t("speaking.pinyin")}</span>
              <input
                value={editQ.pinyin}
                maxLength={SPEAKING.MAX_PINYIN}
                onChange={(e) => setEditQ({ ...editQ, pinyin: e.target.value })}
                placeholder={t("speaking.pinyinPlaceholder")}
                className={field}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[13.5px] font-semibold text-text-2">{t("speaking.meaning")}</span>
              <input
                value={editQ.meaning}
                maxLength={SPEAKING.MAX_MEANING}
                onChange={(e) => setEditQ({ ...editQ, meaning: e.target.value })}
                placeholder={t("speaking.meaningPlaceholder")}
                className={field}
              />
            </label>
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-[13.5px] font-semibold text-text-2">{t("speaking.hsk")}</span>
                <select
                  value={editQ.hsk ?? ""}
                  onChange={(e) => setEditQ({ ...editQ, hsk: e.target.value ? Number(e.target.value) : null })}
                  className={cn(field, "h-11 w-[130px] py-0")}
                >
                  <option value="">{t("speaking.hskNone")}</option>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      HSK{n}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={autoFillQuestion}
                className="inline-flex h-11 items-center gap-1.5 rounded-[12px] bg-[#F1EBFF] px-3 text-[14px] font-semibold text-[#5B3CC4] hover:bg-[#E7DEFF]"
              >
                <Sparkles className="size-4" aria-hidden="true" />
                {t("speaking.autoFill")}
              </button>
              <span className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditQ(null)}
                  className="inline-flex h-11 items-center rounded-[12px] border border-border bg-white px-4 text-[14.5px] font-semibold text-navy-900 hover:bg-blue-50"
                >
                  {t("speaking.cancel")}
                </button>
                <button
                  type="submit"
                  className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-[#1769C9] px-4 text-[14.5px] font-semibold text-white hover:bg-[#135AAD]"
                >
                  <Save className="size-[18px]" aria-hidden="true" />
                  {t("speaking.save")}
                </button>
              </span>
            </div>
          </form>
        ) : (
          <div className="sm:pr-36">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="sp-q"
                lang="zh"
                className="text-[26px] leading-tight font-extrabold tracking-wide text-navy-900 md:text-[30px]"
              >
                {qf.zh}
              </h2>
              <SpeakButton
                text={qf.zh}
                rate={rate}
                label={t("speaking.listen")}
                className="size-10 text-blue-600 [&_svg]:size-6"
              />
              <button
                type="button"
                onClick={() => setEditQ(qf)}
                aria-label={t("speaking.editQuestion")}
                title={t("speaking.editQuestion")}
                className="inline-flex size-9 items-center justify-center rounded-full text-blue-600 hover:bg-white/70"
              >
                <Pencil className="size-[18px]" />
              </button>
            </div>
            {showPinyin && qf.pinyin ? <p className="mt-1 text-[15.5px] text-pinyin">{qf.pinyin}</p> : null}
            {qf.meaning ? <p className="mt-1.5 text-[16.5px] text-navy/80">{qf.meaning}</p> : null}
          </div>
        )}
      </section>

      {/* Câu trả lời */}
      <section
        aria-labelledby="sp-a"
        className="flex flex-col gap-3 rounded-[18px] border border-border bg-white p-3 md:p-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2
            id="sp-a"
            className="inline-flex items-center gap-2 rounded-[10px] bg-[#FFF3D6] px-3 py-1.5 text-[14.5px] font-bold text-[#7A4E00]"
          >
            <PenLine className="size-[18px] text-[#E8A400]" aria-hidden="true" />
            {t("speaking.yourAnswer")}
          </h2>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            {toggles.map((o) => (
              <label
                key={o.label}
                className="relative flex min-h-10 cursor-pointer items-center gap-2 rounded-[12px] border border-border bg-white px-2.5 text-[13.5px] font-semibold text-text"
              >
                <input
                  type="checkbox"
                  checked={o.v}
                  onChange={(e) => o.set(e.target.checked)}
                  className="peer absolute inset-0 z-[1] size-full cursor-pointer opacity-0"
                />
                <span
                  aria-hidden="true"
                  className={cn("flex size-6 items-center justify-center rounded-[7px] text-[12px] font-bold", o.c)}
                >
                  {o.badge}
                </span>
                <span className="whitespace-nowrap">{o.label}</span>
                <span
                  aria-hidden="true"
                  className="relative h-6 w-11 rounded-full bg-[#CBD5E1] transition-colors peer-checked:bg-blue-600 peer-focus-visible:shadow-[var(--focus-ring)] after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"
                />
              </label>
            ))}
            <button
              type="button"
              onClick={() => setWide((w) => !w)}
              aria-pressed={wide}
              aria-label={wide ? t("speaking.collapse") : t("speaking.expand")}
              title={wide ? t("speaking.collapse") : t("speaking.expand")}
              className="inline-flex size-10 items-center justify-center rounded-[12px] text-text-2 hover:bg-blue-50 hover:text-blue-600"
            >
              {wide ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <InkTools
            pen={pen}
            setPen={setPen}
            ink={ink}
            setInk={setInk}
            strokes={strokes}
            setStrokes={setStrokes}
            compact
          />
          <button
            type="button"
            onClick={async () => (await flush()) && toast.success(t("speaking.answerSaved"))}
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-[12px] border border-[#CFE3F7] bg-white px-3 text-[14px] font-semibold text-blue-700 hover:bg-blue-50"
          >
            {saving ? <Loader2 className="size-[18px] animate-spin" /> : <Save className="size-[18px]" />}
            {t("speaking.saveAnswer")}
          </button>
        </div>

        <div className="relative">
          <textarea
            lang="zh"
            value={answer}
            maxLength={SPEAKING.MAX_ANSWER}
            onChange={(e) => {
              setAnswer(e.target.value);
              setManual({ pinyin: false, meaning: false });
            }}
            onBlur={() => void flush()}
            aria-label={t("speaking.answerLabel")}
            placeholder={t("speaking.answerPlaceholder")}
            spellCheck={false}
            className={cn(
              "block w-full resize-none rounded-[14px] border-[1.5px] border-[#E8E1CF] paper-lines text-[#1F2937] outline-none placeholder:text-[16px] placeholder:tracking-normal placeholder:text-text-3 focus-visible:border-blue focus-visible:shadow-[var(--focus-ring)]",
              wide ? "h-[440px]" : "h-[220px]",
            )}
          />
          <InkLayer strokes={strokes} setStrokes={setStrokes} pen={pen} ink={ink} />
          <span className="pointer-events-none absolute right-3 bottom-2 text-[13px] text-text-3 tabular-nums">
            {answer.length}/{SPEAKING.MAX_ANSWER}
          </span>
        </div>

        {showPinyin ? (
          <EditBox
            icon={<AudioLines className="size-5 text-blue-600" aria-hidden="true" />}
            title={t("speaking.answerPinyin")}
            note={manual.pinyin ? t("speaking.edited") : t("speaking.auto")}
            tone="bg-[#EAF3FF] text-blue-700"
            label={t("speaking.answerPinyinLabel")}
            value={pinyin}
            max={SPEAKING.MAX_PINYIN}
            busy={generating && !manual.pinyin}
            onChange={(v) => {
              setPinyin(v);
              setManual((m) => ({ ...m, pinyin: true }));
            }}
            onBlur={() => void flush()}
            speak={<SpeakButton text={saved.answer || answer} rate={rate} label={t("speaking.listenAnswer")} />}
          />
        ) : null}
        {showMeaning ? (
          <EditBox
            icon={<PenLine className="size-5 text-[#6D4FD8]" aria-hidden="true" />}
            title={t("speaking.answerMeaning")}
            note={manual.meaning ? t("speaking.edited") : t("speaking.auto")}
            tone="bg-[#F1EBFF] text-[#5B3CC4]"
            label={t("speaking.answerMeaningLabel")}
            value={meaning}
            max={SPEAKING.MAX_MEANING}
            busy={generating && !manual.meaning}
            onChange={(v) => {
              setMeaning(v);
              setManual((m) => ({ ...m, meaning: true }));
            }}
            onBlur={() => void flush()}
            speak={<SpeakButton text={meaning} voice="vi" label={t("speaking.listenMeaning")} />}
          />
        ) : null}

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={record}
            aria-pressed={!!rec}
            className={cn(tool, "border-[#BFD9F5] bg-[#F3F8FF] text-blue-700", rec && "border-red bg-red-50 text-red")}
          >
            {rec ? <MicOff /> : <Mic />}
            {rec ? t("speaking.recording") : t("speaking.record")}
          </button>
          <SpeakButton
            text={saved.answer || answer}
            rate={rate}
            label={t("speaking.listenAnswer")}
            className={cn(tool, "w-auto [&>svg:first-child]:hidden")}
          >
            <Play className="size-[18px] fill-blue-600 text-blue-600" aria-hidden="true" />
            {t("speaking.replay")}
          </SpeakButton>
          <button type="button" onClick={() => setHint((x) => !x)} aria-pressed={hint} className={tool}>
            <Lightbulb className="text-amber" />
            {t("speaking.hint")}
          </button>
          <button
            type="button"
            onClick={() => {
              setAnswer("");
              setManual({ pinyin: false, meaning: false });
              setFeedback(null);
            }}
            className={tool}
          >
            <RotateCcw />
            {t("speaking.retry")}
          </button>
          <button
            type="button"
            onClick={check}
            disabled={checking}
            className="ml-auto inline-flex h-12 min-w-[200px] items-center justify-between gap-3 rounded-[12px] bg-[#1769C9] px-5 text-[15.5px] font-semibold text-white shadow-[0_6px_14px_rgba(23,105,201,.28)] outline-none hover:bg-[#135AAD] focus-visible:shadow-[var(--focus-ring)] disabled:opacity-60 max-sm:w-full"
          >
            <span className="inline-flex items-center gap-2">
              {checking ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : null}
              {checking ? t("speaking.checking") : t("speaking.check")}
            </span>
            <ArrowRight className="size-5" aria-hidden="true" />
          </button>
        </div>

        {hint ? (
          <div
            role="note"
            className="rounded-[14px] border border-[#F6DE9E] bg-[#FFF9EA] px-4 py-3 text-[14.5px] text-text"
          >
            <p className="font-bold text-[#8A5300]">{t("speaking.hintTitle")}</p>
            <p className="mt-1">{t("speaking.hintStart", { start: h.start })}</p>
            {h.words.length ? <p lang="zh">{t("speaking.hintWords", { words: h.words.join("、") })}</p> : null}
            <p>{t("speaking.hintEnd")}</p>
          </div>
        ) : null}

        {feedback ? <FeedbackBox f={feedback} rate={rate} /> : null}
      </section>

      {/* Tag: + Thêm tag · HSK × · tag × */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        <span className="mr-1 text-[15px] font-bold text-navy-900">{t("speaking.tagsLabel")}</span>
        {tagInput === null ? (
          <button
            type="button"
            onClick={() => setTagInput("")}
            className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-border bg-white px-3 text-[14px] font-semibold text-blue-700 hover:bg-blue-50"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t("speaking.addTag")}
          </button>
        ) : (
          <input
            autoFocus
            value={tagInput}
            list="sp-known-tags"
            aria-label={t("speaking.addTag")}
            placeholder={t("speaking.tagPlaceholder")}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setTagInput(null);
              if (e.key !== "Enter") return;
              e.preventDefault();
              const v = tagInput.trim().slice(0, SPEAKING.MAX_TAG);
              setTagInput(null);
              if (v && !qf.tags.some((x) => x.toLowerCase() === v.toLowerCase()))
                void saveQuestion({ ...qf, tags: [...qf.tags, v] });
            }}
            onBlur={() => setTagInput(null)}
            className="h-9 w-[180px] rounded-[10px] border border-blue-600 px-2.5 text-[14px] outline-none"
          />
        )}
        <datalist id="sp-known-tags">
          {knownTags.map((x) => (
            <option key={x} value={x} />
          ))}
        </datalist>
        {qf.hsk ? (
          <Pill
            text={`HSK${qf.hsk}`}
            style={tagColors("HSK")}
            removeLabel={t("speaking.removeHsk", { hsk: `HSK${qf.hsk}` })}
            onRemove={() => saveQuestion({ ...qf, hsk: null })}
          />
        ) : null}
        {qf.tags.map((tg) => (
          <Pill
            key={tg}
            text={tg}
            style={tagColors(tg)}
            removeLabel={t("speaking.removeTag", { tag: tg })}
            onRemove={() => saveQuestion({ ...qf, tags: qf.tags.filter((x) => x !== tg) })}
          />
        ))}
      </div>

      {/* Điện thoại: danh sách nằm ở trang riêng → nút quay lại + câu tiếp theo. */}
      <div className="flex items-center justify-between gap-3 2xl:hidden">
        <Link
          href={`/speaking${qs}`}
          onClick={(e) => {
            e.preventDefault();
            void goTo(`/speaking${qs}`);
          }}
          className="inline-flex h-12 items-center gap-2 rounded-[14px] border border-border bg-white px-4 font-semibold text-navy-900 hover:bg-blue-50"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
          {t("speaking.backToList")}
        </Link>
        {nav.next ? (
          <button
            type="button"
            onClick={() => goTo(`/speaking/${nav.next}${qs}`)}
            className="inline-flex h-12 items-center gap-2 rounded-[14px] bg-blue-600 px-5 font-semibold text-white shadow-soft hover:bg-blue-700"
          >
            {t("speaking.nextQuestion")}
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Pill({
  text,
  style,
  removeLabel,
  onRemove,
}: {
  text: string;
  style: React.CSSProperties;
  removeLabel: string;
  onRemove: () => void;
}) {
  return (
    <span
      className="inline-flex h-9 items-center gap-1.5 rounded-[10px] pr-1.5 pl-3 text-[14px] font-semibold"
      style={style}
    >
      {text}
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="inline-flex size-6 items-center justify-center rounded-full hover:bg-black/5"
      >
        <X className="size-3.5" />
      </button>
    </span>
  );
}

/** Ô pinyin / nghĩa của câu trả lời: tự sinh, người học sửa tay được (có đếm ký tự và loa). */
function EditBox({
  icon,
  title,
  note,
  tone,
  label,
  value,
  max,
  busy,
  onChange,
  onBlur,
  speak,
}: {
  icon: React.ReactNode;
  title: string;
  note: string;
  tone: string;
  label: string;
  value: string;
  max: number;
  busy: boolean;
  onChange: (v: string) => void;
  onBlur: () => void;
  speak: React.ReactNode;
}) {
  return (
    <div className="rounded-[16px] border border-[#E1EAF5] bg-[#F7FAFE] p-2.5">
      <div className="flex items-center gap-2 px-1 pb-2">
        <span className={cn("inline-flex items-center gap-2 rounded-[10px] px-2.5 py-1 text-[15px] font-bold", tone)}>
          {icon}
          {title} <span className="font-semibold opacity-80">{note}</span>
        </span>
        {busy ? <Loader2 className="size-4 animate-spin text-text-3" aria-hidden="true" /> : null}
        <span className="ml-auto">{speak}</span>
      </div>
      <div className="relative">
        <textarea
          value={value}
          maxLength={max}
          rows={2}
          aria-label={label}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="block min-h-[64px] w-full resize-y rounded-[12px] border border-border bg-white px-4 pt-2.5 pb-6 text-[16px] text-navy-900 outline-none focus:border-blue-600 focus-visible:shadow-[var(--focus-ring)]"
        />
        <span className="pointer-events-none absolute right-3 bottom-1.5 text-[12.5px] text-text-3 tabular-nums">
          {value.length}/{max}
        </span>
      </div>
    </div>
  );
}

function FeedbackBox({ f, rate }: { f: Feedback; rate: number }) {
  const t = useT();
  const tone =
    f.verdict === "great"
      ? "bg-green-50 text-green-700 border-green-100"
      : f.verdict === "good"
        ? "bg-blue-50 text-blue-700 border-[#CFE3F7]"
        : "bg-amber-50 text-[#8A5300] border-[#F6DE9E]";
  return (
    <section
      id="sp-feedback"
      aria-labelledby="sp-fb"
      className="scroll-mt-24 rounded-[16px] border border-border bg-white p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 id="sp-fb" className="text-[16px] font-extrabold text-navy-900">
          {t("speaking.feedbackTitle")}
        </h3>
        <span className={cn("rounded-full border px-3 py-0.5 text-[14px] font-bold", tone)}>
          {t(`speaking.verdict.${f.verdict}`)}
        </span>
      </div>
      <p className="mt-2 text-[15px] text-text">{f.summary_vi}</p>
      {f.issues.length ? (
        <ul className="mt-2 flex flex-col gap-1.5">
          {f.issues.map((x, i) => (
            <li key={i} className="flex gap-2 text-[14.5px] text-text">
              <span className="shrink-0 rounded-[8px] bg-[#EEF4FB] px-2 py-0.5 text-[12.5px] font-bold text-navy-900">
                {t(`speaking.kinds.${x.kind}`)}
              </span>
              <span>{x.text_vi}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[14.5px] text-green-700">{t("speaking.noIssues")}</p>
      )}
      {f.corrected_zh && f.ai ? (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-[14.5px]">
          <span className="font-bold text-navy-900">{t("speaking.corrected")}:</span>
          <span lang="zh" className="[font-family:var(--font-paper)] text-[18px] text-navy-900">
            {f.corrected_zh}
          </span>
          <SpeakButton text={f.corrected_zh} rate={rate} />
        </p>
      ) : null}
      {f.better_zh ? (
        <p className="mt-1 flex flex-wrap items-center gap-2 text-[14.5px]">
          <span className="font-bold text-navy-900">{t("speaking.better")}:</span>
          <span lang="zh" className="[font-family:var(--font-paper)] text-[18px] text-navy-900">
            {f.better_zh}
          </span>
          <SpeakButton text={f.better_zh} rate={rate} />
        </p>
      ) : null}
      {!f.ai ? <p className="mt-3 text-[13.5px] text-text-2">{t("speaking.basicCheck")}</p> : null}
    </section>
  );
}
