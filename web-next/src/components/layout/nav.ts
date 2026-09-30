import type { Messages } from "@/i18n/messages/vi";
import {
  AudioLines,
  BarChart3,
  BookOpen,
  BookOpenText,
  GraduationCap,
  Headphones,
  House,
  MessagesSquare,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { GrammarIcon, RadicalIcon, ReviewIcon } from "./icons";

export type NavKey =
  | "home"
  | "vocabulary"
  | "sentences"
  | "grammar"
  | "radicals"
  | "listening"
  | "pronunciation"
  | "reading"
  | "progress"
  | "lessons"
  | "review"
  | "settings"
  | "admin";
/** Nhãn lấy từ từ điển: `t(\`shell.nav.${key}\`)`. `group`: nhóm trên sidebar (có đường kẻ giữa các nhóm). */
export type NavItem = {
  key: NavKey;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Icon ảnh theo thiết kế (`public/brand/ui/nav-*.png`); không có thì dùng `icon`. */
  img?: string;
  group: 1 | 2 | 3;
};

export const NAV: NavItem[] = [
  { key: "home", href: "/home", icon: House, img: "/brand/ui/nav-home.png", group: 1 },
  { key: "lessons", href: "/lessons", icon: GraduationCap, img: "/brand/ui/nav-lessons.png", group: 1 },
  { key: "vocabulary", href: "/vocabulary", icon: BookOpen, img: "/brand/ui/nav-vocabulary.png", group: 1 },
  { key: "grammar", href: "/grammar", icon: GrammarIcon, img: "/brand/ui/nav-grammar.png", group: 1 },
  { key: "pronunciation", href: "/pronunciation", icon: AudioLines, img: "/brand/ui/nav-pronunciation.png", group: 1 },
  { key: "listening", href: "/listening", icon: Headphones, img: "/brand/ui/nav-listening.png", group: 1 },
  { key: "reading", href: "/reading", icon: BookOpenText, img: "/brand/ui/nav-reading.png", group: 1 },
  { key: "sentences", href: "/translate", icon: MessagesSquare, img: "/brand/ui/nav-translation.png", group: 1 },
  { key: "review", href: "/review/setup", icon: ReviewIcon, img: "/brand/ui/nav-review.png", group: 1 },
  { key: "progress", href: "/progress", icon: BarChart3, img: "/brand/ui/nav-progress.png", group: 2 },
  { key: "radicals", href: "/radicals", icon: RadicalIcon, img: "/brand/ui/nav-radicals.png", group: 2 },
  { key: "settings", href: "/settings", icon: Settings, img: "/brand/ui/nav-settings.png", group: 3 },
];
export const ADMIN_NAV: NavItem = { key: "admin", href: "/admin", icon: ShieldCheck, group: 3 };

/** Thanh tab dưới đáy (điện thoại): 5 mục; các mục khác nằm trong menu ☰. */
export const TAB_KEYS: NavKey[] = ["home", "vocabulary", "grammar", "review", "progress"];

type QuoteKey = `shell.quote.${keyof Messages["shell"]["quote"]}`;
const QUOTES: Partial<Record<NavKey, QuoteKey>> = {
  home: "shell.quote.home",
  vocabulary: "shell.quote.vocabulary",
  sentences: "shell.quote.sentences",
  grammar: "shell.quote.grammar",
  radicals: "shell.quote.radicals",
  listening: "shell.quote.listening",
  reading: "shell.quote.reading",
  progress: "shell.quote.progress",
  pronunciation: "shell.quote.pronunciation",
  lessons: "shell.quote.lessons",
  review: "shell.quote.review",
  settings: "shell.quote.default",
  admin: "shell.quote.default",
};

export type ShellState = { nav: NavKey | null; quote: QuoteKey | null; focus: boolean };

/**
 * Trạng thái khung theo đường dẫn. `focus` = màn tập trung (form nhập, đang làm bài):
 * ẩn tab bar trên điện thoại để có chỗ cho bàn phím và nút chính dính ở đáy.
 */
export function shellState(pathname: string): ShellState {
  const seg = pathname.split("/").filter(Boolean);
  const first = seg[0] ?? "";
  // Kho câu của tôi (/sentences) thuộc mục Luyện dịch (/translate).
  const nav = (NAV.find((n) => n.href.split("/")[1] === first)?.key ??
    (first === "sentences" ? "sentences" : first === "admin" ? "admin" : null)) as NavKey | null;
  const focus =
    ((first === "vocabulary" || first === "grammar" || first === "sentences") &&
      (seg[1] === "new" || seg[2] === "edit")) ||
    (first === "sentences" && seg[1] === "review" && seg[2] === "session") ||
    (first === "translate" && seg[1] === "session") ||
    (first === "review" && seg[1] === "session") ||
    (first === "lessons" && seg.length === 3 && seg[2] !== "result");
  if (first === "review" && seg[1] === "session") return { nav, quote: "shell.quote.reviewSession", focus };
  if (first === "review" && seg[1] === "result") return { nav, quote: "shell.quote.reviewResult", focus };
  return { nav, quote: (nav && QUOTES[nav]) ?? null, focus };
}
