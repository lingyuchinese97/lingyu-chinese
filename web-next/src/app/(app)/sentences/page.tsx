import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { sentenceListSchema } from "@/features/sentences/schema";
import { listSentences } from "@/features/sentences/service";
import { SentenceListView } from "@/features/sentences/components/sentence-list";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("sentences.title") };
}

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function SentencesPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  const sp = await searchParams;
  const params = sentenceListSchema.parse({ q: one(sp.q) ?? "", tag: one(sp.tag) ?? "", page: one(sp.page) ?? 1 });
  const data = await listSentences(user.id, params);
  return <SentenceListView data={data} params={{ ...params, page: data.page }} />;
}
