import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { listSentenceTags } from "@/features/sentences/service";
import { SentenceForm } from "@/features/sentences/components/sentence-form";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("sentences.addNew") };
}

export default async function NewSentencePage() {
  const user = await requireUser();
  const t = await getT();
  const tags = await listSentenceTags(user.id);
  return (
    <>
      <Breadcrumb back="/sentences" section={t("sentences.title")} current={t("sentences.addNew")} />
      <SentenceForm initial={null} allTags={tags.map((t) => t.name)} />
    </>
  );
}
