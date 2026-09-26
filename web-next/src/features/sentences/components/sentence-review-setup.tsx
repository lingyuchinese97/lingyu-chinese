"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Languages, Loader2, Play, RotateCcw, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { LeafDecor } from "@/components/layout/icons";
import { cn } from "@/lib/utils";
import { SENTENCE_COUNTS, type DirectionMode } from "../schema";
import { countSentencePoolAction, startSentenceReviewAction } from "../actions";
import { useT } from "@/i18n/client";
import type { MessageKey } from "@/i18n/translate";

const DIRS: { value: DirectionMode; title: string; sub: MessageKey; icon: React.ReactNode }[] = [
  { value: "vi-zh", title: "VI → 中", sub: "sentences.setup.viZh", icon: <Languages /> },
  { value: "zh-vi", title: "中 → VI", sub: "sentences.setup.zhVi", icon: <ArrowLeftRight /> },
  { value: "mixed", title: "Mix", sub: "sentences.setup.mixed", icon: <Shuffle /> },
];

export function SentenceReviewSetup({
  tags,
  total,
  last,
  active,
}: {
  tags: { name: string; count: number }[];
  total: number;
  last: { direction: DirectionMode; count: number; showPinyin: boolean; showHint: boolean; tags: string[] } | null;
  active: { done: number; total: number } | null;
}) {
  const router = useRouter();
  const t = useT();
  const [direction, setDirection] = React.useState<DirectionMode>(last?.direction ?? "vi-zh");
  const [count, setCount] = React.useState<number>(
    last?.count && SENTENCE_COUNTS.includes(last.count as 5) ? last.count : 10,
  );
  const [tag, setTag] = React.useState(last?.tags[0] && tags.some((t) => t.name === last.tags[0]) ? last.tags[0] : "");
  const [showPinyin, setShowPinyin] = React.useState(last?.showPinyin ?? false);
  const [showHint, setShowHint] = React.useState(last?.showHint ?? false);
  const [pool, setPool] = React.useState<number>(total);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    countSentencePoolAction(tag ? [tag] : []).then((r) => alive && r.ok && setPool(r.data));
    return () => {
      alive = false;
    };
  }, [tag]);

  async function start() {
    setBusy(true);
    const r = await startSentenceReviewAction({ direction, count, tags: tag ? [tag] : [], showPinyin, showHint });
    if (!r.ok) {
      setBusy(false);
      return void toast.error(r.message);
    }
    router.push("/sentences/review/session");
  }

  if (!total)
    return (
      <section className="flex flex-col items-center gap-3 rounded-[var(--radius-xl)] border border-border bg-white p-8 text-center shadow-card">
        <h1 className="text-2xl font-extrabold text-navy">{t("sentences.setupTitle")}</h1>
        <p className="text-text-2">{t("sentences.setup.none")}</p>
        <Button asChild variant="solid">
          <Link href="/sentences">{t("sentences.setup.toList")}</Link>
        </Button>
      </section>
    );

  const n = Math.min(count, pool);
  return (
    <section
      aria-labelledby="ss-title"
      className="relative flex flex-col gap-5 overflow-hidden rounded-[var(--radius-xl)] border border-border bg-white/94 p-4 shadow-card md:p-7"
    >
      <h1 id="ss-title" className="flex items-center gap-3 text-[24px] font-extrabold text-navy md:text-[28px]">
        {t("sentences.setupTitle")}
        <LeafDecor className="w-9" />
      </h1>

      {active ? (
        <div className="flex flex-col gap-2.5 rounded-[14px] border border-[#A9D3F8] bg-blue-50 px-4 py-3 md:flex-row md:items-center">
          <p className="flex-1 text-[15px] text-text-2">
            {t("sentences.setup.unfinished", { done: active.done, total: active.total })}
          </p>
          <Button asChild size="sm" variant="solid">
            <Link href="/sentences/review/session">
              <RotateCcw />
              {t("sentences.setup.resume")}
            </Link>
          </Button>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 rounded-2xl bg-[#F4F9FF] p-4">
          <fieldset>
            <legend className="mb-2.5 font-bold text-text">{t("sentences.setup.direction")}</legend>
            <div role="radiogroup" aria-label={t("sentences.setup.direction")} className="grid grid-cols-3 gap-2">
              {DIRS.map((d) => {
                const on = direction === d.value;
                return (
                  <button
                    key={d.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setDirection(d.value)}
                    className={cn(
                      "flex min-h-[84px] flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] px-1 text-center outline-none focus-visible:[box-shadow:var(--focus-ring)] [&_svg]:size-6",
                      on
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-border bg-white text-blue-600 hover:border-[#A9D3F8]",
                    )}
                  >
                    <span className="flex items-center gap-1.5 text-lg font-bold">
                      {d.value === "mixed" ? d.icon : d.title}
                    </span>
                    <span className={cn("text-[13px]", on ? "text-white" : "text-text-2")}>{t(d.sub)}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <Toggle
            id="ss-pinyin"
            label={t("sentences.setup.showPinyin")}
            checked={showPinyin}
            onChange={setShowPinyin}
          />
          <Toggle id="ss-hint" label={t("sentences.setup.showHint")} checked={showHint} onChange={setShowHint} />
        </div>

        <div className="flex flex-col gap-4 rounded-2xl bg-[#F4F9FF] p-4">
          <fieldset>
            <legend className="mb-2.5 font-bold text-text">{t("sentences.setup.count")}</legend>
            <div role="radiogroup" aria-label={t("sentences.setup.count")} className="grid grid-cols-4 gap-2">
              {SENTENCE_COUNTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={count === c}
                  onClick={() => setCount(c)}
                  className={cn(
                    "h-11 rounded-lg border-[1.5px] font-semibold outline-none focus-visible:[box-shadow:var(--focus-ring)]",
                    count === c
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-border bg-white text-text hover:border-[#A9D3F8]",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="flex flex-col gap-2">
            <span className="font-bold text-text">{t("sentences.setup.chooseTag")}</span>
            <select value={tag} onChange={(e) => setTag(e.target.value)} className={cn(inputClass, "cursor-pointer")}>
              <option value="">{t("sentences.setup.allTags", { count: total })}</option>
              {tags.map((tg) => (
                <option key={tg.name} value={tg.name}>
                  {tg.name} ({tg.count})
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm text-text-2" aria-live="polite">
            {pool ? t("sentences.setup.willReview", { count: n }) : t("sentences.setup.noneWithTag")}
          </p>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="self-center max-md:w-full md:min-w-[240px]"
        disabled={busy || !pool}
        onClick={start}
      >
        {busy ? <Loader2 className="animate-spin" /> : <Play />}
        {busy ? t("sentences.setup.creating") : t("sentences.setup.start")}
      </Button>
    </section>
  );
}

function Toggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="cursor-pointer text-[15px] text-text">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors outline-none focus-visible:[box-shadow:var(--focus-ring)]",
          checked ? "bg-blue-600" : "bg-[#C4D3E3]",
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}
