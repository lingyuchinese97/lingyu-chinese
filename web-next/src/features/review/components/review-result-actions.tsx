"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight, House, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import type { SessionConfig } from "../service";
import { startCustomAction, startDueAction } from "../actions";
import { useT } from "@/i18n/client";

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
  const t = useT();
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
            label: t("review.result.wrongLabel"),
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
      return void toast.error(r.message || t("review.setup.createFailed"));
    }
    router.push("/review/session");
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button asChild variant="secondary" size="lg">
          <Link href="/home">
            <House />
            {t("review.result.home")}
          </Link>
        </Button>
        <Button variant="solid" size="lg" onClick={() => start("again")} disabled={!!busy}>
          {busy === "again" ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          {kind === "due" ? t("review.result.moreDue") : t("review.result.again")}
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
            <strong className="block text-navy">{t("review.result.retryWrong")}</strong>
            <span className="text-sm text-text-2">
              {wrongIds.length
                ? t("review.result.retryWrongDesc", { count: wrongIds.length })
                : t("review.result.noWrong")}
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
            <strong className="block text-navy">{t("review.result.practice")}</strong>
            <span className="text-sm text-text-2">{t("review.result.practiceDesc")}</span>
          </span>
          <ChevronRight className="size-5 text-text-3" />
        </Link>
      </div>
    </>
  );
}
