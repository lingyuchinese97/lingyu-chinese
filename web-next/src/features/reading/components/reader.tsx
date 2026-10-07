"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  BookmarkCheck,
  BookmarkPlus,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Loader2,
  Maximize2,
  Minimize2,
  Highlighter,
  RotateCcw,
  SkipForward,
  Trash2,
  Undo2,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SPEECH_RATE } from "@/lib/speech-rate";
import { inputClass } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { SpeakButton } from "@/components/speak-button";
import { useConfirm } from "@/components/ui/confirm";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";
import type { LocalPassage } from "../service";
import { FeatureHero } from "@/components/feature-hero";
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

/** Một ô của giấy ô vuông: chữ Hán / dấu câu (hoặc trống), kèm âm tiết pinyin và từ khoá chứa nó. */
type Cell = { ch: string; py: string | null; word: Word | null; first: boolean; speaker?: boolean };
type Row = { kind: "cells"; cells: Cell[]; title?: boolean } | { kind: "tr"; text: string };

/** Ô vuông mục tiêu ~40px (điện thoại ~34px); số cột theo bề rộng tờ giấy (9–16 cột). */
const TARGET_CELL = 40;
/** Số dòng ô tối thiểu của trang giấy. */
const MIN_ROWS = 12;
const colsFor = (w: number) => Math.min(16, Math.max(9, Math.floor(w / (w < 480 ? 34 : TARGET_CELL))));

/** Xếp bài đọc lên giấy ô vuông: dòng đầu là tiêu đề căn giữa, mỗi câu bắt đầu một dòng mới, hết dòng thì xuống dòng. */
function layout(passage: Passage, cols: number, showTr: boolean): Row[] {
  const empty = (): Cell => ({ ch: "", py: null, word: null, first: false });
  const rows: Row[] = [];
  const push = (cells: Cell[], title = false) => {
    for (let i = 0; i < Math.max(1, cells.length); i += cols) {
      const part = cells.slice(i, i + cols);
      while (part.length < cols) part.push(empty());
      rows.push({ kind: "cells", cells: part, title });
    }
  };
  const title = [...passage.title].map((ch) => ({ ch, py: null, word: null, first: false }));
  const pad = Math.max(0, Math.floor((cols - title.length) / 2));
  push([...Array.from({ length: pad }, empty), ...title], true);
  for (const l of passage.lines) {
    const cells: Cell[] = l.s
      ? [...`${l.s}：`].map((ch) => ({ ch, py: null, word: null, first: false, speaker: true }))
      : [];
    for (const sg of segment(l.zh, l.py, passage.words))
      sg.text.forEach((c, k) => cells.push({ ch: c.ch, py: c.py, word: sg.word, first: k === 0 }));
    push(cells);
    if (showTr) rows.push({ kind: "tr", text: l.tr });
  }
  // Như trang vở: bài ngắn vẫn kẻ đủ ô đến hết trang.
  while (rows.filter((r) => r.kind === "cells").length < MIN_ROWS) push([]);
  return rows;
}

/** Màu bút highlight (dạ quang): nét to, trong, chữ bên dưới vẫn rõ. */
const INKS = [
  { key: "yellow", color: "#FFD43B" },
  { key: "green", color: "#69DB7C" },
  { key: "pink", color: "#FF8EC2" },
  { key: "blue", color: "#74C0FC" },
  { key: "orange", color: "#FFA94D" },
] as const;
type Ink = (typeof INKS)[number]["key"];
/** Nét vẽ: toạ độ chia theo bề rộng tờ giấy để giữ đúng chỗ khi đổi cỡ màn hình. */
type Stroke = { ink: Ink; pts: [number, number][] };

/** Lớp highlight trên tờ giấy: chỉ nhận chuột / chạm khi bật Bút highlight. */
function InkLayer({
  strokes,
  setStrokes,
  pen,
  ink,
}: {
  strokes: Stroke[];
  setStrokes: React.Dispatch<React.SetStateAction<Stroke[]>>;
  pen: boolean;
  ink: Ink;
}) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const drawing = React.useRef<Stroke | null>(null);
  const [box, setBox] = React.useState({ w: 0, h: 0 });

  React.useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const paint = React.useCallback(() => {
    const c = ref.current;
    if (!c || !box.w) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = box.w * dpr;
    c.height = box.h * dpr;
    const g = c.getContext("2d");
    if (!g) return;
    g.scale(dpr, dpr);
    g.lineCap = "round";
    g.lineJoin = "round";
    // Nét cao ~2/3 ô chữ; độ trong do cả lớp canvas đảm nhận (opacity + multiply) nên nét chồng nhau không đậm dần.
    g.lineWidth = Math.min(30, Math.max(14, box.w * 0.045));
    for (const s of drawing.current ? [...strokes, drawing.current] : strokes) {
      g.strokeStyle = INKS.find((i) => i.key === s.ink)?.color ?? INKS[0].color;
      g.beginPath();
      s.pts.forEach(([x, y], i) => (i ? g.lineTo(x * box.w, y * box.w) : g.moveTo(x * box.w, y * box.w)));
      if (s.pts.length === 1) g.lineTo(s.pts[0]![0] * box.w + 0.1, s.pts[0]![1] * box.w);
      g.stroke();
    }
  }, [strokes, box]);
  React.useEffect(paint, [paint]);

  const at = (e: React.PointerEvent): [number, number] => {
    const r = ref.current!.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.width];
  };
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      data-ink
      className={cn(
        "absolute inset-0 z-[2] size-full opacity-45 mix-blend-multiply",
        pen ? "cursor-crosshair touch-none" : "pointer-events-none",
      )}
      onPointerDown={(e) => {
        if (!pen) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        drawing.current = { ink, pts: [at(e)] };
        paint();
      }}
      onPointerMove={(e) => {
        if (!drawing.current) return;
        drawing.current.pts.push(at(e));
        paint();
      }}
      onPointerUp={() => {
        const s = drawing.current;
        drawing.current = null;
        if (s) setStrokes((x) => [...x, s]);
      }}
      onPointerCancel={() => {
        drawing.current = null;
        paint();
      }}
    />
  );
}

/** Tờ giấy ô vuông chép bài đọc (+ pinyin nhỏ trên đầu ô, bản dịch dưới mỗi câu khi bật). */
function Paper({
  passage,
  pinyin,
  showTr,
  onWord,
  children,
}: {
  passage: Passage;
  pinyin: boolean;
  showTr: boolean;
  onWord: (w: Word, el: HTMLElement) => void;
  children?: React.ReactNode;
}) {
  const t = useT();
  const ref = React.useRef<HTMLDivElement>(null);
  const [cols, setCols] = React.useState(12);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setCols(colsFor(el.clientWidth)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const rows = layout(passage, cols, showTr);
  return (
    <div ref={ref} lang="zh" className="@container relative">
      <ol className="sr-only">
        {passage.lines.map((l, i) => (
          <li key={i}>
            {l.s ? `${l.s}: ` : ""}
            {l.zh}
            {showTr ? ` — ${l.tr}` : ""}
          </li>
        ))}
      </ol>
      <div
        aria-label={t("reading.paper")}
        role="group"
        className="overflow-hidden border-t border-l border-[#DCE0E6] bg-white"
        style={{ ["--cols" as string]: cols } as React.CSSProperties}
      >
        {rows.map((r, i) =>
          r.kind === "tr" ? (
            <p
              key={i}
              lang="vi"
              className="border-r border-b border-[#DCE0E6] bg-[#FAFBFC] px-2.5 py-1 text-[13.5px] leading-snug text-text-2"
            >
              {r.text}
            </p>
          ) : (
            <div key={i} className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))]">
              {r.cells.map((c, j) => {
                const cell = (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative flex w-full items-end justify-center border-r border-b border-[#DCE0E6]",
                      pinyin ? "aspect-[4/5]" : "aspect-square",
                      c.speaker && "text-blue-700",
                    )}
                  >
                    {pinyin && c.py ? (
                      <span
                        data-pinyin-line
                        className="absolute top-[3%] text-[length:max(8px,calc(100cqw/var(--cols)*0.24))] leading-none text-text-2"
                      >
                        {c.py}
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "flex aspect-square w-full items-center justify-center hanzi [font-family:var(--font-paper)] leading-none",
                        r.title ? "kai-bold text-navy-900" : "font-normal! text-[#1F2937]",
                        c.speaker
                          ? "text-[length:calc(100cqw/var(--cols)*0.42)] font-bold text-blue-700"
                          : "text-[length:calc(100cqw/var(--cols)*0.62)]",
                      )}
                    >
                      {c.ch}
                    </span>
                  </span>
                );
                if (!c.word) return <React.Fragment key={j}>{cell}</React.Fragment>;
                // Chỉ ô đầu của từ khoá là nút cho trình đọc màn hình; các ô sau cùng mở thẻ nghĩa nhưng ẩn khỏi cây truy cập.
                return (
                  <button
                    key={j}
                    type="button"
                    onClick={(e) => onWord(c.word!, e.currentTarget)}
                    aria-label={c.first ? t("reading.wordCard", { word: c.word.zh }) : undefined}
                    aria-hidden={c.first ? undefined : true}
                    tabIndex={c.first ? undefined : -1}
                    className="block outline-none hover:bg-[#FFF3C4] focus-visible:bg-[#FFF3C4] focus-visible:shadow-[inset_0_0_0_2px_#2F80ED]"
                  >
                    {cell}
                  </button>
                );
              })}
            </div>
          ),
        )}
      </div>
      {children}
    </div>
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
  const [pinyin, setPinyin] = React.useState(false);
  const [showTr, setShowTr] = React.useState(false);
  const [saved, setSaved] = React.useState(passage.saved);
  const [card, setCard] = React.useState<{ word: Word; x: number; y: number; above: boolean } | null>(null);
  const [answers, setAnswers] = React.useState<(number | string | null)[]>(() => passage.questions.map(() => null));
  const [result, setResult] = React.useState<Result | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [speed, setSpeed] = React.useState(1);
  const [hint, setHint] = React.useState(false);
  const [wide, setWide] = React.useState(false);
  const [cur, setCur] = React.useState(0);
  const [pen, setPen] = React.useState(false);
  const [ink, setInk] = React.useState<Ink>("yellow");
  const [strokes, setStrokes] = React.useState<Stroke[]>([]);
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
  const goQuestion = (i: number) => {
    const k = Math.max(0, Math.min(passage.questions.length - 1, i));
    setCur(k);
    const el = document.getElementById(`rd-q-${k}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    el?.focus({ preventScroll: true });
  };
  const navBtn =
    "inline-flex size-10 shrink-0 items-center justify-center rounded-[12px] border border-border bg-white text-navy-900 outline-none hover:bg-blue-50 focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-5";
  const tool =
    "inline-flex h-10 items-center gap-2 rounded-[12px] border px-3 text-[14px] font-semibold outline-none focus-visible:shadow-[var(--focus-ring)] disabled:opacity-50 [&_svg]:size-[18px]";
  const openCard = (w: Word, el: HTMLElement) => {
    if (pen) return;
    const r = el.getBoundingClientRect();
    // Không đủ chỗ phía dưới (thanh tab dưới đáy trên điện thoại) → mở thẻ phía trên chữ.
    const above = window.innerHeight - r.bottom < 260;
    setCard({ word: w, x: r.left + r.width / 2, y: above ? r.top : r.bottom, above });
  };

  return (
    <div className="flex flex-col gap-4">
      <FeatureHero
        id="rd-title"
        eyebrow={`${t("reading.passageN", { n: nav.index })} · HSK ${passage.level} · ${t(`reading.types.${passage.type}`)}`}
        title={
          <span lang="zh" className="kai-bold">
            {passage.title}
          </span>
        }
        description={passage.titleTr}
      />
      {/* Thanh trên: ‹ Bài đọc n: 标题 n/N › · Nghe mẫu · tốc độ · Bút + màu · Xóa · Lưu bài */}
      <div className="@container rounded-[var(--radius-xl)] border border-border bg-white/92 p-3 shadow-card">
        <div className="flex flex-col gap-3 @[60rem]:flex-row @[60rem]:items-center @[60rem]:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Link
              href={nav.prev ? `/reading/${nav.prev}` : "/reading"}
              aria-label={nav.prev ? t("reading.prevPassage") : t("reading.back")}
              className={navBtn}
            >
              <ChevronLeft />
            </Link>
            <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-1">
              <p className="flex min-w-0 items-baseline gap-2.5 whitespace-nowrap text-navy-900">
                <span className="shrink-0 text-[17px] font-extrabold">{t("reading.passageN", { n: nav.index })}:</span>
                <span lang="zh" className="kai-bold text-[22px] leading-tight">
                  {passage.title}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold whitespace-nowrap text-text-2 tabular-nums">
                  {nav.index} / {nav.total}
                </span>
                <span className="h-1.5 w-[120px] overflow-hidden rounded-full bg-[#E3ECF7]">
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
              onClick={() => setPen((x) => !x)}
              aria-pressed={pen}
              className={cn(
                tool,
                pen
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-border bg-white text-navy-900 hover:bg-blue-50",
              )}
            >
              <Highlighter className="text-[#E8A400]" aria-hidden="true" />
              {t("reading.pen")}
            </button>
            <div role="radiogroup" aria-label={t("reading.pen")} className="flex items-center gap-1">
              {INKS.map((i) => {
                const name = t("reading.penColor", { color: t(`reading.inkColors.${i.key}`) });
                return (
                  <button
                    key={i.key}
                    type="button"
                    role="radio"
                    aria-checked={ink === i.key}
                    aria-label={name}
                    title={name}
                    onClick={() => {
                      setInk(i.key);
                      setPen(true);
                    }}
                    className="flex size-8 items-center justify-center rounded-full outline-none focus-visible:shadow-[var(--focus-ring)]"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "block size-5 rounded-full",
                        ink === i.key && pen && "ring-2 ring-white ring-offset-2 ring-offset-[#9DB3CC]",
                      )}
                      style={{ background: i.color }}
                    />
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setStrokes((x) => x.slice(0, -1))}
              disabled={!strokes.length}
              aria-label={t("reading.undoInkLabel")}
              title={t("reading.undoInkLabel")}
              className={cn(tool, "border-border bg-white px-2.5 text-navy-900 hover:bg-blue-50")}
            >
              <Undo2 className="text-text-2" aria-hidden="true" />
              <span className="sr-only md:not-sr-only">{t("reading.undoInk")}</span>
            </button>
            <button
              type="button"
              onClick={() => setStrokes([])}
              disabled={!strokes.length}
              aria-label={t("reading.clearInkLabel")}
              className={cn(tool, "border-border bg-white text-navy-900 hover:bg-red-50")}
            >
              <Trash2 className="text-text-2" aria-hidden="true" />
              {t("reading.clearInk")}
            </button>
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
      </div>

      <div
        className={cn(
          "grid grid-cols-[minmax(0,1fr)] items-start gap-4",
          !wide && "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]",
        )}
      >
        {/* Bên trái: bài đọc trên giấy ô vuông (vẽ / khoanh bằng Bút) · pinyin / bản dịch · từ vựng nổi bật. */}
        <div className="flex flex-col gap-4">
          <article
            aria-labelledby="rd-title"
            className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-border bg-white p-3 shadow-card md:p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-[12px] bg-[#FFF3D6] px-3 py-1.5 text-[15px] font-bold text-[#7A4E00]">
                <BookOpen className="size-[18px] text-blue-600" aria-hidden="true" />
                {t("reading.passageLabel")}
              </span>
              {/* Hiển thị pinyin / bản dịch ngay cạnh bài đọc. */}
              <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                {[
                  {
                    v: pinyin,
                    set: setPinyin,
                    label: t("reading.showPinyin"),
                    badge: "ā",
                    c: "bg-[#E6F1FF] text-blue-700",
                  },
                  {
                    v: showTr,
                    set: setShowTr,
                    label: t("reading.showTranslation"),
                    badge: "VI",
                    c: "bg-[#EEE8FF] text-[#6D4FD8]",
                  },
                ].map((o) => (
                  <label
                    key={o.label}
                    className="relative flex min-h-10 cursor-pointer items-center gap-2 rounded-[12px] border border-border bg-white px-2.5 text-[14px] font-semibold text-text"
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
              </div>
              <button
                type="button"
                onClick={() => setWide((w) => !w)}
                aria-pressed={wide}
                aria-label={wide ? t("reading.collapse") : t("reading.expand")}
                title={wide ? t("reading.collapse") : t("reading.expand")}
                className="hidden size-10 items-center justify-center rounded-[12px] text-text-2 outline-none hover:bg-blue-50 hover:text-blue-600 focus-visible:shadow-[var(--focus-ring)] lg:inline-flex"
              >
                {wide ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
              </button>
            </div>
            <Paper passage={passage} pinyin={pinyin} showTr={showTr} onWord={openCard}>
              <InkLayer strokes={strokes} setStrokes={setStrokes} pen={pen} ink={ink} />
            </Paper>
          </article>

          <section
            aria-labelledby="rd-words"
            className="rounded-[var(--radius-xl)] border border-[#DCE8F7] bg-[#F4F8FD] p-3 md:p-4"
          >
            <div className="mb-2.5 flex items-center gap-2">
              <h2 id="rd-words" className="flex items-center gap-2 text-[15.5px] font-bold text-navy-900">
                <Lightbulb className="size-5 text-amber" aria-hidden="true" />
                {t("reading.keyWordsTitle")}
              </h2>
              <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={saveAll} disabled={!!busy}>
                {busy === "all" ? <Loader2 className="animate-spin" /> : <BookmarkPlus />}
                {t("reading.saveAll")}
              </Button>
            </div>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2">
              {passage.words.map((w) => (
                <li
                  key={w.zh}
                  className="relative flex flex-col items-center rounded-[12px] border border-border bg-white px-2 pt-2.5 pb-2 text-center"
                >
                  <span
                    lang="zh"
                    className="hanzi [font-family:var(--font-paper)] text-[20px] font-normal! text-navy-900"
                  >
                    {w.zh}
                  </span>
                  <span className="text-[12.5px] text-text-2">{w.py}</span>
                  <span className="mt-1.5 w-full border-t border-border pt-1.5 text-[12.5px] leading-snug text-text">
                    {w.meaning}
                  </span>
                  <button
                    type="button"
                    onClick={() => saveWord(w)}
                    aria-label={t("reading.saveWordN", { word: w.zh })}
                    title={t("reading.saveWordN", { word: w.zh })}
                    className="absolute top-1 right-1 inline-flex size-7 items-center justify-center rounded-full text-blue-600 hover:bg-blue-50 [&_svg]:size-4"
                  >
                    <BookmarkPlus />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Bên phải: câu hỏi · bài trước / tiếp theo. */}
        <div className="flex flex-col gap-4">
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
              <div className="ml-auto flex items-center gap-2">
                <span className="mr-1 text-[15px] font-semibold text-text-2 tabular-nums">
                  {cur + 1} / {passage.questions.length}
                </span>
                {[
                  { d: -1, label: t("reading.prevQuestion"), icon: <ChevronLeft /> },
                  { d: 1, label: t("reading.nextQuestion"), icon: <ChevronRight /> },
                ].map((b) => (
                  <button
                    key={b.d}
                    type="button"
                    aria-label={b.label}
                    title={b.label}
                    disabled={b.d < 0 ? cur === 0 : cur === passage.questions.length - 1}
                    onClick={() => goQuestion(cur + b.d)}
                    className={cn(navBtn, "size-9 disabled:bg-[#F3F6FA] disabled:text-text-3")}
                  >
                    {b.icon}
                  </button>
                ))}
                <div
                  role="progressbar"
                  aria-label={t("reading.progress")}
                  aria-valuemin={0}
                  aria-valuemax={passage.questions.length}
                  aria-valuenow={answered}
                  aria-valuetext={`${answered} / ${passage.questions.length}`}
                  className="sr-only"
                />
              </div>
            </div>
            <ol className="flex flex-col gap-3">
              {passage.questions.map((q, i) => {
                const r = result?.results[i];
                return (
                  <li
                    key={i}
                    id={`rd-q-${i}`}
                    tabIndex={-1}
                    onFocusCapture={() => setCur(i)}
                    className={cn(
                      "@container scroll-mt-24 rounded-[18px] border px-3 py-3 outline-none md:px-4",
                      cur === i && !r && "ring-1 ring-[#CFE1F7]",
                      r
                        ? r.correct
                          ? "border-green-100 bg-green-50/60"
                          : "border-red-100 bg-red-50/50"
                        : "border-transparent bg-[#F3F7FC]",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#DCEBFF] text-[14px] font-bold text-blue-700">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="sr-only">{t("reading.questionN", { n: i + 1 })}: </span>
                        {pinyin ? <p className="text-[13.5px] text-text-2">{q.py}</p> : null}
                        <p lang="zh" className="kai-bold text-[19px] tracking-[.1em] text-navy-900">
                          {q.zh}
                        </p>
                        {showTr || hint ? <p className="text-[14px] text-text-2">{q.tr}</p> : null}
                      </div>
                    </div>
                    <div className="mt-2.5 pl-0 @md:pl-10">
                      {q.kind === "choice" ? (
                        <div
                          role="radiogroup"
                          aria-label={`${t("reading.questionN", { n: i + 1 })}: ${t("reading.choose")}`}
                          className={cn(
                            "grid gap-2.5",
                            q.options!.length === 4 ? "grid-cols-2 @xl:grid-cols-4" : "grid-cols-2 @md:grid-cols-3",
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
                                  "flex min-h-12 items-center gap-3 rounded-[10px] border-[1.5px] bg-white px-3 py-1.5 text-left shadow-[0_1px_2px_rgba(16,42,80,.04)] outline-none focus-visible:[box-shadow:var(--focus-ring)] disabled:cursor-default",
                                  right
                                    ? "border-green"
                                    : on
                                      ? r
                                        ? "border-red"
                                        : "border-[#86B9F2] bg-[#EAF3FF]"
                                      : "border-[#E3EAF3] hover:border-[#A9D3F8]",
                                )}
                              >
                                <span
                                  className={cn(
                                    "flex size-7 shrink-0 items-center justify-center rounded-full text-[13.5px] font-bold",
                                    on && !r ? "bg-[#D3E6FF] text-blue-700" : "bg-[#EEF2F8] text-navy-900",
                                  )}
                                >
                                  {String.fromCharCode(65 + j)}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span
                                    lang="zh"
                                    className="block hanzi [font-family:var(--font-paper)] text-[17px] font-normal! tracking-[.12em] text-navy-900"
                                  >
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
                          className={cn(inputClass, "h-12 rounded-[10px] border-[#E3EAF3] bg-white text-[17px]")}
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
            <div className="mt-1 flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setHint((h) => !h)}
                aria-pressed={hint}
                className={cn(
                  tool,
                  "h-11 border-border bg-white text-navy-900 hover:bg-amber-50 aria-pressed:border-amber aria-pressed:bg-[#FFF8E6]",
                )}
              >
                <Lightbulb className="text-amber" aria-hidden="true" />
                {t("reading.hint")}
              </button>
              <button
                type="button"
                onClick={retry}
                className={cn(tool, "h-11 border-border bg-white text-navy-900 hover:bg-blue-50")}
              >
                <RotateCcw aria-hidden="true" />
                {t("reading.retry")}
              </button>
              {!result ? (
                <button
                  type="button"
                  onClick={submit}
                  disabled={!!busy}
                  className="ml-auto inline-flex h-12 min-w-[210px] items-center justify-between gap-3 rounded-[12px] bg-[#1769C9] px-5 text-[15.5px] font-semibold text-white shadow-[0_6px_14px_rgba(23,105,201,.28)] outline-none hover:bg-[#135AAD] focus-visible:shadow-[var(--focus-ring)] disabled:opacity-60 max-sm:w-full"
                >
                  <span className="inline-flex items-center gap-2">
                    {busy === "submit" ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : null}
                    {busy === "submit" ? t("reading.submitting") : t("reading.submit")}
                  </span>
                  <ChevronRight className="size-5" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </section>

          <div className="flex items-center justify-between gap-3">
            {nav.prev ? (
              <Link
                href={`/reading/${nav.prev}`}
                className="inline-flex h-12 items-center gap-2 rounded-[14px] border border-border bg-white px-5 font-semibold text-navy-900 shadow-sm hover:bg-blue-50"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
                {t("reading.prevPassage")}
              </Link>
            ) : (
              <span />
            )}
            {nav.next ? (
              <Link
                href={`/reading/${nav.next}`}
                className="inline-flex h-12 min-w-[180px] items-center justify-between gap-2 rounded-[14px] bg-blue-600 px-5 font-semibold text-white shadow-soft hover:bg-blue-700"
              >
                {t("reading.nextPassage")}
                <ChevronRight className="size-5" aria-hidden="true" />
              </Link>
            ) : (
              <Button type="button" variant="primary" onClick={next} disabled={!!busy}>
                {t("reading.nextPassage")}
                <ChevronRight />
              </Button>
            )}
          </div>
        </div>
      </div>

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
