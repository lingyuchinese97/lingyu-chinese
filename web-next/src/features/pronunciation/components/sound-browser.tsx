"use client";
import * as React from "react";
import { Lightbulb, ListChecks, NotebookPen } from "lucide-react";
import { useLocale, useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { splitSyllables } from "@/lib/pinyin";
import type { SoundGroup, SoundItem } from "@/data/pronunciation";
import { PCard, PTitle } from "./pron-header";
import { SpeakBtn } from "./speak-btn";
import { useL } from "./speech";
import { TopicNoteButton } from "./topic-note";

const GROUP_TONE = [
  "bg-blue-50 text-blue-700",
  "bg-green-50 text-green-700",
  "bg-amber-50 text-[#8A5300]",
  "bg-[#F3EEFF] text-[#6B46C1]",
  "bg-red-50 text-red",
  "bg-[#E6FAFB] text-[#0B6E77]",
];

/**
 * Bảng thanh mẫu / vận mẫu: nhóm → ô ký hiệu; bấm một ô → khung chi tiết (cách phát âm, ví dụ, mẹo, ghi chú riêng).
 * Âm đang chọn ghi vào `?s=` để chia sẻ / quay lại được.
 */
export function SoundBrowser({
  kind,
  groups,
  items,
  notes: initialNotes,
  selected: initialSelected,
  filterable,
}: {
  kind: "initial" | "final";
  groups: SoundGroup[];
  items: SoundItem[];
  notes: Record<string, string>;
  selected?: string;
  filterable?: boolean;
}) {
  const t = useT();
  const l = useL();
  const locale = useLocale();
  const [selected, setSelected] = React.useState(
    items.find((i) => i.symbol === initialSelected)?.symbol ?? items[0]!.symbol,
  );
  const [filter, setFilter] = React.useState<string>("all");
  const [notes, setNotes] = React.useState(initialNotes);
  const detailRef = React.useRef<HTMLDivElement>(null);
  const item = items.find((i) => i.symbol === selected)!;
  const topic = `${kind}:${item.symbol}`;
  const name = t(kind === "initial" ? "pronunciation.tabs.initials" : "pronunciation.tabs.finals");

  function pick(symbol: string) {
    setSelected(symbol);
    const url = new URL(window.location.href);
    url.searchParams.set("s", symbol);
    window.history.replaceState(null, "", url);
    if (window.matchMedia("(max-width: 1023px)").matches)
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const shown = groups.filter((g) => filter === "all" || g.id === filter);
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="flex min-w-0 flex-col gap-4">
        {filterable ? (
          <div role="group" aria-label={t("pronunciation.sound.filterLabel")} className="flex flex-wrap gap-2">
            {[
              { id: "all", label: t("pronunciation.sound.all"), n: items.length },
              ...groups.map((g) => ({ id: g.id, label: l(g.name), n: items.filter((i) => i.group === g.id).length })),
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-[14.5px] font-semibold outline-none focus-visible:shadow-[var(--focus-ring)]",
                  filter === f.id
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-[#DDEBF8] bg-white text-blue-700 hover:bg-blue-50",
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "rounded-full px-2 text-[12.5px] tabular-nums",
                    filter === f.id ? "bg-white text-blue-700" : "bg-blue-50",
                  )}
                >
                  {f.n}
                </span>
              </button>
            ))}
          </div>
        ) : null}
        {shown.map((g) => {
          const gi = groups.indexOf(g);
          const list = items.filter((i) => i.group === g.id);
          return (
            <PCard key={g.id} aria-labelledby={`grp-${g.id}`} className="p-4 md:p-5">
              <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 id={`grp-${g.id}`} className="text-[17px] font-bold text-navy-900">
                  {l(g.name)}
                </h2>
                <span className="text-[13.5px] text-text-3">{l(g.desc)}</span>
                <span
                  className={cn("ml-auto rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold", GROUP_TONE[gi % 6])}
                >
                  {t("pronunciation.sound.countIn", { count: list.length })}
                </span>
              </div>
              <ul
                aria-label={t("pronunciation.sound.listLabel", { name: l(g.name) })}
                className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2.5"
              >
                {list.map((x) => (
                  <li key={x.symbol}>
                    <button
                      type="button"
                      aria-label={t("pronunciation.sound.pick", { symbol: x.symbol })}
                      aria-pressed={x.symbol === selected}
                      onClick={() => pick(x.symbol)}
                      className={cn(
                        "relative flex h-[84px] w-full flex-col items-center justify-center gap-0.5 rounded-[16px] border-[1.5px] outline-none focus-visible:shadow-[var(--focus-ring)]",
                        x.symbol === selected
                          ? "border-blue-600 bg-blue-50 shadow-[0_6px_16px_rgba(21,149,245,.18)]"
                          : "border-border bg-white hover:border-[#A9D3F8] hover:bg-[#F7FBFF]",
                      )}
                    >
                      <span className="text-[26px] leading-none font-extrabold text-navy-900">{x.symbol}</span>
                      <span className="text-[14px] text-text-2">
                        <span className="hanzi" lang="zh">
                          {x.examples[0]!.hanzi.slice(0, 1)}
                        </span>{" "}
                        <span className="pinyin">{splitSyllables(x.examples[0]!.pinyin)[0]}</span>
                      </span>
                      {notes[`${kind}:${x.symbol}`] ? (
                        <span
                          className="absolute top-1.5 right-1.5 size-2 rounded-full bg-green"
                          title={t("pronunciation.sound.hasNote")}
                        />
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </PCard>
          );
        })}
      </div>

      <div ref={detailRef} className="scroll-mt-4 lg:sticky lg:top-4 lg:self-start">
        <PCard aria-label={t("pronunciation.sound.detail", { symbol: item.symbol })} className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <span className="flex size-[88px] shrink-0 items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,#EAF4FF,#D8EBFD)] text-[42px] font-extrabold text-blue-700">
              {item.symbol}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold tracking-wide text-text-3 uppercase">{name}</p>
              <p className="mt-0.5 text-[15px] text-text">
                <span className="font-semibold text-text-2">{t("pronunciation.sound.like")}: </span>
                {l(item.like)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <SpeakBtn text={item.speak} label={t("pronunciation.sound.listenSound", { symbol: item.symbol })}>
                  {t("pronunciation.sound.listen")}
                </SpeakBtn>
                <TopicNoteButton
                  topic={topic}
                  label={`${name} ${item.symbol}`}
                  value={notes[topic] ?? ""}
                  onChange={(v) => setNotes((n) => ({ ...n, [topic]: v }))}
                />
              </div>
            </div>
          </div>

          <section aria-labelledby="sd-how">
            <PTitle id="sd-how" icon={<ListChecks />}>
              {t("pronunciation.sound.how")}
            </PTitle>
            <ul className="grid list-disc gap-1.5 pl-6 text-[15px] text-text marker:text-blue">
              {item.how[locale].map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="sd-ex">
            <h3 id="sd-ex" className="mb-2 text-[15px] font-bold text-navy-900">
              {t("pronunciation.sound.examples")}
            </h3>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {item.examples.map((e) => (
                <li
                  key={e.hanzi}
                  className="flex items-center gap-3 rounded-[14px] border border-border bg-[#FAFCFF] px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="hanzi text-[22px] leading-tight font-bold text-navy-900" lang="zh">
                      {e.hanzi}
                    </div>
                    <div className="text-[14.5px] pinyin">{e.pinyin}</div>
                    <div className="text-[13.5px] text-text-2">{l(e.meaning)}</div>
                  </div>
                  <SpeakBtn text={e.hanzi} label={t("ui.listen", { text: e.hanzi })} size="sm" />
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="sd-tip"
            className="rounded-[16px] border border-[#F6DE9E] bg-[linear-gradient(135deg,#FFF9EA,#FFF3D2)] p-3.5"
          >
            <h3 id="sd-tip" className="mb-1 flex items-center gap-2 text-[15px] font-bold text-[#8A5300]">
              <Lightbulb className="size-[18px]" aria-hidden="true" />
              {t("pronunciation.sound.tip")}
            </h3>
            <p className="text-[14.5px] text-text">{l(item.tip)}</p>
          </section>

          {notes[topic] ? (
            <section aria-labelledby="sd-note" className="rounded-[16px] border border-[#CFEFDF] bg-[#F1FBF6] p-3.5">
              <h3 id="sd-note" className="mb-1 flex items-center gap-2 text-[15px] font-bold text-green-700">
                <NotebookPen className="size-[18px]" aria-hidden="true" />
                {t("pronunciation.sound.yourNote")}
              </h3>
              <p className="text-[14.5px] whitespace-pre-line text-text">{notes[topic]}</p>
            </section>
          ) : null}
        </PCard>
      </div>
    </div>
  );
}
