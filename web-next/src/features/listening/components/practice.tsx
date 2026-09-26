"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  Lightbulb,
  Link2,
  Pencil,
  PlayCircle,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass, Textarea } from "@/components/ui/input";
import { useConfirm } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toaster";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { LISTENING } from "@/lib/limits";
import { formatTime, parseMediaUrl, type MediaSource } from "@/lib/media-url";
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

/** Bài đang làm, lưu tạm trong trình duyệt (theo từng tài khoản) để tải lại trang không mất bài. */
type Draft = {
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
    return { ...d, spans: Array.isArray(d.spans) ? d.spans : [] };
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
  const [confirm, confirmNode] = useConfirm();
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
    const m = parseMediaUrl(raw);
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

  async function clearContent() {
    const ok = await confirm({
      title: t("listening.actions.clearTitle"),
      message: t("listening.actions.clearMessage"),
      confirmLabel: t("listening.actions.clear"),
      danger: true,
    });
    if (!ok) return;
    set({ spans: [], notes: "", checked: false });
    setSavedId(null);
    toast.success(t("listening.actions.cleared"));
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
    // Lưu xong: xoá bài để làm bài mới, GIỮ LẠI link (và cài đặt nghe) để luyện tiếp đoạn khác của cùng nội dung.
    set({ spans: [], notes: "", checked: false, reference: { answer: "", pinyin: "" } });
    setSavedId(r.data);
    toast.success(t("listening.save.saved", { title: v.title.trim() }), {
      action: { label: t("listening.save.view"), onClick: () => router.push(`/listening/exercises?id=${r.data}`) },
    });
    router.refresh();
    return { ok: true as const };
  }

  return (
    <>
      <ListeningHeader tab="practice" />

      <Panel aria-labelledby="lx-url-title" className="flex flex-col gap-4">
        <form onSubmit={openUrl} noValidate className="flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Link2 className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="lx-url-title" className="text-[17px] font-bold text-navy">
                {t("listening.url.title")}
              </h2>
              <p className="text-[13.5px] text-text-3">{t("listening.url.hint")}</p>
            </div>
          </div>
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

        <div className="grid gap-5 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <MediaPlayer source={source} onReady={setApi} />
          <SegmentControls
            duration={duration}
            segment={effectiveSegment}
            onSegment={(segment) => set({ segment })}
            onApply={(s) => {
              api?.seek(s.start);
              api?.play();
              toast.success(t("listening.segment.applied", { start: formatTime(s.start), end: formatTime(s.end) }));
            }}
            speed={d.speed}
            onSpeed={(speed) => set({ speed })}
            loop={d.loop}
            onLoop={(loop) => set({ loop, autoNext: loop ? false : d.autoNext })}
            autoNext={d.autoNext}
            onAutoNext={(autoNext) => set({ autoNext, loop: autoNext ? false : d.loop })}
          />
        </div>

        <div
          className={cn(
            "flex flex-col gap-3 rounded-[16px] border p-4 sm:flex-row sm:items-center",
            hasRef ? "border-green-100 bg-green-50/60" : "border-[#F7C6CF] bg-[#FFF7F8]",
          )}
        >
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full",
              hasRef ? "bg-white text-green-700" : "bg-white text-rose",
            )}
          >
            {hasRef ? (
              <CheckCircle2 className="size-5" aria-hidden="true" />
            ) : (
              <BookOpen className="size-5" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-bold text-navy">
              {t("listening.reference.title")}{" "}
              <span className="text-[14px] font-medium text-text-2">{t("listening.reference.byYou")}</span>
            </h2>
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
              className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 outline-none hover:bg-blue-100 focus-visible:shadow-[var(--focus-ring)]"
            >
              <Lightbulb className="size-5" />
            </button>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel aria-labelledby="lx-dict-title" className="flex flex-col gap-3">
          <StepTitle
            n={1}
            id="lx-dict-title"
            title={t("listening.dictation.step")}
            sub={t("listening.dictation.sub")}
            right={
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
            }
          />
          {showEditorTips ? (
            <p className="rounded-[12px] bg-blue-50 px-3 py-2 text-[13.5px] text-text-2">
              {t("listening.dictation.tipsText")}
            </p>
          ) : null}
          <DictationEditor
            id="lx-dictation"
            spans={d.spans}
            onChange={(spans) => set({ spans })}
            comparison={comparison}
            maxLength={LISTENING.MAX_TEXT}
            onSaveVocab={setVocabWord}
            describedBy="lx-dict-count"
          />
          <div id="lx-dict-count" className="flex justify-between text-[13.5px] text-text-3">
            <span>{t("listening.dictation.max")}</span>
            <span className={cn("tabular-nums", text.length > LISTENING.MAX_TEXT && "text-red")}>
              {text.length} / {LISTENING.MAX_TEXT}
            </span>
          </div>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel aria-labelledby="lx-res-title" className="flex flex-col gap-3">
            <div ref={resultRef} className="scroll-mt-4">
              <StepTitle n={2} id="lx-res-title" title={t("listening.result.step")} sub={t("listening.result.sub")} />
            </div>
            <div aria-live="polite">
              {comparison ? (
                <div className="flex flex-col gap-3">
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
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-[14px] bg-[#F7FBFF] px-4 py-8 text-center">
                  <FileSearch className="size-12 text-[#9DB9D8]" aria-hidden="true" />
                  <p className="font-bold text-navy">{t("listening.result.none")}</p>
                  <p className="text-[14px] text-text-3">{t("listening.result.noneHint")}</p>
                </div>
              )}
            </div>
          </Panel>

          <Panel aria-labelledby="lx-notes-title" className="flex flex-col gap-2">
            <h2 id="lx-notes-title" className="flex items-center gap-2 text-[17px] font-bold text-navy">
              {t("listening.notes.title")}{" "}
              <span className="text-[13.5px] font-medium text-text-3">{t("listening.notes.max")}</span>
            </h2>
            <label htmlFor="lx-notes" className="sr-only">
              {t("listening.notes.label")}
            </label>
            <Textarea
              id="lx-notes"
              value={d.notes}
              maxLength={LISTENING.MAX_TEXT}
              onChange={(e) => set({ notes: e.target.value })}
              placeholder={t("listening.notes.placeholder")}
              className="min-h-[110px]"
            />
            <span className="self-end text-[13.5px] text-text-3 tabular-nums">
              {d.notes.length} / {LISTENING.MAX_TEXT}
            </span>
          </Panel>
        </div>
      </div>

      {savedId ? (
        <div
          role="status"
          className="flex flex-wrap items-center gap-3 rounded-[14px] border border-green-100 bg-green-50 px-4 py-3 text-green-700"
        >
          <CheckCircle2 className="size-5" aria-hidden="true" />
          <span className="font-semibold">{t("listening.save.savedBanner")}</span>
          <Link
            href={`/listening/exercises?id=${savedId}`}
            className="ml-auto font-semibold text-blue-600 underline-offset-2 hover:underline"
          >
            {t("listening.save.openMine")}
          </Link>
        </div>
      ) : null}

      <div
        role="group"
        aria-label={t("listening.actions.barLabel")}
        className="sticky bottom-[calc(var(--tabbar-h,0px)+var(--safe-b,0px)+8px)] z-30 grid grid-cols-3 gap-2 rounded-[18px] border border-border bg-white/95 p-2.5 shadow-card backdrop-blur md:static md:mx-auto md:flex md:w-full md:max-w-[760px] md:justify-center md:gap-3 md:p-3"
      >
        <span title={hasRef ? undefined : t("listening.actions.checkDisabled")} className="contents md:inline-flex">
          <Button
            type="button"
            variant="secondary"
            onClick={check}
            disabled={!hasRef}
            aria-describedby={hasRef ? undefined : "lx-check-why"}
            className="max-md:h-auto max-md:min-h-12 max-md:flex-col max-md:gap-1 max-md:px-2 max-md:text-[13px] max-md:whitespace-normal md:min-w-[190px]"
          >
            <ClipboardCheck />
            {t("listening.actions.check")}
          </Button>
        </span>
        <Button
          type="button"
          variant="muted"
          onClick={clearContent}
          disabled={!text && !d.notes}
          className="max-md:h-auto max-md:min-h-12 max-md:flex-col max-md:gap-1 max-md:px-2 max-md:text-[13px] max-md:whitespace-normal md:min-w-[170px]"
        >
          <Trash2 />
          {t("listening.actions.clear")}
        </Button>
        <Button
          type="button"
          variant="solid"
          onClick={openSave}
          className="max-md:h-auto max-md:min-h-12 max-md:flex-col max-md:gap-1 max-md:px-2 max-md:text-[13px] max-md:whitespace-normal md:min-w-[190px]"
        >
          <Save />
          {t("listening.actions.save")}
        </Button>
      </div>
      {!hasRef ? (
        <p id="lx-check-why" className="sr-only">
          {t("listening.actions.checkDisabled")}
        </p>
      ) : null}

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
      {confirmNode}
    </>
  );
}
