import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { getLocale, getT } from "@/i18n/server";
import { grammarListSchema } from "@/features/library/schema";
import { listLibGrammar } from "@/features/library/grammar";
import { GrammarList } from "@/features/library/components/hub/grammar-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("libgram.title")} · ${t("libhub.title")}` };
}
export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Thư viện LingYu — bài ngữ pháp biên soạn sẵn. */
export default async function LibraryGrammarPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  const sp = await searchParams;
  const params = grammarListSchema.parse({
    q: one(sp.q) ?? "",
    hsk: one(sp.hsk) ?? 0,
    topic: one(sp.topic) ?? "",
    status: one(sp.status) ?? "all",
    sort: one(sp.sort) ?? "order",
    view: one(sp.view) ?? "grid",
  });
  const data = await listLibGrammar(user.id, params, await getLocale());
  return <GrammarList data={data} params={params} />;
}
