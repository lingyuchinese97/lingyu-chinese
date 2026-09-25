"use client";
import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, Volume2, VolumeX, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import type { LessonSection } from "@/data/lessons/schema";
import { submitSectionAction } from "../actions";
import { ProgressBar } from "./progress-bar";

const LABELS = ["A", "B", "C", "D"] as const;

/**
 * Làm một phần của bài: mỗi câu một màn, chọn đáp án → khoá 4 lựa chọn, báo đúng/sai (sai vẫn tô đáp án đúng).
 * Tiến độ đang làm lưu trong sessionStorage (refresh không mất). Hết phần → server chấm lại và lưu điểm.
 */
export function ExerciseRunner({
  lessonId,
  section,
  nextHref,
}: {
  lessonId: string;
  section: LessonSection;
  /** Phần tiếp theo, hoặc trang kết quả. */
  nextHref: string;
}) {
  const router = useRouter();
  const key = `ly-lesson:${lessonId}:${section.id}`;
  const total = section.questions.length;
  const [answers, setAnswers] = React.useState<(number | null)[]>(() => Array(total).fill(null));
  const [index, setIndex] = React.useState(0);
  const [saving, setSaving] = React.useState(false);

  // Khôi phục bài đang làm dở (chỉ trên trình duyệt).
  React.useEffect(() => {
    let saved: { answers: (number | null)[]; index: number } | null = null;
    try {
      saved = JSON.parse(sessionStorage.getItem(key) ?? "null");
    } catch {
      /* bỏ qua */
    }
    if (saved && saved.answers?.length === total && saved.index >= 0 && saved.index < total) {
      const s = saved;
      const t = setTimeout(() => {
        setAnswers(s.answers);
        setIndex(s.index);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [key, total]);
  const persist = (a: (number | null)[], i: number) => {
    try {
      sessionStorage.setItem(key, JSON.stringify({ answers: a, index: i }));
    } catch {
      /* bỏ qua */
    }
  };

  const q = section.questions[index]!;
  const picked = answers[index] ?? null;
  const answered = picked !== null;
  const correct = answered && picked === q.answer;
  const isLast = index === total - 1;

  function choose(i: number) {
    if (answered) return; // đã khoá
    const a = answers.slice();
    a[index] = i;
    setAnswers(a);
    persist(a, index);
  }

  async function next() {
    if (!answered) return;
    if (!isLast) {
      setIndex(index + 1);
      persist(answers, index + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    setSaving(true);
    const r = await submitSectionAction(lessonId, section.id, answers);
    if (!r.ok) {
      setSaving(false);
      return void toast.error(r.message);
    }
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* bỏ qua */
    }
    toast.success(`${section.title}: đúng ${r.data.score}/${r.data.total} câu.`);
    router.push(nextHref);
  }

  return (
    <div className="flex flex-col gap-4 pb-24 md:pb-0">
      <section
        aria-label={`${section.label}: ${section.title}`}
        className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-white p-4 shadow-card md:p-7"
      >
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-[#FDECA6] px-3 py-1 text-[13px] font-extrabold text-[#7A5A22]">
              {section.label} • {section.title}
            </span>
            <span className="text-sm font-bold text-navy" aria-live="polite">
              Câu {index + 1} / {total}
            </span>
          </div>
          <ProgressBar value={index + (answered ? 1 : 0)} max={total} label="Tiến độ phần này" />
        </header>

        <div className="flex flex-col items-center gap-3 text-center">
          <p className="font-bold text-text-2">{section.instruction}</p>
          <AudioButton key={`${section.id}-${q.id}`} src={q.audio} />
          {q.type === "blend" ? (
            <p className="text-[32px] font-extrabold tracking-wide text-navy" aria-label={`Ghép âm ${q.parts}`}>
              {q.parts}
            </p>
          ) : null}
        </div>

        <ul role="radiogroup" aria-label="Chọn đáp án" className="grid grid-cols-2 gap-3">
          {q.options.map((opt, i) => {
            const state = !answered ? "idle" : i === q.answer ? "correct" : i === picked ? "wrong" : "disabled";
            return (
              <li key={i}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={picked === i}
                  aria-disabled={answered || undefined}
                  onClick={() => choose(i)}
                  className={cn(
                    "flex min-h-[72px] w-full items-center gap-3 rounded-2xl border-2 px-3.5 py-3 text-left transition outline-none focus-visible:[box-shadow:var(--focus-ring)]",
                    state === "idle" && "border-border bg-white hover:border-[#A9D3F8] hover:bg-blue-50",
                    state === "correct" && "border-green bg-green-50",
                    state === "wrong" && "border-rose bg-red-50",
                    state === "disabled" && "border-border bg-white opacity-55",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold",
                      state === "correct"
                        ? "bg-green text-white"
                        : state === "wrong"
                          ? "bg-rose text-white"
                          : "bg-blue-50 text-blue-600",
                    )}
                  >
                    {LABELS[i]}
                  </span>
                  <span className="flex-1 text-2xl font-bold text-navy">{opt}</span>
                  {state === "correct" ? (
                    <CheckCircle2 className="size-6 text-green-700" aria-label="Đáp án đúng" />
                  ) : null}
                  {state === "wrong" ? <XCircle className="size-6 text-rose" aria-label="Sai" /> : null}
                </button>
              </li>
            );
          })}
        </ul>

        {answered ? (
          <div
            role="status"
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3",
              correct ? "bg-green-50 text-green-700" : "bg-red-50 text-red",
            )}
          >
            <Image
              src={correct ? "/brand/lesson/mascot_happy.png" : "/brand/lesson/mascot_sad.png"}
              alt=""
              width={56}
              height={54}
            />
            <div>
              <p className="font-extrabold">{correct ? "Chính xác! 🎉" : "Chưa đúng!"}</p>
              <p className="text-sm text-text-2">
                {correct ? (
                  "Bạn đã chọn đúng đáp án."
                ) : (
                  <>
                    Đáp án đúng là{" "}
                    <strong className="text-text">
                      {LABELS[q.answer]}. {q.options[q.answer]}
                    </strong>
                  </>
                )}
              </p>
              {q.explanation ? <p className="mt-1 text-sm text-text-2">{q.explanation}</p> : null}
            </div>
          </div>
        ) : null}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white px-4 pt-2.5 pb-[calc(10px+var(--safe-b))] shadow-[0_-6px_20px_rgba(20,60,110,.08)] md:static md:flex md:justify-end md:border-0 md:bg-transparent md:p-0 md:shadow-none">
        <Button variant="primary" size="lg" className="w-full md:w-auto" disabled={!answered || saving} onClick={next}>
          {saving ? <Loader2 className="animate-spin" /> : null}
          {saving
            ? "Đang lưu..."
            : isLast
              ? nextHref.endsWith("/result")
                ? "Xem kết quả"
                : "Tiếp tục"
              : "Câu tiếp theo"}
          {saving ? null : <ArrowRight />}
        </Button>
      </div>
    </div>
  );
}

/** Nút nghe lớn. Không có audio → vô hiệu kèm ghi chú (không crash). */
function AudioButton({ src }: { src?: string }) {
  const audio = React.useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  React.useEffect(
    () => () => {
      audio.current?.pause();
      audio.current = null;
    },
    [],
  );
  const missing = !src || failed;

  function play() {
    if (!src || playing) return;
    const a = (audio.current ??= new Audio(src));
    a.currentTime = 0;
    setPlaying(true);
    a.onended = () => setPlaying(false);
    a.onerror = () => {
      setPlaying(false);
      setFailed(true);
    };
    a.play().catch(() => {
      setPlaying(false);
    });
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="flex size-[88px] items-center justify-center rounded-full bg-[radial-gradient(circle,#CFE6FF,#D6EAFE)]">
        <button
          type="button"
          onClick={play}
          disabled={missing}
          aria-label={missing ? "Chưa có audio cho câu này" : playing ? "Đang phát" : "Nghe âm thanh"}
          className="flex size-[66px] items-center justify-center rounded-full bg-[linear-gradient(180deg,#3D9BFF,var(--color-blue))] text-white shadow-[0_6px_14px_rgba(11,95,238,.3)] outline-none focus-visible:[box-shadow:var(--focus-ring)] disabled:cursor-not-allowed disabled:bg-[#C4D3E3] disabled:bg-none disabled:shadow-none"
        >
          {missing ? (
            <VolumeX className="size-7" />
          ) : playing ? (
            <Loader2 className="size-7 animate-spin" />
          ) : (
            <Volume2 className="size-7" />
          )}
        </button>
      </span>
      {missing ? (
        <span className="text-[13px] text-text-3">Câu này chưa có audio — hãy chọn theo hiểu biết của bạn.</span>
      ) : (
        <span className="text-[13px] text-text-3">Nhấn để nghe (nghe lại bao nhiêu lần cũng được)</span>
      )}
    </div>
  );
}
