import {
  AudioLines,
  BookOpen,
  BookOpenText,
  GraduationCap,
  Headphones,
  Languages,
  MessagesSquare,
  RefreshCw,
} from "lucide-react";
import { GrammarIcon } from "@/components/layout/icons";
import { cn } from "@/lib/utils";
import type { T } from "@/i18n/translate";
import type { ActivityKind } from "../constants";

const ICON: Record<ActivityKind, { icon: React.ComponentType<{ className?: string }>; c: string }> = {
  vocab_review: { icon: RefreshCw, c: "bg-green-50 text-green-700" },
  grammar_review: { icon: GrammarIcon, c: "bg-[#F1ECFF] text-[#5B3CC4]" },
  sentence_review: { icon: MessagesSquare, c: "bg-amber-50 text-[#B35C00]" },
  translation: { icon: Languages, c: "bg-amber-50 text-[#B35C00]" },
  reading: { icon: BookOpenText, c: "bg-blue-50 text-blue-600" },
  lesson: { icon: GraduationCap, c: "bg-blue-50 text-blue-600" },
  listening: { icon: Headphones, c: "bg-red-50 text-rose" },
  pronunciation: { icon: AudioLines, c: "bg-[#E6FAFB] text-[#0B6E77]" },
  vocab_add: { icon: BookOpen, c: "bg-green-50 text-green-700" },
  grammar_add: { icon: GrammarIcon, c: "bg-[#F1ECFF] text-[#5B3CC4]" },
};

export function ActivityIcon({ kind, className }: { kind: ActivityKind; className?: string }) {
  const x = ICON[kind] ?? ICON.lesson;
  return (
    <span
      aria-hidden="true"
      className={cn("flex size-10 shrink-0 items-center justify-center rounded-[12px] [&_svg]:size-5", x.c, className)}
    >
      <x.icon />
    </span>
  );
}

type A = { kind: ActivityKind; title: string; correct: number | null; total: number | null; durationSec: number };

/** Dòng tiêu đề + dòng phụ của một hoạt động (dùng chung Trang chủ và Lịch sử học tập). */
export function activityLine(a: A, t: T) {
  const kind = t(`progress.kind.${a.kind}`);
  if (a.kind === "vocab_add") return { title: t("progress.addedWords", { total: a.total ?? 0 }), sub: kind };
  if (a.kind === "grammar_add") return { title: t("progress.addedGrammar", { total: a.total ?? 0 }), sub: kind };
  const parts = [kind];
  if (a.total)
    parts.push(
      a.correct !== null
        ? t("progress.score", { correct: a.correct, total: a.total })
        : t("progress.count", { total: a.total }),
    );
  if (a.durationSec >= 60) parts.push(t("progress.duration", { m: Math.round(a.durationSec / 60) }));
  return { title: a.title || kind, sub: parts.join(" · ") };
}
