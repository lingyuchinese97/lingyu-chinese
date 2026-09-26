import type { Messages } from "@/i18n/messages/vi";
import { BookOpen, GraduationCap, House, MessagesSquare, Settings, ShieldCheck } from "lucide-react";
import { GrammarIcon, RadicalIcon, ReviewIcon } from "./icons";

export type NavKey =
  "home" | "vocabulary" | "sentences" | "grammar" | "radicals" | "lessons" | "review" | "settings" | "admin";
/** Nhãn lấy từ từ điển: `t(\`shell.nav.${key}\`)`. */
export type NavItem = { key: NavKey; href: string; icon: React.ComponentType<{ className?: string }> };

export const NAV: NavItem[] = [
  { key: "home", href: "/home", icon: House },
  { key: "vocabulary", href: "/vocabulary", icon: BookOpen },
  { key: "sentences", href: "/sentences", icon: MessagesSquare },
  { key: "grammar", href: "/grammar", icon: GrammarIcon },
  { key: "radicals", href: "/radicals", icon: RadicalIcon },
  { key: "lessons", href: "/lessons", icon: GraduationCap },
  { key: "review", href: "/review/setup", icon: ReviewIcon },
  { key: "settings", href: "/settings", icon: Settings },
];
export const ADMIN_NAV: NavItem = { key: "admin", href: "/admin", icon: ShieldCheck };

/** Thanh tab dưới đáy (điện thoại): 5 mục; Ôn dịch câu, Bộ thủ, Cài đặt, Quản trị nằm trong menu ☰. */
export const TAB_KEYS: NavKey[] = ["home", "vocabulary", "grammar", "lessons", "review"];

type QuoteKey = `shell.quote.${keyof Messages["shell"]["quote"]}`;
const QUOTES: Partial<Record<NavKey, QuoteKey>> = {
  home: "shell.quote.home",
  vocabulary: "shell.quote.vocabulary",
  sentences: "shell.quote.sentences",
  grammar: "shell.quote.grammar",
  radicals: "shell.quote.radicals",
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
  const nav = (NAV.find((n) => n.href.split("/")[1] === first)?.key ??
    (first === "admin" ? "admin" : null)) as NavKey | null;
  const focus =
    ((first === "vocabulary" || first === "grammar" || first === "sentences") &&
      (seg[1] === "new" || seg[2] === "edit")) ||
    (first === "sentences" && seg[1] === "review" && seg[2] === "session") ||
    (first === "review" && seg[1] === "session") ||
    (first === "lessons" && seg.length === 3 && seg[2] !== "result");
  if (first === "review" && seg[1] === "session") return { nav, quote: "shell.quote.reviewSession", focus };
  if (first === "review" && seg[1] === "result") return { nav, quote: "shell.quote.reviewResult", focus };
  return { nav, quote: (nav && QUOTES[nav]) ?? null, focus };
}
