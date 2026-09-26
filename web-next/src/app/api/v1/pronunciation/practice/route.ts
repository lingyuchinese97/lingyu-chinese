/** Tạo bài luyện tập phát âm (tự luyện, không lưu): `?mode=listen-choose|…&count=1–20`. Câu hỏi có kèm đáp án. */
import { api, query } from "@/server/api";
import { practiceQuerySchema } from "@/features/pronunciation/schema";
import { generatePractice } from "@/features/pronunciation/practice";

export const dynamic = "force-dynamic";

export const GET = api(async ({ req }) => {
  const { mode, count } = practiceQuerySchema.parse(query(req));
  return { mode, questions: generatePractice(mode, count) };
});
