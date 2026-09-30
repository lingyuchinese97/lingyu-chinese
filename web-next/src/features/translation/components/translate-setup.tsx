"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlignLeft,
  BookA,
  Languages,
  Loader2,
  MessageSquareText,
  Play,
  RotateCcw,
  Shuffle,
  Sparkles,
} from "lucide-react";
import { GrammarIcon } from "@/components/layout/icons";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";
import type { MessageKey } from "@/i18n/translate";
import { T_TOPICS } from "@/data/translation/items";
import { T_COUNTS, T_LEVELS, type TDirectionMode, type TSource, type TType } from "../schema";
import { startTranslationAction } from "../actions";

type Grammar = { id: string; level: number; name: string; structure: string };
type MyGrammar = { id: string; title: string; structure: string; examples: number };

function Choice({
  on,
  onClick,
  title,
  sub,
  icon,
}: {
  on: boolean;
  onClick: () => void;
  title: string;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "flex min-h-[72px] items-center gap-3 rounded-xl border-[1.5px] px-3.5 py-2.5 text-left outline-none focus-visible:[box-shadow:var(--focus-ring)] [&_svg]:size-6 [&_svg]:shrink-0",
        on ? "border-blue-600 bg-blue-50 text-blue-700" : "border-border bg-white text-text hover:border-[#A9D3F8]",
      )}
    >
      {icon ? <span className={on ? "text-blue-600" : "text-text-3"}>{icon}</span> : null}
      <span className="min-w-0">
        <span className="block font-bold">{title}</span>
        {sub ? <span className="block text-[13.5px] text-text-2">{sub}</span> : null}
      </span>
    </button>
  );
}

export function TranslateSetup({
  level,
  grammar,
  myGrammar = [],
  active,
}: {
  level: number;
  grammar: Grammar[];
  /** Ngữ pháp người dùng đã nhập ở mục Ngữ pháp — hiện trước ngữ pháp có sẵn. */
  myGrammar?: MyGrammar[];
  active: { done: number; total: number } | null;
}) {
  const t = useT();
  const router = useRouter();
  const [type, setType] = React.useState<TType>("sentence");
  const [direction, setDirection] = React.useState<TDirectionMode>("to-zh");
  const [source, setSource] = React.useState<TSource>("auto");
  const [grammarIds, setGrammarIds] = React.useState<string[]>([]);
  const [myIds, setMyIds] = React.useState<string[]>([]);
  const toggleMine = (id: string) => setMyIds((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));
  const chosen = grammarIds.length + myIds.length;
  const [lv, setLv] = React.useState(0);
  const [topic, setTopic] = React.useState("");
  const [count, setCount] = React.useState(10);
  const [showPinyin, setShowPinyin] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const counts = T_COUNTS[type];

  function pickType(v: TType) {
    setType(v);
    setCount(T_COUNTS[v][1]!);
  }
  const toggleGrammar = (id: string) => setGrammarIds((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));

  async function start() {
    setBusy(true);
    const r = await startTranslationAction({
      type,
      direction,
      source,
      grammarIds: source === "grammar" ? grammarIds : [],
      myGrammarIds: source === "grammar" ? myIds : [],
      level: lv,
      topic,
      count,
      showPinyin,
    });
    if (!r.ok) {
      setBusy(false);
      return void toast.error(r.message);
    }
    router.push("/translate/session");
  }

  const dirs: { v: TDirectionMode; k: MessageKey; icon: React.ReactNode }[] = [
    { v: "to-zh", k: "translate.dirToZh", icon: <Languages /> },
    { v: "from-zh", k: "translate.dirFromZh", icon: <MessageSquareText /> },
    { v: "mixed", k: "translate.dirMixed", icon: <Shuffle /> },
  ];
  const levelGrammar = lv ? grammar.filter((g) => g.level <= lv) : grammar;

  return (
    <section
      aria-labelledby="tr-setup"
      className="flex flex-col gap-5 rounded-[var(--radius-xl)] border border-border bg-white p-4 shadow-card md:p-6"
    >
      <h2 id="tr-setup" className="sr-only">
        {t("translate.title")}
      </h2>
      {active ? (
        <div className="flex flex-col gap-2.5 rounded-[14px] border border-[#A9D3F8] bg-blue-50 px-4 py-3 md:flex-row md:items-center">
          <p className="flex-1 text-[15px] text-text-2">{t("translate.unfinished", active)}</p>
          <Button asChild size="sm" variant="solid">
            <Link href="/translate/session">
              <RotateCcw />
              {t("translate.resume")}
            </Link>
          </Button>
        </div>
      ) : null}

      <fieldset>
        <legend className="mb-2.5 font-bold text-navy-900">{t("translate.stepType")}</legend>
        <div role="radiogroup" aria-label={t("translate.stepType")} className="grid gap-2 sm:grid-cols-2">
          <Choice
            on={type === "sentence"}
            onClick={() => pickType("sentence")}
            title={t("translate.typeSentence")}
            sub={t("translate.typeSentenceSub")}
            icon={<MessageSquareText />}
          />
          <Choice
            on={type === "paragraph"}
            onClick={() => pickType("paragraph")}
            title={t("translate.typeParagraph")}
            sub={t("translate.typeParagraphSub")}
            icon={<AlignLeft />}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2.5 font-bold text-navy-900">{t("translate.stepDirection")}</legend>
        <div role="radiogroup" aria-label={t("translate.stepDirection")} className="grid gap-2 sm:grid-cols-3">
          {dirs.map((d) => (
            <Choice key={d.v} on={direction === d.v} onClick={() => setDirection(d.v)} title={t(d.k)} icon={d.icon} />
          ))}
        </div>
        {direction !== "to-zh" ? (
          <label className="mt-2.5 flex cursor-pointer items-center gap-2.5 text-[15px] text-text">
            <input
              type="checkbox"
              checked={showPinyin}
              onChange={(e) => setShowPinyin(e.target.checked)}
              className="size-5 accent-blue-600"
            />
            {t("translate.showPinyin")}
          </label>
        ) : null}
      </fieldset>

      <fieldset>
        <legend className="mb-2.5 font-bold text-navy-900">{t("translate.stepContent")}</legend>
        <div role="radiogroup" aria-label={t("translate.stepContent")} className="grid gap-2 md:grid-cols-3">
          <Choice
            on={source === "auto"}
            onClick={() => setSource("auto")}
            title={t("translate.srcAuto")}
            sub={t("translate.srcAutoSub", { level })}
            icon={<Sparkles />}
          />
          <Choice
            on={source === "grammar"}
            onClick={() => setSource("grammar")}
            title={t("translate.srcGrammar")}
            sub={t("translate.srcGrammarSub")}
            icon={<GrammarIcon />}
          />
          <Choice
            on={source === "vocab"}
            onClick={() => setSource("vocab")}
            title={t("translate.srcVocab")}
            sub={t("translate.srcVocabSub")}
            icon={<BookA />}
          />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[14.5px] font-semibold text-text-2">{t("translate.level")}</span>
            <select
              value={lv}
              onChange={(e) => setLv(Number(e.target.value))}
              className={cn(inputClass, "cursor-pointer")}
            >
              <option value={0}>{t("translate.levelAuto")}</option>
              {T_LEVELS.map((n) => (
                <option key={n} value={n}>
                  {t("translate.levelN", { n })}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[14.5px] font-semibold text-text-2">{t("translate.topic")}</span>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className={cn(inputClass, "cursor-pointer")}
            >
              <option value="">{t("translate.topicAll")}</option>
              {T_TOPICS.map((k) => (
                <option key={k} value={k}>
                  {t(`translate.topics.${k}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {source === "grammar" ? (
          <div className="mt-3 rounded-2xl bg-[#F4F9FF] p-3">
            <p className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-semibold text-text">{t("translate.grammarPick")}</span>
              <span className="text-[13.5px] text-text-2" aria-live="polite">
                {t("translate.grammarChosen", { count: chosen })}
              </span>
            </p>
            {myGrammar.length ? (
              <>
                <p className="mt-1 mb-1.5 text-[13px] font-bold tracking-wide text-blue-700 uppercase">
                  {t("translate.myGrammar")}
                </p>
                <ul
                  aria-label={t("translate.myGrammar")}
                  className="mb-3 grid max-h-[260px] gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2"
                >
                  {myGrammar.map((g) => (
                    <li key={g.id}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-start gap-2.5 rounded-xl border bg-white px-3 py-2",
                          myIds.includes(g.id) ? "border-blue-600" : "border-border",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={myIds.includes(g.id)}
                          onChange={() => toggleMine(g.id)}
                          className="mt-1 size-4 accent-blue-600"
                        />
                        <span className="min-w-0">
                          <span className="block text-[14.5px] font-semibold text-text">{g.title}</span>
                          <span className="block text-[13px] text-text-2">
                            {g.structure ? `${g.structure} · ` : ""}
                            {g.examples
                              ? t("translate.myGrammarExamples", { count: g.examples })
                              : t("translate.myGrammarNoExamples")}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <p className="mb-1.5 text-[13px] font-bold tracking-wide text-text-3 uppercase">
                  {t("translate.systemGrammar")}
                </p>
              </>
            ) : null}
            <ul
              aria-label={t("translate.grammarPick")}
              className="grid max-h-[300px] gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2"
            >
              {levelGrammar.map((g) => (
                <li key={g.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-2.5 rounded-xl border bg-white px-3 py-2",
                      grammarIds.includes(g.id) ? "border-blue-600" : "border-border",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={grammarIds.includes(g.id)}
                      onChange={() => toggleGrammar(g.id)}
                      className="mt-1 size-4 accent-blue-600"
                    />
                    <span className="min-w-0">
                      <span className="block text-[14.5px] font-semibold text-text">{g.name}</span>
                      <span className="block text-[13px] text-text-2">
                        HSK {g.level} · {g.structure}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </fieldset>

      <fieldset>
        <legend className="mb-2.5 font-bold text-navy-900">{t("translate.stepCount")}</legend>
        <div role="radiogroup" aria-label={t("translate.stepCount")} className="flex flex-wrap gap-2">
          {counts.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={count === c}
              onClick={() => setCount(c)}
              className={cn(
                "h-11 min-w-[88px] rounded-lg border-[1.5px] px-3 font-semibold outline-none focus-visible:[box-shadow:var(--focus-ring)]",
                count === c
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-border bg-white text-text hover:border-[#A9D3F8]",
              )}
            >
              {t(type === "sentence" ? "translate.countSentence" : "translate.countParagraph", { count: c })}
            </button>
          ))}
        </div>
      </fieldset>

      <Button
        variant="primary"
        size="lg"
        className="self-center max-md:w-full md:min-w-[260px]"
        disabled={busy || (source === "grammar" && !chosen)}
        onClick={start}
      >
        {busy ? <Loader2 className="animate-spin" /> : <Play />}
        {busy ? t("translate.creating") : t("translate.start")}
      </Button>
    </section>
  );
}
