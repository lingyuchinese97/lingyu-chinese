"use client";
import * as React from "react";
import Link from "next/link";
import { Ear, Keyboard, Mic, Shuffle, SpellCheck, Waves } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { generatePractice, PRACTICE_MODES, type PracticeMode, type PracticeQuestion } from "../practice";
import { PCard } from "./pron-header";
import { Quiz } from "./quiz";

const ICON: Record<PracticeMode, React.ComponentType<{ className?: string }>> = {
  "listen-choose": Ear,
  "listen-type": Keyboard,
  "speak-compare": Mic,
  pairs: Shuffle,
  "read-words": SpellCheck,
  sandhi: Waves,
};

/** Luyện tập: chọn chế độ (link `?mode=`) → làm bài 10 câu; "Làm bài mới" tạo bộ câu khác ngay trên máy. */
export function PracticeView({ mode, questions: initial }: { mode: PracticeMode; questions: PracticeQuestion[] }) {
  const t = useT();
  const [questions, setQuestions] = React.useState(initial);
  const [round, setRound] = React.useState(0);
  return (
    <div className="grid gap-4 lg:grid-cols-[270px_minmax(0,1fr)]">
      <nav aria-labelledby="pp-modes">
        <PCard className="p-3 md:p-4">
          <h2 id="pp-modes" className="mb-2 px-1 text-[16px] font-bold text-navy-900">
            {t("pronunciation.practice.modes")}
          </h2>
          <ul className="grid grid-cols-2 gap-1.5 lg:grid-cols-1">
            {PRACTICE_MODES.map((m) => {
              const Icon = ICON[m];
              return (
                <li key={m}>
                  <Link
                    href={`/pronunciation/practice?mode=${m}`}
                    aria-current={m === mode ? "page" : undefined}
                    className={cn(
                      "flex h-full items-center gap-2.5 rounded-[12px] border px-2.5 py-2 outline-none focus-visible:shadow-[var(--focus-ring)] sm:gap-3 sm:px-3",
                      m === mode
                        ? "border-blue-600 bg-blue-50"
                        : "border-transparent hover:border-border hover:bg-[#F7FBFF]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full",
                        m === mode ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600",
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[14px] leading-tight font-semibold text-navy-900 sm:text-[15px]">
                        {t(`pronunciation.practice.mode.${m}.title`)}
                      </span>
                      <span className="text-[12.5px] text-text-2 max-sm:hidden">
                        {t(`pronunciation.practice.mode.${m}.desc`)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </PCard>
      </nav>
      <Quiz
        key={`${mode}-${round}`}
        aside
        label={t(`pronunciation.practice.mode.${mode}.title`)}
        questions={questions}
        onRestart={() => {
          setQuestions(generatePractice(mode));
          setRound((r) => r + 1);
        }}
      />
    </div>
  );
}
