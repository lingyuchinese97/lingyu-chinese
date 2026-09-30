import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/server/session";
import { getT } from "@/i18n/server";
import { adminGetWord, LibraryError } from "@/features/library/service";
import { WordEditor } from "@/features/library/components/word-editor";
import type { LibWordInput } from "@/features/library/schema";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("library.editTitle") };
}
export const dynamic = "force-dynamic";

async function load(id: string) {
  try {
    return await adminGetWord(id);
  } catch (e) {
    if (e instanceof LibraryError) return null;
    throw e;
  }
}

export default async function EditLibraryWordPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = z.uuid().safeParse((await params).id);
  const w = id.success ? await load(id.data) : null;
  if (!w) notFound();
  return (
    <WordEditor
      key={w.id}
      initial={{ ...w, pos: w.pos as LibWordInput["pos"], topic: w.topic as LibWordInput["topic"] }}
    />
  );
}
