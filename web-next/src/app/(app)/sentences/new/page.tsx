import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { listSentenceTags } from "@/features/sentences/service";
import { SentenceForm } from "@/features/sentences/components/sentence-form";

export const metadata: Metadata = { title: "Thêm câu mới" };

export default async function NewSentencePage() {
  const user = await requireUser();
  const tags = await listSentenceTags(user.id);
  return (
    <>
      <Breadcrumb back="/sentences" section="Ôn dịch câu" current="Thêm câu mới" />
      <SentenceForm initial={null} allTags={tags.map((t) => t.name)} />
    </>
  );
}
