import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { getT } from "@/i18n/server";
import { FINAL_GROUPS, FINALS } from "@/data/pronunciation";
import { topicNotes } from "@/features/pronunciation/service";
import { SoundBrowser } from "@/features/pronunciation/components/sound-browser";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("pronunciation.tabs.finals")} · ${t("pronunciation.title")}` };
}
export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function Page({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  const s = (await searchParams).s;
  return (
    <SoundBrowser
      kind="final"
      groups={FINAL_GROUPS}
      items={FINALS}
      notes={await topicNotes(user.id)}
      selected={typeof s === "string" ? s : undefined}
      filterable
    />
  );
}
