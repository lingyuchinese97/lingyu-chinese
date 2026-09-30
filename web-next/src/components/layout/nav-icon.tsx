import Image from "next/image";
import { cn } from "@/lib/utils";
import type { NavItem } from "./nav";

/** Icon của một mục menu: ảnh theo thiết kế nếu có, nếu không thì icon vẽ (lucide). */
export function NavIcon({ item, className, muted }: { item: NavItem; className?: string; muted?: boolean }) {
  if (item.img)
    return (
      <Image
        src={item.img}
        alt=""
        aria-hidden="true"
        width={48}
        height={48}
        sizes="28px"
        className={cn("shrink-0 object-contain", muted && "opacity-55 grayscale", className)}
      />
    );
  const Icon = item.icon;
  return <Icon className={cn("shrink-0 text-blue-600", muted && "text-text-3", className)} />;
}
