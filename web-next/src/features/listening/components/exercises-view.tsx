"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  Globe,
  Headphones,
  MessageSquareText,
  Mic,
  MonitorPlay,
  Music2,
  PlaySquare,
  Plus,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass, Select } from "@/components/ui/input";
import { Pager } from "@/components/ui/list-controls";
import { useIntlTag, useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import type { ExerciseListParams } from "../schema";
import type { ExerciseList, SourceKind } from "../service";

const SOURCE: Record<SourceKind, { icon: LucideIcon; tone: string }> = {
  youtube: { icon: MonitorPlay, tone: "bg-[#FFE7EC] text-[#E0305A]" },
  tiktok: { icon: Music2, tone: "bg-[#E8EEFF] text-[#3D52D5]" },
  audio: { icon: Mic, tone: "bg-[#F1E8FF] text-[#8B3FE0]" },
  video: { icon: PlaySquare, tone: "bg-[#E2F6EA] text-[#16924F]" },
  none: { icon: MessageSquareText, tone: "bg-[#FFE7EF] text-[#E0306E]" },
};
/** Màu thẻ: cố định theo tên (HSK xanh dương, còn lại xoay vòng). */
const TAG_TONES = [
  "bg-[#F3EDFF] text-[#6B3FD0]",
  "bg-[#FFF1DC] text-[#A85A00]",
  "bg-[#FFE8EE] text-[#C4285A]",
  "bg-[#E6F4FF] text-[#1566B8]",
  "bg-[#E4F6EC] text-[#157A45]",
];
function tagTone(name: string) {
  if (/^hsk/i.test(name)) return "bg-[#E4F0FF] text-[#1E5FC4]";
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TAG_TONES[h % TAG_TONES.length]!;
}
const good = (p: number) => p >= 85;

/** Tab "Bài làm của tôi": tiêu đề · tab · tìm / lọc thẻ / sắp xếp · bảng bài làm (bấm → trang chi tiết). */
export function ExercisesView({ data, params }: { data: ExerciseList; params: ExerciseListParams }) {
  const t = useT();
  const intl = useIntlTag();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = React.useTransition();
  const [q, setQ] = React.useState(params.q);

  const go = React.useCallback(
    (patch: Partial<ExerciseListParams>) => {
      const next = { ...params, ...patch };
      const sp = new URLSearchParams();
      if (next.q.trim()) sp.set("q", next.q.trim());
      if (next.tag) sp.set("tag", next.tag);
      if (next.sort !== "newest") sp.set("sort", next.sort);
      if (next.page > 1) sp.set("page", String(next.page));
      startTransition(() => router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false }));
    },
    [params, pathname, router],
  );
  React.useEffect(() => {
    if (q === params.q) return;
    const id = setTimeout(() => go({ q, page: 1 }), 300);
    return () => clearTimeout(id);
  }, [q, params.q, go]);

  const filtered = !!(params.q || params.tag);
  // "30/09/2026 12:35": ngày trước, giờ sau (24h).
  const fmt = (d: Date | string) => {
    const x = new Date(d);
    const date = x.toLocaleDateString(intl, { day: "2-digit", month: "2-digit", year: "numeric" });
    const time = x.toLocaleTimeString(intl, { hour: "2-digit", minute: "2-digit", hour12: false });
    return `${date} ${time}`;
  };
  const tabs = [
    { key: "practice", href: "/listening", label: t("listening.tabs.practice"), icon: Globe },
    { key: "mine", href: "/listening/exercises", label: t("listening.tabs.mine"), icon: BookOpen },
  ];

  return (
    <>
      <section
        aria-labelledby="lx-mine-title"
        className="relative flex items-center gap-4 overflow-hidden rounded-[22px] border border-[#DDEBF8] bg-[linear-gradient(100deg,#F6FAFF_0%,#EDF5FE_60%,#E4F0FD_100%)] px-4 py-4 md:px-6 md:py-5"
      >
        <span className="flex size-14 shrink-0 items-center justify-center rounded-[18px] bg-white text-blue-600 shadow-[0_8px_22px_rgba(21,149,245,.14)] md:size-[72px]">
          <Headphones className="size-7 md:size-9" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 id="lx-mine-title" className="text-[24px] font-extrabold tracking-tight text-navy-900 md:text-[32px]">
            {t("listening.mine.title")}
          </h1>
          <p className="mt-0.5 text-[14.5px] text-text-2 md:text-[16px]">{t("listening.mine.sub")}</p>
        </div>
        <Image
          src="/brand/ui/mascot-wave.png"
          alt=""
          aria-hidden="true"
          width={512}
          height={512}
          unoptimized
          className="hidden h-auto w-[92px] shrink-0 sm:block md:w-[104px]"
        />
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <nav aria-label={t("listening.tabs.label")} className="flex flex-wrap gap-2">
          {tabs.map((x) => (
            <Link
              key={x.key}
              href={x.href}
              aria-current={x.key === "mine" ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-[14px] border px-4 text-[14.5px] font-semibold outline-none focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-[18px]",
                x.key === "mine"
                  ? "border-blue-600 bg-blue-600 text-white shadow-cta"
                  : "border-[#DDEBF8] bg-white text-blue-700 hover:bg-blue-50",
              )}
            >
              <x.icon aria-hidden="true" />
              {x.label}
            </Link>
          ))}
        </nav>
        <Button asChild variant="solid" className="ml-auto max-sm:w-full">
          <Link href="/listening?new=1">
            <Plus />
            {t("listening.mine.new")}
          </Link>
        </Button>
      </div>

      <div className="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_220px_220px]">
        <label className="relative block">
          <span className="sr-only">{t("listening.mine.searchLabel")}</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-text-3" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("listening.mine.search")}
            autoComplete="off"
            className={cn(inputClass, "bg-white pl-11")}
          />
        </label>
        <label>
          <span className="sr-only">{t("listening.mine.tagFilter")}</span>
          <Select value={params.tag} onChange={(e) => go({ tag: e.target.value, page: 1 })}>
            <option value="">{t("listening.mine.allTags")}</option>
            {data.tags.map((x) => (
              <option key={x.id} value={x.name}>
                {x.name} ({x.count})
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span className="sr-only">{t("listening.mine.sort")}</span>
          <Select
            value={params.sort}
            onChange={(e) => go({ sort: e.target.value as ExerciseListParams["sort"], page: 1 })}
          >
            <option value="newest">{t("listening.mine.newest")}</option>
            <option value="oldest">{t("listening.mine.oldest")}</option>
          </Select>
        </label>
      </div>

      {data.total === 0 && !filtered ? (
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-xl)] border border-border bg-white px-5 py-12 text-center shadow-card">
          <span className="flex size-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Headphones className="size-8" aria-hidden="true" />
          </span>
          <h2 className="text-xl font-bold text-navy">{t("listening.mine.empty")}</h2>
          <p className="max-w-[420px] text-text-2">{t("listening.mine.emptyHint")}</p>
          <Button asChild variant="primary">
            <Link href="/listening">{t("listening.mine.start")}</Link>
          </Button>
        </div>
      ) : (
        <div
          aria-busy={pending || undefined}
          className={cn("flex flex-col gap-2 transition-opacity", pending && "opacity-60")}
        >
          <p className="text-[13.5px] text-text-2" aria-live="polite">
            {t("listening.mine.total", { count: data.total })}
          </p>
          {data.total === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[16px] border border-dashed border-border bg-white px-4 py-10 text-center">
              <p className="font-bold text-navy">{t("listening.mine.noMatch")}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setQ("");
                  go({ q: "", tag: "", page: 1 });
                }}
              >
                <X />
                {t("listening.mine.clearFilters")}
              </Button>
            </div>
          ) : (
            <>
              <div
                aria-hidden="true"
                className="hidden grid-cols-[40px_48px_minmax(0,1fr)_200px_150px_150px_76px] items-center gap-3 rounded-[14px] bg-[#EEF4FC] px-4 py-3 text-[14px] font-semibold text-text-2 lg:grid"
              >
                <span className="text-center">#</span>
                <span />
                <span>{t("listening.mine.colTitle")}</span>
                <span>{t("listening.mine.colTag")}</span>
                <span>{t("listening.mine.colResult")}</span>
                <span>{t("listening.mine.colTime")}</span>
                <span className="text-center">{t("listening.mine.colAction")}</span>
              </div>
              <ul aria-label={t("listening.mine.list")} className="flex flex-col gap-2">
                {data.items.map((it, i) => {
                  const src = SOURCE[it.sourceKind];
                  return (
                    <li key={it.id}>
                      <Link
                        href={`/listening/exercises/${it.id}`}
                        aria-label={t("listening.mine.open", { title: it.title })}
                        className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-[16px] border border-border bg-white px-3.5 py-3 transition-[border-color,box-shadow] outline-none hover:border-[#A9D3F8] hover:shadow-[0_8px_22px_rgba(20,90,170,.08)] focus-visible:shadow-[var(--focus-ring)] lg:grid-cols-[40px_48px_minmax(0,1fr)_200px_150px_150px_76px] lg:px-4"
                      >
                        <span className="hidden text-center text-text-2 tabular-nums lg:block">
                          {(data.page - 1) * data.pageSize + i + 1}
                        </span>
                        <span
                          aria-hidden="true"
                          className={cn(
                            "flex size-11 items-center justify-center rounded-[12px] [&_svg]:size-[22px]",
                            src.tone,
                          )}
                        >
                          <src.icon />
                        </span>
                        <span className="min-w-0 font-bold break-words text-navy-900 lg:text-[16.5px]">{it.title}</span>
                        <span className="col-span-3 flex flex-wrap gap-1.5 lg:col-span-1">
                          {it.tags.map((x) => (
                            <span
                              key={x}
                              className={cn("rounded-[8px] px-2.5 py-0.5 text-[13px] font-semibold", tagTone(x))}
                            >
                              {x}
                            </span>
                          ))}
                        </span>
                        <span className="col-span-2 flex flex-col gap-1 lg:col-span-1">
                          <span className="flex items-baseline gap-1.5">
                            <span
                              className={cn(
                                "text-[17px] font-extrabold tabular-nums",
                                good(it.scorePercent) ? "text-green-700" : "text-[#B86E00]",
                              )}
                            >
                              {it.scorePercent}%
                            </span>
                            <span className="text-[12.5px] text-text-2 tabular-nums">
                              {t("listening.mine.scoreShort", { correct: it.scoreCorrect, total: it.scoreTotal })}
                            </span>
                          </span>
                          <span className="h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-[#E3ECF7]">
                            <span
                              className={cn(
                                "block h-full rounded-full",
                                good(it.scorePercent) ? "bg-green-600" : "bg-[#F5A524]",
                              )}
                              style={{ width: `${it.scorePercent}%` }}
                            />
                          </span>
                        </span>
                        <span className="text-[13.5px] text-text-2 tabular-nums max-lg:col-span-3 max-lg:-mt-1 lg:text-[14.5px]">
                          {fmt(it.createdAt)}
                        </span>
                        <span className="row-start-1 flex justify-end lg:row-auto lg:justify-center">
                          <span className="flex size-9 items-center justify-center rounded-full border border-border text-text-2">
                            <ChevronRight className="size-5" aria-hidden="true" />
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          <Pager page={data.page} count={data.pageCount} onGo={(page) => go({ page })} />
        </div>
      )}
    </>
  );
}
