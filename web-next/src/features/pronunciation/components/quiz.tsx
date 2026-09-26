"use client";
import * as React from "react";
import { CheckCircle2, Lightbulb, RotateCcw, Snail, Sparkles, Target, Volume2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/i18n/client";
import { applyToneInput } from "@/lib/pinyin";
import { cn } from "@/lib/utils";
import { SANDHI_RULES, TONES } from "@/data/pronunciation";
import { checkAnswer, type PracticeQuestion } from "../practice";
import { PCard, PTitle } from "./pron-header";
import { Recorder } from "./recorder";
import { SPEECH_RATE, speakZh, useChineseVoice, useL } from "./speech";

type Answer = { input: string; correct: boolean };

const PROMPT = {
  "listen-choose": "promptListen",
  "listen-type": "promptType",
  "speak-compare": "promptSpeak",
  pairs: "promptPairs",
  "read-words": "promptRead",
  sandhi: "promptSandhi",
} as const;

/**
 * Làm một bài luyện tập: nghe (giọng của máy) → chọn / gõ / ghi âm → kiểm tra → câu tiếp. Chấm ngay trên máy, không lưu.
 * `aside`: hiện cột Gợi ý / Tiến độ / Mẹo nhỏ bên phải (trang Luyện tập).
 */
export function Quiz({
  questions,
  onRestart,
  aside,
  label,
}: {
  questions: PracticeQuestion[];
  onRestart: () => void;
  aside?: boolean;
  label: string;
}) {
  const t = useT();
  const l = useL();
  const voice = useChineseVoice();
  const [index, setIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<number, Answer>>({});
  const [choice, setChoice] = React.useState("");
  const [typed, setTyped] = React.useState("");
  const [hint, setHint] = React.useState(false);
  const [error, setError] = React.useState("");
  const [finished, setFinished] = React.useState(false);
  const q = questions[index]!;
  const done = answers[index];
  const total = questions.length;
  const answered = Object.keys(answers).length;
  const right = Object.values(answers).filter((a) => a.correct).length;
  // Chữ Hán: luyện đọc / biến điệu luôn hiện; bài nghe chỉ hiện sau khi trả lời (hoặc khi máy không có giọng đọc).
  const showHanzi = q.mode === "read-words" || q.mode === "sandhi" || q.mode === "speak-compare" || !!done || !voice;
  const speakText = q.speak;

  function answer(input: string, correct = checkAnswer(q, input)) {
    setAnswers((a) => ({ ...a, [index]: { input, correct } }));
    setError("");
  }
  function check() {
    if (q.mode === "listen-type") {
      if (!typed.trim()) return setError(t("pronunciation.practice.typeFirst"));
      return answer(typed);
    }
    if (!choice) return setError(t("pronunciation.practice.pickFirst"));
    answer(choice);
  }
  function next() {
    if (index + 1 >= total) return setFinished(true);
    setIndex(index + 1);
    setChoice("");
    setTyped("");
    setHint(false);
    setError("");
  }

  const hints: string[] = [];
  if (q.hint.initial) hints.push(t("pronunciation.practice.hintInitial", { v: q.hint.initial }));
  if (q.hint.final) hints.push(t("pronunciation.practice.hintFinal", { v: q.hint.final }));
  if (q.hint.tone) hints.push(l(TONES.find((x) => x.tone === q.hint.tone)!.name));
  if (q.hint.tones) hints.push(t("pronunciation.practice.hintTones", { v: q.hint.tones.join(" · ") }));
  if (q.hint.rule)
    hints.push(t("pronunciation.practice.hintRule", { v: l(SANDHI_RULES.find((r) => r.id === q.hint.rule)!.title) }));

  const main = finished ? (
    <PCard aria-label={label} className="flex flex-col items-center gap-3 py-10 text-center">
      <Sparkles className="size-10 text-amber" aria-hidden="true" />
      <p role="status" className="text-[22px] font-extrabold text-navy-900">
        {t("pronunciation.practice.result", { correct: right, total })}
      </p>
      <Button onClick={onRestart}>
        <RotateCcw />
        {t("pronunciation.practice.restart")}
      </Button>
    </PCard>
  ) : (
    <PCard aria-label={label} className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-[15px] font-bold text-navy-900 tabular-nums">
          {t("pronunciation.practice.progress", { n: index + 1, total })}
        </span>
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-blue-50"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={answered}
          aria-label={t("pronunciation.practice.progressTitle")}
        >
          <div className="h-full rounded-full bg-blue" style={{ width: `${(answered / total) * 100}%` }} />
        </div>
      </div>

      <p className="text-center text-[16px] font-semibold text-text-2">
        {t(`pronunciation.practice.${PROMPT[q.mode]}`)}
      </p>

      <div className="flex flex-col items-center gap-3">
        {voice ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => speakZh(speakText)}
              aria-label={t("pronunciation.practice.playLabel", { n: index + 1 })}
              className="flex size-[88px] items-center justify-center rounded-full text-white shadow-cta outline-none bg-grad-primary focus-visible:shadow-[var(--focus-ring)] active:scale-95"
            >
              <Volume2 className="size-10" aria-hidden="true" />
            </button>
            <Button variant="ghost" size="sm" onClick={() => speakZh(speakText, SPEECH_RATE.slow)}>
              <Snail />
              {t("pronunciation.practice.slow")}
            </Button>
          </div>
        ) : (
          <p className="rounded-[12px] bg-amber-50 px-3 py-2 text-center text-[14px] text-[#8A5300]">
            {t("pronunciation.practice.noVoice")}
          </p>
        )}
        {showHanzi ? (
          <div className="text-center">
            <div className="hanzi text-[44px] leading-tight font-bold text-navy-900" lang="zh">
              {q.hanzi}
            </div>
            <div className="text-[14px] text-text-2">{l(q.meaning)}</div>
            {q.mode === "speak-compare" ? <div className="text-[18px] pinyin">{q.answer}</div> : null}
          </div>
        ) : null}
      </div>

      {q.options.length ? (
        <div
          role="radiogroup"
          aria-label={t("pronunciation.practice.options")}
          className={cn("grid gap-2.5", q.options.length === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4")}
        >
          {q.options.map((o, i) => {
            const picked = (done?.input ?? choice) === o;
            const state = done ? (o === q.answer ? "right" : picked ? "wrong" : "") : picked ? "picked" : "";
            return (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={picked}
                disabled={!!done}
                onClick={() => {
                  setChoice(o);
                  setError("");
                }}
                className={cn(
                  "flex min-h-14 items-center gap-2.5 rounded-[14px] border-[1.5px] px-3 text-left outline-none focus-visible:shadow-[var(--focus-ring)] disabled:cursor-default",
                  state === "" && "border-border bg-white hover:border-[#A9D3F8] hover:bg-[#F7FBFF]",
                  state === "picked" && "border-blue-600 bg-blue-50",
                  state === "right" && "border-green bg-green-50",
                  state === "wrong" && "border-red bg-red-50",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-[14px] font-bold",
                    state === "right"
                      ? "bg-green text-white"
                      : state === "wrong"
                        ? "bg-red text-white"
                        : state === "picked"
                          ? "bg-blue-600 text-white"
                          : "bg-blue-50 text-blue-700",
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-[19px] font-semibold text-navy-900">{o}</span>
              </button>
            );
          })}
        </div>
      ) : q.mode === "listen-type" ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pr-type" className="text-[14.5px] font-semibold text-text">
            {t("pronunciation.practice.typeLabel")}
          </label>
          <Input
            id="pr-type"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={done?.input ?? typed}
            disabled={!!done}
            placeholder={t("pronunciation.practice.typePlaceholder")}
            onChange={(e) => {
              setTyped(applyToneInput(e.currentTarget, (e.nativeEvent as InputEvent).isComposing));
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !done) {
                e.preventDefault();
                check();
              }
            }}
            className="text-[18px]"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Recorder key={q.id} />
          {!done ? (
            <div className="flex flex-col gap-2">
              <span className="text-[14.5px] font-semibold text-text">{t("pronunciation.practice.selfCheck")}</span>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => answer("same", true)}>
                  <CheckCircle2 />
                  {t("pronunciation.practice.same")}
                </Button>
                <Button variant="secondary" onClick={() => answer("not-same", false)}>
                  <XCircle />
                  {t("pronunciation.practice.notSame")}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {error ? (
        <p role="alert" className="text-[14px] text-red">
          {error}
        </p>
      ) : null}

      {done && q.mode !== "speak-compare" ? (
        <div
          role="status"
          className={cn(
            "flex flex-col gap-0.5 rounded-[14px] px-4 py-3 text-[15px] font-semibold",
            done.correct ? "bg-green-50 text-green-700" : "bg-red-50 text-red",
          )}
        >
          <span className="flex items-center gap-2">
            {done.correct ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
            {done.correct
              ? t("pronunciation.practice.correct")
              : t("pronunciation.practice.wrong", { answer: q.answer })}
          </span>
          {q.written ? (
            <span className="text-[14px] font-normal text-text-2">
              {t("pronunciation.practice.written", { written: q.written })}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        {!aside && hints.length && !done ? (
          <Button variant="ghost" size="sm" className="mr-auto" onClick={() => setHint((h) => !h)} aria-expanded={hint}>
            <Lightbulb />
            {t("pronunciation.practice.hintShow")}
          </Button>
        ) : null}
        {done ? (
          <Button onClick={next}>
            {index + 1 >= total ? t("pronunciation.practice.finish") : t("pronunciation.practice.next")}
          </Button>
        ) : q.mode !== "speak-compare" ? (
          <Button onClick={check}>{t("pronunciation.practice.check")}</Button>
        ) : null}
      </div>
      {!aside && hint && !done ? <p className="text-[14px] text-text-2">{hints.join(" · ")}</p> : null}
    </PCard>
  );

  if (!aside) return main;
  const stats = [
    { k: "done", v: answered, c: "text-blue-700 bg-blue-50" },
    { k: "right", v: right, c: "text-green-700 bg-green-50" },
    { k: "wrongCount", v: answered - right, c: "text-red bg-red-50" },
    { k: "left", v: total - answered, c: "text-text-2 bg-[#EEF4FB]" },
  ] as const;
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      {main}
      <div className="flex flex-col gap-4">
        <PCard aria-labelledby="pq-hint">
          <PTitle id="pq-hint" icon={<Lightbulb />} tone="amber">
            {t("pronunciation.practice.hint")}
          </PTitle>
          {hint || done ? (
            <p className="text-[14.5px] text-text">{hints.join(" · ") || t("pronunciation.practice.hintNone")}</p>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setHint(true)}>
              {t("pronunciation.practice.hintShow")}
            </Button>
          )}
        </PCard>
        <PCard aria-labelledby="pq-prog">
          <PTitle id="pq-prog" icon={<Target />}>
            {t("pronunciation.practice.progressTitle")}
          </PTitle>
          <dl className="grid grid-cols-2 gap-2">
            {stats.map((s) => (
              <div key={s.k} className={cn("rounded-[12px] px-3 py-2", s.c)}>
                <dt className="text-[13px] font-semibold">{t(`pronunciation.practice.${s.k}`)}</dt>
                <dd className="text-[22px] font-extrabold tabular-nums">{s.v}</dd>
              </div>
            ))}
          </dl>
        </PCard>
        <PCard aria-labelledby="pq-tip" className="border-[#F6DE9E] bg-[linear-gradient(135deg,#FFF9EA,#FFF3D2)]">
          <PTitle id="pq-tip" icon={<Sparkles />} tone="amber">
            {t("pronunciation.practice.tips")}
          </PTitle>
          <ul className="grid list-disc gap-1.5 pl-6 text-[14px] text-text marker:text-amber">
            <li>{t("pronunciation.practice.tip1")}</li>
            <li>{t("pronunciation.practice.tip2")}</li>
            <li>{t("pronunciation.practice.tip3")}</li>
          </ul>
        </PCard>
      </div>
    </div>
  );
}
