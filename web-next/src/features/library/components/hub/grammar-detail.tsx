"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookmarkCheck,
  BookmarkPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Loader2,
  RotateCcw,
  Share2,
  XCircle,
} from "lucide-react";
import { SpeakButton } from "@/components/speak-button";
import { toast } from "@/components/ui/toaster";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import type { GPartKind } from "@/data/library/grammar";
import type { LibGrammarDetail } from "../../grammar";
import { saveGrammarAction, setGrammarLearnedAction } from "../../actions";
import { Cover, Crumbs, Pill, Ring, card } from "./parts";
import { GrammarFav } from "./grammar-list";

const PART: Record<GPartKind, string> = {
  subj: "border-[#BCD7FF] bg-[#EAF3FF] text-[#1F5FCC]",
  key: "border-[#FFC2CB] bg-[#FFE9EC] text-[#C42A42]",
  slot: "border-[#FFE0A3] bg-[#FFF6E0] text-[#8A5A00]",
  end: "border-[#D5C6FF] bg-[#F3EEFF] text-[#6B3FD0]",
};
const SECTIONS = ["overview", "structure", "usage", "examples", "notes", "quiz"] as const;

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={`g-${id}`} aria-labelledby={`g-${id}-h`} className={cn(card, "scroll-mt-24 p-4 md:p-5")}>
      <h2 id={`g-${id}-h`} className="mb-3 text-[20px] font-extrabold text-navy-900">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Bài tập nhanh: chọn đáp án → kiểm tra → giải thích; làm lại được. Đáp án chấm ở trình duyệt (nội dung công khai). */
function Quiz({ items }: { items: LibGrammarDetail["quiz"] }) {
  const t = useT();
  const [picked, setPicked] = React.useState<(number | null)[]>(() => items.map(() => null));
  const [checked, setChecked] = React.useState(false);
  const right = picked.filter((p, i) => p === items[i]!.answer).length;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] text-text-2">{t("libgram.quizSub")}</p>
      <ol className="flex flex-col gap-4">
        {items.map((q, i) => (
          <li key={i}>
            <fieldset className="rounded-[14px] border border-border p-3">
              <legend className="px-1 text-[13px] font-semibold text-text-2">
                {t("libgram.question", { n: i + 1 })}
                {q.prompt ? ` · ${q.prompt}` : ""}
              </legend>
              {q.q ? (
                <p lang="zh" className="mb-2 hanzi text-[20px] text-navy-900">
                  {q.q}
                </p>
              ) : null}
              <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((o, j) => {
                  const on = picked[i] === j;
                  const good = checked && j === q.answer;
                  const bad = checked && on && j !== q.answer;
                  return (
                    <label
                      key={j}
                      className={cn(
                        "flex min-h-11 cursor-pointer items-center gap-2 rounded-[12px] border px-3 py-2",
                        good
                          ? "border-[#22C08A] bg-[#E8F8F0]"
                          : bad
                            ? "border-[#E5484D] bg-[#FFECEC]"
                            : on
                              ? "border-blue-600 bg-blue-50"
                              : "border-border hover:bg-[#F7FAFE]",
                      )}
                    >
                      <input
                        type="radio"
                        name={`gq-${i}`}
                        className="size-4 accent-blue-600"
                        checked={on}
                        disabled={checked}
                        onChange={() => setPicked((p) => p.map((x, k) => (k === i ? j : x)))}
                      />
                      <span lang="zh" className="hanzi text-[17px] text-navy-900">
                        {o}
                      </span>
                    </label>
                  );
                })}
              </div>
              {checked ? (
                <p
                  role="status"
                  className={cn(
                    "mt-2 flex items-start gap-1.5 text-[14px]",
                    picked[i] === q.answer ? "text-[#178A5A]" : "text-[#C42A42]",
                  )}
                >
                  {picked[i] === q.answer ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  )}
                  <span>
                    {picked[i] === q.answer
                      ? t("libgram.correct")
                      : t("libgram.wrong", { answer: q.options[q.answer]! })}{" "}
                    <span className="text-text-2">{q.explain}</span>
                  </span>
                </p>
              ) : null}
            </fieldset>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-3">
        {checked ? (
          <>
            <p className="font-bold text-navy-900">{t("libgram.score", { right, total: items.length })}</p>
            <button
              type="button"
              onClick={() => {
                setPicked(items.map(() => null));
                setChecked(false);
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-[12px] border border-border px-4 font-semibold text-navy-900 hover:bg-blue-50"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              {t("libgram.again")}
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={picked.some((p) => p === null)}
            onClick={() => setChecked(true)}
            className="inline-flex min-h-11 items-center rounded-[12px] bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {t("libgram.check")}
          </button>
        )}
      </div>
    </div>
  );
}

/** Chi tiết một bài ngữ pháp: đầu trang, mục lục, cấu trúc tô màu, cách dùng, ví dụ (nghe), bài tập; cột phải tiến độ + bài liên quan. */
export function GrammarDetailView({ data }: { data: LibGrammarDetail }) {
  const t = useT();
  const [learned, setLearned] = React.useState(data.learned);
  const [progress, setProgress] = React.useState(data.progress);
  const router = useRouter();
  const [savedId, setSavedId] = React.useState(data.savedId);
  const saved = !!savedId;
  const [busy, setBusy] = React.useState<"" | "learn" | "save">("");

  async function toggleLearned() {
    setBusy("learn");
    const r = await setGrammarLearnedAction(data.id, !learned);
    setBusy("");
    if (!r.ok) return void toast.error(t.maybe(r.message));
    setLearned(r.data.learned);
    setProgress(r.data.progress);
  }
  async function save() {
    setBusy("save");
    const r = await saveGrammarAction(data.id);
    setBusy("");
    if (!r.ok) return void toast.error(t.maybe(r.message));
    setSavedId(r.data.id);
    const id = r.data.id;
    toast.success(r.data.added ? t("libgram.savedToast") : t("libgram.alreadySaved"), {
      action: { label: t("libgram.editMine"), onClick: () => router.push(`/grammar/${id}/edit`) },
    });
  }
  async function share() {
    const url = window.location.href.split("?")[0]!;
    try {
      if (navigator.share) await navigator.share({ title: `${data.zh} – ${data.name}`, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success(t("libhub.copied"));
      }
    } catch {
      /* người dùng huỷ chia sẻ */
    }
  }
  const btn =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-[12px] border border-border bg-white px-3 text-[14px] font-semibold text-navy-900 hover:bg-blue-50 disabled:opacity-60";

  return (
    <div className="flex flex-col gap-4">
      <Crumbs
        label={t("shell.breadcrumb")}
        home={t("shell.nav.home")}
        items={[
          { href: "/library", text: t("libhub.breadcrumb") },
          { href: "/library/grammar", text: t("libgram.title") },
          { href: `/library/grammar?hsk=${data.hsk}`, text: `HSK ${data.hsk}` },
          { text: data.zh },
        ]}
      />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <header className={cn(card, "flex flex-col gap-4 p-4 sm:flex-row md:p-5")}>
            <Cover
              emoji={data.emoji}
              tone={data.tone}
              size="lg"
              className="h-[110px] w-full shrink-0 rounded-[20px] sm:h-[150px] sm:w-[180px]"
            />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap gap-1.5">
                <Pill>HSK {data.hsk}</Pill>
                <Pill color="green">{t(`libgram.topics.${data.topic}`)}</Pill>
                <Pill color="amber">{t("libhub.cats.grammar")}</Pill>
              </p>
              <h1 className="mt-2 flex flex-wrap items-center gap-3">
                <span lang="zh" className="hanzi text-[38px] leading-tight font-bold text-navy-900 md:text-[44px]">
                  {data.zh}
                </span>
                <SpeakButton
                  text={data.zh.replace(/\s*…\s*/g, "")}
                  label={t("libgram.listen", { text: data.zh })}
                  className="border border-border"
                />
              </h1>
              <p className="text-[16px] text-text-2">{data.py}</p>
              <p className="mt-1 text-[18px] font-bold text-[#C42A42]">{data.name}</p>
              <p className="mt-1 text-[15px] text-text-2">{data.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <GrammarFav id={data.id} name={data.zh} on={data.favorite} withText />
                {savedId ? (
                  <Link href={`/grammar/${savedId}/edit`} className={btn}>
                    <BookmarkCheck className="size-4 text-[#22C08A]" aria-hidden="true" />
                    {t("libgram.savedEdit")}
                  </Link>
                ) : (
                  <button type="button" onClick={save} disabled={busy === "save"} className={btn}>
                    {busy === "save" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <BookmarkPlus className="size-4" />
                    )}
                    {t("libgram.save")}
                  </button>
                )}
                <button type="button" onClick={share} className={btn}>
                  <Share2 className="size-4" />
                  {t("libgram.share")}
                </button>
              </div>
            </div>
          </header>

          <nav
            aria-label={t("libgram.sectionsLabel")}
            className="sticky top-0 z-10 -mx-1 flex gap-2 overflow-x-auto bg-bg/90 px-1 py-1 backdrop-blur"
          >
            {SECTIONS.map((s) => (
              <a
                key={s}
                href={`#g-${s}`}
                className="inline-flex min-h-10 shrink-0 items-center rounded-[12px] border border-border bg-white px-4 text-[14.5px] font-semibold whitespace-nowrap text-navy-900 hover:bg-blue-50"
              >
                {t(`libgram.tabs.${s}`)}
              </a>
            ))}
          </nav>

          <Section id="overview" title={t("libgram.intro")}>
            <p className="text-[16px] leading-relaxed text-navy-900">{data.intro}</p>
            {data.meaning.length ? (
              <>
                <h3 className="mt-4 mb-1.5 font-bold text-navy-900">{t("libgram.meaning")}</h3>
                <ul className="list-disc space-y-1 pl-5 text-[15px] text-navy-900">
                  {data.meaning.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </Section>

          <Section id="structure" title={t("libgram.structure")}>
            <ol className="flex flex-wrap items-start gap-2">
              {data.structure.map((p, i) => (
                <li key={i} className="flex items-start gap-2">
                  {i ? (
                    <span aria-hidden="true" className="pt-2.5 text-[20px] font-bold text-text-3">
                      +
                    </span>
                  ) : null}
                  <span className="flex flex-col items-center gap-1">
                    <span
                      lang="zh"
                      className={cn("rounded-[12px] border px-4 py-2 hanzi text-[20px] font-bold", PART[p.kind])}
                    >
                      {p.zh}
                    </span>
                    <span className="max-w-[140px] text-center text-[12.5px] text-text-2">{p.label}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="usage" title={t("libgram.usage")}>
            <ol className="flex flex-col gap-2">
              {data.usage.map((u, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[13px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 text-[15.5px] text-navy-900">{u}</span>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="examples" title={t("libgram.examples")}>
            <ul className="grid gap-3 md:grid-cols-2">
              {data.examples.map((e, i) => (
                <li key={i} className="flex items-start gap-3 rounded-[14px] border border-border p-3">
                  <Cover emoji={e.emoji} tone={data.tone} size="sm" className="size-14 shrink-0 rounded-[12px]" />
                  <div className="min-w-0 flex-1">
                    <p lang="zh" className="hanzi text-[19px] text-navy-900">
                      {e.zh}
                    </p>
                    <p className="text-[13.5px] text-text-2">{e.py}</p>
                    <p className="text-[14.5px] text-navy-900">{e.meaning}</p>
                  </div>
                  <SpeakButton text={e.zh} label={t("libgram.listen", { text: e.zh })} />
                </li>
              ))}
            </ul>
          </Section>

          <Section id="notes" title={t("libgram.notes")}>
            <ul className="flex flex-col gap-2">
              {data.notes.map((n, i) => (
                <li key={i} className="rounded-[12px] border-l-4 border-[#F5B70A] bg-[#FFF9EC] px-3 py-2 text-[15px]">
                  {n}
                </li>
              ))}
            </ul>
          </Section>

          <Section id="quiz" title={t("libgram.quiz")}>
            <Quiz items={data.quiz} />
          </Section>

          <nav aria-label={t("libgram.levelLessons", { hsk: data.hsk })} className="flex justify-between gap-2">
            {data.prev ? (
              <Link href={`/library/grammar/${data.prev}`} className={btn}>
                <ChevronLeft className="size-4" aria-hidden="true" />
                {t("libgram.prev")}
              </Link>
            ) : (
              <span />
            )}
            {data.next ? (
              <Link href={`/library/grammar/${data.next}`} className={btn}>
                {t("libgram.next")}
                <ChevronRight className="size-4" aria-hidden="true" />
              </Link>
            ) : null}
          </nav>
        </div>

        <aside className="flex flex-col gap-4">
          <section aria-labelledby="gd-progress" className={cn(card, "flex flex-col gap-3 p-4")}>
            <div className="flex items-center gap-4">
              <Ring value={progress.learned} total={progress.total} />
              <div className="min-w-0">
                <h2 id="gd-progress" className="font-bold text-navy-900">
                  {t("libgram.progress", { hsk: data.hsk })}
                </h2>
                <p className="text-[13.5px] text-text-2">
                  {t("libgram.progressText", { learned: progress.learned, total: progress.total })}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleLearned}
              disabled={busy === "learn"}
              aria-pressed={learned}
              className={cn(
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-[12px] px-4 font-semibold",
                learned
                  ? "border border-[#22C08A] bg-[#E8F8F0] text-[#178A5A]"
                  : "bg-blue-600 text-white hover:bg-blue-700",
              )}
            >
              {busy === "learn" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : learned ? (
                <CheckCircle2 className="size-5" aria-hidden="true" />
              ) : null}
              {learned ? t("libgram.learned") : t("libgram.markLearned")}
            </button>
            {learned ? (
              <button
                type="button"
                onClick={toggleLearned}
                disabled={busy === "learn"}
                className="text-[13px] text-text-2 underline hover:text-blue-600"
              >
                {t("libgram.unmark")}
              </button>
            ) : null}
          </section>

          <section aria-labelledby="gd-level" className={cn(card, "p-4")}>
            <h2 id="gd-level" className="mb-2 text-[17px] font-extrabold text-navy-900">
              {t("libgram.levelLessons", { hsk: data.hsk })}
            </h2>
            <ol className="flex flex-col">
              {data.level.map((x) => {
                const done = x.id === data.id ? learned : x.learned;
                const here = x.id === data.id;
                return (
                  <li key={x.id}>
                    <Link
                      href={`/library/grammar/${x.id}`}
                      aria-current={here ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-[12px] px-2 py-2 hover:bg-blue-50",
                        here && "bg-blue-50",
                      )}
                    >
                      <span className="w-5 text-right text-[13px] text-text-3">{x.no}</span>
                      <span lang="zh" className="min-w-[56px] hanzi text-[17px] font-bold text-navy-900">
                        {x.zh}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13.5px] text-text-2">{x.name}</span>
                      {done ? (
                        <CheckCircle2
                          className="size-4 shrink-0 text-[#22C08A]"
                          aria-label={t("libgram.learnedBadge")}
                        />
                      ) : (
                        <Circle className="size-4 shrink-0 text-[#C9D6E5]" aria-hidden="true" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>

          {data.related.length ? (
            <section aria-labelledby="gd-related" className={cn(card, "p-4")}>
              <h2 id="gd-related" className="mb-2 text-[17px] font-extrabold text-navy-900">
                {t("libgram.related")}
              </h2>
              <ul className="flex flex-col gap-1">
                {data.related.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/library/grammar/${r.id}`}
                      className="flex items-center gap-3 rounded-[12px] px-2 py-2 hover:bg-blue-50"
                    >
                      <Cover
                        emoji={r.emoji}
                        tone={r.tone}
                        size="sm"
                        className="size-11 shrink-0 rounded-[10px] text-[22px]"
                      />
                      <span className="min-w-0 flex-1">
                        <span lang="zh" className="block hanzi font-bold text-navy-900">
                          {r.zh}
                        </span>
                        <span className="block truncate text-[13px] text-text-2">{r.name}</span>
                      </span>
                      <Pill>HSK {r.hsk}</Pill>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="gd-materials" className={cn(card, "p-4")}>
            <h2 id="gd-materials" className="mb-2 text-[17px] font-extrabold text-navy-900">
              {t("libgram.materials")}
            </h2>
            <ul className="flex flex-col gap-1">
              {data.sets.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/library/vocabulary/${s.id}`}
                    className="flex items-center gap-3 rounded-[12px] px-2 py-2 hover:bg-blue-50"
                  >
                    <span aria-hidden="true" className="text-[22px]">
                      {s.emoji}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-semibold text-navy-900">{s.title}</span>
                    <span className="text-[12.5px] text-text-2">{t("libgram.materialsWords", { count: s.total })}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/translate" className="flex items-center gap-3 rounded-[12px] px-2 py-2 hover:bg-blue-50">
                  <span aria-hidden="true" className="text-[22px]">
                    ✍️
                  </span>
                  <span className="min-w-0 flex-1 font-semibold text-navy-900">{t("libgram.docTranslate")}</span>
                  <ChevronRight className="size-4 text-text-3" aria-hidden="true" />
                </Link>
              </li>
              {saved ? (
                <li>
                  <Link
                    href={`/grammar/${savedId}`}
                    className="flex items-center gap-3 rounded-[12px] px-2 py-2 hover:bg-blue-50"
                  >
                    <span aria-hidden="true" className="text-[22px]">
                      📒
                    </span>
                    <span className="min-w-0 flex-1 font-semibold text-navy-900">{t("libgram.practiceMine")}</span>
                    <ChevronRight className="size-4 text-text-3" aria-hidden="true" />
                  </Link>
                </li>
              ) : null}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
