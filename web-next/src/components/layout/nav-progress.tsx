"use client";
import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thanh tiến trình mảnh ở đầu màn hình: hiện ngay khi bấm một link nội bộ, tắt khi trang mới đã hiển thị.
 * Giúp người dùng thấy phản hồi tức thì trong lúc server tải dữ liệu (không dùng loading.tsx để giữ đúng mã 404 / redirect).
 */
function Bar() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  // Ghi lại trang lúc bấm link → khi đường dẫn đổi (trang mới đã hiện) thanh tự tắt.
  const here = search ? `${pathname}?${search}` : pathname;
  const [from, setFrom] = React.useState<string | null>(null);
  const [seen, setSeen] = React.useState(here);
  if (seen !== here) {
    setSeen(here);
    setFrom(null);
  }
  const pending = from === here;

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement) || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      setFrom(location.pathname + location.search);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  React.useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => setFrom(null), 15_000);
    return () => clearTimeout(t);
  }, [pending]);

  if (!pending) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden">
      <div className="h-full w-1/3 animate-nav-progress rounded-full bg-[linear-gradient(90deg,var(--color-blue),var(--color-cyan))] motion-reduce:animate-none" />
    </div>
  );
}

export function NavProgress() {
  return (
    <React.Suspense fallback={null}>
      <Bar />
    </React.Suspense>
  );
}
