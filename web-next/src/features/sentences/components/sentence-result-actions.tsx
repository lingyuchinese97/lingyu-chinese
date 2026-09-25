"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import type { SentenceConfig } from "../schema";
import { startSentenceReviewAction } from "../actions";

export function SentenceResultActions({ wrongIds, config }: { wrongIds: string[]; config: SentenceConfig }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  async function again() {
    setBusy(true);
    const r = await startSentenceReviewAction({
      direction: config.direction,
      count: wrongIds.length,
      tags: [],
      showPinyin: config.showPinyin,
      showHint: config.showHint,
      sentenceIds: wrongIds,
      label: "Ôn lại câu sai",
    });
    if (!r.ok) {
      setBusy(false);
      return void toast.error(r.message);
    }
    router.push("/sentences/review/session");
  }
  return (
    <div className="grid w-full gap-2.5 sm:grid-cols-2">
      <Button variant="secondary" size="lg" onClick={again} disabled={busy || !wrongIds.length}>
        {busy ? <Loader2 className="animate-spin" /> : <RotateCcw />}
        Ôn lại câu sai{wrongIds.length ? ` (${wrongIds.length})` : ""}
      </Button>
      <Button asChild variant="primary" size="lg">
        <Link href="/sentences">Hoàn thành</Link>
      </Button>
    </div>
  );
}
