"use client";
import * as React from "react";
import { Lightbulb, Quote, RefreshCw } from "lucide-react";
import { SpeakButton } from "@/components/speak-button";
import { LeafDecor } from "@/components/layout/icons";
import { DAILY_QUOTES } from "@/data/daily-quotes";
import { useLocale, useT } from "@/i18n/client";

/** Câu nói mỗi ngày: mặc định câu của hôm nay (server tính), bấm ⟳ để xem câu khác. */
export function DailyQuote({ initial }: { initial: number }) {
  const [i, setI] = React.useState(initial);
  const t = useT();
  const locale = useLocale();
  const q = DAILY_QUOTES[i % DAILY_QUOTES.length]!;
  return (
    <article
      aria-labelledby="dq-title"
      className="relative flex flex-col gap-3 overflow-hidden rounded-3xl border border-border bg-white/94 p-5 shadow-card"
    >
      <div className="flex items-center gap-2.5">
        <Lightbulb className="size-6 text-amber" aria-hidden="true" />
        <h2 id="dq-title" className="flex-1 text-lg font-bold text-navy">
          {t("home.quoteTitle")}
        </h2>
        <button
          type="button"
          onClick={() => setI((x) => (x + 1) % DAILY_QUOTES.length)}
          aria-label={t("home.quoteNext")}
          className="flex size-10 items-center justify-center rounded-full text-blue-600 outline-none hover:bg-blue-50 focus-visible:[box-shadow:var(--focus-ring)]"
        >
          <RefreshCw className="size-5" />
        </button>
      </div>
      <div className="relative flex flex-1 flex-col justify-center gap-1.5 rounded-2xl bg-[#F2F8FE] px-5 py-5 text-center">
        <Quote className="absolute top-3 left-3 size-6 text-[#B9D6F3]" aria-hidden="true" />
        <p className="flex items-center justify-center gap-1 hanzi text-[26px] leading-snug text-navy" lang="zh">
          {q.zh}
          <SpeakButton text={q.zh} className="size-8" />
        </p>
        <p className="text-[14.5px] pinyin">{q.pinyin}</p>
        <p className="text-[15px] text-text-2">{locale === "en" ? q.en : q.vi}</p>
      </div>
      <LeafDecor className="pointer-events-none absolute -right-2 -bottom-2 w-12 rotate-[-30deg] opacity-50" />
    </article>
  );
}
