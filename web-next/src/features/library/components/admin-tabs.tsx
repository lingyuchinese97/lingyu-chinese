import Link from "next/link";
import { Library, Users } from "lucide-react";
import { cn } from "@/lib/utils";

/** Tab của khu quản trị: Người dùng · Thư viện LingYu. */
export function AdminTabs({
  active,
  labels,
}: {
  active: "users" | "library";
  labels: { users: string; library: string; nav: string };
}) {
  const tabs = [
    { key: "users" as const, href: "/admin", label: labels.users, icon: Users },
    { key: "library" as const, href: "/admin/library", label: labels.library, icon: Library },
  ];
  return (
    <nav aria-label={labels.nav} className="flex flex-wrap gap-2">
      {tabs.map((x) => (
        <Link
          key={x.key}
          href={x.href}
          aria-current={active === x.key ? "page" : undefined}
          className={cn(
            "flex min-h-11 items-center gap-2 rounded-[14px] border px-4 text-[14.5px] font-semibold outline-none focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-[18px]",
            active === x.key
              ? "border-blue-600 bg-blue-600 text-white shadow-cta"
              : "border-[#DDEBF8] bg-white text-blue-700 hover:bg-blue-50",
          )}
        >
          <x.icon aria-hidden="true" />
          {x.label}
        </Link>
      ))}
    </nav>
  );
}
