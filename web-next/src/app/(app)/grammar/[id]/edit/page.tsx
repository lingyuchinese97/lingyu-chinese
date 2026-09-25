import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { requireUser } from "@/server/session";
import { getOwnGrammar, listGrammarTags } from "@/features/grammar/service";
import { GrammarForm } from "@/features/grammar/components/grammar-form";

export const metadata: Metadata = { title: "Chỉnh sửa ngữ pháp" };

export default async function EditGrammarPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  // Chỉ sửa được ngữ pháp của mình; của người khác → 404 (không tiết lộ là có tồn tại).
  const g = await getOwnGrammar(user.id, id.data);
  if (!g) notFound();
  const tags = await listGrammarTags(user.id);
  return (
    <>
      <Breadcrumb back={`/grammar/${g.id}`} section="Ngữ pháp" current="Chỉnh sửa ngữ pháp" />
      <GrammarForm
        initial={{
          id: g.id,
          title: g.title,
          meaning: g.meaning,
          structure: g.structure,
          notes: g.notes,
          personalNote: g.personalNote,
          examples: g.examples,
          tags: g.tags.map((t) => t.name),
        }}
        allTags={tags.map((t) => t.name)}
      />
    </>
  );
}
