"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleSlash,
  Clock3,
  Lightbulb,
  Loader2,
  Pause,
  Play,
  Send,
  SkipForward,
  ThumbsUp,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { SpeakButton } from "@/components/speak-button";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";
import type { ClientTranslationSession } from "../service";
import {
  answerTranslationAction,
  completeTranslationAction,
  hintTranslationAction,
  moveTranslationAction,
  overrideTranslationAction,
  saveTranslationTimeAction,
  skipTranslationAction,
} from "../actions";
import { ItemExplain } from "./item-explain";
import { NewWords } from "./new-words";
import { formatDuration } from "./format";

export function TranslateSession({ initial }: { initial: ClientTranslationSession }) {
  const t = useT();
  const router = useRouter();
  const [s, setS] = React.useState(initial);
  const [index, setIndex] = React.useState(initial.currentIndex);
  const [draft, setDraft] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [paused, setPaused] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(initial.elapsedSec);
  const elapsedRef = React.useRef(elapsed);
  React.useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);
  const q = s.questions[index]!;
  const paragraph = s.config.type === "paragraph";
  const done = s.questions.filter((x) => x.answered).length;
  const allDone = done === s.total;
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Đồng hồ: chạy khi không tạm dừng và trang đang hiển thị.
  React.useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") setElapsed((e) => e + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [paused]);
  // Rời trang / ẩn tab → lưu thời gian.
  React.useEffect(() => {
    const save = () => {
      if (document.visibilityState === "hidden") void saveTranslationTimeAction(s.id, elapsedRef.current);
    };
    document.addEventListener("visibilitychange", save);
    return () => document.removeEventListener("visibilitychange", save);
  }, [s.id]);

  async function call(
    kind: string,
    fn: () => Promise<{ ok: true; data: ClientTranslationSession } | { ok: false; message: string }>,
  ) {
    setBusy(kind);
    const r = await fn();
    setBusy(null);
    if (!r.ok) return void toast.error(r.message);
    setS(r.data);
  }
  const check = () => call("check", () => answerTranslationAction(s.id, index, draft, elapsed));
  const skip = () => call("skip", () => skipTranslationAction(s.id, index, elapsed));
  const hint = () => call("hint", () => hintTranslationAction(s.id, index));
  const override = () => call("override", () => overrideTranslationAction(s.id, index));

  function go(i: number) {
    setIndex(i);
    setDraft("");
    void moveTranslationAction(s.id, i);
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }
  async function togglePause() {
    const next = !paused;
    setPaused(next);
    if (next) await saveTranslationTimeAction(s.id, elapsed);
  }
  async function finish() {
    setBusy("finish");
    const r = await completeTranslationAction(s.id, elapsed);
    if (!r.ok) {
      setBusy(null);
      return void toast.error(r.message);
    }
    router.push(`/translate/result/${r.data}`);
  }

  const toZh = q.direction === "to-zh";
  const firstOpen = s.questions.findIndex((x) => !x.answered);
  const status = (x: (typeof s.questions)[number]) => (x.result ?? "todo") as "todo" | "correct" | "wrong" | "skipped";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex min-w-0 flex-col gap-4">
        <header className="flex flex-wrap items-center gap-3 rounded-[var(--radius-xl)] border border-border bg-white px-4 py-3 shadow-card">
          <Button asChild variant="muted" size="sm">
            <Link href="/translate">
              <X />
              {t("translate.quit")}
            </Link>
          </Button>
          <h1 className="text-[18px] font-extrabold text-navy-900 md:text-[20px]">{t("translate.sessionTitle")}</h1>
          <p className="text-[15px] font-semibold text-text-2">
            {t(paragraph ? "translate.progressParagraph" : "translate.progressSentence", {
              n: index + 1,
              total: s.total,
            })}
          </p>
          <div className="ml-auto flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-blue-700 tabular-nums"
              aria-label={`${t("translate.timer")}: ${formatDuration(elapsed)}`}
              role="timer"
            >
              <Clock3 className="size-4" aria-hidden="true" />
              {formatDuration(elapsed)}
            </span>
            <Button variant="secondary" size="sm" onClick={togglePause} aria-pressed={paused}>
              {paused ? <Play /> : <Pause />}
              {paused ? t("translate.resumeTimer") : t("translate.pause")}
            </Button>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-[#EEF4FB]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={s.total}
            aria-valuenow={done}
            aria-label={t("translate.listLabel")}
          >
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${(done / s.total) * 100}%` }} />
          </div>
        </header>

        {paused ? (
          <section
            aria-labelledby="tr-paused"
            className="flex flex-col items-center gap-3 rounded-[var(--radius-xl)] border border-border bg-white p-8 text-center shadow-card"
          >
            <Pause className="size-10 text-blue-600" aria-hidden="true" />
            <h2 id="tr-paused" className="text-xl font-extrabold text-navy-900">
              {t("translate.paused")}
            </h2>
            <p className="text-text-2">{t("translate.pausedSub")}</p>
            <Button variant="primary" onClick={togglePause}>
              <Play />
              {t("translate.resumeTimer")}
            </Button>
          </section>
        ) : (
          <section
            aria-labelledby="tr-prompt"
            className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-white p-4 shadow-card md:p-6"
          >
            <div>
              <p id="tr-prompt" className="mb-1.5 text-[14px] font-bold tracking-wide text-blue-600 uppercase">
                {t(toZh ? "translate.translateToZh" : "translate.translateFromZh")}
              </p>
              <div className="flex items-start gap-3 rounded-2xl bg-[#F4F9FF] p-4">
                <div className="min-w-0 flex-1">
                  <p
                    id="tr-prompt-text"
                    className={cn(
                      "leading-relaxed text-navy-900",
                      toZh ? "text-[19px] font-semibold md:text-[21px]" : "hanzi text-[22px] font-bold md:text-[26px]",
                    )}
                    lang={toZh ? undefined : "zh"}
                  >
                    {q.prompt.text}
                  </p>
                  {"py" in q.prompt && q.prompt.py ? <p className="mt-1 text-[15px] pinyin">{q.prompt.py}</p> : null}
                </div>
                {!toZh ? <SpeakButton text={q.prompt.text} label={t("ui.listen", { text: q.prompt.text })} /> : null}
              </div>
            </div>

            <NewWords q={q} key={`nw-${index}`} />

            {q.hintWords || q.hintGrammar ? (
              <div className="grid gap-2 rounded-2xl border border-[#F6DE9E] bg-[#FFF9EA] p-3.5 text-[14.5px]">
                {q.hintWords ? (
                  <div>
                    <p className="font-bold text-[#8A5300]">{t("translate.hintWords")}</p>
                    <ul className="mt-1 flex flex-wrap gap-1.5">
                      {q.hintWords.map((w) => (
                        <li key={w.zh} className="rounded-lg bg-white px-2 py-1">
                          <span className="hanzi font-semibold" lang="zh">
                            {w.zh}
                          </span>{" "}
                          <span className="pinyin">{w.py}</span> · {w.meaning}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {q.hintGrammar ? (
                  <div>
                    <p className="font-bold text-[#8A5300]">{t("translate.hintGrammar")}</p>
                    <ul className="mt-1 grid gap-1">
                      {q.hintGrammar.map((g) => (
                        <li key={g.name}>
                          <span className="font-semibold">{g.name}:</span> {g.structure}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            {!q.answered ? (
              <>
                <label className="flex flex-col gap-2">
                  <span className="font-bold text-text">{t("translate.answerLabel")}</span>
                  <textarea
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && draft.trim()) void check();
                    }}
                    lang={toZh ? "zh" : undefined}
                    rows={paragraph ? 5 : 3}
                    maxLength={1000}
                    placeholder={t(toZh ? "translate.placeholderZh" : "translate.placeholderNative")}
                    className="min-h-24 w-full resize-y rounded-2xl border-[1.5px] border-border bg-white px-4 py-3 text-[17px] outline-none focus:border-blue-600 focus-visible:[box-shadow:var(--focus-ring)]"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={hint} disabled={!!busy || q.hints >= 2}>
                    {busy === "hint" ? <Loader2 className="animate-spin" /> : <Lightbulb />}
                    {q.hints ? t("translate.hintMore") : t("translate.hint")} ({q.hints}/2)
                  </Button>
                  <Button variant="muted" onClick={skip} disabled={!!busy}>
                    {busy === "skip" ? <Loader2 className="animate-spin" /> : <SkipForward />}
                    {t("translate.skip")}
                  </Button>
                  <Button
                    variant="primary"
                    className="ml-auto max-sm:w-full"
                    onClick={check}
                    disabled={!!busy || !draft.trim()}
                  >
                    {busy === "check" ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                    {t("translate.check")}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div
                  role="status"
                  className={cn(
                    "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl px-4 py-3",
                    q.result === "correct"
                      ? "bg-green-50 text-green-700"
                      : q.result === "wrong"
                        ? "bg-red-50 text-red"
                        : "bg-[#EEF4FB] text-text-2",
                  )}
                >
                  {q.result === "correct" ? (
                    <CheckCircle2 className="size-6" aria-hidden="true" />
                  ) : q.result === "wrong" ? (
                    <XCircle className="size-6" aria-hidden="true" />
                  ) : (
                    <CircleSlash className="size-6" aria-hidden="true" />
                  )}
                  <span className="text-[17px] font-bold">
                    {q.overridden
                      ? t("translate.overridden")
                      : t(
                          q.result === "correct"
                            ? "translate.correct"
                            : q.result === "wrong"
                              ? "translate.wrong"
                              : "translate.skipped",
                        )}
                  </span>
                  {q.result !== "skipped" ? (
                    <span className="text-[14.5px]">{t("translate.similarity", { n: q.similarity ?? 0 })}</span>
                  ) : null}
                  {q.result === "wrong" ? (
                    <Button variant="secondary" size="sm" className="ml-auto" onClick={override} disabled={!!busy}>
                      <ThumbsUp />
                      {t("translate.countAsCorrect")}
                    </Button>
                  ) : null}
                </div>
                <p className="text-[15px] text-text-2">
                  <span className="font-semibold">{t("translate.yourAnswer")}: </span>
                  <span className={toZh ? "hanzi text-text" : "text-text"} lang={toZh ? "zh" : undefined}>
                    {q.userAnswer || t("translate.noAnswer")}
                  </span>
                </p>
                {q.reveal ? <ItemExplain item={q.reveal} idPrefix={`q${index}`} /> : null}
              </>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <Button variant="secondary" onClick={() => go(index - 1)} disabled={index === 0 || !!busy}>
                <ArrowLeft />
                {t("translate.prev")}
              </Button>
              {allDone ? (
                <Button variant="primary" className="ml-auto" onClick={finish} disabled={!!busy}>
                  {busy === "finish" ? <Loader2 className="animate-spin" /> : <Send />}
                  {busy === "finish" ? t("translate.finishing") : t("translate.finish")}
                </Button>
              ) : (
                <Button
                  variant="solid"
                  className="ml-auto"
                  onClick={() => go(q.answered && index + 1 < s.total ? index + 1 : Math.max(firstOpen, 0))}
                  disabled={!q.answered || !!busy}
                >
                  {t("translate.next")}
                  <ArrowRight />
                </Button>
              )}
            </div>
          </section>
        )}
      </div>

      <aside
        aria-labelledby="tr-list"
        className="flex flex-col gap-3 self-start rounded-[var(--radius-xl)] border border-border bg-white p-4 shadow-card lg:sticky lg:top-4"
      >
        <h2 id="tr-list" className="font-bold text-navy-900">
          {t("translate.listLabel")}
        </h2>
        <ol className="grid grid-cols-5 gap-2 lg:grid-cols-4">
          {s.questions.map((x, i) => {
            const st = status(x);
            const reachable = x.answered || i === firstOpen;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  disabled={!reachable || paused}
                  aria-current={i === index ? "step" : undefined}
                  aria-label={`${t("translate.itemN", { n: i + 1 })}: ${t(`translate.itemStatus.${st}`)}`}
                  className={cn(
                    "flex h-11 w-full items-center justify-center rounded-xl border-[1.5px] font-bold outline-none focus-visible:[box-shadow:var(--focus-ring)] disabled:opacity-50",
                    st === "correct" && "border-green-100 bg-green-50 text-green-700",
                    st === "wrong" && "border-red-100 bg-red-50 text-red",
                    st === "skipped" && "border-border bg-[#EEF4FB] text-text-3",
                    st === "todo" && "border-border bg-white text-text-2",
                    i === index && "ring-2 ring-blue-600",
                  )}
                >
                  {i + 1}
                </button>
              </li>
            );
          })}
        </ol>
        <p className="text-[14px] text-text-2">{t("translate.score", { correct: s.correctCount, total: s.total })}</p>
      </aside>
    </div>
  );
}
