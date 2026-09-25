"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight, House, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import type { SessionConfig } from "../service";
import { startCustomAction, startDueAction } from "../actions";

/** Nút "Ôn tập lại" (cùng thiết lập) và gợi ý "Ôn lại các từ đã sai". */
export function ResultActions({
  kind,
  config,
  wrongIds,
  children,
}: {
  kind: "custom" | "due";
  config: SessionConfig;
  wrongIds: string[];
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<"again" | "wrong" | null>(null);

  async function start(which: "again" | "wrong") {
    if (busy) return;
    setBusy(which);
    const r =
      which === "wrong"
        ? await startCustomAction({
            tags: [],
            vocabIds: wrongIds,
            count: wrongIds.length,
            mode: config.mode,
            showImage: config.showImage,
            label: "Các từ đã sai",
          })
        : kind === "due"
          ? await startDueAction({ mode: config.mode, showImage: config.showImage })
          : await startCustomAction(
              config.vocabIds
                ? { ...config, count: config.vocabIds.length }
                : { tags: config.tags, count: config.count, mode: config.mode, showImage: config.showImage },
            );
    if (!r.ok) {
      setBusy(null);
      return void toast.error(r.message || "Không thể tạo bài ôn tập.");
    }
    router.push("/review/session");
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button asChild variant="secondary" size="lg">
          <Link href="/home">
            <House />
            Về trang chủ
          </Link>
        </Button>
        <Button variant="solid" size="lg" onClick={() => start("again")} disabled={!!busy}>
          {busy === "again" ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          {kind === "due" ? "Ôn tiếp thẻ đến hạn" : "Ôn tập lại"}
        </Button>
      </div>
      {children}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={!wrongIds.length || !!busy}
          onClick={() => start("wrong")}
          className="flex min-h-16 items-center gap-3 rounded-[14px] border border-border bg-white px-4 py-3 text-left hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "wrong" ? (
            <Loader2 className="size-6 animate-spin text-blue-600" />
          ) : (
            <BookOpen className="size-6 text-blue-600" />
          )}
          <span className="min-w-0 flex-1">
            <strong className="block text-navy">Ôn lại các từ đã sai</strong>
            <span className="text-sm text-text-2">
              {wrongIds.length ? `Xem lại ${wrongIds.length} từ bạn trả lời sai` : "Bạn không sai từ nào — tuyệt vời!"}
            </span>
          </span>
          <ChevronRight className="size-5 text-text-3" />
        </button>
        <Link
          href="/review/setup"
          className="flex min-h-16 items-center gap-3 rounded-[14px] border border-border bg-white px-4 py-3 hover:bg-blue-50"
        >
          <RefreshCw className="size-6 text-blue-600" />
          <span className="min-w-0 flex-1">
            <strong className="block text-navy">Luyện tập tiếp</strong>
            <span className="text-sm text-text-2">Chọn chủ đề khác để ôn tập</span>
          </span>
          <ChevronRight className="size-5 text-text-3" />
        </Link>
      </div>
    </>
  );
}
