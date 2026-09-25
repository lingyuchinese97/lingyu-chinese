"use client";
import { DropdownMenu } from "radix-ui";
import { cn } from "@/lib/utils";

export const Menu = DropdownMenu.Root;
export const MenuTrigger = DropdownMenu.Trigger;

export const menuContentClass =
  "z-[60] min-w-[220px] max-w-[calc(100vw-16px)] rounded-lg border border-border bg-white p-1.5 shadow-card";
export const menuItemClass =
  "flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-3 text-[15px] font-medium text-text outline-none select-none data-[highlighted]:bg-blue-50 [&_svg]:size-5 [&_svg]:text-blue-600";

export function MenuContent({ className, ...props }: React.ComponentProps<typeof DropdownMenu.Content>) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content align="end" sideOffset={6} className={cn(menuContentClass, className)} {...props} />
    </DropdownMenu.Portal>
  );
}

export function MenuItem({
  danger,
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenu.Item> & { danger?: boolean }) {
  return (
    <DropdownMenu.Item
      className={cn(menuItemClass, danger && "text-red data-[highlighted]:bg-red-50 [&_svg]:text-red", className)}
      {...props}
    />
  );
}

export const MenuSeparator = () => <DropdownMenu.Separator className="my-1 h-px bg-border" />;
