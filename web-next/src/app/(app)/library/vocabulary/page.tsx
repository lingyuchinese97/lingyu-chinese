import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { getLocale, getT } from "@/i18n/server";
import { setListSchema } from "@/features/library/schema";
import { listSets } from "@/features/library/sets";
import { SetList } from "@/features/library/components/hub/set-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("libhub.vocabTitle")} · ${t("libhub.title")}` };
}
export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Thư viện LingYu — các bộ từ vựng. Link cũ `?w=<id>` (từ admin đăng) → /library/words. */
export default async function LibraryVocabularyPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  const sp = await searchParams;
  const w = one(sp.w);
  if (w) redirect(`/library/words?w=${encodeURIComponent(w)}`);
  const params = setListSchema.parse({
    q: one(sp.q) ?? "",
    hsk: one(sp.hsk) ?? 0,
    topic: one(sp.topic) ?? "",
    kind: one(sp.kind) ?? "all",
    sort: one(sp.sort) ?? "order",
    view: one(sp.view) ?? "grid",
  });
  const data = await listSets(user.id, params, await getLocale());
  return <SetList data={data} params={params} />;
}
