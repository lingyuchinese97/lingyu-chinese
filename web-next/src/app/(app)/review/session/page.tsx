import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { requireUser } from "@/server/session";
import { getActiveSession, getLastResult } from "@/features/review/service";
import { ReviewSession } from "@/features/review/components/review-session";

export const metadata: Metadata = { title: "Làm bài ôn tập" };
export const dynamic = "force-dynamic";

export default async function ReviewSessionPage() {
  const user = await requireUser();
  const s = await getActiveSession(user.id);
  if (!s) redirect((await getLastResult(user.id)) ? "/review/result" : "/review/setup");
  return (
    <>
      <Breadcrumb back="/review/setup" section="Ôn tập" current="Làm bài ôn tập" />
      <ReviewSession key={s.id} initial={s} />
    </>
  );
}
