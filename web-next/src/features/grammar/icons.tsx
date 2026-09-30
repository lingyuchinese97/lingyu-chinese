/**
 * Biểu tượng + nhãn loại cho mỗi điểm ngữ pháp (hiển thị cạnh tiêu đề). Người dùng chọn ở form;
 * để trống ("") thì tự đoán theo thẻ / tiêu đề / cấu trúc. Dùng được ở cả server lẫn client.
 */
import {
  Clock,
  FileText,
  Gauge,
  Layers,
  ListOrdered,
  MapPin,
  MessageSquareText,
  Palette,
  Puzzle,
  Scale,
  Sparkles,
  StickyNote,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { fold } from "@/lib/fold";
import { cn } from "@/lib/utils";

export const G_ICON_KEYS = [
  "noun",
  "measure",
  "number",
  "particle",
  "question",
  "structure",
  "compare",
  "communication",
  "verb",
  "adjective",
  "adverb",
  "time",
  "complement",
  "preposition",
  "other",
] as const;
export type GrammarIconKey = (typeof G_ICON_KEYS)[number];

type Def = { icon: LucideIcon | "123" | "?"; tone: string; pill: string };
const DEFS: Record<GrammarIconKey, Def> = {
  noun: { icon: FileText, tone: "bg-[#E6F0FF] text-[#1E6FE0]", pill: "bg-[#E6F0FF] text-[#1E5FC4]" },
  measure: { icon: Layers, tone: "bg-[#E3F6EC] text-[#15935A]", pill: "bg-[#E3F6EC] text-[#12784A]" },
  number: { icon: "123", tone: "bg-[#FFE6E8] text-[#C0243B]", pill: "bg-[#FFE6E8] text-[#C42A3F]" },
  particle: { icon: StickyNote, tone: "bg-[#FFF2D9] text-[#E09A00]", pill: "bg-[#FFF2D9] text-[#8F6200]" },
  question: { icon: "?", tone: "bg-[#EFE7FF] text-[#7A45E0]", pill: "bg-[#EFE7FF] text-[#6536C8]" },
  structure: { icon: ListOrdered, tone: "bg-[#FFEBDD] text-[#F0782B]", pill: "bg-[#FFEBDD] text-[#A94D0F]" },
  compare: { icon: Scale, tone: "bg-[#FFE4EC] text-[#E03A6A]", pill: "bg-[#FFE4EC] text-[#BD2554]" },
  communication: {
    icon: MessageSquareText,
    tone: "bg-[#DFF6EE] text-[#12A071]",
    pill: "bg-[#DFF6EE] text-[#0E7A56]",
  },
  verb: { icon: Zap, tone: "bg-[#E1F1FF] text-[#1486E0]", pill: "bg-[#E1F1FF] text-[#0F6AB3]" },
  adjective: { icon: Palette, tone: "bg-[#DDF5F6] text-[#0F979E]", pill: "bg-[#DDF5F6] text-[#0B7379]" },
  adverb: { icon: Gauge, tone: "bg-[#E8E9FF] text-[#4F55D8]", pill: "bg-[#E8E9FF] text-[#3F44B8]" },
  time: { icon: Clock, tone: "bg-[#DDF3FB] text-[#0E8DBA]", pill: "bg-[#DDF3FB] text-[#0A6E92]" },
  complement: { icon: Puzzle, tone: "bg-[#F3E6FF] text-[#9A3FD6]", pill: "bg-[#F3E6FF] text-[#7C2DB0]" },
  preposition: { icon: MapPin, tone: "bg-[#E2F6EA] text-[#16924F]", pill: "bg-[#E2F6EA] text-[#12743F]" },
  other: { icon: Sparkles, tone: "bg-[#EEF2F7] text-[#5B6B82]", pill: "bg-[#EEF2F7] text-[#4A5A70]" },
};

/** Từ khoá (đã bỏ dấu) để tự đoán loại — ưu tiên thẻ, rồi tiêu đề, rồi cấu trúc. */
const RULES: [GrammarIconKey, RegExp][] = [
  ["compare", /so sanh|比|更|最|一样/],
  ["question", /nghi van|cau hoi|什么|吗|呢|哪|谁|怎么|为什么|几|多少/],
  ["measure", /luong tu|个|两|本|张|只|条/],
  ["number", /so dem|con so|so thu tu|第/],
  ["complement", /bo ngu|得/],
  ["particle", /tro tu|了|过|着|的|地|吧|要/],
  ["communication", /giao tiep|cau cau khien|loi chao|请|不要/],
  ["time", /thoi gian|khi nao|以前|以后|的时候/],
  ["noun", /danh tu|这|那/],
  ["verb", /dong tu/],
  ["adjective", /tinh tu/],
  ["adverb", /pho tu|都|也|还|就|才/],
  ["preposition", /gioi tu|在|从|对|给|跟|向/],
  ["structure", /cau truc|是|把|被|有/],
];

export function guessIcon(g: { title: string; structure?: string; tags?: { name: string }[] }): GrammarIconKey {
  for (const text of [(g.tags ?? []).map((t) => t.name).join(" "), g.title, g.structure ?? ""]) {
    const f = fold(text);
    const hit = RULES.find(([, re]) => re.test(f));
    if (hit) return hit[0];
  }
  return "other";
}

export const isIconKey = (k: string): k is GrammarIconKey => (G_ICON_KEYS as readonly string[]).includes(k);
export const iconOf = (g: { icon?: string; title: string; structure?: string; tags?: { name: string }[] }) =>
  g.icon && isIconKey(g.icon) ? g.icon : guessIcon(g);

/** Vòng tròn biểu tượng. */
export function GrammarBadgeIcon({ k, className }: { k: GrammarIconKey; className?: string }) {
  const d = DEFS[k];
  const Icon = d.icon;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-full font-extrabold [&_svg]:size-6",
        d.tone,
        className,
      )}
    >
      {Icon === "123" ? <span className="text-[19px] tracking-tight">123</span> : null}
      {Icon === "?" ? <span className="text-[26px] leading-none">?</span> : null}
      {typeof Icon !== "string" ? <Icon strokeWidth={2.2} /> : null}
    </span>
  );
}

export const pillClass = (k: GrammarIconKey) => DEFS[k].pill;
