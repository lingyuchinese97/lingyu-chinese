import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { getT } from "@/i18n/server";
import { listNotes } from "@/features/pronunciation/service";
import { NotesView } from "@/features/pronunciation/components/notes-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("pronunciation.tabs.notes")} · ${t("pronunciation.title")}` };
}
export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requireUser();
  return <NotesView notes={await listNotes(user.id)} />;
}
