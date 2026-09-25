"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BarChart3, Check, Lightbulb, ListChecks, Loader2, Shuffle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";
import { useConfirm } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { applyToneInput } from "@/lib/pinyin";
import type { PromptType } from "@/lib/grading";
import { MODE_LABEL } from "../schema";
import type { ClientQuestion, ClientSession } from "../service";
import { abandonAction, checkAnswerAction, completeAction, moveToAction, rateAnswerAction } from "../actions";

const INSTR: Record<PromptType, string> = {
  meaning: "Nhập nghĩa tiếng Việt của từ sau:",
  hanzi: "Nhập chữ Hán (tiếng Trung) của từ sau:",
  pinyin: "Nhập pinyin của từ sau:",
};
const PLACEHOLDER: Record<PromptType, string> = {
  meaning: "Nhập nghĩa tiếng Việt của từ này...",
  hanzi: "Nhập chữ Hán...",
  pinyin: "Nhập pinyin (vd: nǐ hǎo hoặc ni3 hao3)...",
};
const TYPE_LABEL: Record<PromptType, string> = { meaning: "Nghĩa tiếng Việt", hanzi: "Chữ Hán", pinyin: "Pinyin" };
const TIP: Record<PromptType, string> = {
  pinyin: "Gõ số 1–4 sau chữ để thêm dấu, ví dụ ni3hao3 → nǐhǎo (viết liền hoặc cách đều được).",
  hanzi: "Bật bộ gõ tiếng Trung (Pinyin IME) để nhập chữ Hán nhanh hơn.",
  meaning: "Hãy nhớ nghĩa của từ và cách dùng trong ngữ cảnh nhé!",
};
/** ts-fsrs Rating */
const RATINGS = [
  { value: 2, label: "Khó", hint: "Nhớ ra nhưng vất vả" },
  { value: 3, label: "Được", hint: "Nhớ bình thường" },
  { value: 4, label: "Dễ", hint: "Nhớ ngay" },
] as const;

const img = (id: string | null | undefined) => (id ? `/api/images/${id}` : null);

export function ReviewSession({ initial }: { initial: ClientSession }) {
  const router = useRouter();
  const [confirm, confirmNode] = useConfirm();
  const [s, setS] = React.useState(initial);
  const furthest = () => {
    const i = s.questions.findIndex((q) => !q.answered);
    return i < 0 ? s.total - 1 : i;
  };
  const [idx, setIdx] = React.useState(Math.min(initial.currentIndex, furthest()));
  const [answer, setAnswer] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);
  const q = s.questions[idx]!;
  const isLast = idx === s.total - 1;
  const answered = s.questions.filter((x) => x.answered).length;
  const pct = Math.max(4, Math.round(((idx + 1) / s.total) * 100));
  const source = s.config.label || (s.config.tags.length ? s.config.tags.join(", ") : "Tất cả từ vựng");

  React.useEffect(() => {
    if (q.answered) nextRef.current?.focus();
    else inputRef.current?.focus();
  }, [idx, q.answered]);

  async function check(e?: React.FormEvent) {
    e?.preventDefault();
    if (!answer.trim() || busy) return;
    setBusy(true);
    const r = await checkAnswerAction({ sessionId: s.id, index: idx, answer });
    setBusy(false);
    if (!r.ok) return void toast.error(r.message || "Không kiểm tra được đáp án. Vui lòng thử lại.");
    setS(r.data);
    setAnswer("");
  }

  function go(i: number) {
    if (i < 0 || i > furthest()) return;
    setIdx(i);
    setAnswer("");
    void moveToAction(s.id, i);
    if (window.innerWidth < 1024) window.scrollTo({ top: 0 });
  }

  async function finish() {
    const un = s.questions.findIndex((x) => !x.answered);
    if (un >= 0) return go(un);
    setBusy(true);
    const r = await completeAction(s.id);
    if (!r.ok) {
      setBusy(false);
      return void toast.error(r.message || "Không lưu được kết quả. Vui lòng thử lại.");
    }
    router.push("/review/result");
  }

  async function rate(value: number) {
    const r = await rateAnswerAction(s.id, idx, value);
    if (!r.ok) return void toast.error(r.message);
    setS(r.data);
  }

  async function quit() {
    const ok = await confirm({
      title: "Kết thúc bài ôn tập?",
      message: `Bạn đã làm ${answered}/${s.total} câu. Nếu kết thúc bây giờ, tiến độ bài này sẽ không được lưu.`,
      confirmLabel: "Kết thúc",
      danger: true,
    });
    if (!ok) return;
    await abandonAction();
    toast.info("Đã kết thúc bài ôn tập.");
    router.push("/review/setup");
  }

  // Enter khi đã có kết quả → sang câu tiếp.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || !q.answered) return;
      const t = e.target as HTMLElement;
      if (t.closest("form, textarea, [role=dialog], button")) return;
      e.preventDefault();
      nextRef.current?.click();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [q.answered]);

  return (
    <>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
        <section
          aria-labelledby="qs-title"
          className="flex flex-col gap-5 rounded-[var(--radius-xl)] border border-border bg-white/92 p-4 shadow-card md:p-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 id="qs-title" className="text-2xl font-extrabold text-navy md:text-[28px]">
                {s.kind === "due" ? "Ôn thẻ đến hạn" : "Ôn tập từ vựng"}
              </h1>
              <p className="mt-1 text-[15px] text-text-2 md:text-[17px]">{INSTR[q.promptType]}</p>
            </div>
            <div className="flex w-full flex-col gap-1.5 sm:w-[220px]">
              <div className="text-right text-[15px] text-text-2">
                <strong className="text-navy">Câu {idx + 1}</strong> / {s.total}
              </div>
              <div
                role="progressbar"
                aria-label="Tiến độ bài ôn tập"
                aria-valuemin={0}
                aria-valuemax={s.total}
                aria-valuenow={idx + 1}
                className="h-2.5 overflow-hidden rounded-full bg-[#E4EEF8]"
              >
                <div className="h-full rounded-full transition-[width] bg-grad-primary" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>

          {!q.answered ? (
            <>
              <Prompt q={q} mixed={s.config.mode === "mixed"} />
              <form onSubmit={check} noValidate>
                <label htmlFor="answer" className="sr-only">
                  {PLACEHOLDER[q.promptType]}
                </label>
                <input
                  ref={inputRef}
                  id="answer"
                  value={answer}
                  lang={q.promptType === "hanzi" ? "zh" : undefined}
                  onChange={(e) =>
                    setAnswer(
                      q.promptType === "pinyin"
                        ? applyToneInput(
                            e.currentTarget,
                            e.nativeEvent instanceof InputEvent && e.nativeEvent.isComposing,
                          )
                        : e.target.value,
                    )
                  }
                  maxLength={200}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  placeholder={PLACEHOLDER[q.promptType]}
                  readOnly={busy}
                  className={cn(
                    inputClass,
                    "h-14 scroll-mb-[120px] text-center text-lg",
                    q.promptType === "hanzi" && "font-cn",
                  )}
                />
              </form>
              <p className="-mt-2 text-center text-[13.5px] text-text-3 max-md:hidden">Nhấn Enter để kiểm tra đáp án</p>
            </>
          ) : (
            <Feedback q={q} />
          )}

          {q.answered && s.kind === "due" && q.isCorrect ? (
            <div className="flex flex-col gap-2 rounded-[14px] bg-bg p-3.5">
              <span className="text-sm font-semibold text-text-2">Bạn nhớ từ này thế nào? (đổi lịch ôn tiếp theo)</span>
              <div role="radiogroup" aria-label="Tự đánh giá" className="grid grid-cols-3 gap-2">
                {RATINGS.map((r) => {
                  const on = q.reveal?.rating === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      title={r.hint}
                      onClick={() => rate(r.value)}
                      className={cn(
                        "min-h-11 rounded-[10px] border-[1.5px] font-semibold transition-colors",
                        on
                          ? "border-blue bg-blue text-white"
                          : "border-border bg-white text-text-2 hover:border-border-strong",
                      )}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Điện thoại: thanh nút dính ở đáy (màn tập trung). */}
          <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-[auto_1fr] gap-2.5 border-t border-border bg-white px-4 pt-2.5 pb-[calc(10px+var(--safe-b))] shadow-[0_-6px_20px_rgba(20,60,110,.08)] md:static md:flex md:justify-between md:border-0 md:bg-transparent md:p-0 md:shadow-none">
            <Button
              variant="muted"
              onClick={() => go(idx - 1)}
              disabled={idx === 0 || busy}
              aria-label="Câu trước"
              className="max-md:px-3.5"
            >
              <ArrowLeft />
              <span className="max-md:sr-only">Câu trước</span>
            </Button>
            {!q.answered ? (
              <Button
                variant="solid"
                onClick={() => check()}
                disabled={!answer.trim() || busy}
                className="md:min-w-[220px]"
              >
                {busy ? <Loader2 className="animate-spin" /> : null}
                {busy ? "Đang kiểm tra..." : "Kiểm tra đáp án"}
              </Button>
            ) : (
              <Button
                ref={nextRef}
                variant="solid"
                onClick={() => (isLast ? finish() : go(idx + 1))}
                disabled={busy}
                className="md:min-w-[220px]"
              >
                {busy ? <Loader2 className="animate-spin" /> : null}
                {isLast ? "Xem kết quả" : "Câu tiếp"}
                <ArrowRight />
              </Button>
            )}
          </div>
        </section>

        <aside aria-label="Thông tin bài ôn tập" className="flex flex-col gap-5">
          <RailCard icon={<BarChart3 />} title="Tiến độ">
            <div className="text-lg">
              <strong className="text-navy">Câu {idx + 1}</strong> / {s.total}
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#E4EEF8]">
              <div className="h-full rounded-full bg-grad-primary" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[15px] text-text-2">
              <span className="text-green-700">
                <Check className="inline size-4 -translate-y-px" /> Đúng <b>{s.correctCount}</b>
              </span>
              <span className="text-red">
                <X className="inline size-4 -translate-y-px" /> Sai <b>{s.wrongCount}</b>
              </span>
              <span>
                Đã làm <b>{answered}</b>/{s.total}
              </span>
            </div>
          </RailCard>
          <RailCard icon={<ListChecks />} title="Chế độ ôn tập" className="max-lg:hidden">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px]">
              <dt className="text-text-3">Nguồn từ vựng</dt>
              <dd className="font-semibold">{source}</dd>
              <dt className="text-text-3">Số lượng từ</dt>
              <dd className="font-semibold">{s.total} từ</dd>
              <dt className="text-text-3">Hình thức</dt>
              <dd className="font-semibold">{MODE_LABEL[s.config.mode]}</dd>
            </dl>
            {!q.answered ? (
              <div className="mt-4 flex gap-3 rounded-md bg-blue-50 p-3 text-sm text-text-2">
                <Lightbulb className="mt-0.5 size-5 shrink-0 text-amber" aria-hidden="true" />
                <div>
                  <strong className="text-navy">Mẹo nhỏ: </strong>
                  {TIP[q.promptType]}
                </div>
              </div>
            ) : null}
          </RailCard>
          <Button variant="secondary" size="sm" onClick={quit} className="self-stretch">
            <X />
            Kết thúc bài
          </Button>
        </aside>
      </div>
      {confirmNode}
    </>
  );
}

function RailCard({
  icon,
  title,
  className,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-xl)] border border-border bg-white/75 shadow-card",
        className,
      )}
    >
      <div className="flex items-center gap-3.5 bg-[linear-gradient(90deg,#EEF6FF,#F6FAFF)] px-5 py-3.5 text-lg font-semibold text-text">
        <span className="flex size-10 items-center justify-center rounded-full bg-[#E1EFFD] text-blue-600 [&_svg]:size-5">
          {icon}
        </span>
        {title}
      </div>
      <div className="bg-white px-5 py-4">{children}</div>
    </div>
  );
}

function Prompt({ q, mixed }: { q: ClientQuestion; mixed: boolean }) {
  const p = q.prompt;
  const src = img(p.imageId);
  return (
    <div className="relative flex flex-col items-center gap-2 rounded-[20px] border border-[#E1ECF7] bg-[linear-gradient(180deg,#F7FBFF,#EEF6FE)] px-4 py-6 text-center md:py-8">
      {mixed ? (
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-blue-600">
          <Shuffle className="size-3.5" />
          {TYPE_LABEL[q.promptType]}
        </span>
      ) : null}
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="Hình minh họa" className="mb-2 max-h-[180px] rounded-xl object-contain" />
      ) : null}
      {q.promptType === "hanzi" ? (
        <>
          <div className="text-2xl font-bold text-navy md:text-[28px]">{p.meaningVi}</div>
          <div className="text-lg pinyin">{p.pinyin}</div>
        </>
      ) : (
        <>
          <div className="hanzi text-[56px] leading-tight md:text-[72px]" lang="zh">
            {p.hanzi}
          </div>
          <div className={q.promptType === "meaning" ? "text-xl pinyin" : "text-lg text-text-2"}>
            {q.promptType === "meaning" ? p.pinyin : p.meaningVi}
          </div>
        </>
      )}
    </div>
  );
}

function WordCard({
  w,
  label,
  mine,
}: {
  w: { hanzi: string; pinyin: string; meaningVi: string; imageId: string | null };
  label: string;
  mine?: boolean;
}) {
  const src = img(w.imageId);
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-[16px] border p-4 text-center",
        mine ? "border-red-100 bg-red-50/60" : "border-green-100 bg-green-50/70",
      )}
    >
      <span className={cn("text-xs font-bold tracking-wide uppercase", mine ? "text-red" : "text-green-700")}>
        {label}
      </span>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="my-1 max-h-24 rounded-lg object-contain" />
      ) : null}
      <div className="hanzi text-4xl" lang="zh">
        {w.hanzi}
      </div>
      <div className="pinyin">{w.pinyin}</div>
      <div className="text-text">{w.meaningVi}</div>
    </div>
  );
}

function Feedback({ q }: { q: ClientQuestion }) {
  const w = q.reveal!;
  const note = w.note ? (
    <div className="flex gap-3 rounded-[14px] bg-[#FFF9E8] p-4 text-[15px]">
      <Lightbulb className="mt-0.5 size-5 shrink-0 text-amber" aria-hidden="true" />
      <div>
        <strong className="text-navy">Ghi chú</strong>
        <p className="mt-0.5 break-words whitespace-pre-wrap text-text-2">{w.note}</p>
      </div>
    </div>
  ) : null;
  if (q.isCorrect)
    return (
      <div role="status" className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-[16px] bg-green-50 px-4 py-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-green text-white">
            <Check className="size-5" strokeWidth={3} />
          </span>
          <div>
            <div className="text-lg font-bold text-green-700">Chính xác!</div>
            <div className="text-sm text-text-2">Bạn đã trả lời đúng: “{q.userAnswer}”.</div>
          </div>
        </div>
        <WordCard w={w} label="Đáp án đúng" />
        {note}
      </div>
    );
  return (
    <div role="status" className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-[16px] bg-red-50 px-4 py-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-red text-white">
          <X className="size-5" strokeWidth={3} />
        </span>
        <div>
          <div className="text-lg font-bold text-red">Chưa đúng!</div>
          <div className="text-sm text-text-2">Hãy xem lại đáp án bên dưới nhé.</div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <WordCard w={w} label="Đáp án đúng" />
        {w.matched ? (
          <WordCard w={w.matched} label="Bạn đã trả lời" mine />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 rounded-[16px] border border-red-100 bg-red-50/60 p-4 text-center">
            <span className="text-xs font-bold tracking-wide text-red uppercase">Bạn đã trả lời</span>
            <div
              lang={q.promptType === "hanzi" ? "zh" : undefined}
              className={cn(
                "text-xl break-all text-text",
                q.promptType === "hanzi" && "font-cn",
                !q.userAnswer && "text-text-3",
              )}
            >
              {q.userAnswer || "(bỏ trống)"}
            </div>
          </div>
        )}
      </div>
      {note}
    </div>
  );
}
