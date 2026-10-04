/** Đánh dấu đã học một từ trong bộ: PUT (đã học) · DELETE (bỏ) → { learned, progress }. */
import { api } from "@/server/api";
import { setIdSchema, setWordSchema } from "@/features/library/schema";
import { setWordLearned } from "@/features/library/sets";

export const dynamic = "force-dynamic";
type P = { id: string; word: string };
const args = (p: P) => [setIdSchema.parse(p.id), setWordSchema.parse(decodeURIComponent(p.word))] as const;
export const PUT = api<P>(async ({ user, params }) => setWordLearned(user.id, ...args(params), true));
export const DELETE = api<P>(async ({ user, params }) => setWordLearned(user.id, ...args(params), false));
