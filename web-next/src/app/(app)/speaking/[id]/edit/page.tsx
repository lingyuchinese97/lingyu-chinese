import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/server/session";
import { getT } from "@/i18n/server";
import { getQuestion, listQuestions, SpeakingError } from "@/features/speaking/service";
import { questionListSchema } from "@/features/speaking/schema";
import { QuestionForm } from "@/features/speaking/components/question-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("speaking.editTitle") };
}
export const dynamic = "force-dynamic";

/** Luyện giao tiếp — sửa một câu hỏi (của người khác / không có → 404). */
export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const q = await getQuestion(user.id, id.data).catch((e) => {
    if (e instanceof SpeakingError) notFound();
    throw e;
  });
  const { tags } = await listQuestions(user.id, questionListSchema.parse({ size: 10 }));
  return (
    <QuestionForm
      id={q.id}
      initial={{ zh: q.zh, pinyin: q.pinyin, meaning: q.meaning, hsk: q.hsk, tags: q.tags }}
      knownTags={tags.map((x) => x.name)}
    />
  );
}
