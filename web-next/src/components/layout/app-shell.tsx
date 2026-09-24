"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import { Heart, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomNav } from "./bottom-nav";
import { ADMIN_NAV, NAV, TAB_KEYS, shellState } from "./nav";
import { NotificationBell } from "./notification-bell";
import { Sidebar } from "./sidebar";
import { UserMenu } from "./user-menu";

type ShellUser = { name: string; email: string; role: "user" | "admin" };

/** Khung chung của khu vực đã đăng nhập: Sidebar + TopBar + nội dung + BottomNav (mobile). */
export function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const { nav, quote, focus } = shellState(pathname);
  // Ngăn kéo gắn với đường dẫn lúc mở → đổi trang (kể cả nút Back) là tự đóng.
  const [openAt, setOpenAt] = React.useState<string | null>(null);
  const navOpen = openAt === pathname;
  const setNavOpen = (open: boolean) => setOpenAt(open ? pathname : null);
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const items = user.role === "admin" ? [...NAV, ADMIN_NAV] : NAV;
  const tabs = TAB_KEYS.map((k) => NAV.find((n) => n.key === k)!);

  const closeNav = React.useCallback(() => setOpenAt(null), []);
  React.useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenAt(null);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [navOpen]);

  return (
    <div
      data-focus={focus || undefined}
      className="relative grid min-h-dvh bg-[radial-gradient(1200px_500px_at_70%_-10%,#EAF5FF_0%,transparent_60%),linear-gradient(180deg,#F7FBFF_0%,#F2F8FE_100%)] lg:grid-cols-[96px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]"
    >
      <a
        href="#main"
        className="sr-only z-[70] rounded-md bg-white px-4 py-2 font-semibold text-blue-600 shadow-card focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Bỏ qua điều hướng
      </a>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-0 h-[140px] bg-[radial-gradient(60%_90px_at_20%_100%,rgba(173,214,247,.35),transparent_70%),radial-gradient(50%_80px_at_80%_100%,rgba(173,225,240,.35),transparent_70%)]"
      />
      <Sidebar items={items} active={nav} quote={quote} open={navOpen} onNavigate={closeNav} />
      {navOpen && (
        <div className="fixed inset-0 z-40 bg-[rgba(9,35,80,.35)] lg:hidden" onClick={closeNav} aria-hidden="true" />
      )}

      <div
        className={cn(
          "relative z-[1] flex min-w-0 flex-col overflow-x-clip px-4 pt-[max(10px,env(safe-area-inset-top))] md:px-6 md:pt-3.5 md:pb-6 xl:px-8 xl:pt-[18px] xl:pb-7",
          focus ? "pb-[calc(84px+var(--safe-b))]" : "pb-[calc(var(--tabbar-h)+var(--safe-b)+12px)]",
        )}
      >
        <header className="relative flex min-h-[52px] items-center justify-end gap-2 md:min-h-[60px] md:gap-3.5">
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setNavOpen(!navOpen)}
            aria-label={navOpen ? "Đóng menu" : "Mở menu"}
            aria-controls="sidebar"
            aria-expanded={navOpen}
            className="mr-auto flex size-11 items-center justify-center rounded-full text-navy outline-none hover:bg-blue-50 focus-visible:[box-shadow:var(--focus-ring)] lg:hidden"
          >
            <Menu className="size-[26px]" aria-hidden="true" />
          </button>
          <NotificationBell />
          <span className="h-[30px] w-px bg-border" aria-hidden="true" />
          <UserMenu name={user.name} email={user.email} />
        </header>

        <main id="main" tabIndex={-1} className="flex min-w-0 flex-1 flex-col gap-[22px] outline-none">
          {children}
        </main>

        <footer className="mt-[18px] flex flex-wrap items-center justify-center gap-3 text-center text-[12.5px] text-text-2 md:mt-[26px] md:text-[13.5px]">
          <strong className="font-semibold text-navy">LingYu Chinese</strong>
          <span className="h-3.5 w-px bg-border-strong" aria-hidden="true" />
          <span>Tiếng Trung gần hơn mỗi ngày</span>
          <Heart className="size-[18px] text-blue-600" aria-hidden="true" />
        </footer>
      </div>

      {!focus && <BottomNav items={tabs} active={nav} />}
    </div>
  );
}
