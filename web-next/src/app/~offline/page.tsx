import type { Metadata } from "next";
import Image from "next/image";
import { WifiOff } from "lucide-react";
import { OfflineText } from "./offline-text";

export const metadata: Metadata = { title: "Offline" };
export const dynamic = "force-static";

/** Trang hiện khi mất mạng (service worker trả về thay cho trang không tải được). */
export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <Image src="/brand/lesson/mascot_sad.png" alt="" width={110} height={105} priority />
      <span className="flex size-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <WifiOff className="size-7" aria-hidden="true" />
      </span>
      <OfflineText />
    </main>
  );
}
