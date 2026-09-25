import { BookOpen, GraduationCap, House, MessagesSquare, Settings, ShieldCheck } from "lucide-react";
import { GrammarIcon, RadicalIcon, ReviewIcon } from "./icons";

export type NavKey =
  "home" | "vocabulary" | "sentences" | "grammar" | "radicals" | "lessons" | "review" | "settings" | "admin";
export type NavItem = { key: NavKey; href: string; label: string; icon: React.ComponentType<{ className?: string }> };

export const NAV: NavItem[] = [
  { key: "home", href: "/home", label: "Trang chủ", icon: House },
  { key: "vocabulary", href: "/vocabulary", label: "Từ vựng", icon: BookOpen },
  { key: "sentences", href: "/sentences", label: "Ôn dịch câu", icon: MessagesSquare },
  { key: "grammar", href: "/grammar", label: "Ngữ pháp", icon: GrammarIcon },
  { key: "radicals", href: "/radicals", label: "Bộ thủ", icon: RadicalIcon },
  { key: "lessons", href: "/lessons", label: "Bài học", icon: GraduationCap },
  { key: "review", href: "/review/setup", label: "Ôn tập", icon: ReviewIcon },
  { key: "settings", href: "/settings", label: "Cài đặt", icon: Settings },
];
export const ADMIN_NAV: NavItem = { key: "admin", href: "/admin", label: "Quản trị", icon: ShieldCheck };

/** Thanh tab dưới đáy (điện thoại): 5 mục; Ôn dịch câu, Bộ thủ, Cài đặt, Quản trị nằm trong menu ☰. */
export const TAB_KEYS: NavKey[] = ["home", "vocabulary", "grammar", "lessons", "review"];

const QUOTES: Partial<Record<NavKey, string>> = {
  home: "Cùng LingYu\nkhám phá thế giới tiếng Trung\nthật thú vị nhé!",
  vocabulary: "Học mỗi ngày\nMột phiên bản tốt hơn\ncủa chính mình!",
  sentences: "Dịch từng câu,\nnói tiếng Trung\ntự nhiên hơn!",
  grammar: "Nắm vững ngữ pháp,\nnói tiếng Trung\ntự tin hơn!",
  radicals: "Hiểu bộ thủ,\nnhớ chữ Hán\nthật dễ dàng!",
  lessons: "Mỗi bài một bước,\ntiếng Trung\ngần hơn mỗi ngày!",
  review: "Ôn tập hôm nay,\ntự tin hơn mỗi ngày!",
  settings: "Small steps,\nbig future!",
  admin: "Small steps,\nbig future!",
};

export type ShellState = { nav: NavKey | null; quote: string; focus: boolean };

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
  if (first === "review" && seg[1] === "session")
    return { nav, quote: "Cố gắng mỗi ngày\nTiếng Trung sẽ gần hơn!", focus };
  if (first === "review" && seg[1] === "result") return { nav, quote: "Kiên trì hôm nay,\ntiến bộ mỗi ngày!", focus };
  return { nav, quote: (nav && QUOTES[nav]) ?? "", focus };
}
