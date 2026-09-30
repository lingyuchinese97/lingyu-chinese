import type { Metadata } from "next";
import { requireAdmin } from "@/server/session";
import { getT } from "@/i18n/server";
import { WordEditor } from "@/features/library/components/word-editor";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("library.newTitle") };
}

export default async function NewLibraryWordPage() {
  await requireAdmin();
  return <WordEditor initial={null} />;
}
