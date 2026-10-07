import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { getT } from "@/i18n/server";
import { questionListSchema } from "@/features/speaking/schema";
import { listQuestions } from "@/features/speaking/service";
import { QuestionList } from "@/features/speaking/components/question-list";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("speaking.title") };
}
export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Luyện giao tiếp — danh sách câu hỏi của tôi. */
export default async function SpeakingPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  const sp = await searchParams;
  const params = questionListSchema.parse(Object.fromEntries(Object.keys(sp).map((k) => [k, one(sp[k])])));
  return (
    <QuestionList
      key={JSON.stringify({ ...params, q: "" })}
      data={await listQuestions(user.id, params)}
      params={params}
    />
  );
}
