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
  const [confirm, confirmNode] = useConfirm();
  const [sel, setSel] = React.useState<string[]>((last?.tags ?? []).filter((t) => tags.some((x) => x.name === t)));
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

  const opts = COUNTS.map((c) => ({ value: c as number, label: `${c} từ`, disabled: c > avail }));
  if (avail > 0 && avail < 50 && !COUNTS.includes(avail as (typeof COUNTS)[number]))
    opts.push({ value: avail, label: `Tất cả (${avail})`, disabled: false });
  const okOpts = opts.filter((o) => !o.disabled);
  const effCount = okOpts.some((o) => o.value === count)
    ? count
    : ((okOpts.find((o) => o.value === 10) ?? okOpts[okOpts.length - 1])?.value ?? 0);
  const valid = avail > 0 && effCount > 0;

  async function start() {
    if (busy || !valid) return;
    if (active) {
      const ok = await confirm({
        title: "Bắt đầu bài mới?",
        message: "Bài ôn tập đang làm dở sẽ bị bỏ để tạo bài mới.",
        confirmLabel: "Bắt đầu bài mới",
        icon: <RefreshCw />,
      });
      if (!ok) return;
    }
    setBusy(true);
    const r = await startCustomAction({ tags: sel, count: effCount, mode, showImage: false });
    if (!r.ok) {
      setBusy(false);
      return void toast.error(r.message || "Không thể tạo bài ôn tập.");
    }
    router.push("/review/session");
  }

  async function abandon() {
    const ok = await confirm({
      title: "Bỏ bài ôn tập đang làm?",
      message: "Tiến độ của bài đang làm sẽ không được lưu.",
      confirmLabel: "Bỏ bài",
      danger: true,
    });
    if (!ok) return;
    await abandonAction();
    toast.info("Đã bỏ bài ôn tập cũ.");
    router.refresh();
  }

  const toggleTag = (t: string) => setSel((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

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
            <strong className="block text-navy">Bạn còn một bài ôn tập chưa hoàn thành</strong>
            Đã làm {active.answered}/{active.total} câu — tiếp tục hoặc bỏ bài để tạo bài mới.
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button size="sm" variant="secondary" onClick={abandon} className="flex-1 sm:flex-none">
              Bỏ bài
            </Button>
            <Button size="sm" variant="solid" asChild className="flex-1 sm:flex-none">
              <Link href="/review/session">Tiếp tục làm bài</Link>
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
                Thiết lập bài ôn tập
              </h1>
              <p className="mt-1 text-[15px] text-text-2 md:text-[17px]">
                Chọn nội dung và hình thức ôn tập phù hợp với mục tiêu của bạn.
              </p>
            </div>
          </div>

          <Step n={1} title="Chọn nguồn từ vựng" desc="Chọn các tag hoặc nhóm từ vựng để ôn tập.">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(116px,1fr))] gap-3">
              <CheckChip on={!sel.length} onClick={() => setSel([])}>
                Tất cả từ vựng
              </CheckChip>
              {tags.map((t) => (
                <CheckChip
                  key={t.name}
                  on={sel.includes(t.name)}
                  onClick={() => toggleTag(t.name)}
                  title={`${t.count} từ`}
                >
                  {t.name}
                </CheckChip>
              ))}
            </div>
          </Step>

          <Step
            n={2}
            title="Số lượng từ cần ôn tập"
            desc={`Chọn số lượng từ vựng cho mỗi lần ôn tập (hiện có ${avail} từ phù hợp).`}
          >
            <div
              role="radiogroup"
              aria-label="Số lượng từ"
              className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-3"
            >
              {opts.map((o) => (
                <CheckChip
                  key={`${o.value}-${o.label}`}
                  role="radio"
                  on={o.value === effCount}
                  disabled={o.disabled}
                  title={o.disabled ? `Chỉ có ${avail} từ phù hợp` : undefined}
                  onClick={() => setCount(o.value)}
                >
                  {o.label}
                </CheckChip>
              ))}
            </div>
          </Step>

          <Step n={3} title="Hình thức ôn tập" desc="Chọn dạng câu hỏi bạn muốn luyện tập.">
            <div role="radiogroup" aria-label="Hình thức ôn tập" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                    <span className="text-[15px]">{m.label}</span>
                    {on ? <Check className="absolute top-2 right-2 size-4 text-blue" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
          </Step>
        </section>

        <aside aria-label="Tóm tắt thiết lập" className="flex flex-col gap-5 lg:sticky lg:top-4">
          <div className="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-white/75 shadow-card">
            <div className="flex items-center gap-3.5 bg-[linear-gradient(90deg,#EEF6FF,#F6FAFF)] px-5 py-4 text-xl font-semibold text-text">
              <span className="flex size-11 items-center justify-center rounded-full bg-[#E1EFFD] text-blue-600">
                <ListChecks className="size-6" />
              </span>
              Tóm tắt thiết lập
            </div>
            <div aria-live="polite" className="flex flex-col gap-4 bg-white px-5 py-5">
              <SumRow icon={<TagIcon />} label="Tag từ vựng">
                {sel.length ? (
                  <span className="flex flex-wrap gap-1.5">
                    {sel.map((t) => (
                      <Tag key={t} name={t} />
                    ))}
                  </span>
                ) : (
                  "Tất cả từ vựng"
                )}
              </SumRow>
              <SumRow icon={<FileText />} label="Số lượng từ">
                {effCount ? `${effCount} từ` : "—"}
              </SumRow>
              <SumRow icon={<BookOpen />} label="Hình thức ôn tập">
                {MODE_LABEL[mode]}
              </SumRow>
              <p className="text-center hand text-lg leading-snug">
                “Ôn tập hôm nay
                <br />
                là tiến bộ lớn của ngày mai.”
              </p>
            </div>
          </div>
          <div aria-hidden="true" className="hidden justify-center py-2 lg:flex">
            <Flashcard hanzi="学习" pinyin="xué xí" meaning="học tập" />
          </div>
          <div className="max-lg:fixed max-lg:inset-x-0 max-lg:bottom-[calc(var(--tabbar-h)+var(--safe-b))] max-lg:z-30 max-lg:border-t max-lg:border-border max-lg:bg-white max-lg:px-4 max-lg:py-2.5 md:max-lg:bottom-0">
            <Button variant="solid" size="lg" block disabled={!valid || busy} onClick={start}>
              {busy ? <Loader2 className="animate-spin" /> : <Play />}
              {busy ? "Đang chuẩn bị..." : "Bắt đầu ôn tập"}
              {!busy ? <ArrowRight /> : null}
            </Button>
            {!valid ? (
              <p className="mt-1.5 text-center text-[13.5px] text-text-3">
                Không có từ vựng nào trong các tag đã chọn.
              </p>
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
