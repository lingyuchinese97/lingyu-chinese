import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { requireUser } from "@/server/session";
import { listTags } from "@/features/vocabulary/service";
import { VocabForm } from "@/features/vocabulary/components/vocab-form";

export const metadata: Metadata = { title: "Thêm từ vựng" };

export default async function NewVocabPage() {
  const user = await requireUser();
  const tags = await listTags(user.id);
  return (
    <>
      <Breadcrumb back="/vocabulary" section="Từ vựng" current="Thêm từ vựng mới" />
      <VocabForm word={null} allTags={tags.map((t) => t.name)} />
    </>
  );
}
