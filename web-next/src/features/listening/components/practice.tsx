"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileSearch,
  Gauge,
  Lightbulb,
  Link2,
  Maximize2,
  Minimize2,
  NotebookPen,
  Pencil,
  PlayCircle,
  Plus,
  Music2,
  Podcast,
  Radio,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { LISTENING } from "@/lib/limits";
import { asAudio, formatTime, parseMediaUrl, parseTime, type MediaSource } from "@/lib/media-url";
import { compareDictation, plainOf, reformat, type FormattedSpan } from "@/lib/dictation-compare";
import { createExerciseAction } from "../actions";
import { ListeningHeader, Panel, StepTitle } from "./listening-header";
import { MediaPlayer, type PlayerApi } from "./media-player";
import { SegmentControls, type Segment } from "./segment-controls";
import { ReferenceModal, type Reference } from "./reference-modal";
import { DictationEditor } from "./dictation-editor";
import { DiffPinyin, DiffText, Legend, ScoreLine } from "./comparison-view";
import { SaveExerciseModal } from "./save-exercise-modal";
import { SaveVocabDialog } from "./save-vocab-dialog";
import type { DraftErrors, ExerciseDraft } from "./exercise-fields";

/** Biểu tượng YouTube (khối đỏ + tam giác trắng). */
function YtIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="1.5" y="5" width="21" height="14" rx="4" fill="#FF0000" />
      <path d="M10 9.2v5.6l4.8-2.8z" fill="#fff" />
    </svg>
  );
}

/** Bài đang làm, lưu tạm trong trình duyệt (theo từng tài khoản) để tải lại trang không mất bài. */
type SourceTab = "youtube" | "podcast" | "radio" | "tiktok" | "other";
const SOURCE_TABS: SourceTab[] = ["youtube", "podcast", "radio", "tiktok", "other"];
type Draft = {
  tab: SourceTab;
  url: string;
  opened: string;
  segment: Segment | null;
  speed: number;
  loop: boolean;
  autoNext: boolean;
  reference: Reference;
  spans: FormattedSpan[];
  notes: string;
  checked: boolean;
};
const EMPTY: Draft = {
  tab: "youtube",
  url: "",
  opened: "",
  segment: null,
  speed: 1,
  loop: true,
  autoNext: false,
  reference: { answer: "", pinyin: "" },
  spans: [],
  notes: "",
  checked: false,
};
const draftKey = (userId: string) => `lingyu-listening-draft:${userId}`;
function loadDraft(userId: string, fresh: boolean): Draft {
  try {
    if (fresh) {
      localStorage.removeItem(draftKey(userId));
      return EMPTY;
    }
    const raw = localStorage.getItem(draftKey(userId));
    if (!raw) return EMPTY;
    const d = { ...EMPTY, ...(JSON.parse(raw) as Partial<Draft>) };
    // Tải lại trang: không mở lại link / video cũ (chỉ giữ bài chép, đáp án, ghi chú đang làm dở).
    return { ...d, url: "", opened: "", segment: null, spans: Array.isArray(d.spans) ? d.spans : [] };
  } catch {
    return EMPTY;
  }
}

function writeDraft(userId: string, d: Draft) {
  try {
    localStorage.setItem(draftKey(userId), JSON.stringify(d));
  } catch {
    /* bộ nhớ trình duyệt bị chặn / đầy: bỏ qua */
  }
}

/**
 * Màn "Luyện nghe từ các kênh". Luồng (không đổi thứ tự):
 * dán link → chọn đoạn → NGƯỜI DÙNG tự nhập đáp án tham khảo → nghe → chép chính tả → Kiểm tra (so sánh) → tô đỏ phần
 * không khớp → sửa → so sánh lại (tự động) → ghi chú → Lưu bài làm + thẻ → xuất hiện trong "Bài làm của tôi".
 * Không bao giờ lấy phụ đề YouTube làm đáp án.
 */
export function ListeningPractice({
  userId,
  fresh,
  listeningTags,
  vocabTags,
}: {
  userId: string;
  fresh: boolean;
  listeningTags: string[];
  vocabTags: string[];
}) {
  const t = useT();
  const router = useRouter();
  const [d, setD] = React.useState<Draft>(() => loadDraft(userId, fresh));
  const set = React.useCallback((p: Partial<Draft>) => setD((x) => ({ ...x, ...p })), []);
  const [urlError, setUrlError] = React.useState("");
  const [api, setApi] = React.useState<PlayerApi | null>(null);
  const [duration, setDuration] = React.useState(0);
  const [refOpen, setRefOpen] = React.useState(false);
  const [saveOpen, setSaveOpen] = React.useState(false);
  const [vocabWord, setVocabWord] = React.useState<string | null>(null);
  const [showTip, setShowTip] = React.useState(false);
  const [showEditorTips, setShowEditorTips] = React.useState(false);
  const [savedId, setSavedId] = React.useState<string | null>(null);
  const resultRef = React.useRef<HTMLDivElement>(null);
  const [guideOpen, setGuideOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [jump, setJump] = React.useState("");
  const [jumpErr, setJumpErr] = React.useState("");
  const [loopOpen, setLoopOpen] = React.useState(false);

  const source: MediaSource | null = React.useMemo(() => (d.opened ? parseMediaUrl(d.opened) : null), [d.opened]);
  const text = plainOf(d.spans);
  const hasRef = !!d.reference.answer.trim();
  const comparison = React.useMemo(
    () => (d.checked && hasRef ? compareDictation(d.reference.answer, text) : null),
    [d.checked, hasRef, d.reference.answer, text],
  );

  // "Tạo bài mới" (?new=1) đã xoá nháp → bỏ tham số để tải lại trang không xoá tiếp.
  React.useEffect(() => {
    if (fresh) router.replace("/listening", { scroll: false });
  }, [fresh, router]);

  // Lưu nháp (hệ thống ngoài = localStorage): sau 0,4 giây, và ngay lập tức khi rời trang / đóng tab để không mất sửa đổi cuối.
  const latest = React.useRef(d);
  React.useEffect(() => {
    latest.current = d;
    const id = setTimeout(() => writeDraft(userId, d), 400);
    return () => clearTimeout(id);
  }, [d, userId]);
  React.useEffect(() => {
    const flush = () => writeDraft(userId, latest.current);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [userId]);

  // Thời lượng (YouTube có thể trả 0 lúc đầu) + tốc độ.
  React.useEffect(() => {
    if (!api) return;
    const tick = () => {
      const dur = api.getDuration();
      if (dur > 0) {
        setDuration(dur);
        return true;
      }
      return false;
    };
    if (tick()) return;
    const id = setInterval(() => tick() && clearInterval(id), 500);
    return () => clearInterval(id);
  }, [api]);
  React.useEffect(() => {
    api?.setRate(d.speed);
  }, [api, d.speed]);

  // Đoạn mặc định khi mới mở nội dung: 30 giây đầu.
  const effectiveSegment = d.segment ?? (duration > 0 ? { start: 0, end: Math.min(30, duration) } : null);

  // Lặp lại đoạn / tự chuyển đoạn tiếp theo / dừng ở cuối đoạn.
  const segRef = React.useRef(effectiveSegment);
  const optsRef = React.useRef({ loop: d.loop, autoNext: d.autoNext, duration });
  React.useEffect(() => {
    segRef.current = effectiveSegment;
    optsRef.current = { loop: d.loop, autoNext: d.autoNext, duration };
  });
  React.useEffect(() => {
    if (!api) return;
    const id = setInterval(() => {
      const seg = segRef.current;
      if (!seg || !api.isPlaying()) return;
      const now = api.getTime();
      if (now < seg.end - 0.05) return;
      const o = optsRef.current;
      if (o.autoNext) {
        const len = seg.end - seg.start;
        if (seg.end >= o.duration - 0.5) return api.pause();
        const next = { start: seg.end, end: Math.min(seg.end + len, o.duration) };
        setD((x) => ({ ...x, segment: next }));
      } else if (o.loop) api.seek(seg.start);
      else api.pause();
    }, 200);
    return () => clearInterval(id);
  }, [api]);

  function openUrl(e?: React.FormEvent) {
    e?.preventDefault();
    const raw = d.url.trim();
    if (!raw) return void setUrlError(t("listening.url.empty"));
    const m = parseMediaUrl(raw) ?? (d.tab === "podcast" || d.tab === "radio" ? parseMediaUrl(asAudio(raw)) : null);
    if (!m) return void setUrlError(t("listening.url.unsupported"));
    setUrlError("");
    if (m.url !== d.opened) {
      setDuration(0);
      set({ opened: m.url, url: m.url, segment: null });
    }
  }

  function check() {
    if (!hasRef) return void toast.info(t("listening.actions.checkDisabled"));
    if (!text.trim()) return void toast.info(t("listening.actions.needAnswer"));
    set({ checked: true });
    requestAnimationFrame(() => {
      if (window.matchMedia("(max-width: 1023px)").matches)
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function jumpTo(e?: React.FormEvent) {
    e?.preventDefault();
    const sec = parseTime(jump);
    if (sec === null) return void setJumpErr(t("listening.jump.bad"));
    setJumpErr("");
    if (!api) return void toast.info(t("listening.segment.needMedia"));
    api.seek(Math.min(sec, duration || sec));
    api.play();
    toast.success(t("listening.jump.done", { time: formatTime(sec) }));
  }

  function openSave() {
    if (!hasRef) {
      toast.info(t("listening.actions.needReference"));
      return setRefOpen(true);
    }
    setSaveOpen(true);
  }

  async function submitSave(v: ExerciseDraft) {
    const formatted = reformat(d.spans, v.userAnswer);
    const r = await createExerciseAction({
      title: v.title,
      tags: v.tags,
      contentUrl: d.opened,
      segmentStart: effectiveSegment?.start ?? null,
      segmentEnd: effectiveSegment?.end ?? null,
      playbackSpeed: d.speed,
      referenceAnswer: d.reference.answer,
      referencePinyin: d.reference.pinyin,
      userAnswer: v.userAnswer,
      formattedUserAnswer: formatted,
      notes: v.notes,
    });
    if (!r.ok) return { ok: false as const, message: r.message, fieldErrors: r.fieldErrors as DraftErrors | undefined };
    // Lưu xong: xoá sạch để làm bài mới — cả link và trình phát (giữ cài đặt tốc độ / lặp lại).
    set({
      url: "",
      opened: "",
      segment: null,
      spans: [],
      notes: "",
      checked: false,
      reference: { answer: "", pinyin: "" },
    });
    setSavedId(r.data);
    toast.success(t("listening.save.saved", { title: v.title.trim() }), {
      action: { label: t("listening.save.view"), onClick: () => router.push(`/listening/exercises/${r.data}`) },
    });
    router.refresh();
    return { ok: true as const };
  }

  const tabIcon: Record<SourceTab, React.ReactNode> = {
    youtube: <YtIcon />,
    podcast: <Podcast className="text-[#7C5CE6]" />,
    radio: <Radio className="text-[#0B6E77]" />,
    tiktok: <Music2 className="text-text" />,
    other: <Link2 className="text-blue-600" />,
  };
  const saveButton = (extra?: string) => (
    <Button type="button" variant="solid" onClick={openSave} className={extra}>
      <Save />
      {t("listening.actions.save")}
    </Button>
  );

  return (
    <>
      <ListeningHeader
        tab="practice"
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-expanded={guideOpen}
              aria-controls="lx-guide"
              onClick={() => setGuideOpen((v) => !v)}
            >
              <Lightbulb />
              {t("listening.guide.button")}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={openSave} className="max-sm:hidden">
              <BookOpen />
              {t("listening.actions.save")}
            </Button>
          </>
        }
      />
      {guideOpen ? (
        <Panel id="lx-guide" aria-labelledby="lx-guide-title" className="border-[#F6DE9E] bg-[#FFF9EA]">
          <h2 id="lx-guide-title" className="mb-2 flex items-center gap-2 font-bold text-[#8A5300]">
            <Lightbulb className="size-5" aria-hidden="true" />
            {t("listening.guide.title")}
          </h2>
          <ol className="grid list-decimal gap-1 pl-5 text-[14.5px] text-text">
            {(["step1", "step2", "step3", "step4", "step5"] as const).map((k) => (
              <li key={k}>{t(`listening.guide.${k}`)}</li>
            ))}
          </ol>
        </Panel>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {/* ---------- 1. Nguồn nghe ---------- */}
        <Panel aria-labelledby="lx-src-title" className="flex flex-col gap-4">
          <StepTitle n={1} id="lx-src-title" title={t("listening.source.step")} />
          <div
            role="radiogroup"
            aria-label={t("listening.source.label")}
            className="grid grid-cols-3 gap-1 rounded-[14px] bg-[#F4F8FD] p-1 sm:grid-cols-5"
          >
            {SOURCE_TABS.map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={d.tab === k}
                onClick={() => set({ tab: k })}
                className={cn(
                  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[11px] border-[1.5px] px-1.5 text-[13.5px] font-semibold whitespace-nowrap outline-none focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-[18px] [&_svg]:shrink-0",
                  d.tab === k
                    ? "border-blue-600 bg-white text-navy-900 shadow-soft"
                    : "border-transparent text-text-2 hover:bg-white/70",
                )}
              >
                {tabIcon[k]}
                {t(`listening.source.${k}`)}
              </button>
            ))}
          </div>

          <form onSubmit={openUrl} noValidate className="flex flex-col gap-2">
            <p className="text-[13.5px] text-text-3">{t(`listening.source.hint.${d.tab}`)}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">{t("listening.url.label")}</span>
                <input
                  type="url"
                  inputMode="url"
                  value={d.url}
                  onChange={(e) => {
                    set({ url: e.target.value });
                    setUrlError("");
                  }}
                  placeholder={t("listening.url.placeholder")}
                  autoComplete="off"
                  aria-invalid={!!urlError || undefined}
                  aria-describedby="lx-url-err"
                  className={cn(inputClass, "pr-11")}
                />
                {d.url ? (
                  <button
                    type="button"
                    onClick={() => set({ url: "" })}
                    aria-label={t("listening.url.clear")}
                    className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-text-3 hover:bg-blue-50"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </label>
              <Button type="submit" variant="solid">
                <PlayCircle />
                {t("listening.url.open")}
              </Button>
            </div>
            {urlError ? (
              <p id="lx-url-err" role="alert" className="text-[13.5px] text-red">
                {urlError}
              </p>
            ) : null}
          </form>

          <MediaPlayer source={source} onReady={setApi} />
          {source?.kind === "tiktok" ? <p className="text-[13px] text-text-3">{t("listening.player.noRate")}</p> : null}

          <div className="grid gap-4 rounded-[16px] border border-[#E3EEF8] bg-[#F8FBFF] p-3.5 md:grid-cols-[minmax(0,1fr)_auto] md:divide-x md:divide-[#E3EEF8]">
            <div className="min-w-0">
              <p id="lx-speed-title" className="mb-2 flex items-center gap-2 text-[14.5px] font-bold text-navy">
                <Gauge className="size-[18px] text-blue-600" aria-hidden="true" />
                {t("listening.speed.label")}
              </p>
              <div role="radiogroup" aria-labelledby="lx-speed-title" className="grid grid-cols-6 gap-1.5">
                {LISTENING.SPEEDS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={d.speed === v}
                    onClick={() => set({ speed: v })}
                    className={cn(
                      "h-10 rounded-[10px] border text-[14px] font-semibold tabular-nums outline-none focus-visible:shadow-[var(--focus-ring)]",
                      d.speed === v
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-border bg-white text-text-2 hover:border-[#A9D3F8]",
                    )}
                  >
                    {v}x
                  </button>
                ))}
              </div>
            </div>
            <form onSubmit={jumpTo} noValidate className="md:pl-4">
              <label htmlFor="lx-jump" className="mb-2 block text-[14.5px] font-bold text-navy">
                {t("listening.jump.label")}
              </label>
              <div className="flex gap-1.5">
                <span className="relative">
                  <Clock3
                    className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-text-3"
                    aria-hidden="true"
                  />
                  <input
                    id="lx-jump"
                    value={jump}
                    onChange={(e) => {
                      setJump(e.target.value);
                      setJumpErr("");
                    }}
                    inputMode="numeric"
                    placeholder="00:00"
                    aria-label={t("listening.jump.input")}
                    aria-invalid={!!jumpErr || undefined}
                    className={cn(inputClass, "h-10 w-[110px] pl-8 tabular-nums")}
                  />
                </span>
                <Button type="submit" size="sm" variant="solid" disabled={!jump.trim()}>
                  {t("listening.jump.go")}
                </Button>
              </div>
              {jumpErr ? (
                <p role="alert" className="mt-1 text-[13px] text-red">
                  {jumpErr}
                </p>
              ) : null}
            </form>
          </div>

          <div className="rounded-[16px] border border-[#E3EEF8]">
            <button
              type="button"
              aria-expanded={loopOpen}
              aria-controls="lx-loop"
              onClick={() => setLoopOpen((v) => !v)}
              className="flex w-full items-center gap-2 rounded-[16px] px-3.5 py-3 text-left text-[14.5px] font-bold text-navy outline-none focus-visible:shadow-[var(--focus-ring)]"
            >
              {t("listening.loopSection")}
              <ChevronDown
                className={cn("ml-auto size-5 transition-transform", loopOpen && "rotate-180")}
                aria-hidden="true"
              />
            </button>
            <div id="lx-loop" hidden={!loopOpen} className="border-t border-[#E3EEF8] p-3.5">
              <SegmentControls
                hideSpeed
                duration={duration}
                segment={effectiveSegment}
                onSegment={(segment) => set({ segment })}
                onApply={(sg) => {
                  api?.seek(sg.start);
                  api?.play();
                  toast.success(
                    t("listening.segment.applied", { start: formatTime(sg.start), end: formatTime(sg.end) }),
                  );
                }}
                speed={d.speed}
                onSpeed={(speed) => set({ speed })}
                loop={d.loop}
                onLoop={(loop) => set({ loop, autoNext: loop ? false : d.autoNext })}
                autoNext={d.autoNext}
                onAutoNext={(autoNext) => set({ autoNext, loop: autoNext ? false : d.loop })}
              />
            </div>
          </div>
        </Panel>

        {/* ---------- 2. Chép chính tả ---------- */}
        {expanded ? (
          <div
            aria-hidden="true"
            className="fixed inset-0 z-[55] bg-[rgba(9,35,80,.35)]"
            onClick={() => setExpanded(false)}
          />
        ) : null}
        <Panel
          aria-labelledby="lx-dict-title"
          className={cn(
            "flex flex-col gap-3",
            expanded && "fixed inset-2 z-[60] overflow-y-auto md:inset-6 lg:inset-x-[10%]",
          )}
        >
          <StepTitle
            n={2}
            id="lx-dict-title"
            title={t("listening.dictation.step")}
            right={
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-expanded={showEditorTips}
                  onClick={() => setShowEditorTips((v) => !v)}
                >
                  <Lightbulb />
                  {t("listening.dictation.tips")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  aria-pressed={expanded}
                  onClick={() => setExpanded((v) => !v)}
                >
                  {expanded ? <Minimize2 /> : <Maximize2 />}
                  {expanded ? t("listening.collapse") : t("listening.expand")}
                </Button>
              </div>
            }
          />
          {showEditorTips ? (
            <p className="rounded-[12px] bg-blue-50 px-3 py-2 text-[13.5px] text-text-2">
              {t("listening.dictation.tipsText")}
            </p>
          ) : null}
          <div className="rounded-[16px] border border-[#E3EEF8] p-2.5">
            <DictationEditor
              id="lx-dictation"
              spans={d.spans}
              onChange={(spans) => set({ spans })}
              comparison={comparison}
              maxLength={LISTENING.MAX_TEXT}
              onSaveVocab={setVocabWord}
              describedBy="lx-dict-count"
            />
            <p id="lx-dict-count" className="mt-1 text-right text-[13.5px] text-text-3">
              <span className="sr-only">{t("listening.dictation.max")} · </span>
              <span className={cn("tabular-nums", text.length > LISTENING.MAX_TEXT && "text-red")}>
                {text.length} / {LISTENING.MAX_TEXT}
              </span>
            </p>
          </div>

          {comparison ? (
            <section
              aria-labelledby="lx-res-title"
              className="flex flex-col gap-3 rounded-[16px] border border-[#DDEBF8] p-3"
            >
              <div ref={resultRef} className="scroll-mt-4">
                <h3 id="lx-res-title" className="text-[16px] font-bold text-navy">
                  {t("listening.result.step")}
                </h3>
              </div>
              <div aria-live="polite" className="flex flex-col gap-3">
                <div className="rounded-[14px] border border-[#DDEBF8] bg-[#F5FAFF] p-3">
                  <p className="text-[13.5px] font-semibold text-text-2">{t("listening.result.reference")}</p>
                  <p lang="zh" className="font-cn text-[18px] leading-relaxed whitespace-pre-wrap">
                    {d.reference.answer}
                  </p>
                  {d.reference.pinyin ? (
                    <p className="text-[14.5px] whitespace-pre-wrap text-pinyin">{d.reference.pinyin}</p>
                  ) : null}
                </div>
                <div className="rounded-[14px] border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[13.5px] font-semibold text-text-2">{t("listening.result.yours")}</p>
                    <ScoreLine c={comparison} className="text-[15px]" />
                  </div>
                  {text.trim() ? (
                    <>
                      <DiffText parts={comparison.parts} />
                      <DiffPinyin parts={comparison.parts} />
                    </>
                  ) : (
                    <p className="text-text-3">{t("listening.result.empty")}</p>
                  )}
                </div>
                <Legend />
                <p className="text-[13px] text-text-3">{t("listening.result.live")}</p>
              </div>
            </section>
          ) : null}

          <div
            className={cn(
              "flex flex-col gap-3 rounded-[16px] border p-3.5 sm:flex-row sm:items-center",
              hasRef ? "border-green-100 bg-green-50/60" : "border-[#F7D5DB] bg-[#FFF3F5]",
            )}
          >
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full bg-white",
                hasRef ? "text-green-700" : "text-rose",
              )}
            >
              {hasRef ? (
                <CheckCircle2 className="size-5" aria-hidden="true" />
              ) : (
                <BookOpen className="size-5" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-[15.5px] font-bold text-navy">{t("listening.reference.title")}</h3>
              <p className="text-[14px] text-text-2">
                {hasRef
                  ? t("listening.reference.ready", { count: d.reference.answer.length })
                  : t("listening.reference.desc")}
              </p>
              {showTip ? <p className="mt-1 text-[13.5px] text-text-3">{t("listening.reference.tip")}</p> : null}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setRefOpen(true)}>
                {hasRef ? <Pencil /> : <Plus />}
                {hasRef ? t("listening.reference.edit") : t("listening.reference.add")}
              </Button>
              <button
                type="button"
                onClick={() => setShowTip((v) => !v)}
                aria-expanded={showTip}
                aria-label={t("listening.reference.tipLabel")}
                title={t("listening.reference.tip")}
                className="flex size-10 items-center justify-center rounded-full bg-white text-blue-600 outline-none hover:bg-blue-100 focus-visible:shadow-[var(--focus-ring)]"
              >
                <Lightbulb className="size-5" />
              </button>
            </div>
          </div>

          <div className="rounded-[16px] border border-[#E3EEF8] p-3.5">
            <h3 id="lx-notes-title" className="mb-2 flex items-center gap-2 text-[15.5px] font-bold text-navy">
              <NotebookPen className="size-5 text-blue-600" aria-hidden="true" />
              {t("listening.notes.title")}
            </h3>
            <label htmlFor="lx-notes" className="sr-only">
              {t("listening.notes.label")}
            </label>
            <Textarea
              id="lx-notes"
              value={d.notes}
              maxLength={LISTENING.MAX_TEXT}
              onChange={(e) => set({ notes: e.target.value })}
              placeholder={t("listening.notes.placeholder")}
              className="min-h-[96px]"
            />
            <p className="mt-1 text-right text-[13.5px] text-text-3 tabular-nums">
              {d.notes.length} / {LISTENING.MAX_TEXT}
            </p>
          </div>

          {savedId ? (
            <div
              role="status"
              className="flex flex-wrap items-center gap-3 rounded-[14px] border border-green-100 bg-green-50 px-4 py-3 text-green-700"
            >
              <CheckCircle2 className="size-5" aria-hidden="true" />
              <span className="font-semibold">{t("listening.save.savedBanner")}</span>
              <Link
                href={`/listening/exercises/${savedId}`}
                className="ml-auto font-semibold text-blue-600 underline-offset-2 hover:underline"
              >
                {t("listening.save.openMine")}
              </Link>
            </div>
          ) : null}

          <div
            role="group"
            aria-label={t("listening.actions.barLabel")}
            className="sticky bottom-[calc(var(--tabbar-h,0px)+var(--safe-b,0px)+8px)] z-30 grid grid-cols-2 gap-2 rounded-[16px] bg-white/95 py-1 backdrop-blur sm:flex sm:justify-end md:static"
          >
            <span title={hasRef ? undefined : t("listening.actions.checkDisabled")} className="contents sm:inline-flex">
              <Button
                type="button"
                variant="ghost"
                onClick={check}
                disabled={!hasRef}
                aria-describedby={hasRef ? undefined : "lx-check-why"}
                className="sm:min-w-[190px]"
              >
                <FileSearch />
                {t("listening.actions.check")}
              </Button>
            </span>
            {saveButton("sm:min-w-[190px]")}
          </div>
          {!hasRef ? (
            <p id="lx-check-why" className="sr-only">
              {t("listening.actions.checkDisabled")}
            </p>
          ) : null}
        </Panel>
      </div>

      <ReferenceModal
        open={refOpen}
        onOpenChange={setRefOpen}
        initial={d.reference}
        onSave={(reference) => {
          set({ reference });
          toast.success(t("listening.reference.saved"));
        }}
      />
      <SaveExerciseModal
        open={saveOpen}
        onOpenChange={setSaveOpen}
        initial={{
          title: "",
          tags: [],
          referenceAnswer: d.reference.answer,
          referencePinyin: d.reference.pinyin,
          userAnswer: text,
          notes: d.notes,
        }}
        allTags={listeningTags}
        onSubmit={submitSave}
      />
      <SaveVocabDialog word={vocabWord} onClose={() => setVocabWord(null)} vocabTags={vocabTags} />
    </>
  );
}
