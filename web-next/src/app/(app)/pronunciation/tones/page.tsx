import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { getT } from "@/i18n/server";
import { topicNotes } from "@/features/pronunciation/service";
import { TonesView } from "@/features/pronunciation/components/tones-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("pronunciation.tabs.tones")} · ${t("pronunciation.title")}` };
}
export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requireUser();
  return <TonesView notes={await topicNotes(user.id)} />;
}
