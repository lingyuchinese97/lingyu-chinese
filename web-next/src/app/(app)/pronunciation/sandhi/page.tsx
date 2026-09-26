import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { getT } from "@/i18n/server";
import { listNotes } from "@/features/pronunciation/service";
import { generatePractice } from "@/features/pronunciation/practice";
import { SandhiView } from "@/features/pronunciation/components/sandhi-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("pronunciation.tabs.sandhi")} · ${t("pronunciation.title")}` };
}
export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function Page({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  const rule = (await searchParams).rule;
  return (
    <SandhiView
      rule={typeof rule === "string" ? rule : undefined}
      notes={await listNotes(user.id)}
      quick={generatePractice("sandhi", 5)}
    />
  );
}
