import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { requireUser } from "@/server/session";
import { listTags } from "@/features/vocabulary/service";
import { VocabForm } from "@/features/vocabulary/components/vocab-form";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("vocab.add") };
}

export default async function NewVocabPage() {
  const user = await requireUser();
  const tags = await listTags(user.id);
  const t = await getT();
  return (
    <>
      <Breadcrumb back="/vocabulary" section={t("vocab.title")} current={t("vocab.addNew")} />
      <VocabForm word={null} allTags={tags.map((x) => x.name)} />
    </>
  );
}
