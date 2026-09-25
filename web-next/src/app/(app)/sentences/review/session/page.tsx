import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { getActiveSentenceSession } from "@/features/sentences/review-service";
import { SentenceReviewSession } from "@/features/sentences/components/sentence-review-session";

export const metadata: Metadata = { title: "Ôn dịch câu" };

export default async function SentenceSessionPage() {
  const user = await requireUser();
  const s = await getActiveSentenceSession(user.id);
  if (!s) redirect("/sentences/review/setup");
  return <SentenceReviewSession key={s.id} initial={s} />;
}
