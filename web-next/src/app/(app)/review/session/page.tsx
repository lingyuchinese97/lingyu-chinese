import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { requireUser } from "@/server/session";
import { getActiveSession, getLastResult } from "@/features/review/service";
import { ReviewSession } from "@/features/review/components/review-session";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("review.session.pageTitle") };
}
export const dynamic = "force-dynamic";

export default async function ReviewSessionPage() {
  const user = await requireUser();
  const t = await getT();
  const s = await getActiveSession(user.id);
  if (!s) redirect((await getLastResult(user.id)) ? "/review/result" : "/review/setup");
  return (
    <>
      <Breadcrumb back="/review/setup" section={t("review.title")} current={t("review.session.pageTitle")} />
      <ReviewSession key={s.id} initial={s} />
    </>
  );
}
