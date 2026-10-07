import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { getT } from "@/i18n/server";
import { listQuestions } from "@/features/speaking/service";
import { questionListSchema } from "@/features/speaking/schema";
import { QuestionForm } from "@/features/speaking/components/question-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("speaking.newTitle") };
}
export const dynamic = "force-dynamic";

/** Luyện giao tiếp — tạo câu hỏi (nhiều câu một lần). */
export default async function NewQuestionsPage() {
  const user = await requireUser();
  const { tags } = await listQuestions(user.id, questionListSchema.parse({ size: 10 }));
  return <QuestionForm knownTags={tags.map((x) => x.name)} />;
}
