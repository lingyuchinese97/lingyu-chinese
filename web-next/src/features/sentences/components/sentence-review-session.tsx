"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Lightbulb, Loader2, RotateCcw, Smile, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { SpeakButton } from "@/components/speak-button";
import { cn } from "@/lib/utils";
import type { ClientSentenceSession } from "../review-service";
import {
  answerSentenceAction,
  completeSentenceAction,
  hintSentenceAction,
  moveSentenceToAction,
  overrideSentenceAction,
  rememberSentenceAction,
  skipSentenceAction,
} from "../actions";

export function SentenceReviewSession({ initial }: { initial: ClientSentenceSession }) {
  const router = useRouter();
  const [s, setS] = React.useState(initial);
  const [index, setIndex] = React.useState(initial.currentIndex);
  const [answer, setAnswer] = React.useState("");
  const [busy, setBusy] = React.useState<"" | "check" | "skip" | "next" | "hint" | "mark">("");
  const input = React.useRef<HTMLTextAreaElement>(null);

  const q = s.questions[index]!;
  const isLast = index === s.total - 1;
  const done = s.questions.filter((x) => x.answered).length;
  const viZh = q.direction === "vi-zh";

  React.useEffect(() => {
    if (!q.answered) input.current?.focus();
  }, [index, q.answered]);

  async function call<T extends { ok: boolean }>(kind: typeof busy, p: Promise<T>) {
    setBusy(kind);
    const r = await p;
    setBusy("");
    if (!r.ok) toast.error((r as unknown as { message: string }).message);
    return r;
  }
  async function check() {
    if (!answer.trim() || busy) return;
    const r = await call("check", answerSentenceAction(s.id, index, answer));
    if (r.ok) setS(r.data);
  }
  async function skip() {
    if (busy) return;
    const r = await call("skip", skipSentenceAction(s.id, index));
    if (r.ok) setS(r.data);
  }
  async function hint() {
    const r = await call("hint", hintSentenceAction(s.id, index));
    if (r.ok) setS(r.data);
  }
  async function override() {
    const r = await call("mark", overrideSentenceAction(s.id, index));
    if (r.ok) {
      setS(r.data);
      toast.success("Đã tính câu này là đúng.");
    }
  }
  async function remember(v: boolean) {
    const r = await call("mark", rememberSentenceAction(s.id, index, v));
    if (r.ok) {
      setS(r.data);
      toast.success(v ? "Đã đánh dấu câu này là Đã thuộc." : "Đã đánh dấu câu này cần ôn thêm.");
    }
  }
  async function next() {
    if (busy) return;
    if (isLast) {
      const r = await call("next", completeSentenceAction(s.id));
      if (r.ok) router.push("/sentences/review/result");
      return;
    }
    setIndex(index + 1);
    setAnswer("");
    void moveSentenceToAction(s.id, index + 1);
    window.scrollTo({ top: 0 });
  }
  function back() {
    if (index === 0) return;
    setIndex(index - 1);
    setAnswer("");
    void moveSentenceToAction(s.id, index - 1);
  }

  const correct = q.result === "correct";
  const skipped = q.result === "skipped";
  return (
    <div className="flex flex-col gap-4 pb-28 md:pb-0">
      <section
        aria-labelledby="sr-title"
        className="relative flex flex-col gap-4 overflow-hidden rounded-[var(--radius-xl)] border border-border bg-white/94 p-4 shadow-card md:p-7"
      >
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={back}
              disabled={index === 0}
              aria-label="Câu trước"
              className="-ml-2 flex size-10 items-center justify-center rounded-full text-text-2 hover:bg-blue-50 disabled:opacity-30"
            >
              <ArrowLeft className="size-6" />
            </button>
            <h1 id="sr-title" className="text-xl font-extrabold text-navy md:text-2xl">
              {q.answered ? "Đáp án" : "Ôn dịch câu"}{" "}
              <span className="font-semibold text-text-2" aria-live="polite">
                ({index + 1}/{s.total})
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div
              role="progressbar"
              aria-label="Tiến độ bài ôn"
              aria-valuemin={0}
              aria-valuemax={s.total}
              aria-valuenow={done}
              className="h-2 flex-1 overflow-hidden rounded-full bg-blue-50"
            >
              <span
                className="block h-full rounded-full bg-[linear-gradient(90deg,var(--color-blue),var(--color-cyan))] transition-[width]"
                style={{ width: `${(done / s.total) * 100}%` }}
              />
            </div>
            <span className="text-sm text-text-2 tabular-nums">{Math.round((done / s.total) * 100)}%</span>
          </div>
        </header>

        {!q.answered ? (
          <>
            <div className="flex flex-col gap-3 rounded-2xl bg-[#F4F9FF] p-4 md:p-5">
              <span className="w-fit rounded-lg bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                {viZh ? "Việt → Trung" : "Trung → Việt"}
              </span>
              <p
                className={cn("text-[22px] font-bold text-text md:text-[26px]", !viZh && "hanzi text-navy")}
                lang={viZh ? "vi" : "zh"}
              >
                {q.prompt.text}
                {!viZh ? <SpeakButton text={q.prompt.text} className="ml-1 align-middle" /> : null}
              </p>
              {q.prompt.pinyin ? <p className="-mt-1 pinyin">{q.prompt.pinyin}</p> : null}
              {viZh && q.hint ? (
                <p className="text-[15px] text-text-2">
                  Gợi ý: bắt đầu bằng chữ{" "}
                  <span className="hanzi text-xl text-red" lang="zh">
                    {q.hint}
                  </span>
                </p>
              ) : null}
              <label htmlFor="sr-answer" className="sr-only">
                {viZh ? "Câu tiếng Trung của bạn" : "Câu tiếng Việt của bạn"}
              </label>
              <textarea
                id="sr-answer"
                ref={input}
                rows={2}
                value={answer}
                maxLength={400}
                lang={viZh ? "zh" : "vi"}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    void check();
                  }
                }}
                placeholder={viZh ? "Nhập câu tiếng Trung..." : "Nhập câu tiếng Việt..."}
                autoComplete="off"
                className="min-h-14 w-full resize-none rounded-md border-[1.5px] border-border bg-white px-4 py-3 text-lg text-text outline-none focus:border-blue focus:[box-shadow:var(--focus-ring)]"
              />
              {viZh && !q.hint ? (
                <button
                  type="button"
                  onClick={hint}
                  disabled={!!busy}
                  className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-blue-600 hover:underline"
                >
                  <Lightbulb className="size-4" aria-hidden="true" />
                  Xem gợi ý
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <div
            className={cn(
              "flex flex-col gap-3 rounded-2xl p-4 md:p-5",
              correct ? "bg-green-50" : skipped ? "bg-[#F4F9FF]" : "bg-red-50",
            )}
          >
            <div className="flex items-center gap-3">
              <Image
                src={correct ? "/brand/lesson/mascot_happy.png" : "/brand/lesson/mascot_sad.png"}
                alt=""
                width={56}
                height={54}
              />
              <p
                role="status"
                className={cn(
                  "flex items-center gap-2 text-xl font-extrabold",
                  correct ? "text-green-700" : skipped ? "text-text-2" : "text-red",
                )}
              >
                {correct ? <CheckCircle2 className="size-6" /> : <XCircle className="size-6" />}
                {correct
                  ? q.overridden
                    ? "Đã tính là đúng"
                    : "Chính xác! 🎉"
                  : skipped
                    ? "Đã bỏ qua"
                    : "Chưa chính xác"}
              </p>
            </div>
            <p className="text-[15px] text-text-2">
              {viZh ? "Câu tiếng Việt:" : "Câu tiếng Trung:"}{" "}
              <span className={cn("text-text", !viZh && "hanzi")} lang={viZh ? "vi" : "zh"}>
                {viZh ? q.reveal!.vietnamese : q.reveal!.chinese}
              </span>
            </p>
            {q.userAnswer && !correct ? (
              <p className="text-[15px] text-text-2">
                Bạn đã trả lời: <span className="text-text">{q.userAnswer}</span>
              </p>
            ) : null}
            <div className="rounded-xl bg-white p-4">
              <p className="mb-1 text-sm font-semibold text-text-2">Đáp án{correct ? "" : " đúng"}:</p>
              {viZh ? (
                <>
                  <p className="flex items-center gap-1 text-2xl font-bold text-text">
                    <span className="hanzi text-text" lang="zh">
                      {q.reveal!.chinese}
                    </span>
                    <SpeakButton text={q.reveal!.chinese} />
                  </p>
                  {q.reveal!.pinyin ? <p className="pinyin">Pinyin: {q.reveal!.pinyin}</p> : null}
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-text">{q.reveal!.vietnamese}</p>
                  {q.reveal!.pinyin ? <p className="pinyin">Pinyin: {q.reveal!.pinyin}</p> : null}
                </>
              )}
              {q.reveal!.note ? <p className="mt-2 text-sm text-text-2">Ghi chú: {q.reveal!.note}</p> : null}
            </div>
            {q.result === "wrong" ? (
              <button
                type="button"
                onClick={override}
                disabled={!!busy}
                className="self-start text-sm font-semibold text-blue-600 hover:underline"
              >
                Tôi dịch đúng nghĩa (cách khác) — tính là đúng
              </button>
            ) : null}
          </div>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2.5 border-t border-border bg-white px-4 pt-2.5 pb-[calc(10px+var(--safe-b))] shadow-[0_-6px_20px_rgba(20,60,110,.08)] md:static md:flex md:justify-between md:border-0 md:bg-transparent md:p-0 md:shadow-none">
        {!q.answered ? (
          <>
            <Button variant="secondary" size="lg" onClick={skip} disabled={!!busy}>
              Bỏ qua
            </Button>
            <Button variant="primary" size="lg" onClick={check} disabled={!!busy || !answer.trim()}>
              {busy === "check" ? <Loader2 className="animate-spin" /> : null}
              Kiểm tra
              <ArrowRight />
            </Button>
          </>
        ) : (
          <>
            {correct ? (
              <Button
                variant="secondary"
                size="lg"
                aria-pressed={q.remembered === true}
                onClick={() => remember(true)}
                disabled={!!busy}
              >
                <Smile />
                {q.remembered === true ? "Đã nhớ" : "Tôi nhớ"}
              </Button>
            ) : (
              <Button
                variant="danger-outline"
                size="lg"
                aria-pressed={q.remembered === false}
                onClick={() => remember(false)}
                disabled={!!busy}
              >
                <RotateCcw />
                {q.remembered === false ? "Đã đánh dấu cần ôn" : "Tôi chưa nhớ"}
              </Button>
            )}
            <Button variant="primary" size="lg" onClick={next} disabled={!!busy}>
              {busy === "next" ? <Loader2 className="animate-spin" /> : null}
              {isLast ? "Xem kết quả" : "Câu tiếp theo"}
              <ArrowRight />
            </Button>
          </>
        )}
      </div>
      <p className="text-center text-sm text-text-3 max-md:hidden">
        <Link href="/sentences" className="hover:underline">
          Thoát (bài ôn được lưu, làm tiếp sau)
        </Link>
      </p>
    </div>
  );
}
