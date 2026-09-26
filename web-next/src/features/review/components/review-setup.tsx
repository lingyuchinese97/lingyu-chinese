"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Check,
  FileText,
  ListChecks,
  Loader2,
  Pin,
  Play,
  RefreshCw,
  Shuffle,
  Tag as TagIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/badges";
import { useConfirm } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toaster";
import { Flashcard } from "@/components/flashcard";
import { cn } from "@/lib/utils";
import { COUNTS, MODES, MODE_LABEL, type ReviewMode } from "../schema";
import { abandonAction, countPoolAction, startCustomAction } from "../actions";
import { useT } from "@/i18n/client";

type Props = {
  tags: { name: string; count: number }[];
  total: number;
  last: { tags: string[]; count: number; mode: ReviewMode; showImage: boolean } | null;
  active: { answered: number; total: number } | null;
};

const MODE_ICON: Record<ReviewMode, React.ReactNode> = {
  meaning: <FileText />,
  hanzi: (
    <span className="font-cn text-lg font-bold" lang="zh">
      中
    </span>
  ),
  pinyin: <span className="text-base font-bold">pīn</span>,
  mixed: <Shuffle />,
};

export function ReviewSetup({ tags, total, last, active }: Props) {
  const router = useRouter();
  const t = useT();
  const [confirm, confirmNode] = useConfirm();
  const [sel, setSel] = React.useState<string[]>((last?.tags ?? []).filter((x) => tags.some((y) => y.name === x)));
  const [count, setCount] = React.useState(last?.count ?? 10);
  const [mode, setMode] = React.useState<ReviewMode>(last?.mode ?? "meaning");
  const [avail, setAvail] = React.useState(total);
  const [busy, setBusy] = React.useState(false);

  // Số từ khả dụng theo tag đã chọn (một từ nhiều tag chỉ tính 1 lần) — hỏi server.
  React.useEffect(() => {
    let alive = true;
    if (!sel.length) {
      Promise.resolve().then(() => alive && setAvail(total));
    } else {
      countPoolAction(sel).then((r) => alive && r.ok && setAvail(r.data));
    }
    return () => {
      alive = false;
    };
  }, [sel, total]);

  const opts = COUNTS.map((c) => ({
    value: c as number,
    label: t("review.setup.countWords", { count: c }),
    disabled: c > avail,
  }));
  if (avail > 0 && avail < 50 && !COUNTS.includes(avail as (typeof COUNTS)[number]))
    opts.push({ value: avail, label: t("review.setup.all", { count: avail }), disabled: false });
  const okOpts = opts.filter((o) => !o.disabled);
  const effCount = okOpts.some((o) => o.value === count)
    ? count
    : ((okOpts.find((o) => o.value === 10) ?? okOpts[okOpts.length - 1])?.value ?? 0);
  const valid = avail > 0 && effCount > 0;

  async function start() {
    if (busy || !valid) return;
    if (active) {
      const ok = await confirm({
        title: t("review.setup.newTitle"),
        message: t("review.setup.newMessage"),
        confirmLabel: t("review.setup.newConfirm"),
        icon: <RefreshCw />,
      });
      if (!ok) return;
    }
    setBusy(true);
    const r = await startCustomAction({ tags: sel, count: effCount, mode, showImage: false });
    if (!r.ok) {
      setBusy(false);
      return void toast.error(r.message || t("review.setup.createFailed"));
    }
    router.push("/review/session");
  }

  async function abandon() {
    const ok = await confirm({
      title: t("review.setup.abandonTitle"),
      message: t("review.setup.abandonMessage"),
      confirmLabel: t("review.setup.abandonConfirm"),
      danger: true,
    });
    if (!ok) return;
    await abandonAction();
    toast.info(t("review.setup.abandoned"));
    router.refresh();
  }

  const toggleTag = (name: string) => setSel((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]));

  return (
    <>
      {active ? (
        <div
          role="status"
          className="flex flex-wrap items-center gap-3 rounded-[18px] border border-[#CFE3F7] bg-blue-50 px-4 py-3.5"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-blue-600">
            <RefreshCw className="size-5" />
          </span>
          <div className="min-w-0 flex-1 text-[15px] text-text-2">
            <strong className="block text-navy">{t("review.setup.unfinished")}</strong>
            {t("review.setup.unfinishedDesc", { done: active.answered, total: active.total })}
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button size="sm" variant="secondary" onClick={abandon} className="flex-1 sm:flex-none">
              {t("review.setup.abandonConfirm")}
            </Button>
            <Button size="sm" variant="solid" asChild className="flex-1 sm:flex-none">
              <Link href="/review/session">{t("review.setup.resume")}</Link>
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
        <section
          aria-labelledby="rs-title"
          className="flex flex-col gap-6 rounded-[var(--radius-xl)] border border-border bg-white/92 p-4 shadow-card md:p-7"
        >
          <div className="flex items-start gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Pin className="size-7" />
            </span>
            <div>
              <h1 id="rs-title" className="text-[26px] font-extrabold tracking-tight text-navy md:text-[32px]">
                {t("review.setup.heading")}
              </h1>
              <p className="mt-1 text-[15px] text-text-2 md:text-[17px]">{t("review.setup.sub")}</p>
            </div>
          </div>

          <Step n={1} title={t("review.setup.step1")} desc={t("review.setup.step1Desc")}>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(116px,1fr))] gap-3">
              <CheckChip on={!sel.length} onClick={() => setSel([])}>
                {t("review.setup.allVocab")}
              </CheckChip>
              {tags.map((tg) => (
                <CheckChip
                  key={tg.name}
                  on={sel.includes(tg.name)}
                  onClick={() => toggleTag(tg.name)}
                  title={t("review.setup.countWords", { count: tg.count })}
                >
                  {tg.name}
                </CheckChip>
              ))}
            </div>
          </Step>

          <Step n={2} title={t("review.setup.step2")} desc={t("review.setup.step2Desc", { count: avail })}>
            <div
              role="radiogroup"
              aria-label={t("review.setup.countLabel")}
              className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-3"
            >
              {opts.map((o) => (
                <CheckChip
                  key={`${o.value}-${o.label}`}
                  role="radio"
                  on={o.value === effCount}
                  disabled={o.disabled}
                  title={o.disabled ? t("review.setup.onlyAvail", { count: avail }) : undefined}
                  onClick={() => setCount(o.value)}
                >
                  {o.label}
                </CheckChip>
              ))}
            </div>
          </Step>

          <Step n={3} title={t("review.setup.step3")} desc={t("review.setup.step3Desc")}>
            <div
              role="radiogroup"
              aria-label={t("review.setup.step3")}
              className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            >
              {MODES.map((m) => {
                const on = m.value === mode;
                return (
                  <button
                    key={m.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setMode(m.value)}
                    className={cn(
                      "relative flex min-h-[64px] items-center gap-3 rounded-[14px] border-[1.5px] bg-white px-4 py-3 text-left font-semibold transition-colors xl:flex-col xl:justify-center xl:py-4 xl:text-center",
                      on
                        ? "border-blue bg-blue-50 text-blue-700"
                        : "border-border text-text hover:border-border-strong",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-full [&_svg]:size-6",
                        on ? "bg-white text-blue-600" : "bg-bg text-blue-600",
                      )}
                    >
                      {MODE_ICON[m.value]}
                    </span>
                    <span className="text-[15px]">{t(m.label)}</span>
                    {on ? <Check className="absolute top-2 right-2 size-4 text-blue" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
          </Step>
        </section>

        <aside aria-label={t("review.setup.summary")} className="flex flex-col gap-5 lg:sticky lg:top-4">
          <div className="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-white/75 shadow-card">
            <div className="flex items-center gap-3.5 bg-[linear-gradient(90deg,#EEF6FF,#F6FAFF)] px-5 py-4 text-xl font-semibold text-text">
              <span className="flex size-11 items-center justify-center rounded-full bg-[#E1EFFD] text-blue-600">
                <ListChecks className="size-6" />
              </span>
              {t("review.setup.summary")}
            </div>
            <div aria-live="polite" className="flex flex-col gap-4 bg-white px-5 py-5">
              <SumRow icon={<TagIcon />} label={t("review.setup.sumTags")}>
                {sel.length ? (
                  <span className="flex flex-wrap gap-1.5">
                    {sel.map((x) => (
                      <Tag key={x} name={x} />
                    ))}
                  </span>
                ) : (
                  t("review.setup.allVocab")
                )}
              </SumRow>
              <SumRow icon={<FileText />} label={t("review.setup.sumCount")}>
                {effCount ? t("review.setup.countWords", { count: effCount }) : "—"}
              </SumRow>
              <SumRow icon={<BookOpen />} label={t("review.setup.sumMode")}>
                {t(MODE_LABEL[mode])}
              </SumRow>
              <p className="text-center hand text-lg leading-snug whitespace-pre-line">{t("review.setup.quote")}</p>
            </div>
          </div>
          <div aria-hidden="true" className="hidden justify-center py-2 lg:flex">
            <Flashcard hanzi="学习" pinyin="xué xí" meaning={t("review.setup.flashMeaning")} />
          </div>
          <div className="max-lg:fixed max-lg:inset-x-0 max-lg:bottom-[calc(var(--tabbar-h)+var(--safe-b))] max-lg:z-30 max-lg:border-t max-lg:border-border max-lg:bg-white max-lg:px-4 max-lg:py-2.5 md:max-lg:bottom-0">
            <Button variant="solid" size="lg" block disabled={!valid || busy} onClick={start}>
              {busy ? <Loader2 className="animate-spin" /> : <Play />}
              {busy ? t("review.setup.preparing") : t("review.setup.start")}
              {!busy ? <ArrowRight /> : null}
            </Button>
            {!valid ? (
              <p className="mt-1.5 text-center text-[13.5px] text-text-3">{t("review.setup.noneInTags")}</p>
            ) : null}
          </div>
        </aside>
      </div>
      {confirmNode}
    </>
  );
}

function StepNum({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue text-base font-bold text-white md:size-10"
    >
      {n}
    </span>
  );
}

function Step({ n, title, desc, children }: { n: number; title: string; desc: string; children: React.ReactNode }) {
  return (
    <fieldset className="m-0 flex min-w-0 gap-4 border-0 p-0">
      <StepNum n={n} />
      <div className="min-w-0 flex-1">
        <legend className="text-[17px] font-bold text-navy">{title}</legend>
        <p className="mb-3 text-[14.5px] text-text-2">{desc}</p>
        {children}
      </div>
    </fieldset>
  );
}

function CheckChip({ on, children, className, ...props }: React.ComponentProps<"button"> & { on: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={props.role === "radio" ? undefined : on}
      aria-checked={props.role === "radio" ? on : undefined}
      className={cn(
        "relative inline-flex min-h-11 items-center justify-center rounded-[10px] border-[1.5px] px-3 text-[14.5px] whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        on
          ? "border-blue bg-blue-50 font-bold text-blue-600"
          : "border-transparent bg-[#EEF5FC] font-medium text-text-2 hover:bg-blue-100",
        className,
      )}
      {...props}
    >
      {children}
      {on ? (
        <span
          aria-hidden="true"
          className="absolute -top-2 -right-2 flex size-[22px] items-center justify-center rounded-full border-2 border-white bg-blue text-white"
        >
          <Check className="size-3" strokeWidth={3} />
        </span>
      ) : null}
    </button>
  );
}

function SumRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-blue-600 [&_svg]:size-5">{icon}</span>
      <div className="min-w-0">
        <div className="text-[13.5px] text-text-3">{label}</div>
        <div className="font-semibold text-text">{children}</div>
      </div>
    </div>
  );
}
