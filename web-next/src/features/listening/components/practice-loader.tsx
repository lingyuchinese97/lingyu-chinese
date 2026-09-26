"use client";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Màn luyện nghe chạy hoàn toàn ở trình duyệt (trình phát, ô soạn thảo, nháp lưu trong trình duyệt) nên tải phía client,
 * tránh lệch nội dung khi hydrate.
 */
export const ListeningPracticeLoader = dynamic(() => import("./practice").then((m) => m.ListeningPractice), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-4" aria-busy="true">
      <Skeleton className="h-[120px] rounded-[22px]" />
      <Skeleton className="h-[420px] rounded-[22px]" />
      <Skeleton className="h-[360px] rounded-[22px]" />
    </div>
  ),
});
