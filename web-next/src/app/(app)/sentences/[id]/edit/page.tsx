import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/server/session";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { getSentence, listSentenceTags, SentenceError } from "@/features/sentences/service";
import { SentenceForm } from "@/features/sentences/components/sentence-form";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("sentences.edit") };
}

export default async function EditSentencePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const t = await getT();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const s = await getSentence(user.id, id.data).catch((e) => {
    if (e instanceof SentenceError) return null;
    throw e;
  });
  if (!s) notFound();
  const tags = await listSentenceTags(user.id);
  return (
    <>
      <Breadcrumb back="/sentences" section={t("sentences.title")} current={t("sentences.edit")} />
      <SentenceForm
        initial={{
          id: s.id,
          chinese: s.chinese,
          pinyin: s.pinyin,
          vietnamese: s.vietnamese,
          note: s.note,
          tags: s.tags,
        }}
        allTags={tags.map((t) => t.name)}
      />
    </>
  );
}
