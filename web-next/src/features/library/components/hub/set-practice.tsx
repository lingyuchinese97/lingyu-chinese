"use client";
import * as React from "react";
import { CheckCircle2, Headphones, Image as ImageIcon, RotateCcw, Volume2, XCircle } from "lucide-react";
import { SpeakButton } from "@/components/speak-button";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import type { SetDetail } from "../../sets";
import { setWordLearnedAction } from "../../actions";
import { card } from "./parts";

type Word = SetDetail["words"][number];
type Mode = "listen" | "image";
type Q = { word: Word; options: Word[] };
const MAX = 10;

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j]!, b[i]!];
  }
  return b;
}
function build(words: Word[]): Q[] {
  // Từ chưa học trước, rồi tới từ đã học.
  const order = [...shuffle(words.filter((w) => !w.learned)), ...shuffle(words.filter((w) => w.learned))];
  return order.slice(0, MAX).map((word) => ({
    word,
    options: shuffle([word, ...shuffle(words.filter((w) => w.zh !== word.zh)).slice(0, 3)]),
  }));
}

/** Luyện tập nhanh với một bộ từ: nghe và chọn nghĩa, hoặc ghép từ với hình. Trả lời đúng → đánh dấu đã học. */
export function SetPractice({
  setId,
  words,
  onLearned,
  onBack,
}: {
  setId: string;
  words: Word[];
  onLearned: (zh: string) => void;
  onBack: () => void;
}) {
  const t = useT();
  const [mode, setMode] = React.useState<Mode | null>(null);
  const [qs, setQs] = React.useState<Q[]>([]);
  const [i, setI] = React.useState(0);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [score, setScore] = React.useState(0);

  function start(m: Mode) {
    setMode(m);
    setQs(build(words));
    setI(0);
    setPicked(null);
    setScore(0);
  }
  const q = qs[i];
  async function choose(o: Word) {
    if (!q || picked) return;
    setPicked(o.zh);
    if (o.zh === q.word.zh) {
      setScore((s) => s + 1);
      if (!q.word.learned) {
        onLearned(q.word.zh);
        await setWordLearnedAction(setId, q.word.zh, true);
      }
    }
  }
  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    // Nút loa riêng (SpeakButton) lo chọn giọng; ở đây chỉ phát tự động khi sang câu mới nếu trình duyệt cho phép.
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 0.6;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }
  React.useEffect(() => {
    if (mode === "listen" && q && !picked) speak(q.word.zh);
  }, [mode, q, picked]);

  if (!mode) {
    return (
      <section aria-labelledby="sp-title" className={cn(card, "p-4 md:p-5")}>
        <h2 id="sp-title" className="mb-3 text-[20px] font-extrabold text-navy-900">
          {t("libhub.tabPractice")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["listen", Headphones],
              ["image", ImageIcon],
            ] as const
          ).map(([m, Icon]) => (
            <button
              key={m}
              type="button"
              onClick={() => start(m)}
              disabled={words.length < 2}
              className="flex items-center gap-3 rounded-[16px] border border-border p-4 text-left hover:border-blue-600 hover:bg-[#F7FAFE]"
            >
              <span className="flex size-12 items-center justify-center rounded-[14px] bg-blue-50 text-blue-600">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-bold text-navy-900">{t(`libhub.modes.${m}`)}</span>
                <span className="block text-[13.5px] text-text-2">{t(`libhub.modes.${m}Sub`)}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  if (!q) {
    return (
      <section aria-labelledby="sp-done" className={cn(card, "flex flex-col items-center gap-3 p-8 text-center")}>
        <CheckCircle2 className="size-12 text-[#22C08A]" aria-hidden="true" />
        <h2 id="sp-done" className="text-[22px] font-extrabold text-navy-900">
          {t("libhub.finish", { score, total: qs.length })}
        </h2>
        <p className="text-text-2">{t("libhub.finishSub")}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => start(mode)}
            className="inline-flex min-h-11 items-center gap-2 rounded-[12px] bg-blue-600 px-5 font-semibold text-white hover:bg-blue-700"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            {t("libhub.again")}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-11 items-center rounded-[12px] border border-border px-5 font-semibold text-navy-900 hover:bg-blue-50"
          >
            {t("libhub.backToList")}
          </button>
        </div>
      </section>
    );
  }

  const right = picked === q.word.zh;
  return (
    <section aria-labelledby="sp-q" className={cn(card, "flex flex-col gap-4 p-4 md:p-6")}>
      <div className="flex items-center gap-3">
        <h2 id="sp-q" className="text-[15px] font-bold text-text-2">
          {t(`libhub.modes.${mode}`)} · {t("libhub.quizOf", { n: i + 1, total: qs.length })}
        </h2>
        <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#E6EEF8]">
          <span
            className="block h-full rounded-full bg-blue-600"
            style={{ width: `${((i + 1) / qs.length) * 100}%` }}
          />
        </span>
      </div>
      <div className="flex flex-col items-center gap-2 rounded-[18px] bg-[#F3F8FE] p-6">
        {mode === "listen" ? (
          <>
            <span lang="zh" className="hanzi text-[52px] font-bold text-navy-900">
              {q.word.zh}
            </span>
            <SpeakButton text={q.word.zh} label={t("libhub.replay")} className="size-11">
              <span className="sr-only">{t("libhub.replay")}</span>
            </SpeakButton>
            <p className="font-semibold text-text-2">{t("libhub.chooseMeaning")}</p>
          </>
        ) : (
          <>
            <span aria-hidden="true" className="text-[88px]">
              {q.word.emoji}
            </span>
            <p className="sr-only">{q.word.meaning}</p>
            <p className="font-semibold text-text-2">{t("libhub.chooseWord")}</p>
          </>
        )}
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {q.options.map((o, k) => {
          const isAns = o.zh === q.word.zh;
          return (
            <li key={o.zh}>
              <button
                type="button"
                onClick={() => choose(o)}
                disabled={!!picked}
                className={cn(
                  "flex min-h-14 w-full items-center gap-3 rounded-[14px] border px-4 text-left text-[16px] font-semibold",
                  !picked && "border-border hover:border-blue-600 hover:bg-[#F7FAFE]",
                  picked && isAns && "border-[#22C08A] bg-green-50 text-green-800",
                  picked === o.zh && !isAns && "border-red bg-red-50 text-red",
                  picked && !isAns && picked !== o.zh && "border-border opacity-60",
                )}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-bold text-text-2">
                  {"ABCD"[k]}
                </span>
                {mode === "listen" ? (
                  o.meaning
                ) : (
                  <span>
                    <span lang="zh" className="hanzi text-[20px]">
                      {o.zh}
                    </span>{" "}
                    <span className="font-normal pinyin text-text-2">{o.py}</span>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {picked ? (
        <div className="flex flex-wrap items-center gap-3">
          <p role="status" className={cn("flex items-center gap-2 font-bold", right ? "text-green-700" : "text-red")}>
            {right ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
            {right
              ? t("libhub.correct")
              : t("libhub.wrong", { answer: `${q.word.zh} (${q.word.py}) — ${q.word.meaning}` })}
          </p>
          <button
            type="button"
            onClick={() => {
              setI((n) => n + 1);
              setPicked(null);
            }}
            className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-[12px] bg-blue-600 px-5 font-semibold text-white hover:bg-blue-700"
          >
            {t("libhub.nextQ")}
            <Volume2 className="hidden" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </section>
  );
}
