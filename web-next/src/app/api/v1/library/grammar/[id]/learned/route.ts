/** Đã học bài ngữ pháp: PUT (đánh dấu) · DELETE (bỏ) → { learned, progress } của cấp HSK. */
import { api } from "@/server/api";
import { setIdSchema } from "@/features/library/schema";
import { setLibGrammarLearned } from "@/features/library/grammar";

export const dynamic = "force-dynamic";
type P = { id: string };
export const PUT = api<P>(async ({ user, params }) =>
  setLibGrammarLearned(user.id, setIdSchema.parse(params.id), true),
);
export const DELETE = api<P>(async ({ user, params }) =>
  setLibGrammarLearned(user.id, setIdSchema.parse(params.id), false),
);
