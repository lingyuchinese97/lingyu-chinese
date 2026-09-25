import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { requireUser } from "@/server/session";
import { listGrammarTags } from "@/features/grammar/service";
import { GrammarForm } from "@/features/grammar/components/grammar-form";

export const metadata: Metadata = { title: "Thêm ngữ pháp" };

export default async function NewGrammarPage() {
  const user = await requireUser();
  const tags = await listGrammarTags(user.id);
  return (
    <>
      <Breadcrumb back="/grammar" section="Ngữ pháp" current="Thêm ngữ pháp mới" />
      <GrammarForm initial={null} allTags={tags.map((t) => t.name)} />
    </>
  );
}
