import type { Metadata } from "next";
import { z } from "zod";
import { requireUser } from "@/server/session";
import { getT } from "@/i18n/server";
import { libListSchema } from "@/features/library/schema";
import { getPublicWord, LibraryError, listPublicWords, type PublicWord } from "@/features/library/service";
import { LibraryVocab } from "@/features/library/components/library-vocab";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("libhub.oldWords")} · ${t("library.nav")}` };
}
export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function LibraryVocabPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  const sp = await searchParams;
  const params = libListSchema.parse({
    q: one(sp.q) ?? "",
    hsk: one(sp.hsk) ?? 1,
    topic: one(sp.topic) ?? "",
    sort: one(sp.sort) ?? "order",
  });
  const data = await listPublicWords(user.id, params);
  const wanted = z.uuid().safeParse(one(sp.w));
  const id = wanted.success ? wanted.data : data.items[0]?.id;
  let selected: PublicWord | null = null;
  if (id) {
    try {
      selected = await getPublicWord(user.id, id);
    } catch (e) {
      if (!(e instanceof LibraryError)) throw e;
    }
  }
  return <LibraryVocab data={data} params={params} selected={selected} picked={wanted.success} />;
}
