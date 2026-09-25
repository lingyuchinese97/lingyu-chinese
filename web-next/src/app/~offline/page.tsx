import type { Metadata } from "next";
import Image from "next/image";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = { title: "Bạn đang offline" };
export const dynamic = "force-static";

/** Trang hiện khi mất mạng (service worker trả về thay cho trang không tải được). */
export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <Image src="/brand/lesson/mascot_sad.png" alt="" width={110} height={105} priority />
      <span className="flex size-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <WifiOff className="size-7" aria-hidden="true" />
      </span>
      <h1 className="text-2xl font-extrabold text-navy">Bạn đang offline</h1>
      <p className="max-w-sm text-text-2">
        Không có kết nối mạng. Hãy kiểm tra Wi-Fi hoặc dữ liệu di động rồi thử lại — dữ liệu của bạn vẫn an toàn trên
        máy chủ.
      </p>
      <a
        href="/home"
        className="inline-flex h-12 items-center rounded-md bg-blue-600 px-5 font-semibold text-white shadow-cta hover:bg-blue-700"
      >
        Thử lại
      </a>
    </main>
  );
}
