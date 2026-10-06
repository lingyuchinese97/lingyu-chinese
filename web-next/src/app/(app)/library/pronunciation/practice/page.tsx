import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { getT } from "@/i18n/server";
import { generatePractice, PRACTICE_MODES, type PracticeMode } from "@/features/pronunciation/practice";
import { PracticeView } from "@/features/pronunciation/components/practice-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("pronunciation.tabs.practice")} · ${t("pronunciation.title")}` };
}
export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function Page({ searchParams }: { searchParams: SP }) {
  await requireUser();
  const m = (await searchParams).mode;
  const mode: PracticeMode = PRACTICE_MODES.includes(m as PracticeMode) ? (m as PracticeMode) : "listen-choose";
  return <PracticeView key={mode} mode={mode} questions={generatePractice(mode)} />;
}
