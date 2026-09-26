"use client";
import { useLocale, useT } from "@/i18n/client";
import { radicalMeaning, radicalName } from "@/lib/radicals";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, FileText, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { LeafDecor } from "@/components/layout/icons";
import { cn } from "@/lib/utils";
import type { Radical } from "@/lib/radicals";
import { setRadicalKnownAction } from "../actions";
import { StrokeWriter } from "./stroke-writer";

type Near = Pick<Radical, "num" | "char" | "name"> | null;
type Word = { id: string; hanzi: string; pinyin: string; meaningVi: string };

export function RadicalDetail({
  r,
  known: initialKnown,
  examples,
  moreChars,
  prev,
  next,
  words,
  wordTotal,
}: {
  r: Radical;
  known: boolean;
  examples: { char: string; pinyin: string }[];
  moreChars: string[];
  prev: Near;
  next: Near;
  words: Word[];
  wordTotal: number;
}) {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const name = radicalName(r, locale);
  const [known, setKnown] = React.useState(initialKnown);
  const [busy, setBusy] = React.useState(false);
  // Chữ đang hiện trong khung nét viết: mặc định là bộ thủ, bấm chữ ví dụ để xem chữ đó.
  const [char, setChar] = React.useState(r.char);

  async function toggle() {
    const on = !known;
    setBusy(true);
    setKnown(on);
    try {
      await setRadicalKnownAction(r.num, on);
      toast.success(on ? t("radicals.markedToast", { name }) : t("radicals.unmarkedToast"));
      router.refresh();
    } catch {
      setKnown(!on);
      toast.error(t("radicals.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  const variants = r.variants;
  return (
    <article
      aria-labelledby="rd-title"
      className="relative grid gap-1.5 overflow-hidden rounded-[var(--radius-xl)] border border-border bg-white/92 p-4 shadow-card md:p-7"
    >
      <LeafDecor className="pointer-events-none absolute -right-2.5 -bottom-3.5 w-[70px] rotate-[-30deg] opacity-35" />
      <header className="flex flex-wrap items-center gap-4 border-b border-border pb-5 md:gap-7">
        <StrokeWriter key={char} char={char} size={180} />
        <div className="grid min-w-0 flex-[1_1_280px] justify-items-start gap-1.5">
          <p className="text-[13.5px] font-bold text-text-3">{t("radicals.numberOf", { num: r.num })}</p>
          <h1 id="rd-title" className="text-[26px] font-extrabold tracking-tight text-text md:text-[32px]">
            {t("radicals.heading", { name })}{" "}
            <span className="hanzi text-navy" lang="zh">
              {r.char}
            </span>
          </h1>
          <p className="text-lg text-text-2">{radicalMeaning(r, locale)}</p>
          <dl className="my-2 flex flex-wrap gap-x-7 gap-y-2.5">
            <Fact label={t("radicals.pinyin")}>
              <span className="pinyin">{r.pinyin}</span>
            </Fact>
            <Fact label={t("radicals.strokes")}>{r.strokes}</Fact>
            <Fact label={t("radicals.variants")}>
              <span className="hanzi text-xl text-navy" lang="zh">
                {variants.length ? variants.join("　") : "—"}
              </span>
            </Fact>
            <Fact label={t("radicals.charCount")}>{r.charCount}</Fact>
          </dl>
          <Button variant={known ? "secondary" : "solid"} aria-pressed={known} onClick={toggle} disabled={busy}>
            {known ? <CheckCircle2 /> : <Check />}
            {known ? t("radicals.known") : t("radicals.markKnown")}
          </Button>
        </div>
      </header>

      <Section icon={<FileText />} title={t("radicals.commonChars", { name })}>
        {examples.length ? (
          <>
            <p className="mb-2.5 text-sm text-text-3">{t("radicals.tapChar")}</p>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2.5">
              {[{ char: r.char, pinyin: r.pinyin }, ...examples.filter((e) => e.char !== r.char)].map((e) => (
                <li key={e.char}>
                  <button
                    type="button"
                    onClick={() => setChar(e.char)}
                    aria-pressed={char === e.char}
                    aria-label={t("radicals.showStrokes", { char: e.char })}
                    className={cn(
                      "flex w-full flex-col items-center rounded-xl border bg-white px-1.5 py-2.5 outline-none hover:border-[#A9D3F8] focus-visible:[box-shadow:var(--focus-ring)]",
                      char === e.char ? "border-blue bg-blue-50" : "border-border",
                    )}
                  >
                    <span className="hanzi text-[30px] text-text" lang="zh">
                      {e.char}
                    </span>
                    <span className="text-[13px] pinyin">{e.pinyin}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-text-3">{t("radicals.noExamples")}</p>
        )}
        {moreChars.length ? (
          <p className="mt-3 leading-[1.9]">
            <span className="text-sm text-text-3">{t("radicals.otherChars")}</span>{" "}
            <span className="hanzi text-lg tracking-[2px] break-all text-text" lang="zh">
              {moreChars.join(" ")}
            </span>
          </p>
        ) : null}
      </Section>

      <Section icon={<BookOpen />} title={t("radicals.yourWords")}>
        {wordTotal ? (
          <>
            <ul className="mb-3 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2">
              {words.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/vocabulary/${v.id}/edit`}
                    className="flex items-baseline gap-2.5 rounded-[10px] border border-border bg-white px-3 py-2 text-text-2 hover:border-[#A9D3F8] hover:bg-blue-50"
                  >
                    <span className="hanzi text-xl text-text" lang="zh">
                      {v.hanzi}
                    </span>
                    <span className="text-[13.5px] pinyin">{v.pinyin}</span>
                    <span className="truncate">{v.meaningVi}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {wordTotal > words.length ? (
              <p className="mb-2 text-sm text-text-3">{t("radicals.moreWords", { count: wordTotal - words.length })}</p>
            ) : null}
            <Button asChild size="sm" variant="secondary">
              <Link href={`/vocabulary?radical=${r.num}`}>
                <List />
                {t("radicals.seeWords", { count: wordTotal })}
              </Link>
            </Button>
          </>
        ) : (
          <p className="text-sm text-text-3">{t("radicals.noWords", { name })}</p>
        )}
      </Section>

      <nav aria-label={t("radicals.prevNext")} className="flex flex-wrap justify-between gap-3 pt-3.5">
        {prev ? (
          <Button asChild variant="secondary">
            <Link href={`/radicals/${prev.num}`}>
              <ArrowLeft />
              <span className="hanzi text-lg text-current" lang="zh">
                {prev.char}
              </span>
              {prev.name}
            </Link>
          </Button>
        ) : (
          <span />
        )}
        {next ? (
          <Button asChild variant="secondary">
            <Link href={`/radicals/${next.num}`}>
              <span className="hanzi text-lg text-current" lang="zh">
                {next.char}
              </span>
              {next.name}
              <ArrowRight />
            </Link>
          </Button>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[12.5px] font-semibold text-text-3">{label}</dt>
      <dd className="text-[17px] font-semibold text-text">{children}</dd>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border py-5 last-of-type:border-0">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-navy [&_svg]:size-5 [&_svg]:text-blue-600">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}
