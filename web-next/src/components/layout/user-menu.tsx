"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const last = parts[parts.length - 1]!;
  return (parts.length > 1 ? parts[0]![0]! + last[0]! : last.slice(0, 2)).toUpperCase();
}

export const menuContentClass =
  "z-[60] min-w-[220px] max-w-[calc(100vw-16px)] rounded-lg border border-border bg-white p-1.5 shadow-card";
export const menuItemClass =
  "flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-3 text-[15px] font-medium text-text outline-none select-none data-[highlighted]:bg-blue-50 [&_svg]:size-5 [&_svg]:text-blue-600";

export function UserMenu({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-3 rounded-[14px] px-1.5 py-1 text-[17px] font-semibold text-navy outline-none hover:bg-blue-50 focus-visible:[box-shadow:var(--focus-ring)]"
          aria-label={`Tài khoản: ${name}`}
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full border-[3px] border-white bg-[linear-gradient(135deg,#3BA7F7,#19C7D6)] text-base font-bold text-white shadow-soft md:size-[52px] md:text-lg">
            {initials(name)}
          </span>
          <span className="hidden max-w-[180px] truncate md:inline">{name}</span>
          <ChevronDown className="size-5 text-text-2" aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={8} className={`${menuContentClass} w-[260px]`}>
          <div className="flex flex-col px-3 pt-2 pb-2.5">
            <strong className="truncate text-navy">{name}</strong>
            <span className="truncate text-sm text-text-2">{email}</span>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item asChild className={menuItemClass}>
            <Link href="/settings">
              <Settings aria-hidden="true" />
              Cài đặt
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className={`${menuItemClass} text-red data-[highlighted]:bg-red-50 [&_svg]:text-red`}
            onSelect={async () => {
              await authClient.signOut();
              router.replace("/login");
              router.refresh();
            }}
          >
            <LogOut aria-hidden="true" />
            Đăng xuất
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
