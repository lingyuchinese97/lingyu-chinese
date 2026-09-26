import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { listSentences } from "@/features/sentences/service";
import { getActiveSentenceSession, getLastSentenceConfig } from "@/features/sentences/review-service";
import { SentenceReviewSetup } from "@/features/sentences/components/sentence-review-setup";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("sentences.setupTitle") };
}

export default async function SentenceReviewSetupPage() {
  const user = await requireUser();
  const t = await getT();
  const [list, last, active] = await Promise.all([
    listSentences(user.id, { q: "", tag: "", page: 1 }, 1),
    getLastSentenceConfig(user.id),
    getActiveSentenceSession(user.id),
  ]);
  return (
    <>
      <Breadcrumb back="/sentences" section={t("sentences.title")} current={t("sentences.startReview")} />
      <SentenceReviewSetup
        tags={list.tags.filter((t) => t.count > 0).map((t) => ({ name: t.name, count: t.count }))}
        total={list.totalAll}
        last={last}
        active={active ? { done: active.questions.filter((q) => q.answered).length, total: active.total } : null}
      />
    </>
  );
}
