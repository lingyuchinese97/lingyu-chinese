import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/session";
import { getLocale, getT } from "@/i18n/server";
import { setIdSchema, setWordSchema } from "@/features/library/schema";
import { getSetWord } from "@/features/library/sets";
import { LibraryError } from "@/features/library/service";
import { SetWordView } from "@/features/library/components/hub/set-word";

type P = Promise<{ set: string; word: string }>;
const dec = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const t = await getT();
  return { title: `${dec((await params).word)} · ${t("libhub.title")}` };
}
export const dynamic = "force-dynamic";

async function load(userId: string, set: string, word: string) {
  const id = setIdSchema.safeParse(set);
  const zh = setWordSchema.safeParse(dec(word));
  if (!id.success || !zh.success) return null;
  try {
    return await getSetWord(userId, id.data, zh.data, await getLocale());
  } catch (e) {
    if (e instanceof LibraryError) return null;
    throw e;
  }
}

/** Một từ trong bộ từ vựng. */
export default async function SetWordPage({ params }: { params: P }) {
  const user = await requireUser();
  const p = await params;
  const data = await load(user.id, p.set, p.word);
  if (!data) notFound();
  return <SetWordView key={`${data.set.id}/${data.word.zh}`} data={data} />;
}
