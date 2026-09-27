import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { getT } from "@/i18n/server";
import { getActiveTranslation } from "@/features/translation/service";
import { TranslateSession } from "@/features/translation/components/translate-session";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("translate.sessionTitle") };
}
export const dynamic = "force-dynamic";

export default async function TranslateSessionPage() {
  const user = await requireUser();
  const s = await getActiveTranslation(user.id);
  if (!s) redirect("/translate");
  return <TranslateSession key={s.id} initial={s} />;
}
