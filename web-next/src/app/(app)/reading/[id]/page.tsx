import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/session";
import { getLocale, getT } from "@/i18n/server";
import { R_PASSAGE_BY_ID, R_PASSAGES } from "@/data/reading/passages";
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
  // Thanh "Bài đọc 1/4" + ‹ ›: các bài cùng cấp HSK, theo thứ tự trong kho.
  const level = R_PASSAGES.filter((p) => p.level === passage.level);
  const i = level.findIndex((p) => p.id === id);
  const nav = { index: i + 1, total: level.length, prev: level[i - 1]?.id ?? null, next: level[i + 1]?.id ?? null };
  return <Reader key={id} passage={passage} nav={nav} />;
}
