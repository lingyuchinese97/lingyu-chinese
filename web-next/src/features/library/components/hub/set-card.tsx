"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import type { SetCard } from "../../sets";
import { setFavoriteAction } from "../../actions";
import { Cover, Pill, card } from "./parts";

const KIND_COLOR = {
  communication: "rose",
  essential: "amber",
  radical: "orange",
  situation: "violet",
  topic: "green",
} as const;

/** Nút sao yêu thích một bộ (cập nhật ngay, lỗi thì trả lại). */
export function FavStar({ id, name, on, className }: { id: string; name: string; on: boolean; className?: string }) {
  const t = useT();
  const [fav, setFav] = React.useState(on);
  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !fav;
    setFav(next);
    const r = await setFavoriteAction(id, null, next);
    if (!r.ok) {
      setFav(!next);
      toast.error(t.maybe(r.message));
    }
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={fav}
      aria-label={fav ? t("libhub.unfavSet", { name }) : t("libhub.favSet", { name })}
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-white/85 text-[#F2A900] shadow-sm hover:bg-white",
        className,
      )}
    >
      <Star className={cn("size-5", fav && "fill-[#F5B70A]")} />
    </button>
  );
}

function Tags({ s }: { s: SetCard }) {
  const t = useT();
  return (
    <span className="flex flex-wrap gap-1.5">
      <Pill color="rose">{t(`libhub.topics.${s.topic}`)}</Pill>
      <Pill>HSK {s.hsk}</Pill>
      {s.kinds
        .filter((k) => k !== "topic")
        .slice(0, 1)
        .map((k) => (
          <Pill key={k} color={KIND_COLOR[k]}>
            {t(`libhub.kinds.${k}`)}
          </Pill>
        ))}
      {s.kinds.includes("topic") && s.kinds.length === 1 ? <Pill color="amber">{t("libhub.kinds.topic")}</Pill> : null}
    </span>
  );
}

/** Thẻ bộ từ vựng dạng lưới: ảnh bìa, HSK, tên, mô tả, nhãn, tiến độ. */
export function SetGridCard({ s }: { s: SetCard }) {
  const t = useT();
  return (
    <article className={cn(card, "relative h-full overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg")}>
      <Link href={`/library/vocabulary/${s.id}`} className="flex h-full flex-col">
        <span className="relative block">
          <Cover emoji={s.emoji} tone={s.tone} className="h-[120px] w-full" />
          <Pill className="absolute top-2.5 left-2.5 bg-white/90">HSK {s.hsk}</Pill>
        </span>
        <span className="flex flex-1 flex-col gap-1.5 p-3.5">
          <span className="text-[16.5px] font-bold text-navy-900">
            {s.no}. {s.title}
          </span>
          <span className="line-clamp-2 text-[13.5px] text-text-2">
            {t("libhub.wordsCount", { count: s.total })} · {s.desc}
          </span>
          <span className="mt-auto pt-1">
            <Tags s={s} />
          </span>
          {s.learned ? (
            <span className="mt-1 flex items-center gap-2 text-[12.5px] text-text-2">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E6EEF8]">
                <span
                  className="block h-full rounded-full bg-[#22C08A]"
                  style={{ width: `${Math.round((s.learned / s.total) * 100)}%` }}
                />
              </span>
              {t("libhub.learnedOf", { learned: s.learned, total: s.total })}
            </span>
          ) : null}
        </span>
      </Link>
      <FavStar id={s.id} name={s.title} on={s.favorite} className="absolute top-2 right-2" />
    </article>
  );
}

/** Dòng bộ từ vựng dạng danh sách. */
export function SetRow({ s }: { s: SetCard }) {
  const t = useT();
  return (
    <article className="relative flex items-center gap-3 px-3 py-2.5 hover:bg-[#F7FAFE] md:px-4">
      <Link href={`/library/vocabulary/${s.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Cover emoji={s.emoji} tone={s.tone} size="sm" className="size-14 shrink-0 rounded-[12px]" />
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-navy-900">
            {s.no}. {s.title}{" "}
            <span className="hanzi font-semibold text-text-2" lang="zh">
              {s.titleZh}
            </span>
          </span>
          <span className="block truncate text-[13.5px] text-text-2">
            {t("libhub.wordsCount", { count: s.total })} · {s.desc}
          </span>
        </span>
        <span className="hidden md:block">
          <Tags s={s} />
        </span>
        <span className="hidden w-[92px] text-right text-[12.5px] text-text-2 lg:block">
          {t("libhub.learnedOf", { learned: s.learned, total: s.total })}
        </span>
        <ChevronRight className="size-5 shrink-0 text-blue-600" aria-hidden="true" />
      </Link>
      <FavStar id={s.id} name={s.title} on={s.favorite} />
    </article>
  );
}
