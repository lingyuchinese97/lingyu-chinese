import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { listParamsSchema } from "@/features/vocabulary/schema";
import { listVocab } from "@/features/vocabulary/service";
import { listReceivedVocab } from "@/features/vocabulary/share-service";
import { VocabListView } from "@/features/vocabulary/components/vocab-list";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("vocab.title") };
}

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function VocabularyPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  const sp = await searchParams;
  const params = listParamsSchema.parse({
    q: one(sp.q) ?? "",
    tag: one(sp.tag) ?? "",
    radical: one(sp.radical) ?? 0,
    sort: one(sp.sort) ?? "newest",
    page: one(sp.page) ?? 1,
  });
  const [data, received] = await Promise.all([listVocab(user.id, params), listReceivedVocab(user.id)]);
  return <VocabListView data={data} params={{ ...params, page: data.page }} received={received} />;
}
