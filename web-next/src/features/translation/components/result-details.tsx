"use client";
import * as React from "react";
import { CheckCircle2, ChevronDown, CircleSlash, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";
import type { ClientTranslationSession } from "../service";
import { ItemExplain } from "./item-explain";

/** Kết quả từng câu: đề, bài làm, đúng / sai; mở ra để xem đáp án + giải thích ngữ pháp. */
export function ResultDetails({ session }: { session: ClientTranslationSession }) {
  const t = useT();
  const [open, setOpen] = React.useState<number | null>(
    session.questions.findIndex((q) => q.result !== "correct") >= 0
      ? session.questions.findIndex((q) => q.result !== "correct")
      : null,
  );
  return (
    <section aria-labelledby="tr-details" className="flex flex-col gap-3">
      <h2 id="tr-details" className="text-[20px] font-extrabold text-navy-900">
        {t("translate.details")}
      </h2>
      <ol className="grid gap-3">
        {session.questions.map((q, i) => {
          const on = open === i;
          const Icon = q.result === "correct" ? CheckCircle2 : q.result === "wrong" ? XCircle : CircleSlash;
          return (
            <li key={i} className="rounded-[var(--radius-xl)] border border-border bg-white shadow-card">
              <button
                type="button"
                aria-expanded={on}
                aria-controls={`res-${i}`}
                onClick={() => setOpen(on ? null : i)}
                className="flex w-full items-start gap-3 rounded-[var(--radius-xl)] p-4 text-left outline-none focus-visible:[box-shadow:var(--focus-ring)]"
              >
                <Icon
                  className={cn(
                    "mt-0.5 size-6 shrink-0",
                    q.result === "correct" ? "text-green" : q.result === "wrong" ? "text-red" : "text-text-3",
                  )}
                  aria-label={t(`translate.itemStatus.${q.result ?? "todo"}`)}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-text-3">
                    {t("translate.itemN", { n: i + 1 })}
                  </span>
                  <span
                    className={cn(
                      "block text-[16px] font-semibold text-navy-900",
                      q.direction === "from-zh" && "hanzi",
                    )}
                    lang={q.direction === "from-zh" ? "zh" : undefined}
                  >
                    {q.prompt.text}
                  </span>
                  <span className="block text-[14.5px] text-text-2">
                    {t("translate.yourAnswer")}: {q.userAnswer || t("translate.noAnswer")}
                  </span>
                </span>
                <ChevronDown
                  className={cn("size-5 shrink-0 text-blue-600 transition-transform", on && "rotate-180")}
                  aria-hidden="true"
                />
              </button>
              {on && q.reveal ? (
                <div id={`res-${i}`} className="border-t border-border p-4">
                  <ItemExplain item={q.reveal} idPrefix={`res-${i}`} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
