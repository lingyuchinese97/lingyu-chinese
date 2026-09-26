"use client";
import * as React from "react";
import Link from "next/link";
import { BarChart3, Lightbulb, Mic, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import { TONE_SETS, TONE_TIPS, TONES } from "@/data/pronunciation";
import { PCard, PTitle } from "./pron-header";
import { SpeakBtn } from "./speak-btn";
import { useL } from "./speech";
import { TONE_COLOR, ToneChart } from "./tone-chart";
import { TopicNoteButton } from "./topic-note";

/** Thanh điệu: thẻ từng thanh (đường thanh, ví dụ 妈 麻 马 骂, nghe) + so sánh 4 thanh, ví dụ so sánh, mẹo. */
export function TonesView({ notes: initialNotes }: { notes: Record<string, string> }) {
  const t = useT();
  const l = useL();
  const [notes, setNotes] = React.useState(initialNotes);
  const axis = {
    high: t("pronunciation.tones.high"),
    mid: t("pronunciation.tones.mid"),
    low: t("pronunciation.tones.low"),
  };
  const main = TONES.filter((x) => x.tone !== 5);
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
      <section aria-labelledby="tn-h" className="flex min-w-0 flex-col gap-3">
        <h2 id="tn-h" className="sr-only">
          {t("pronunciation.tones.heading")}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {TONES.map((x) => {
            const topic = `tone:${x.tone}`;
            return (
              <li key={x.tone} className={x.tone === 5 ? "sm:col-span-2" : undefined}>
                <PCard className="flex h-full flex-col gap-3" style={{ borderTop: `4px solid ${TONE_COLOR[x.tone]}` }}>
                  <div className="flex items-center gap-2">
                    <h3
                      id={`tone-${x.tone}`}
                      className="text-[18px] font-extrabold"
                      style={{ color: TONE_COLOR[x.tone] }}
                    >
                      {l(x.name)} <span aria-hidden="true">{x.mark}</span>
                    </h3>
                    <span className="text-[14px] text-text-2">{l(x.desc)}</span>
                    <TopicNoteButton
                      compact
                      className="ml-auto"
                      topic={topic}
                      label={l(x.name)}
                      value={notes[topic] ?? ""}
                      onChange={(v) => setNotes((n) => ({ ...n, [topic]: v }))}
                    />
                  </div>
                  <div
                    className={x.tone === 5 ? "flex flex-col gap-3 sm:flex-row sm:items-center" : "flex flex-col gap-3"}
                  >
                    <ToneChart
                      lines={[x]}
                      axis={axis}
                      label={t("pronunciation.tones.chart", { name: l(x.name), contour: x.contour.join("") })}
                      className={x.tone === 5 ? "sm:max-w-[260px]" : undefined}
                    />
                    <div className="flex flex-1 items-center gap-3 rounded-[14px] bg-[#F7FBFF] px-3 py-2">
                      <span className="hanzi text-[40px] leading-none font-bold text-navy-900" lang="zh">
                        {x.example.hanzi}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[18px] font-semibold pinyin">{x.example.pinyin}</div>
                        <div className="text-[13.5px] text-text-2">{l(x.example.meaning)}</div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[14px] text-text-2">{l(x.like)}</p>
                  {notes[topic] ? (
                    <p className="rounded-[12px] bg-green-50 px-3 py-2 text-[14px] whitespace-pre-line text-green-700">
                      {notes[topic]}
                    </p>
                  ) : null}
                  <div className="mt-auto flex flex-wrap gap-2">
                    <SpeakBtn
                      text={x.example.hanzi}
                      label={t("pronunciation.tones.listenTone", { name: l(x.name), hanzi: x.example.hanzi })}
                    >
                      {t("pronunciation.sound.listen")}
                    </SpeakBtn>
                    <Button asChild variant="secondary" size="sm">
                      <Link href="/pronunciation/practice?mode=listen-choose">
                        <Mic />
                        {t("pronunciation.tones.read")}
                      </Link>
                    </Button>
                  </div>
                </PCard>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex flex-col gap-4 xl:sticky xl:top-4 xl:self-start">
        <PCard aria-labelledby="tn-cmp">
          <PTitle id="tn-cmp" icon={<BarChart3 />}>
            {t("pronunciation.tones.compare")}
          </PTitle>
          <ToneChart lines={main} axis={axis} label={t("pronunciation.tones.compareChart")} />
          <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[13.5px]">
            {main.map((x) => (
              <li key={x.tone} className="flex items-center gap-1.5">
                <span aria-hidden="true" className="h-1 w-5 rounded-full" style={{ background: TONE_COLOR[x.tone] }} />
                {l(x.name)} ({x.contour.join("")})
              </li>
            ))}
          </ul>
        </PCard>
        <PCard aria-labelledby="tn-ex">
          <PTitle id="tn-ex" icon={<Music />}>
            {t("pronunciation.tones.examples")}
          </PTitle>
          <ul className="flex flex-col gap-3">
            {TONE_SETS.map((s) => (
              <li key={s.syllable} className="rounded-[14px] border border-border p-2.5">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="font-semibold pinyin">{s.syllable}</span>
                  <SpeakBtn
                    text={s.items.map((i) => i.hanzi)}
                    label={t("pronunciation.tones.listenSet", { syllable: s.syllable })}
                    size="sm"
                  />
                </div>
                <ol className="grid grid-cols-4 gap-1.5">
                  {s.items.map((i, k) => (
                    <li
                      key={i.hanzi}
                      className="flex flex-col items-center rounded-[10px] py-1.5"
                      style={{ background: `${TONE_COLOR[k + 1]}14` }}
                    >
                      <span className="hanzi text-[24px] font-bold text-navy-900" lang="zh">
                        {i.hanzi}
                      </span>
                      <span className="text-[14px] font-semibold" style={{ color: TONE_COLOR[k + 1] }}>
                        {i.pinyin}
                      </span>
                      <span className="text-[12px] text-text-3">{l(i.meaning)}</span>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        </PCard>
        <PCard aria-labelledby="tn-tip" className="border-[#F6DE9E] bg-[linear-gradient(135deg,#FFF9EA,#FFF3D2)]">
          <PTitle id="tn-tip" icon={<Lightbulb />} tone="amber">
            {t("pronunciation.tones.tips")}
          </PTitle>
          <ul className="grid list-disc gap-1.5 pl-6 text-[14.5px] text-text marker:text-amber">
            {TONE_TIPS.map((x) => (
              <li key={x.vi}>{l(x)}</li>
            ))}
          </ul>
        </PCard>
      </div>
    </div>
  );
}
