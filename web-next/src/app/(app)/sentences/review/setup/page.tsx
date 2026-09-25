import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { listSentences } from "@/features/sentences/service";
import { getActiveSentenceSession, getLastSentenceConfig } from "@/features/sentences/review-service";
import { SentenceReviewSetup } from "@/features/sentences/components/sentence-review-setup";

export const metadata: Metadata = { title: "Bắt đầu ôn dịch câu" };

export default async function SentenceReviewSetupPage() {
  const user = await requireUser();
  const [list, last, active] = await Promise.all([
    listSentences(user.id, { q: "", tag: "", page: 1 }, 1),
    getLastSentenceConfig(user.id),
    getActiveSentenceSession(user.id),
  ]);
  return (
    <>
      <Breadcrumb back="/sentences" section="Ôn dịch câu" current="Bắt đầu ôn" />
      <SentenceReviewSetup
        tags={list.tags.filter((t) => t.count > 0).map((t) => ({ name: t.name, count: t.count }))}
        total={list.totalAll}
        last={last}
        active={active ? { done: active.questions.filter((q) => q.answered).length, total: active.total } : null}
      />
    </>
  );
}
