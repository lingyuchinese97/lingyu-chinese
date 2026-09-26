"use client";
import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Headphones,
  Lightbulb,
  Loader2,
  NotebookPen,
  Plus,
  Save,
  Target,
  Waves,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useIntlTag, useT } from "@/i18n/client";
import { PRONUNCIATION } from "@/lib/limits";
import { cn } from "@/lib/utils";
import { SANDHI_RULES, SANDHI_TIPS, topicLabel, type SandhiRule } from "@/data/pronunciation";
import { generatePractice, type PracticeQuestion } from "../practice";
import type { PronunciationNote } from "../service";
import { NoteDialog } from "./note-dialog";
import { PCard, PTitle } from "./pron-header";
import { Quiz } from "./quiz";
import { SpeakBtn } from "./speak-btn";
import { SPEECH_RATE, useL } from "./speech";
import { saveTopicNote, TopicNoteButton } from "./topic-note";

/**
 * Biến điệu: giải thích, danh sách quy tắc, chi tiết quy tắc (công thức, ví dụ trước → sau, ghi chú từng ví dụ),
 * so sánh phát âm trước / sau, luyện tập nhanh, ghi chú của tôi, ghi chú chung, mẹo.
 */
export function SandhiView({
  rule: initialRule,
  notes: initialNotes,
  quick,
}: {
  rule?: string;
  notes: PronunciationNote[];
  quick: PracticeQuestion[];
}) {
  const t = useT();
  const l = useL();
  const tag = useIntlTag();
  const [ruleId, setRuleId] = React.useState<SandhiRule["id"]>(
    SANDHI_RULES.find((r) => r.id === initialRule)?.id ?? "third-two",
  );
  const [exIndex, setExIndex] = React.useState(0);
  const [notes, setNotes] = React.useState(initialNotes);
  const [questions, setQuestions] = React.useState(quick);
  const [round, setRound] = React.useState(0);
  const [adding, setAdding] = React.useState(false);
  const general = notes.find((n) => n.topic === "sandhi:general")?.content ?? "";
  const [generalDraft, setGeneralDraft] = React.useState(general);
  const [savingGeneral, setSavingGeneral] = React.useState(false);

  const rule = SANDHI_RULES.find((r) => r.id === ruleId)!;
  const ex = rule.examples[exIndex] ?? rule.examples[0]!;
  const topicMap = Object.fromEntries(notes.filter((n) => n.topic).map((n) => [n.topic!, n.content]));
  const setTopic = (topic: string, content: string) =>
    setNotes((list) => {
      const rest = list.filter((n) => n.topic !== topic);
      if (!content) return rest;
      const old = list.find((n) => n.topic === topic);
      const now = new Date();
      return [
        {
          id: old?.id ?? topic,
          topic,
          title: topicLabel(topic)!.vi,
          content,
          createdAt: old?.createdAt ?? now,
          updatedAt: now,
        },
        ...rest,
      ];
    });
  const mine = notes.filter((n) => n.topic !== "sandhi:general" && (n.topic === null || n.topic.startsWith("sandhi:")));

  function pickRule(id: SandhiRule["id"]) {
    setRuleId(id);
    setExIndex(0);
    const url = new URL(window.location.href);
    url.searchParams.set("rule", id);
    window.history.replaceState(null, "", url);
  }
  async function saveGeneral() {
    setSavingGeneral(true);
    const next = await saveTopicNote("sandhi:general", generalDraft, t);
    setSavingGeneral(false);
    if (next !== null) {
      setTopic("sandhi:general", next);
      setGeneralDraft(next);
    }
  }

  const groups = [
    { key: "third", label: t("pronunciation.sandhi.thirdGroup") },
    { key: "fixed", label: t("pronunciation.sandhi.fixedGroup") },
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      <PCard
        aria-labelledby="sh-what"
        className="flex flex-col gap-3 bg-[linear-gradient(100deg,#FFFFFF_0%,#F4F9FF_100%)] md:flex-row md:items-center"
      >
        <span className="hidden size-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 md:flex">
          <Waves className="size-7" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="sh-what" className="text-[18px] font-bold text-navy-900">
            {t("pronunciation.sandhi.whatTitle")}
          </h2>
          <p className="mt-1 text-[14.5px] text-text-2">{t("pronunciation.sandhi.whatDesc")}</p>
        </div>
        <div className="md:max-w-[440px]">
          <p className="mb-1.5 text-[13.5px] font-semibold text-text-2">{t("pronunciation.sandhi.common")}</p>
          <ul className="flex flex-wrap gap-1.5">
            {SANDHI_RULES.map((r) => (
              <li key={r.id} className="rounded-full bg-blue-50 px-3 py-1 text-[13.5px] font-semibold text-blue-700">
                {l(r.short)}
              </li>
            ))}
          </ul>
        </div>
      </PCard>

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] 2xl:grid-cols-[260px_minmax(0,1fr)_380px]">
        <nav aria-labelledby="sh-rules" className="lg:row-span-2 2xl:row-span-1">
          <PCard className="flex flex-col gap-3 p-3 md:p-4">
            <h2 id="sh-rules" className="px-1 text-[16px] font-bold text-navy-900">
              {t("pronunciation.sandhi.rules")}
            </h2>
            {groups.map((g) => (
              <div key={g.key}>
                <p className="mb-1 px-1 text-[12.5px] font-semibold tracking-wide text-text-3 uppercase">{g.label}</p>
                <ul className="flex flex-col gap-1.5">
                  {SANDHI_RULES.filter((r) => r.kind === g.key).map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        aria-current={r.id === ruleId ? "true" : undefined}
                        onClick={() => pickRule(r.id)}
                        className={cn(
                          "flex w-full flex-col rounded-[12px] border px-3 py-2 text-left outline-none focus-visible:shadow-[var(--focus-ring)]",
                          r.id === ruleId
                            ? "border-blue-600 bg-blue-50"
                            : "border-transparent hover:border-border hover:bg-[#F7FBFF]",
                        )}
                      >
                        <span className="text-[15px] font-semibold text-navy-900">{l(r.title)}</span>
                        <span className="text-[13px] text-text-2">{l(r.short)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <Link
              href="/pronunciation/practice?mode=sandhi"
              className="flex items-center gap-2 rounded-[12px] border border-dashed border-[#A9D3F8] px-3 py-2 outline-none hover:bg-blue-50 focus-visible:shadow-[var(--focus-ring)]"
            >
              <Target className="size-5 shrink-0 text-blue-600" aria-hidden="true" />
              <span className="flex flex-col">
                <span className="text-[15px] font-semibold text-navy-900">
                  {t("pronunciation.sandhi.practiceItem")}
                </span>
                <span className="text-[13px] text-text-3">{t("pronunciation.sandhi.practiceItemDesc")}</span>
              </span>
            </Link>
          </PCard>
        </nav>

        <PCard aria-labelledby="sh-rule" className="flex min-w-0 flex-col gap-4">
          <div>
            <h2 id="sh-rule" className="text-[20px] font-extrabold text-navy-900">
              {l(rule.title)}
            </h2>
            <p className="mt-1 text-[14.5px] text-text-2">{l(rule.desc)}</p>
          </div>
          <div className="rounded-[16px] border border-[#F6DE9E] bg-[linear-gradient(135deg,#FFF9EA,#FFF3D2)] px-4 py-3">
            <p className="text-[13px] font-semibold text-[#8A5300]">{t("pronunciation.sandhi.formula")}</p>
            <p className="mt-0.5 text-[22px] font-extrabold tracking-wide text-red" lang="zh">
              {rule.formula}
            </p>
          </div>
          <section aria-labelledby="sh-ex">
            <h3 id="sh-ex" className="mb-2 flex items-center gap-2 text-[16px] font-bold text-navy-900">
              <BookOpen className="size-[18px] text-blue-600" aria-hidden="true" />
              {t("pronunciation.sandhi.examples")}
            </h3>
            <ul className="flex flex-col gap-2">
              {rule.examples.map((e, i) => {
                const topic = `sandhi:${rule.id}:${i}`;
                return (
                  <li
                    key={e.hanzi}
                    className={cn(
                      "flex flex-col gap-2 rounded-[14px] border p-3 sm:flex-row sm:items-center",
                      i === exIndex ? "border-[#A9D3F8] bg-[#F7FBFF]" : "border-border bg-white",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setExIndex(i)}
                      aria-pressed={i === exIndex}
                      aria-label={t("pronunciation.sandhi.compareOf", { hanzi: e.hanzi })}
                      className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 rounded-[10px] text-left outline-none focus-visible:shadow-[var(--focus-ring)]"
                    >
                      <span className="hanzi text-[26px] font-bold text-navy-900" lang="zh">
                        {e.hanzi}
                      </span>
                      <span className="flex items-center gap-2 text-[16px]">
                        <span className="pinyin text-text-2 line-through decoration-text-3/50">{e.pinyin}</span>
                        <ArrowRight className="size-4 text-text-3" aria-hidden="true" />
                        <span className="font-bold text-red">{e.spoken}</span>
                      </span>
                      <span className="text-[14px] text-text-2">{l(e.meaning)}</span>
                    </button>
                    <div className="flex shrink-0 items-center gap-2">
                      <SpeakBtn text={e.hanzi} label={t("ui.listen", { text: e.hanzi })} size="sm" />
                      <TopicNoteButton
                        compact
                        topic={topic}
                        label={e.hanzi}
                        value={topicMap[topic] ?? ""}
                        onChange={(v) => setTopic(topic, v)}
                      />
                    </div>
                    {topicMap[topic] ? (
                      <p className="basis-full rounded-[10px] bg-green-50 px-3 py-1.5 text-[13.5px] whitespace-pre-line text-green-700 sm:order-last">
                        {topicMap[topic]}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
          <div className="rounded-[14px] bg-blue-50 px-4 py-3 text-[14.5px] text-blue-700">
            <Lightbulb className="mr-1.5 inline size-[18px] align-[-3px]" aria-hidden="true" />
            {l(rule.tip)}
          </div>
        </PCard>

        <div className="flex min-w-0 flex-col gap-4 lg:col-start-2 2xl:col-start-auto">
          <PCard aria-labelledby="sh-cmp">
            <PTitle id="sh-cmp" icon={<Headphones />}>
              {t("pronunciation.sandhi.compare")}
            </PTitle>
            <p className="mb-3 text-center hanzi text-[34px] font-bold text-navy-900" lang="zh">
              {ex.hanzi}
            </p>
            <dl className="grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center gap-1 rounded-[14px] bg-[#F3F6FA] p-3">
                <dt className="text-[13px] font-semibold text-text-2">{t("pronunciation.sandhi.before")}</dt>
                <dd className="text-[18px] pinyin">{ex.pinyin}</dd>
                <SpeakBtn
                  text={[...ex.hanzi]}
                  label={t("pronunciation.sandhi.playBefore")}
                  rate={SPEECH_RATE.syllable}
                />
              </div>
              <div className="flex flex-col items-center gap-1 rounded-[14px] bg-red-50 p-3">
                <dt className="text-[13px] font-semibold text-red">{t("pronunciation.sandhi.after")}</dt>
                <dd className="text-[18px] font-bold text-red">{ex.spoken}</dd>
                <SpeakBtn text={ex.hanzi} label={t("pronunciation.sandhi.playAfter")} />
              </div>
            </dl>
          </PCard>

          <section aria-labelledby="sh-quick" className="flex flex-col gap-2">
            <h2 id="sh-quick" className="px-1 text-[17px] font-bold text-navy-900">
              {t("pronunciation.sandhi.quick")}
            </h2>
            <Quiz
              key={round}
              label={t("pronunciation.sandhi.quick")}
              questions={questions}
              onRestart={() => {
                setQuestions(generatePractice("sandhi", 5));
                setRound((r) => r + 1);
              }}
            />
          </section>

          <PCard aria-labelledby="sh-mine">
            <PTitle
              id="sh-mine"
              icon={<NotebookPen />}
              tone="green"
              right={
                <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
                  <Plus />
                  {t("pronunciation.sandhi.addNote")}
                </Button>
              }
            >
              {t("pronunciation.sandhi.myNotes")}
            </PTitle>
            {mine.length ? (
              <ul className="flex flex-col divide-y divide-border">
                {mine.slice(0, 6).map((n) => (
                  <li key={n.id} className="flex flex-col py-2">
                    <span className="text-[14.5px] font-semibold text-navy-900">
                      {n.topic ? l(topicLabel(n.topic) ?? { vi: n.title, en: n.title }) : n.title}
                    </span>
                    <span className="line-clamp-2 text-[13.5px] text-text-2">{n.content}</span>
                    <span className="text-[12.5px] text-text-3">
                      {t("pronunciation.notes.updated", { date: new Date(n.updatedAt).toLocaleDateString(tag) })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-text-3">{t("pronunciation.sandhi.noNotes")}</p>
            )}
            {mine.length ? (
              <Link
                href="/pronunciation/notes"
                className="mt-2 inline-block text-[14px] font-semibold text-blue-600 hover:underline"
              >
                {t("pronunciation.tabs.notes")} →
              </Link>
            ) : null}
          </PCard>

          <PCard aria-labelledby="sh-general">
            <PTitle id="sh-general" icon={<NotebookPen />} tone="green">
              <label htmlFor="sh-general-text">{t("pronunciation.sandhi.generalNote")}</label>
            </PTitle>
            <Textarea
              id="sh-general-text"
              rows={4}
              value={generalDraft}
              maxLength={PRONUNCIATION.MAX_TEXT}
              placeholder={t("pronunciation.sandhi.generalPlaceholder")}
              onChange={(e) => setGeneralDraft(e.target.value)}
            />
            <div className="mt-2 flex items-center justify-end gap-2">
              <span className="mr-auto text-[13px] text-text-3 tabular-nums">
                {generalDraft.length} / {PRONUNCIATION.MAX_TEXT}
              </span>
              <Button size="sm" onClick={saveGeneral} disabled={savingGeneral || generalDraft === general}>
                {savingGeneral ? <Loader2 className="animate-spin" /> : <Save />}
                {t("pronunciation.note.save")}
              </Button>
            </div>
          </PCard>

          <PCard aria-labelledby="sh-tip" className="border-[#F6DE9E] bg-[linear-gradient(135deg,#FFF9EA,#FFF3D2)]">
            <PTitle id="sh-tip" icon={<Lightbulb />} tone="amber">
              {t("pronunciation.sandhi.tips")}
            </PTitle>
            <ul className="grid list-disc gap-1.5 pl-6 text-[14.5px] text-text marker:text-amber">
              {SANDHI_TIPS.map((x) => (
                <li key={x.vi}>{l(x)}</li>
              ))}
            </ul>
          </PCard>
        </div>
      </div>
      <NoteDialog
        open={adding}
        onOpenChange={setAdding}
        note={null}
        onSaved={(n) => setNotes((list) => [n, ...list])}
      />
    </div>
  );
}
