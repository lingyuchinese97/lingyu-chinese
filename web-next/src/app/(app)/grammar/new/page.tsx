import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { requireUser } from "@/server/session";
import { listGrammarTags } from "@/features/grammar/service";
import { GrammarForm } from "@/features/grammar/components/grammar-form";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("grammar.addNew") };
}

export default async function NewGrammarPage() {
  const user = await requireUser();
  const t = await getT();
  const tags = await listGrammarTags(user.id);
  return (
    <>
      <Breadcrumb back="/grammar" section={t("grammar.title")} current={t("grammar.addNew")} />
      <GrammarForm initial={null} allTags={tags.map((t) => t.name)} />
    </>
  );
}
