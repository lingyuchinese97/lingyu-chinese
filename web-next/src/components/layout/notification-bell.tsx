"use client";
import { DropdownMenu } from "radix-ui";
import { Bell } from "lucide-react";
import { menuContentClass } from "./user-menu";

/** Chuông thông báo. Phase 7–8 nối dữ liệu thật (chia sẻ ngữ pháp / từ vựng). */
export function NotificationBell({ unread = 0 }: { unread?: number }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={unread ? `Thông báo (${unread} chưa đọc)` : "Thông báo"}
          className="relative flex size-11 items-center justify-center rounded-full text-navy outline-none hover:bg-blue-50 focus-visible:[box-shadow:var(--focus-ring)]"
        >
          <Bell className="size-[26px]" aria-hidden="true" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-rose px-1 text-[11px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={8} className={`${menuContentClass} w-[360px]`}>
          <div className="flex flex-col items-center gap-1.5 px-4 py-6 text-center text-text-2">
            <Bell className="size-7 text-blue-600" aria-hidden="true" />
            Bạn chưa có thông báo mới.
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
