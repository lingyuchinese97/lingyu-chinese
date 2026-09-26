import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { grammarListSchema } from "@/features/grammar/schema";
import { listGrammar, listGrammarTags, listReceived } from "@/features/grammar/service";
import { GrammarList } from "@/features/grammar/components/grammar-list";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("grammar.title") };
}

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function GrammarPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  const sp = await searchParams;
  const tags = await listGrammarTags(user.id);
  const parsed = grammarListSchema.parse({
    q: one(sp.q) ?? "",
    tag: one(sp.tag) ?? "",
    sort: one(sp.sort) ?? "updated",
    view: one(sp.view) ?? "all",
  });
  // Thẻ không còn tồn tại → bỏ lọc.
  const params = { ...parsed, tag: tags.some((t) => t.id === parsed.tag) ? parsed.tag : "" };
  const [data, received] = await Promise.all([listGrammar(user.id, params), listReceived(user.id)]);
  return <GrammarList data={data} params={params} tags={tags} received={received} />;
}
