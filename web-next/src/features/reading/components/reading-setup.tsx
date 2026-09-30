"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { BookA, Loader2, Play, Sparkles } from "lucide-react";
import { GrammarIcon } from "@/components/layout/icons";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";
import { T_TOPICS } from "@/data/translation/items";
import { R_TYPES } from "@/data/reading/passages";
import { R_LEVELS, type RSource } from "../schema";
import { pickPassageAction } from "../actions";

/** Chọn bài đọc: cấp (tự động theo trình độ), dạng bài, chủ đề, nội dung (tự chọn / theo từ vựng / theo ngữ pháp). */
export function ReadingSetup({ level, grammar }: { level: number; grammar: { id: string; name: string }[] }) {
  const t = useT();
  const router = useRouter();
  const [lv, setLv] = React.useState(0);
  const [type, setType] = React.useState("");
  const [topic, setTopic] = React.useState("");
  const [source, setSource] = React.useState<RSource>("auto");
  const [gid, setGid] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function start() {
    setBusy(true);
    const r = await pickPassageAction({ level: lv, type, topic, source, grammar: gid });
    if (!r.ok) {
      setBusy(false);
      return void toast.error(r.message);
    }
    router.push(`/reading/${r.data.id}`);
  }

  const chip = (on: boolean) =>
    cn(
      "inline-flex min-h-10 items-center rounded-full border-[1.5px] px-4 text-[14.5px] font-semibold outline-none focus-visible:[box-shadow:var(--focus-ring)]",
      on ? "border-blue-600 bg-blue-600 text-white" : "border-border bg-white text-text-2 hover:border-[#A9D3F8]",
    );
  const sources: { v: RSource; title: string; sub: string; icon: React.ReactNode }[] = [
    { v: "auto", title: t("reading.sourceAuto"), sub: t("reading.sourceAutoSub"), icon: <Sparkles /> },
    { v: "vocab", title: t("reading.sourceVocab"), sub: t("reading.sourceVocabSub"), icon: <BookA /> },
    { v: "grammar", title: t("reading.sourceGrammar"), sub: t("reading.sourceGrammarSub"), icon: <GrammarIcon /> },
  ];

  return (
    <section
      aria-labelledby="rd-setup"
      className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-white p-4 shadow-card md:p-6"
    >
      <h2 id="rd-setup" className="text-[19px] font-extrabold text-navy-900">
        {t("reading.setupTitle")}
      </h2>
      <fieldset>
        <legend className="mb-2 font-bold text-navy-900">{t("reading.level")}</legend>
        <div role="radiogroup" aria-label={t("reading.level")} className="flex flex-wrap gap-2">
          <button
            type="button"
            role="radio"
            aria-checked={lv === 0}
            onClick={() => setLv(0)}
            className={chip(lv === 0)}
          >
            {t("reading.levelAuto", { level })}
          </button>
          {R_LEVELS.map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={lv === n}
              onClick={() => setLv(n)}
              className={chip(lv === n)}
            >
              {t("reading.levelN", { n })}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-bold text-navy-900">{t("reading.type")}</legend>
        <div role="radiogroup" aria-label={t("reading.type")} className="flex flex-wrap gap-2">
          <button type="button" role="radio" aria-checked={!type} onClick={() => setType("")} className={chip(!type)}>
            {t("reading.typeAll")}
          </button>
          {R_TYPES.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={type === k}
              onClick={() => setType(k)}
              className={chip(type === k)}
            >
              {t(`reading.types.${k}`)}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-1.5 sm:max-w-[360px]">
        <span className="font-bold text-navy-900">{t("reading.topic")}</span>
        <select value={topic} onChange={(e) => setTopic(e.target.value)} className={cn(inputClass, "cursor-pointer")}>
          <option value="">{t("reading.topicAll")}</option>
          {T_TOPICS.map((k) => (
            <option key={k} value={k}>
              {t(`translate.topics.${k}`)}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend className="mb-2 font-bold text-navy-900">{t("reading.source")}</legend>
        <div role="radiogroup" aria-label={t("reading.source")} className="grid gap-2 md:grid-cols-3">
          {sources.map((x) => (
            <button
              key={x.v}
              type="button"
              role="radio"
              aria-checked={source === x.v}
              onClick={() => setSource(x.v)}
              className={cn(
                "flex min-h-[70px] items-center gap-3 rounded-xl border-[1.5px] px-3.5 py-2.5 text-left outline-none focus-visible:[box-shadow:var(--focus-ring)] [&_svg]:size-6 [&_svg]:shrink-0",
                source === x.v
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-border bg-white text-text hover:border-[#A9D3F8]",
              )}
            >
              <span className={source === x.v ? "text-blue-600" : "text-text-3"}>{x.icon}</span>
              <span className="min-w-0">
                <span className="block font-bold">{x.title}</span>
                <span className="block text-[13px] text-text-2">{x.sub}</span>
              </span>
            </button>
          ))}
        </div>
        {source === "grammar" ? (
          <label className="mt-2.5 flex flex-col gap-1.5 sm:max-w-[420px]">
            <span className="text-[14.5px] font-semibold text-text-2">{t("reading.grammarPick")}</span>
            <select value={gid} onChange={(e) => setGid(e.target.value)} className={cn(inputClass, "cursor-pointer")}>
              <option value="">{t("reading.grammarAny")}</option>
              {grammar.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </fieldset>
      <Button
        variant="primary"
        size="lg"
        className="self-center max-md:w-full md:min-w-[240px]"
        disabled={busy || (source === "grammar" && !gid)}
        onClick={start}
      >
        {busy ? <Loader2 className="animate-spin" /> : <Play />}
        {busy ? t("reading.starting") : t("reading.start")}
      </Button>
    </section>
  );
}
