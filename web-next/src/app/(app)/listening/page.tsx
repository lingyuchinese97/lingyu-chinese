import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { getT } from "@/i18n/server";
import { listListeningTags } from "@/features/listening/service";
import { listTags } from "@/features/vocabulary/service";
import { ListeningPracticeLoader } from "@/features/listening/components/practice-loader";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("listening.title") };
}

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function ListeningPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  const sp = await searchParams;
  const [lt, vt] = await Promise.all([listListeningTags(user.id), listTags(user.id)]);
  return (
    <ListeningPracticeLoader
      userId={user.id}
      fresh={sp.new === "1"}
      listeningTags={lt.map((x) => x.name)}
      vocabTags={vt.map((x) => x.name)}
    />
  );
}
