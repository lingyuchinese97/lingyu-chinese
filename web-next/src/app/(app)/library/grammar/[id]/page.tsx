import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/session";
import { getLocale, getT } from "@/i18n/server";
import { setIdSchema } from "@/features/library/schema";
import { getLibGrammar } from "@/features/library/grammar";
import { LibraryError } from "@/features/library/service";
import { LIB_GRAMMAR_BY_ID } from "@/data/library/grammar";
import { GrammarDetailView } from "@/features/library/components/hub/grammar-detail";

type P = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const t = await getT();
  const g = LIB_GRAMMAR_BY_ID.get((await params).id);
  const l = await getLocale();
  return { title: g ? `${g.zh} – ${l === "en" ? g.name.en : g.name.vi} · ${t("libgram.title")}` : t("libgram.title") };
}
export const dynamic = "force-dynamic";

async function load(userId: string, id: string) {
  const parsed = setIdSchema.safeParse(id);
  if (!parsed.success) return null;
  try {
    return await getLibGrammar(userId, parsed.data, await getLocale());
  } catch (e) {
    if (e instanceof LibraryError) return null;
    throw e;
  }
}

/** Một bài ngữ pháp của Thư viện LingYu. */
export default async function LibraryGrammarDetailPage({ params }: { params: P }) {
  const user = await requireUser();
  const data = await load(user.id, (await params).id);
  if (!data) notFound();
  return <GrammarDetailView key={data.id} data={data} />;
}
