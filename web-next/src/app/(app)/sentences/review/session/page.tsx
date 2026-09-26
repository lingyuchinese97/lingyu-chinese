import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { getActiveSentenceSession } from "@/features/sentences/review-service";
import { SentenceReviewSession } from "@/features/sentences/components/sentence-review-session";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("sentences.title") };
}

export default async function SentenceSessionPage() {
  const user = await requireUser();
  const s = await getActiveSentenceSession(user.id);
  if (!s) redirect("/sentences/review/setup");
  return <SentenceReviewSession key={s.id} initial={s} />;
}
