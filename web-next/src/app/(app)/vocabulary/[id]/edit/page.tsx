import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { requireUser } from "@/server/session";
import { getVocab, listTags, VocabError } from "@/features/vocabulary/service";
import { VocabForm } from "@/features/vocabulary/components/vocab-form";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("vocab.edit") };
}

export default async function EditVocabPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const word = await getVocab(user.id, id.data).catch((e) => {
    if (e instanceof VocabError) notFound();
    throw e;
  });
  const tags = await listTags(user.id);
  const t = await getT();
  return (
    <>
      <Breadcrumb back="/vocabulary" section={t("vocab.title")} current={t("vocab.edit")} />
      <VocabForm word={word} allTags={tags.map((x) => x.name)} />
    </>
  );
}
