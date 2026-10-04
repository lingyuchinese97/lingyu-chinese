/** Đánh dấu đã học một từ HSK: PUT · DELETE. Từ không thuộc cấp đó → 404. */
import { z } from "zod";
import { api } from "@/server/api";
import { setWordSchema } from "@/features/library/schema";
import { setHskLearned } from "@/features/library/sets";

export const dynamic = "force-dynamic";
type P = { level: string; word: string };
const args = (p: P) =>
  [z.coerce.number().int().min(1).max(6).parse(p.level), setWordSchema.parse(decodeURIComponent(p.word))] as const;
export const PUT = api<P>(async ({ user, params }) => setHskLearned(user.id, ...args(params), true));
export const DELETE = api<P>(async ({ user, params }) => setHskLearned(user.id, ...args(params), false));
