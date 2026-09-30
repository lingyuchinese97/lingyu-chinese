import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/session";
import { getLocale, getT } from "@/i18n/server";
import { R_PASSAGE_BY_ID } from "@/data/reading/passages";
import { getPassage } from "@/features/reading/service";
import { Reader } from "@/features/reading/components/reader";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = R_PASSAGE_BY_ID.get((await params).id);
  return { title: p ? `${p.title.zh} · ${(await getT())("reading.title")}` : (await getT())("reading.title") };
}
export const dynamic = "force-dynamic";

export default async function ReadingPassagePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!R_PASSAGE_BY_ID.has(id)) notFound();
  const passage = await getPassage(user.id, id, await getLocale());
  return <Reader key={id} passage={passage} />;
}
